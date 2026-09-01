import { z } from 'zod'

export const customerPhoneSchema = z.string().trim().min(10).max(30)

export const publicCustomerLookupSchema = z.object({
  phone: customerPhoneSchema
})

export const shortIdParamsSchema = z.object({
  shortId: z.string().min(16).max(128)
})

export const invalidateCustomerLinkSchema = z.object({
  phone: customerPhoneSchema
})

export const customerAccessHeadersSchema = z.object({
  'x-device-id': z.string().trim().min(16).max(128).optional()
})
