export type OperatingHour = {
  weekday: 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY'
  openTime: string
  closeTime: string
}

export type StoreAvailabilityMode = 'ALWAYS_AVAILABLE' | 'SCHEDULED' | 'SCHEDULED_ONLY' | 'PERMANENTLY_CLOSED'

export type UnavailabilityPeriod = { startsAt: Date; endsAt: Date }

const weekdayByEnglishName: Record<string, OperatingHour['weekday']> = {
  Sunday: 'SUNDAY',
  Monday: 'MONDAY',
  Tuesday: 'TUESDAY',
  Wednesday: 'WEDNESDAY',
  Thursday: 'THURSDAY',
  Friday: 'FRIDAY',
  Saturday: 'SATURDAY'
}

const storeTimeZone = 'America/Sao_Paulo'

function timeToMinutes(time: string) {
  const [hour, minute] = time.split(':').map(Number)
  return hour * 60 + minute
}

function currentStoreTime(now: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: storeTimeZone,
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(now)

  const weekday = weekdayByEnglishName[parts.find((part) => part.type === 'weekday')?.value ?? '']
  const hour = Number(parts.find((part) => part.type === 'hour')?.value)
  const minute = Number(parts.find((part) => part.type === 'minute')?.value)

  if (!weekday || !Number.isInteger(hour) || !Number.isInteger(minute)) {
    throw new Error('Unable to resolve store local time')
  }

  return { weekday, minutes: hour * 60 + minute }
}

/**
 * A store is available when it has not been manually closed and the current
 * São Paulo time fits one of its configured opening slots. Stores without
 * configured hours retain the previous behaviour and are available.
 */
export function isStoreOpenAt({
  manuallyOpen,
  operatingHours,
  now = new Date()
}: {
  manuallyOpen: boolean
  operatingHours?: OperatingHour[]
  now?: Date
}) {
  if (!manuallyOpen) return false
  if (!operatingHours || operatingHours.length === 0) return true

  const { weekday, minutes } = currentStoreTime(now)

  return operatingHours.some((slot) => (
    slot.weekday === weekday &&
    minutes >= timeToMinutes(slot.openTime) &&
    minutes < timeToMinutes(slot.closeTime)
  ))
}

export function resolveStoreAvailability({
  mode,
  operatingHours,
  unavailabilityPeriods,
  now = new Date()
}: {
  mode: StoreAvailabilityMode
  operatingHours: OperatingHour[]
  unavailabilityPeriods?: UnavailabilityPeriod[]
  now?: Date
}) {
  if (unavailabilityPeriods?.some((period) => period.startsAt <= now && now < period.endsAt)) return false
  if (mode === 'PERMANENTLY_CLOSED' || mode === 'SCHEDULED_ONLY') return false
  if (mode === 'ALWAYS_AVAILABLE') return true
  return isStoreOpenAt({ manuallyOpen: true, operatingHours, now })
}

export function validateScheduleSlots(slots: OperatingHour[]) {
  const byWeekday = new Map<OperatingHour['weekday'], OperatingHour[]>()
  for (const slot of slots) {
    if (timeToMinutes(slot.openTime) >= timeToMinutes(slot.closeTime)) {
      throw new Error('Open time must be before close time')
    }
    const daySlots = byWeekday.get(slot.weekday) ?? []
    const previous = daySlots.at(-1)
    if (previous && timeToMinutes(slot.openTime) < timeToMinutes(previous.closeTime)) {
      throw new Error('Each interval must start at or after the previous interval closes')
    }
    daySlots.push(slot)
    byWeekday.set(slot.weekday, daySlots)
  }
}
