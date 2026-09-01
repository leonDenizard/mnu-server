import prisma from '../../database.js'

export type OrderStreamEvent = {
  id: string
  type: string
  payload: unknown
  occurredAt: string
}

export async function getLatestOrderStreamEventId(storeId: string) {
  const latestEvent = await prisma.orderEventOutbox.findFirst({
    where: { storeId },
    orderBy: { id: 'desc' },
    select: { id: true }
  })

  return latestEvent?.id.toString() ?? '0'
}

function parseEventId(value: string | undefined) {
  if (!value) {
    return undefined
  }

  if (!/^\d+$/.test(value)) {
    return undefined
  }

  return BigInt(value)
}

/**
 * The outbox is the durable source for the SSE feed. Each connection queries
 * its own store and cursor, so reconnects also work when the API runs in more
 * than one process. `publishedAt` is intentionally not a per-client delivery
 * acknowledgement and is therefore not changed here.
 */
export async function listOrderStreamEvents({
  storeId,
  afterEventId,
  limit = 100
}: {
  storeId: string
  afterEventId?: string
  limit?: number
}): Promise<OrderStreamEvent[]> {
  const cursor = parseEventId(afterEventId)

  const events = await prisma.orderEventOutbox.findMany({
    where: {
      storeId,
      ...(cursor === undefined ? {} : { id: { gt: cursor } })
    },
    orderBy: { id: 'asc' },
    take: limit,
    select: {
      id: true,
      type: true,
      payload: true,
      createdAt: true
    }
  })

  return events.map((event) => ({
    id: event.id.toString(),
    type: event.type,
    payload: event.payload,
    occurredAt: event.createdAt.toISOString()
  }))
}
