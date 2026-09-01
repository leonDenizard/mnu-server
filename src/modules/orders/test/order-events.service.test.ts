import prisma from '../../../database'
import { getLatestOrderStreamEventId, listOrderStreamEvents } from '../order-events.service'

jest.mock('../../../database', () => ({
  __esModule: true,
  default: {
    orderEventOutbox: {
      findMany: jest.fn(),
      findFirst: jest.fn()
    }
  }
}))

const prismaMock = prisma as unknown as {
  orderEventOutbox: { findMany: jest.Mock, findFirst: jest.Mock }
}

describe('order event stream', () => {
  it('lists only the store events after the requested cursor', async () => {
    prismaMock.orderEventOutbox.findMany.mockResolvedValue([
      {
        id: 42n,
        type: 'order.status.changed',
        payload: { orderId: 'order-1', status: 'READY', version: 3 },
        createdAt: new Date('2026-08-31T12:00:00.000Z')
      }
    ])

    const result = await listOrderStreamEvents({
      storeId: 'store-1',
      afterEventId: '41'
    })

    expect(prismaMock.orderEventOutbox.findMany).toHaveBeenCalledWith({
      where: { storeId: 'store-1', id: { gt: 41n } },
      orderBy: { id: 'asc' },
      take: 100,
      select: {
        id: true,
        type: true,
        payload: true,
        createdAt: true
      }
    })
    expect(result).toEqual([
      {
        id: '42',
        type: 'order.status.changed',
        payload: { orderId: 'order-1', status: 'READY', version: 3 },
        occurredAt: '2026-08-31T12:00:00.000Z'
      }
    ])
  })

  it('ignores an invalid cursor instead of querying another event range', async () => {
    prismaMock.orderEventOutbox.findMany.mockResolvedValue([])

    await listOrderStreamEvents({ storeId: 'store-1', afterEventId: 'invalid' })

    expect(prismaMock.orderEventOutbox.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { storeId: 'store-1' } })
    )
  })

  it('returns zero for a new store and the outbox id otherwise', async () => {
    prismaMock.orderEventOutbox.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 99n })

    await expect(getLatestOrderStreamEventId('new-store')).resolves.toBe('0')
    await expect(getLatestOrderStreamEventId('store-1')).resolves.toBe('99')
    expect(prismaMock.orderEventOutbox.findFirst).toHaveBeenCalledWith({
      where: { storeId: 'store-1' },
      orderBy: { id: 'desc' },
      select: { id: true }
    })
  })
})
