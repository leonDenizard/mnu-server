import z from "zod";

export const productModifierGroupParamsSchema = z.object({
  productId: z.string().uuid()
})

export const linkModifierGroupToProductInputSchema = z.object({
  modifierGroupId: z.string().uuid()
})

export const productModifierGroupDeleteParamsSchema = z.object({
  productId: z.string().uuid(),
  modifierGroupId: z.string().uuid()
})

const linkedModifierOptionOutputSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  price: z.number(),
  description: z.string().max(400).optional().nullable(),
  displayOrder: z.number()
})

const linkedModifierGroupOutputSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  surname: z.string().nullable().optional(),
  active: z.boolean(),
  required: z.boolean(),
  minSelections: z.number(),
  maxSelections: z.number(),
  displayOrder: z.number(),
  options: z.array(linkedModifierOptionOutputSchema),
  createdAt: z.string(),
  updatedAt: z.string()
})

export const productModifierGroupsResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(linkedModifierGroupOutputSchema)
})

export type ProductModifierGroupParams = z.infer<typeof productModifierGroupParamsSchema>
export type LinkModifierGroupToProductInput = z.infer<typeof linkModifierGroupToProductInputSchema>
export type ProductModifierGroupDeleteParams = z.infer<typeof productModifierGroupDeleteParamsSchema>
export type LinkedModifierGroupOutput = z.infer<typeof linkedModifierGroupOutputSchema>
export type ProductModifierGroupsResponse = z.infer<typeof productModifierGroupsResponseSchema>

