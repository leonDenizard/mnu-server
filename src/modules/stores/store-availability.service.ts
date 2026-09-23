import prisma from '../../database.js'
import { BadRequestError, NotFoundError } from '../../shared/errors/app-error.js'
import { resolveStoreAvailability, validateScheduleSlots, type OperatingHour, type StoreAvailabilityMode } from './store-opening-hours.js'

type AvailabilityInput = { mode: StoreAvailabilityMode; operatingHours: OperatingHour[] }

export async function updateStoreAvailability(storeId: string, input: AvailabilityInput) {
  if (input.mode === 'SCHEDULED' && input.operatingHours.length === 0) {
    throw new BadRequestError('Scheduled availability requires at least one operating hour')
  }
  try { validateScheduleSlots(input.operatingHours) } catch (error) {
    throw new BadRequestError(error instanceof Error ? error.message : 'Invalid operating hours')
  }

  await prisma.$transaction(async (tx) => {
    const store = await tx.store.findUnique({ where: { id: storeId }, select: { id: true } })
    if (!store) throw new NotFoundError('Store not found')
    await tx.storeOperatingHour.deleteMany({ where: { storeId } })
    // Prisma rejects an empty `createMany`. Modes such as permanently closed
    // deliberately have no timetable, so only persist slots when they exist.
    if (input.operatingHours.length > 0) {
      await tx.storeOperatingHour.createMany({ data: input.operatingHours.map((hour) => ({ ...hour, storeId })) })
    }
    await tx.store.update({ where: { id: storeId }, data: { availabilityMode: input.mode } })
  })
  await syncStoreAvailability({ storeIds: [storeId] })
}

export async function createUnavailabilityPeriod(storeId: string, input: { startsAt: Date; endsAt: Date; reason?: string }) {
  if (input.startsAt >= input.endsAt) throw new BadRequestError('Unavailability end must be after its start')
  const period = await prisma.storeUnavailabilityPeriod.create({ data: { storeId, ...input } })
  await syncStoreAvailability({ storeIds: [storeId] })
  return period
}

export async function syncStoreAvailability({ storeIds, now = new Date() }: { storeIds?: string[]; now?: Date } = {}) {
  const stores = await prisma.store.findMany({
    where: storeIds ? { id: { in: storeIds } } : {},
    select: {
      id: true, isOpen: true, availabilityMode: true,
      operatingHours: { select: { weekday: true, openTime: true, closeTime: true } },
      unavailabilityPeriods: { where: { startsAt: { lte: now }, endsAt: { gt: now } }, select: { startsAt: true, endsAt: true } }
    }
  })
  let changed = 0
  for (const store of stores) {
    const isOpen = resolveStoreAvailability({ mode: store.availabilityMode, operatingHours: store.operatingHours, unavailabilityPeriods: store.unavailabilityPeriods, now })
    if (isOpen === store.isOpen) continue
    const didUpdate = await prisma.$transaction(async (tx) => {
      const update = await tx.store.updateMany({ where: { id: store.id, isOpen: store.isOpen }, data: { isOpen } })
      if (update.count === 0) return false
      await tx.storeAvailabilityEventOutbox.create({ data: { storeId: store.id, type: 'store.availability.changed', payload: { storeId: store.id, isOpen, mode: store.availabilityMode, occurredAt: now.toISOString() } } })
      return true
    })
    if (didUpdate) changed += 1
  }
  return changed
}
