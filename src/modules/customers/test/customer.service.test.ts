import prisma from '../../../database'
import {
  getPublicCustomerByShortId,
  getPublicCustomerOrdersByPhone,
  invalidateCustomerLink
} from '../customer.service'

jest.mock('../../../database', () => ({
  __esModule: true,
  default: {
    customer: { findFirst: jest.fn(), findUnique: jest.fn() },
    customerAccessLink: { findFirst: jest.fn(), update: jest.fn(), updateMany: jest.fn(), create: jest.fn() },
    customerAccessLog: { create: jest.fn() },
    $transaction: jest.fn()
  }
}))

const prismaMock = prisma as unknown as {
  customer: { findFirst: jest.Mock, findUnique: jest.Mock }
  customerAccessLink: { findFirst: jest.Mock, update: jest.Mock, updateMany: jest.Mock, create: jest.Mock }
  customerAccessLog: { create: jest.Mock }
  $transaction: jest.Mock
}

const order = {
  id: '10000000-0000-4000-8000-000000000001',
  orderNumber: 1,
  status: 'PENDING' as const,
  serviceType: 'DELIVERY' as const,
  total: { toString: () => '32.50' },
  deliveryStreet: 'Rua das Flores',
  deliveryNeighborhood: 'Centro',
  deliveryCity: 'São Paulo',
  createdAt: new Date('2026-09-01T12:00:00.000Z'),
  updatedAt: new Date('2026-09-01T12:00:00.000Z')
}

describe('public customer access', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    prismaMock.$transaction.mockResolvedValue([])
  })

  it('returns customer history scoped by the store slug with an address that hides the number', async () => {
    prismaMock.customer.findFirst.mockResolvedValue({
      id: 'customer-1', name: 'Leon', orders: [order], addresses: []
    })

    const result = await getPublicCustomerOrdersByPhone({ slug: 'leons', phone: '(11) 99999-9999' })

    expect(prismaMock.customer.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { phoneNormalized: '11999999999', store: { slug: 'leons' } }
    }))
    expect(result).toEqual({
      customerName: 'Leon',
      addresses: [],
      orders: [expect.objectContaining({
        deliveryAddressLabel: 'Rua das Flor…, Centro, São Paulo'
      })]
    })
    expect(result.orders[0].deliveryAddressLabel).not.toContain('123')
  })

  it('records IP, user agent and a hashed device id when a personal link is opened', async () => {
    prismaMock.customerAccessLink.findFirst.mockResolvedValue({
      id: 'link-1', customer: { name: 'Leon', orders: [order], addresses: [] }
    })
    prismaMock.customerAccessLink.update.mockResolvedValue({})
    prismaMock.customerAccessLog.create.mockResolvedValue({})

    await getPublicCustomerByShortId({
      slug: 'leons',
      shortId: 'a-valid-personal-short-id',
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
      deviceId: 'device-identifier-1234'
    })

    expect(prismaMock.customerAccessLink.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ revokedAt: null, customer: { store: { slug: 'leons' } } })
    }))
    expect(prismaMock.customerAccessLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        accessLinkId: 'link-1', ipAddress: '127.0.0.1', userAgent: 'test-agent',
        deviceIdHash: expect.any(String)
      })
    })
  })

  it('revokes only active links from the customer in the authenticated store and issues a new one', async () => {
    prismaMock.customer.findUnique.mockResolvedValue({ id: 'customer-1' })
    prismaMock.customerAccessLink.updateMany.mockResolvedValue({ count: 1 })
    prismaMock.customerAccessLink.create.mockResolvedValue({})

    const result = await invalidateCustomerLink({ storeId: 'store-1', phone: '11999999999' })

    expect(prismaMock.customer.findUnique).toHaveBeenCalledWith({
      where: { storeId_phoneNormalized: { storeId: 'store-1', phoneNormalized: '11999999999' } },
      select: { id: true }
    })
    expect(prismaMock.customerAccessLink.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { customerId: 'customer-1', revokedAt: null }
    }))
    expect(result.shortId).toHaveLength(22)
  })
})
