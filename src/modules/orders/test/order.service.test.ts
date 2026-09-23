import prisma from '../../../database'
import type { CreateOrderInput } from '../order.schema'
import { createOrder } from '../order.service'

jest.mock('../../../database', () => ({
  __esModule: true,
  default: {
    store: {
      findFirst: jest.fn()
    },
    user: {
      findFirst: jest.fn()
    },
    $transaction: jest.fn()
  }
}))

const prismaMock = prisma as unknown as {
  store: {
    findFirst: jest.Mock
  }
  user: {
    findFirst: jest.Mock
  }
  $transaction: jest.Mock
}

const baseOrder: CreateOrderInput = {
  customerName: 'Maria',
  customerPhone: '11999999999',
  serviceType: 'PICKUP',
  paymentMethod: 'PIX',
  items: [
    {
      productId: '10000000-0000-4000-8000-000000000001',
      quantity: 1,
      orderModifierGroups: []
    }
  ]
}

const availableStore = {
  status: 'ACTIVE',
  isOpen: true,
  availabilityMode: 'ALWAYS_AVAILABLE',
  operatingHours: [],
  unavailabilityPeriods: [],
  supportsDelivery: true,
  supportsPickup: true,
  supportsDineIn: true,
  orderSequenceMode: 'CONTINUOUS',
  deliveryFeeCents: 500
}

function createServiceInput(data: CreateOrderInput = baseOrder) {
  return {
    storeId: 'store-1',
    userId: 'user-1',
    data
  }
}

describe('createOrder validations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    prismaMock.store.findFirst.mockResolvedValue(availableStore)
    prismaMock.user.findFirst.mockResolvedValue({ id: 'user-1', name: 'Maria' })
  })

  it('rejects orders when the store is not active', async () => {
    prismaMock.store.findFirst.mockResolvedValue({
      ...availableStore,
      status: 'SUSPENDED'
    })

    await expect(createOrder(createServiceInput())).rejects.toThrow('Store is not active')
    expect(prismaMock.$transaction).not.toHaveBeenCalled()
  })

  it('rejects orders when the store is closed', async () => {
    prismaMock.store.findFirst.mockResolvedValue({
      ...availableStore,
      availabilityMode: 'PERMANENTLY_CLOSED'
    })

    await expect(createOrder(createServiceInput())).rejects.toThrow('Store is closed')
    expect(prismaMock.$transaction).not.toHaveBeenCalled()
  })

  it('rejects a service type that the store does not support', async () => {
    prismaMock.store.findFirst.mockResolvedValue({
      ...availableStore,
      supportsPickup: false
    })

    await expect(createOrder(createServiceInput())).rejects.toThrow(
      'Service type "PICKUP" is not available for this store'
    )
    expect(prismaMock.$transaction).not.toHaveBeenCalled()
  })

  it('rejects the same modifier group more than once', async () => {
    const modifierGroupId = '20000000-0000-4000-8000-000000000001'
    const modifierOptionId = '30000000-0000-4000-8000-000000000001'
    const data: CreateOrderInput = {
      ...baseOrder,
      items: [
        {
          ...baseOrder.items[0],
          orderModifierGroups: [
            {
              modifierGroupId,
              options: [{ modifierOptionId, quantity: 1 }]
            },
            {
              modifierGroupId,
              options: [{ modifierOptionId, quantity: 1 }]
            }
          ]
        }
      ]
    }

    await expect(createOrder(createServiceInput(data))).rejects.toThrow(
      `Modifier group "${modifierGroupId}" cannot be selected more than once`
    )
    expect(prismaMock.store.findFirst).not.toHaveBeenCalled()
  })

  it('rejects the same modifier option more than once in a group', async () => {
    const modifierOptionId = '30000000-0000-4000-8000-000000000001'
    const data: CreateOrderInput = {
      ...baseOrder,
      items: [
        {
          ...baseOrder.items[0],
          orderModifierGroups: [
            {
              modifierGroupId: '20000000-0000-4000-8000-000000000001',
              options: [
                { modifierOptionId, quantity: 1 },
                { modifierOptionId, quantity: 1 }
              ]
            }
          ]
        }
      ]
    }

    await expect(createOrder(createServiceInput(data))).rejects.toThrow(
      `Modifier option "${modifierOptionId}" cannot be selected more than once`
    )
    expect(prismaMock.store.findFirst).not.toHaveBeenCalled()
  })

  it('requires linked groups marked as required', async () => {
    const tx = {
      orderSequence: {
        upsert: jest.fn().mockResolvedValue({ current: 1 })
      },
      product: {
        findFirst: jest.fn().mockResolvedValue({
          id: baseOrder.items[0].productId,
          name: 'Pizza',
          price: '40.00',
          modifierGroups: [
            {
              modifierGroupId: '20000000-0000-4000-8000-000000000001',
              modifierGroup: {
                id: '20000000-0000-4000-8000-000000000001',
                name: 'Tamanho',
                required: true,
                minSelections: 1,
                maxSelections: 1,
                displayOrder: 0,
                options: []
              }
            }
          ]
        })
      }
    }

    prismaMock.$transaction.mockImplementation(
      async (callback: (client: typeof tx) => unknown) => callback(tx)
    )

    await expect(createOrder(createServiceInput())).rejects.toThrow(
      'Modifier group "Tamanho" requires a selection'
    )
  })
})
