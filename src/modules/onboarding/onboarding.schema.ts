import { z } from "zod"
import { authUserSchema } from "../auth/auth.schema"

export const onboardingSchema = z.object({
  storeName: z.string(),
  ownerName: z.string(),
  ownerEmail: z.string().email(),
  ownerPassword: z.string().min(6),
  document: z.string(),
  documentType: z.enum(["CPF", "CNPJ"]),
  legalName: z.string().optional()
})

export const onboardingResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    accessToken: z.string(),
    tokenType: z.literal('Bearer'),
    expiresIn: z.number(),
    user: authUserSchema,
    store: z.object({
      id: z.string(),
      name: z.string(),
      slug: z.string()
    })
  })
})

export type OnboardingInput = z.infer<typeof onboardingSchema>
export type OnboardingResponse = z.infer<typeof onboardingResponseSchema>