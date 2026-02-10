import { z } from 'zod'

export const healthResponseSchema = z.object({
  status: z.string(),
  message: z.string(),
  timestamp: z.string().datetime()
})
