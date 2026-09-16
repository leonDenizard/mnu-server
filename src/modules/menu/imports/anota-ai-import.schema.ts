import { z } from 'zod'

export const anotaAiImportResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    categories: z.number().int().nonnegative(),
    products: z.number().int().nonnegative(),
    modifierGroups: z.number().int().nonnegative(),
    modifierOptions: z.number().int().nonnegative(),
    productModifierGroups: z.number().int().nonnegative()
  })
})
