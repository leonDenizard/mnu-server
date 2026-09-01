import { expirePendingOrders } from './order-state.service'

type WorkerLogger = {
  error: (payload: unknown, message: string) => void
}

export function startOrderExpirationWorker({
  logger,
  intervalMs = 15_000
}: {
  logger: WorkerLogger
  intervalMs?: number
}) {
  let running = false

  const tick = async () => {
    if (running) {
      return
    }

    running = true

    try {
      await expirePendingOrders()
    } catch (error) {
      logger.error({ err: error }, 'Failed to expire pending orders')
    } finally {
      running = false
    }
  }

  void tick()
  const timer = setInterval(() => void tick(), intervalMs)
  timer.unref()

  return () => clearInterval(timer)
}
