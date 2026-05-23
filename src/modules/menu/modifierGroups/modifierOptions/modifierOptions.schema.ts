import z from "zod";

export const modifierOptionItemSchema = z.object({
    name: z.string().min(3),
    description: z.string().max(300).optional().nullable(),
    image: z.string().optional(),
    price: z.number().optional(),
    maxQuantity: z.number().int().optional(),
    active: z.boolean().optional(),
    displayOrder: z.number().int().optional(),
})

export const modifierOptionsInputSchema = z.object({
    data: z.array(modifierOptionItemSchema).min(1)
})

const modifierOptionsOutputSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(3),
    description: z.string().max(300).optional().nullable(),
    image: z.string().optional().nullable(),
    price: z.number(),
    maxQuantity: z.number().optional().nullable(),
    active: z.boolean(),
    displayOrder: z.number().int(),
    createdAt: z.string(),
    updatedAt: z.string(),
    modifierGroupId: z.string().uuid()
})

export const modifierOptionsResponseListSchema = z.object({
    success: z.literal(true),
    data: z.array(modifierOptionsOutputSchema)
})

export const modifierOptionsParamsSchema = z.object({
    id: z.string().uuid()
})

export const modifierOptionsUpdateInputSchema = z.object({
    id: z.string().uuid(),
    data: z.array(modifierOptionItemSchema).min(1)
})

export type ModifierOptionItem = z.infer<typeof modifierOptionItemSchema>
export type ModifierOptionsInput = z.infer<typeof modifierOptionsInputSchema>
export type ModifierOptionsOutput = z.infer<typeof modifierOptionsOutputSchema>
export type ModifierOptionsResponseList = z.infer<typeof modifierOptionsResponseListSchema>
export type ModifierOptionsParams = z.infer<typeof modifierOptionsParamsSchema>
export type ModifierOptionsUpdateInput = z.infer<typeof modifierOptionsUpdateInputSchema>

