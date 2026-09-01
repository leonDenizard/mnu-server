import prisma from '../../../database'
import { ConflictError } from '../../../shared/errors/app-error'
import { hashOrderAccessToken } from '../order-access-token'
import {
  cancelOrderByCustomerToken,
  expirePendingOrders,
  transitionStoreOrder
} from '../order-state.service'

jest.mock('../../../database', () => ({
  __esModule: true,
  default: {
    order: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn()
    },
    user: {
      findFirst: jest.fn()
    },
    orderStatusHistory: {
      create: jest.fn()
    },
    orderEventOutbox: {
      create: jest.fn()
    },
    $transaction: jest.fn()
  }
}))

const prismaMock = prisma as unknown as {
  order: {
    findFirst: jest.Mock
    findUnique: jest.Mock
    findUniqueOrThrow: jest.Mock
    findMany: jest.Mock
    updateMany: jest.Mock
  }
  user: {
    findFirst: jest.Mock
  }
  orderStatusHistory: {
    create: jest.Mock
  }
  orderEventOutbox: {
    create: jest.Mock
  }
  $transaction: jest.Mock
}

const pendingOrder = {
  id: '10000000-0000-4000-8000-000000000001',
  storeId: '20000000-0000-4000-8000-000000000001',
  status: 'PENDING',
  version: 1
}

function stateResult(
  status: 'PENDING' | 'IN_PREPARATION' | 'READY' | 'CANCELED' | 'FINISHED',
  version = 2,
  cancellationType: 'CUSTOMER_CANCELED' | 'STORE_REJECTED' | 'STORE_CANCELED' | 'ACCEPTANCE_TIMEOUT' | null = null
) {
  return {
    id: pendingOrder.id,
    status,
    cancellationType,
    cancellationReason: null,
    acceptanceExpiresAt: null,
    canceledAt: cancellationType ? new Date('2026-08-30T12:05:00.000Z') : null,
    version,
    updatedAt: new Date('2026-08-30T12:05:00.000Z')
  }
}

describe('order state machine', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    prismaMock.$transaction.mockImplementation(async (callback: (tx: typeof prismaMock) => unknown) => {
      return callback(prismaMock)
    })
    prismaMock.user.findFirst.mockResolvedValue({
      id: '30000000-0000-4000-8000-000000000001',
      name: 'Leon'
    })
    prismaMock.order.updateMany.mockResolvedValue({ count: 1 })
  })

  it('accepts a pending order and records actor, history and outbox event', async () => {
    prismaMock.order.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(pendingOrder)
    prismaMock.order.findUniqueOrThrow.mockResolvedValue(stateResult('IN_PREPARATION'))

    const result = await transitionStoreOrder({
      storeId: pendingOrder.storeId,
      orderId: pendingOrder.id,
      userId: '30000000-0000-4000-8000-000000000001',
      action: 'accept'
    })

    expect(prismaMock.order.updateMany).toHaveBeenCalledWith({
      where: {
        id: pendingOrder.id,
        storeId: pendingOrder.storeId,
        status: 'PENDING',
        version: 1
      },
      data: expect.objectContaining({
        status: 'IN_PREPARATION',
        acceptanceExpiresAt: null,
        version: { increment: 1 }
      })
    })
    expect(prismaMock.orderStatusHistory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        orderId: pendingOrder.id,
        previousStatus: 'PENDING',
        status: 'IN_PREPARATION',
        action: 'ACCEPTED',
        actorType: 'STORE_USER',
        actorNameSnapshot: 'Leon'
      })
    })
    expect(prismaMock.orderEventOutbox.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        orderId: pendingOrder.id,
        storeId: pendingOrder.storeId,
        type: 'order.status.changed'
      })
    })
    expect(result.status).toBe('IN_PREPARATION')
  })

  it('rejects invalid state transitions', async () => {
    prismaMock.order.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(pendingOrder)

    await expect(
      transitionStoreOrder({
        storeId: pendingOrder.storeId,
        orderId: pendingOrder.id,
        userId: '30000000-0000-4000-8000-000000000001',
        action: 'ready'
      })
    ).rejects.toBeInstanceOf(ConflictError)

    expect(prismaMock.order.updateMany).not.toHaveBeenCalled()
    expect(prismaMock.orderStatusHistory.create).not.toHaveBeenCalled()
  })

  it.each([
    {
      action: 'ready' as const,
      previousStatus: 'IN_PREPARATION' as const,
      status: 'READY' as const,
      historyAction: 'MARKED_READY' as const,
      reason: undefined
    },
    {
      action: 'finish' as const,
      previousStatus: 'READY' as const,
      status: 'FINISHED' as const,
      historyAction: 'FINISHED' as const,
      reason: undefined
    },
    {
      action: 'reject' as const,
      previousStatus: 'PENDING' as const,
      status: 'CANCELED' as const,
      historyAction: 'REJECTED' as const,
      reason: 'Product unavailable'
    },
    {
      action: 'cancel' as const,
      previousStatus: 'IN_PREPARATION' as const,
      status: 'CANCELED' as const,
      historyAction: 'STORE_CANCELED' as const,
      reason: 'Equipment failure'
    },
    {
      action: 'cancel' as const,
      previousStatus: 'READY' as const,
      status: 'CANCELED' as const,
      historyAction: 'STORE_CANCELED' as const,
      reason: 'Customer request'
    }
  ])(
    'moves $previousStatus to $status using $action',
    async ({ action, previousStatus, status, historyAction, reason }) => {
      prismaMock.order.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ ...pendingOrder, status: previousStatus })
      prismaMock.order.findUniqueOrThrow.mockResolvedValue(
        stateResult(
          status,
          2,
          historyAction === 'REJECTED' ? 'STORE_REJECTED' :
            historyAction === 'STORE_CANCELED' ? 'STORE_CANCELED' : null
        )
      )

      const result = await transitionStoreOrder({
        storeId: pendingOrder.storeId,
        orderId: pendingOrder.id,
        userId: '30000000-0000-4000-8000-000000000001',
        action,
        reason
      })

      expect(prismaMock.orderStatusHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          previousStatus,
          status,
          action: historyAction,
          reason: reason ?? null
        })
      })
      expect(result.status).toBe(status)
    }
  )

  it('allows the customer to cancel only a pending order using its token', async () => {
    const token = 'customer-access-token-with-more-than-32-characters'
    const tokenHash = hashOrderAccessToken(token)

    prismaMock.order.findUnique
      .mockResolvedValueOnce({ id: pendingOrder.id })
      .mockResolvedValueOnce(pendingOrder)
    prismaMock.order.findFirst.mockResolvedValueOnce(null)
    prismaMock.order.findUniqueOrThrow.mockResolvedValue(
      stateResult('CANCELED', 2, 'CUSTOMER_CANCELED')
    )

    const result = await cancelOrderByCustomerToken(token)

    expect(prismaMock.order.updateMany).toHaveBeenCalledWith({
      where: {
        id: pendingOrder.id,
        status: 'PENDING',
        version: 1,
        publicAccessTokenHash: tokenHash
      },
      data: expect.objectContaining({
        status: 'CANCELED',
        cancellationType: 'CUSTOMER_CANCELED'
      })
    })
    expect(prismaMock.orderStatusHistory.create).toHaveBeenCalledWith({
      data: {
        orderId: pendingOrder.id,
        previousStatus: 'PENDING',
        status: 'CANCELED',
        action: 'CUSTOMER_CANCELED',
        actorType: 'CUSTOMER'
      }
    })
    expect(result.status).toBe('CANCELED')
  })

  it('expires pending orders and records a system action', async () => {
    const now = new Date('2026-08-30T12:05:00.000Z')
    prismaMock.order.findMany.mockResolvedValue([{ id: pendingOrder.id }])
    prismaMock.order.findFirst.mockResolvedValueOnce(pendingOrder)

    const count = await expirePendingOrders({ now })

    expect(count).toBe(1)
    expect(prismaMock.order.updateMany).toHaveBeenCalledWith({
      where: {
        id: pendingOrder.id,
        storeId: pendingOrder.storeId,
        status: 'PENDING',
        version: 1
      },
      data: expect.objectContaining({
        status: 'CANCELED',
        cancellationType: 'ACCEPTANCE_TIMEOUT',
        canceledAt: now
      })
    })
    expect(prismaMock.orderStatusHistory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'ACCEPTANCE_TIMED_OUT',
        actorType: 'SYSTEM'
      })
    })
  })
})
