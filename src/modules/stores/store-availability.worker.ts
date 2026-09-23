import { syncStoreAvailability } from './store-availability.service.js'

export function startStoreAvailabilityWorker({ logger, intervalMs = 30_000 }: { logger: { error: (payload: unknown, message: string) => void }; intervalMs?: number }) {
  let running = false
  const tick = async () => {
    if (running) return
    running = true
    try { await syncStoreAvailability() } catch (error) { logger.error({ err: error }, 'Failed to sync store availability') } finally { running = false }
  }
  void tick()
  const timer = setInterval(() => void tick(), intervalMs)
  timer.unref()
  return () => clearInterval(timer)
}
