import prisma from '../../../database'
import { hashOrderAccessToken } from '../order-access-token'
import type { CreateOrderInput } from '../order.schema'
import { createOrder } from '../order.service'

jest.mock('../../../database', () => ({
  __esModule: true,
  default: {
    store: { findFirst: jest.fn() },
    user: { findFirst: jest.fn() },
    $transaction: jest.fn()
  }
}))

const prismaMock = prisma as unknown as {
  store: { findFirst: jest.Mock }
  user: { findFirst: jest.Mock }
  $transaction: jest.Mock
}

const storeId = '10000000-0000-4000-8000-000000000001'
const userId = '20000000-0000-4000-8000-000000000001'
const productId = '30000000-0000-4000-8000-000000000001'
const now = new Date('2026-08-30T12:00:00.000Z')

const input: CreateOrderInput = {
  customerName: 'Maria',
  customerPhone: '11999999999',
  serviceType: 'PICKUP',
  paymentMethod: 'PIX',
  items: [{ productId, quantity: 1, orderModifierGroups: [] }]
}

function buildCreatedOrder(data: Record<string, any>) {
  return {
    id: '40000000-0000-4000-8000-000000000001',
    storeId,
    orderNumber: 1,
    sequenceKey: 'global',
    customerName: input.customerName ?? null,
    customerPhone: input.customerPhone ?? null,
    serviceType: input.serviceType,
    paymentMethod: input.paymentMethod,
    paymentDetail: null,
    status: data.status,
    subtotal: '40.00',
    deliveryFee: '0.00',
    discount: '0.00',
    couponCode: null,
    total: '40.00',
    noteOrder: null,
    cancellationReason: null,
    cancellationType: null,
    acceptanceExpiresAt: data.acceptanceExpiresAt,
    canceledAt: null,
    publicAccessTokenHash: data.publicAccessTokenHash,
    version: data.version,
    printedAt: null,
    deliveryStreet: null,
    deliveryAddressNumber: null,
    deliveryNeighborhood: null,
    deliveryCity: null,
    deliveryState: null,
    deliveryZipCode: null,
    deliveryComplement: null,
    createdAt: now,
    updatedAt: now,
    orderItems: [
      {
        id: '50000000-0000-4000-8000-000000000001',
        orderId: '40000000-0000-4000-8000-000000000001',
        productId,
        productNameSnapshot: 'Pizza',
        unitPrice: '40.00',
        quantity: 1,
        total: '40.00',
        noteItem: null,
        modifierGroups: []
      }
    ],
    orderStatusHistories: data.orderStatusHistories.create.map(
      (history: Record<string, unknown>, index: number) => ({
        id: `60000000-0000-4000-8000-00000000000${index + 1}`,
        orderId: '40000000-0000-4000-8000-000000000001',
        ...history,
        createdAt: now,
        updatedAt: now
      })
    )
  }
}

describe('order creation state', () => {
  const tx = {
    orderSequence: {
      upsert: jest.fn().mockResolvedValue({ current: 1 })
    },
    product: {
      findFirst: jest.fn().mockResolvedValue({
        id: productId,
        name: 'Pizza',
        price: '40.00',
        modifierGroups: []
      })
    },
    order: {
      create: jest.fn()
    },
    orderEventOutbox: {
      create: jest.fn()
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    prismaMock.user.findFirst.mockResolvedValue({ id: userId, name: 'Leon' })
    prismaMock.$transaction.mockImplementation(async (callback: (client: typeof tx) => unknown) => {
      return callback(tx)
    })
    tx.order.create.mockImplementation(({ data }: { data: Record<string, any> }) => {
      return buildCreatedOrder(data)
    })
  })

  it('creates a pending order with a five-minute acceptance deadline', async () => {
    prismaMock.store.findFirst.mockResolvedValue({
      status: 'ACTIVE',
      isOpen: true,
      availabilityMode: 'ALWAYS_AVAILABLE',
      operatingHours: [],
      unavailabilityPeriods: [],
      supportsDelivery: true,
      supportsPickup: true,
      supportsDineIn: true,
      autoAcceptOrders: false,
      orderSequenceMode: 'CONTINUOUS',
      deliveryFeeCents: 0
    })

    const result = await createOrder({ storeId, userId, data: input })
    const createData = tx.order.create.mock.calls[0][0].data

    expect(createData).toEqual(
      expect.objectContaining({
        status: 'PENDING',
        acceptanceExpiresAt: expect.any(Date),
        version: 1,
        publicAccessTokenHash: expect.any(String)
      })
    )
    expect(createData.orderStatusHistories.create).toHaveLength(1)
    expect(createData.orderStatusHistories.create[0]).toEqual(
      expect.objectContaining({
        action: 'CREATED',
        actorType: 'STORE_USER',
        actorUserId: userId,
        actorNameSnapshot: 'Leon'
      })
    )
    expect(hashOrderAccessToken(result.customerAccessToken)).toBe(
      createData.publicAccessTokenHash
    )
    expect(result.order.status).toBe('PENDING')
  })

  it('records automatic acceptance and starts preparation immediately', async () => {
    prismaMock.store.findFirst.mockResolvedValue({
      status: 'ACTIVE',
      isOpen: true,
      availabilityMode: 'ALWAYS_AVAILABLE',
      operatingHours: [],
      unavailabilityPeriods: [],
      supportsDelivery: true,
      supportsPickup: true,
      supportsDineIn: true,
      autoAcceptOrders: true,
      orderSequenceMode: 'CONTINUOUS',
      deliveryFeeCents: 0
    })

    const result = await createOrder({ storeId, userId, data: input })
    const createData = tx.order.create.mock.calls[0][0].data

    expect(createData).toEqual(
      expect.objectContaining({
        status: 'IN_PREPARATION',
        acceptanceExpiresAt: null,
        version: 2
      })
    )
    expect(createData.orderStatusHistories.create).toEqual([
      expect.objectContaining({ action: 'CREATED' }),
      expect.objectContaining({
        previousStatus: 'PENDING',
        status: 'IN_PREPARATION',
        action: 'AUTO_ACCEPTED',
        actorType: 'SYSTEM'
      })
    ])
    expect(result.order.status).toBe('IN_PREPARATION')
  })
})
