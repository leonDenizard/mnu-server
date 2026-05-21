import z from "zod";
import { createPaginatedResponseSchema } from "../../../shared/schemas/response";

export const optionInputSchema = z.object({
    name: z.string().min(3),
    price: z.number().min(0),
    maxQuantity: z.number().int().positive().optional().nullable(),
    displayOrder: z.number().int().min(0).optional(),
    description: z.string().max(400).optional().nullable(),
})

export const createInputModifierGroupsSchema = z.object({
    name: z.string().min(3),
    surname: z.string().max(50).optional(),
    active: z.boolean().optional(),
    required: z.boolean().optional(),
    minSelections: z.number().int().min(0),
    maxSelections: z.number().int().min(1),
    displayOrder: z.number().int().min(0).optional(),
    options: z.array(optionInputSchema).min(1)
})

const modifierOptionOutputSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    price: z.number(),
    description: z.string().max(400).optional().nullable(),
    displayOrder: z.number()
})

export const modifierGroupsOutputSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    surname: z.string().nullable().optional(),
    active: z.boolean(),
    required: z.boolean(),
    minSelections: z.number(),
    maxSelections: z.number(),
    displayOrder: z.number(),
    options: z.array(modifierOptionOutputSchema),
    createdAt: z.string(),
    updatedAt: z.string(),
})

export const modifierGroupsResponse = z.object({
    success: z.literal(true),
    data: modifierGroupsOutputSchema
})

export const modifierGroupsListResponse = createPaginatedResponseSchema(modifierGroupsOutputSchema)

export const modifierGroupsArrayResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(modifierGroupsOutputSchema)
})

export const modifierGroupsParamsSchema = z.object({
    id: z.string().uuid()
})

export const productParamsSchema = z.object({
    id: z.string().uuid()
})

export const linkModifierGroupSchema = z.object({
  modifierGroupId: z.string().uuid()
})

export type OptionInput = z.infer<typeof optionInputSchema>
export type CreateInputModifierGroups = z.infer<typeof createInputModifierGroupsSchema>
export type ModifierOptionOutput = z.infer<typeof modifierOptionOutputSchema>
export type ModifierGroupsOutput = z.infer<typeof modifierGroupsOutputSchema>
export type ModifierGroups = z.infer<typeof modifierGroupsResponse>
export type ModifierGroupsListResponse = z.infer<typeof modifierGroupsListResponse>
export type ModifierGroupsArrayResponse = z.infer<typeof modifierGroupsArrayResponseSchema>
export type ModifierGroupsParams = z.infer<typeof modifierGroupsParamsSchema>
export type ProductParams = z.infer<typeof productParamsSchema>
export type LinkModifierGroup = z.infer<typeof linkModifierGroupSchema>