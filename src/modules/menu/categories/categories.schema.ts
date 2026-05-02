import z from "zod";
import { createPaginatedResponseSchema } from "../../../shared/schemas/response";

export const categoryInputSchema = z.object({
    title: z.string(),
    active: z.boolean(),
    displayOrder: z.number().optional(),
    showInMenu: z.boolean().optional(),
    showInPos: z.boolean().optional(),
    showInWaiter: z.boolean().optional()
})

export const categoryOutputSchema = z.object({
    id: z.string(),
    title: z.string(),
    active: z.boolean(),
    displayOrder: z.number(),
    showInMenu: z.boolean(),
    showInPos: z.boolean(),
    showInWaiter: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string()
})

export const categoryListResponseSchema = createPaginatedResponseSchema(categoryOutputSchema)

export const categoryParamsSchema = z.object({
    id: z.string()
})

export type CategoryOutput = z.infer<typeof categoryOutputSchema>
export type CategoryInput = z.infer<typeof categoryInputSchema>
export type CategoryListResponse = z.infer<typeof categoryListResponseSchema>
export type CategoryParams = z.infer<typeof categoryParamsSchema>