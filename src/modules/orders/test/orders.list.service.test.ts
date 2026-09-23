import prisma from '../../../database'
import { listOrdersQuerySchema } from '../order.schema'
import { listOrders } from '../order.service'

jest.mock('../../../database', () => ({
  __esModule: true,
  default: {
    order: {
      findMany: jest.fn(),
      count: jest.fn()
    }
  }
}))

const prismaMock = prisma as unknown as {
  order: {
    findMany: jest.Mock
    count: jest.Mock
  }
}

const createdAt = new Date('2026-08-30T12:00:00.000Z')
const updatedAt = new Date('2026-08-30T12:05:00.000Z')

describe('listOrders', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('lists only authenticated store orders filtered by status', async () => {
    prismaMock.order.findMany.mockResolvedValue([
      {
        id: '10000000-0000-4000-8000-000000000001',
        orderNumber: 42,
        customerName: 'Maria',
        customerPhone: '11999999999',
        serviceType: 'DELIVERY',
        paymentMethod: 'PIX',
        status: 'PENDING',
        cancellationType: null,
        total: '85.50',
        createdAt,
        updatedAt,
        _count: { orderItems: 3 }
      }
    ])
    prismaMock.order.count.mockResolvedValue(11)

    const result = await listOrders({
      storeId: 'store-1',
      page: 2,
      limit: 10,
      status: 'PENDING'
    })

    expect(prismaMock.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          storeId: 'store-1',
          status: 'PENDING'
        },
        orderBy: [
          { createdAt: 'desc' },
          { id: 'desc' }
        ],
        skip: 10,
        take: 10
      })
    )
    expect(prismaMock.order.count).toHaveBeenCalledWith({
      where: {
        storeId: 'store-1',
        status: 'PENDING'
      }
    })
    expect(result).toEqual({
      data: [
        {
          id: '10000000-0000-4000-8000-000000000001',
          orderNumber: 42,
          customerName: 'Maria',
          customerPhone: '11999999999',
          serviceType: 'DELIVERY',
          paymentMethod: 'PIX',
          status: 'PENDING',
          cancellationType: null,
          total: 85.5,
          itemCount: 3,
          createdAt: '2026-08-30T12:00:00.000Z',
          updatedAt: '2026-08-30T12:05:00.000Z'
        }
      ],
      meta: {
        total: 11,
        page: 2,
        lastPage: 2
      }
    })
  })

  it('lists all statuses when the filter is omitted', async () => {
    prismaMock.order.findMany.mockResolvedValue([])
    prismaMock.order.count.mockResolvedValue(0)

    await listOrders({
      storeId: 'store-1',
      page: 1,
      limit: 20
    })

    expect(prismaMock.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { storeId: 'store-1' },
        skip: 0,
        take: 20
      })
    )
    expect(prismaMock.order.count).toHaveBeenCalledWith({
      where: { storeId: 'store-1' }
    })
  })

  it('applies query defaults and rejects unknown statuses', () => {
    expect(listOrdersQuerySchema.parse({})).toEqual({
      page: 1,
      limit: 10
    })
    expect(() => listOrdersQuerySchema.parse({ status: 'UNKNOWN' })).toThrow()
  })
})
