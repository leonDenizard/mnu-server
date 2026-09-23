import { isStoreOpenAt, resolveStoreAvailability, validateScheduleSlots } from '../store-opening-hours.js'

const mondayHours = [{ weekday: 'MONDAY' as const, openTime: '09:00', closeTime: '18:00' }]

describe('isStoreOpenAt', () => {
  it('returns open during a configured São Paulo time slot', () => {
    expect(isStoreOpenAt({
      manuallyOpen: true,
      operatingHours: mondayHours,
      now: new Date('2026-09-21T13:00:00.000Z') // Monday, 10:00 in São Paulo
    })).toBe(true)
  })

  it('returns closed outside a configured time slot', () => {
    expect(isStoreOpenAt({
      manuallyOpen: true,
      operatingHours: mondayHours,
      now: new Date('2026-09-21T22:00:00.000Z') // Monday, 19:00 in São Paulo
    })).toBe(false)
  })

  it('respects a manual close even during configured hours', () => {
    expect(isStoreOpenAt({
      manuallyOpen: false,
      operatingHours: mondayHours,
      now: new Date('2026-09-21T13:00:00.000Z')
    })).toBe(false)
  })

  it('keeps stores without schedules open when they are not manually closed', () => {
    expect(isStoreOpenAt({ manuallyOpen: true, operatingHours: [] })).toBe(true)
  })

  it('closes immediate orders in scheduled-only mode', () => {
    expect(resolveStoreAvailability({ mode: 'SCHEDULED_ONLY', operatingHours: mondayHours })).toBe(false)
  })

  it('closes during an active unavailability period', () => {
    const now = new Date('2026-09-21T13:00:00.000Z')
    expect(resolveStoreAvailability({
      mode: 'ALWAYS_AVAILABLE', operatingHours: [], now,
      unavailabilityPeriods: [{ startsAt: new Date('2026-09-21T12:00:00.000Z'), endsAt: new Date('2026-09-21T14:00:00.000Z') }]
    })).toBe(false)
  })

  it('rejects an interval whose opening is after its closing', () => {
    expect(() => validateScheduleSlots([{ weekday: 'MONDAY', openTime: '15:00', closeTime: '13:00' }]))
      .toThrow('Open time must be before close time')
  })

  it('rejects a second interval that overlaps the previous interval', () => {
    expect(() => validateScheduleSlots([
      { weekday: 'MONDAY', openTime: '13:00', closeTime: '15:00' },
      { weekday: 'MONDAY', openTime: '13:00', closeTime: '22:00' }
    ])).toThrow('Each interval must start at or after the previous interval closes')
  })

  it('accepts ordered non-overlapping intervals on the same day', () => {
    expect(() => validateScheduleSlots([
      { weekday: 'MONDAY', openTime: '13:00', closeTime: '15:00' },
      { weekday: 'MONDAY', openTime: '18:00', closeTime: '22:00' }
    ])).not.toThrow()
  })
})
