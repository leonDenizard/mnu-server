import prisma from '../../database.js'

function cursor(value: string | undefined) {
  return value && /^\d+$/.test(value) ? BigInt(value) : undefined
}

export async function latestStoreAvailabilityEventId(storeId: string) {
  const event = await prisma.storeAvailabilityEventOutbox.findFirst({ where: { storeId }, orderBy: { id: 'desc' }, select: { id: true } })
  return event?.id.toString() ?? '0'
}

export async function listStoreAvailabilityEvents(storeId: string, afterEventId?: string) {
  const after = cursor(afterEventId)
  const events = await prisma.storeAvailabilityEventOutbox.findMany({
    where: { storeId, ...(after === undefined ? {} : { id: { gt: after } }) },
    orderBy: { id: 'asc' }, take: 100,
    select: { id: true, type: true, payload: true, createdAt: true }
  })
  return events.map((event) => ({ id: event.id.toString(), type: event.type, payload: event.payload, occurredAt: event.createdAt.toISOString() }))
}
