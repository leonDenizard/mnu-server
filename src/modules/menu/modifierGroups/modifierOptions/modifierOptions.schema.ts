import z from "zod";
import { success } from "zod/v4";

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

export const modifierOptionsOutputSchema = z.object({
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

export const modifierOptionUpdateItemSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(3).optional(),
    description: z.string().max(300).optional().nullable(),
    image: z.string().optional(),
    price: z.number().optional(),
    maxQuantity: z.number().int().optional(),
    active: z.boolean().optional(),
    displayOrder: z.number().int().optional(),
})

export const modifierOptionsBulkUpdateSchema = z.object({
    data: z.array(modifierOptionUpdateItemSchema).min(1)
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

export const deleteBulkOptionsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1)
})

export const deleteBulkOptionsOutputSchema = z.object({
  message: z.string(),
  ids: z.array(z.string().uuid())
})

export const deleteBulkOptionsOutputResponseSchema = z.object({
    success: z.literal(true),
    data: deleteBulkOptionsOutputSchema
})

export type ModifierOptionItem = z.infer<typeof modifierOptionItemSchema>
export type ModifierOptionsInput = z.infer<typeof modifierOptionsInputSchema>
export type ModifierOptionsOutput = z.infer<typeof modifierOptionsOutputSchema>
export type ModifierOptionUpdateItem = z.infer<typeof modifierOptionUpdateItemSchema>
export type ModifierOptionsBulkUpdate = z.infer<typeof modifierOptionsBulkUpdateSchema>
export type ModifierOptionsResponseList = z.infer<typeof modifierOptionsResponseListSchema>
export type ModifierOptionsParams = z.infer<typeof modifierOptionsParamsSchema>
export type ModifierOptionsUpdateInput = z.infer<typeof modifierOptionsUpdateInputSchema>
export type DeleteBulkOptionsInput = z.infer<typeof deleteBulkOptionsSchema>
export type DeleteBulkOptionsOutput = z.infer<typeof deleteBulkOptionsOutputSchema>
