import { z } from "zod"

export const onboardingSchema = z.object({
  storeName: z.string(),
  ownerName: z.string(),
  ownerEmail: z.string().email(),
  ownerPassword: z.string().min(6),
  document: z.string(),
  documentType: z.enum(["CPF", "CNPJ"]),
  legalName: z.string().optional()
})

export type OnboardingInput = z.infer<typeof onboardingSchema>