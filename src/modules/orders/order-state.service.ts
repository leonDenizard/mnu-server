import { Prisma } from '../../../generated/prisma/index.js'

import prisma from '../../database'
import { BadRequestError, ConflictError, NotFoundError } from '../../shared/errors/app-error'
import { hashOrderAccessToken } from './order-access-token'
import type { OrderStateOutput } from './order.schema'

const ACCEPTANCE_TIMEOUT_REASON = 'Order was not accepted within 5 minutes'

type StoreAction = 'accept' | 'reject' | 'ready' | 'finish' | 'cancel'

type StoreTransitionInput = {
  storeId: string
  orderId: string
  userId: string
  action: StoreAction
  reason?: string
}

type TransitionDefinition = {
  allowedFrom: Array<'PENDING' | 'IN_PREPARATION' | 'READY'>
  status: 'IN_PREPARATION' | 'READY' | 'FINISHED' | 'CANCELED'
  historyAction: 'ACCEPTED' | 'REJECTED' | 'MARKED_READY' | 'FINISHED' | 'STORE_CANCELED'
  cancellationType: 'STORE_REJECTED' | 'STORE_CANCELED' | null
  requiresReason: boolean
}

const storeTransitions: Record<StoreAction, TransitionDefinition> = {
  accept: {
    allowedFrom: ['PENDING'],
    status: 'IN_PREPARATION',
    historyAction: 'ACCEPTED',
    cancellationType: null,
    requiresReason: false
  },
  reject: {
    allowedFrom: ['PENDING'],
    status: 'CANCELED',
    historyAction: 'REJECTED',
    cancellationType: 'STORE_REJECTED',
    requiresReason: true
  },
  ready: {
    allowedFrom: ['IN_PREPARATION'],
    status: 'READY',
    historyAction: 'MARKED_READY',
    cancellationType: null,
    requiresReason: false
  },
  finish: {
    allowedFrom: ['READY'],
    status: 'FINISHED',
    historyAction: 'FINISHED',
    cancellationType: null,
    requiresReason: false
  },
  cancel: {
    allowedFrom: ['IN_PREPARATION', 'READY'],
    status: 'CANCELED',
    historyAction: 'STORE_CANCELED',
    cancellationType: 'STORE_CANCELED',
    requiresReason: true
  }
}

function mapOrderState(order: {
  id: string
  status: 'PENDING' | 'IN_PREPARATION' | 'READY' | 'CANCELED' | 'FINISHED'
  cancellationType: 'CUSTOMER_CANCELED' | 'STORE_REJECTED' | 'STORE_CANCELED' | 'ACCEPTANCE_TIMEOUT' | null
  cancellationReason: string | null
  acceptanceExpiresAt: Date | null
  canceledAt: Date | null
  version: number
  updatedAt: Date
}): OrderStateOutput {
  return {
    id: order.id,
    status: order.status,
    cancellationType: order.cancellationType,
    cancellationReason: order.cancellationReason,
    acceptanceExpiresAt: order.acceptanceExpiresAt?.toISOString() ?? null,
    canceledAt: order.canceledAt?.toISOString() ?? null,
    version: order.version,
    updatedAt: order.updatedAt.toISOString()
  }
}

async function enqueueStatusEvent({
  tx,
  orderId,
  storeId,
  previousStatus,
  status,
  action,
  version,
  occurredAt
}: {
  tx: Prisma.TransactionClient
  orderId: string
  storeId: string
  previousStatus: string
  status: string
  action: string
  version: number
  occurredAt: Date
}) {
  await tx.orderEventOutbox.create({
    data: {
      orderId,
      storeId,
      type: 'order.status.changed',
      payload: {
        orderId,
        storeId,
        previousStatus,
        status,
        action,
        version,
        occurredAt: occurredAt.toISOString()
      }
    }
  })
}

async function expirePendingOrderById(orderId: string, now: Date, storeId?: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: {
        id: orderId,
        ...(storeId ? { storeId } : {}),
        status: 'PENDING',
        acceptanceExpiresAt: { lte: now }
      },
      select: {
        id: true,
        storeId: true,
        status: true,
        version: true
      }
    })

    if (!order) {
      return false
    }

    const updated = await tx.order.updateMany({
      where: {
        id: order.id,
        storeId: order.storeId,
        status: 'PENDING',
        version: order.version
      },
      data: {
        status: 'CANCELED',
        cancellationType: 'ACCEPTANCE_TIMEOUT',
        cancellationReason: ACCEPTANCE_TIMEOUT_REASON,
        canceledAt: now,
        acceptanceExpiresAt: null,
        version: { increment: 1 }
      }
    })

    if (updated.count === 0) {
      return false
    }

    const version = order.version + 1

    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        previousStatus: 'PENDING',
        status: 'CANCELED',
        action: 'ACCEPTANCE_TIMED_OUT',
        actorType: 'SYSTEM',
        reason: ACCEPTANCE_TIMEOUT_REASON
      }
    })

    await enqueueStatusEvent({
      tx,
      orderId: order.id,
      storeId: order.storeId,
      previousStatus: 'PENDING',
      status: 'CANCELED',
      action: 'ACCEPTANCE_TIMED_OUT',
      version,
      occurredAt: now
    })

    return true
  })
}

export async function transitionStoreOrder({
  storeId,
  orderId,
  userId,
  action,
  reason
}: StoreTransitionInput): Promise<OrderStateOutput> {
  const now = new Date()
  await expirePendingOrderById(orderId, now, storeId)

  const definition = storeTransitions[action]
  const normalizedReason = reason?.trim() || null

  if (definition.requiresReason && !normalizedReason) {
    throw new BadRequestError('A reason is required for this order action')
  }

  const updatedOrderId = await prisma.$transaction(async (tx) => {
    const [order, actor] = await Promise.all([
      tx.order.findFirst({
        where: { id: orderId, storeId },
        select: {
          id: true,
          storeId: true,
          status: true,
          version: true
        }
      }),
      tx.user.findFirst({
        where: { id: userId, storeId, active: true },
        select: { id: true, name: true }
      })
    ])

    if (!order) {
      throw new NotFoundError('Order not found')
    }

    if (!actor) {
      throw new NotFoundError('Authenticated user not found in store')
    }

    if (!definition.allowedFrom.includes(order.status as TransitionDefinition['allowedFrom'][number])) {
      throw new ConflictError(
        `Order cannot perform action "${action}" from status "${order.status}"`
      )
    }

    const isCancellation = definition.status === 'CANCELED'
    const nextVersion = order.version + 1

    const updated = await tx.order.updateMany({
      where: {
        id: order.id,
        storeId,
        status: order.status,
        version: order.version
      },
      data: {
        status: definition.status,
        acceptanceExpiresAt: null,
        cancellationType: definition.cancellationType,
        cancellationReason: isCancellation ? normalizedReason : null,
        canceledAt: isCancellation ? now : null,
        version: { increment: 1 }
      }
    })

    if (updated.count === 0) {
      throw new ConflictError('Order was updated by another operation')
    }

    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        previousStatus: order.status,
        status: definition.status,
        action: definition.historyAction,
        actorType: 'STORE_USER',
        actorUserId: actor.id,
        actorNameSnapshot: actor.name,
        reason: normalizedReason
      }
    })

    await enqueueStatusEvent({
      tx,
      orderId: order.id,
      storeId,
      previousStatus: order.status,
      status: definition.status,
      action: definition.historyAction,
      version: nextVersion,
      occurredAt: now
    })

    return order.id
  })

  const updatedOrder = await prisma.order.findUniqueOrThrow({
    where: { id: updatedOrderId }
  })

  return mapOrderState(updatedOrder)
}

export async function cancelOrderByCustomerToken(token: string): Promise<OrderStateOutput> {
  const now = new Date()
  const tokenHash = hashOrderAccessToken(token)
  const existingOrder = await prisma.order.findUnique({
    where: { publicAccessTokenHash: tokenHash },
    select: { id: true }
  })

  if (!existingOrder) {
    throw new NotFoundError('Order not found')
  }

  await expirePendingOrderById(existingOrder.id, now)

  const updatedOrderId = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { publicAccessTokenHash: tokenHash },
      select: {
        id: true,
        storeId: true,
        status: true,
        version: true
      }
    })

    if (!order) {
      throw new NotFoundError('Order not found')
    }

    if (order.status !== 'PENDING') {
      throw new ConflictError('Customer can only cancel an order awaiting acceptance')
    }

    const updated = await tx.order.updateMany({
      where: {
        id: order.id,
        status: 'PENDING',
        version: order.version,
        publicAccessTokenHash: tokenHash
      },
      data: {
        status: 'CANCELED',
        cancellationType: 'CUSTOMER_CANCELED',
        cancellationReason: null,
        canceledAt: now,
        acceptanceExpiresAt: null,
        version: { increment: 1 }
      }
    })

    if (updated.count === 0) {
      throw new ConflictError('Order was updated by another operation')
    }

    const version = order.version + 1

    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        previousStatus: 'PENDING',
        status: 'CANCELED',
        action: 'CUSTOMER_CANCELED',
        actorType: 'CUSTOMER'
      }
    })

    await enqueueStatusEvent({
      tx,
      orderId: order.id,
      storeId: order.storeId,
      previousStatus: 'PENDING',
      status: 'CANCELED',
      action: 'CUSTOMER_CANCELED',
      version,
      occurredAt: now
    })

    return order.id
  })

  const updatedOrder = await prisma.order.findUniqueOrThrow({
    where: { id: updatedOrderId }
  })

  return mapOrderState(updatedOrder)
}

export async function expirePendingOrders({
  now = new Date(),
  batchSize = 100
}: {
  now?: Date
  batchSize?: number
} = {}) {
  const orders = await prisma.order.findMany({
    where: {
      status: 'PENDING',
      acceptanceExpiresAt: { lte: now }
    },
    select: { id: true },
    orderBy: { acceptanceExpiresAt: 'asc' },
    take: batchSize
  })

  const results = await Promise.all(
    orders.map((order) => expirePendingOrderById(order.id, now))
  )

  return results.filter(Boolean).length
}
