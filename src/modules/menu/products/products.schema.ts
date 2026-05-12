import z from "zod";
import { createPaginatedResponseSchema } from "../../../shared/schemas/response";

export const productInputSchema = z.object({
    name: z.string().min(3),
    price: z.number(),
    description: z.string().max(1000).optional(),
    image: z.string().optional(),
    promotionalPrice: z.number().optional(),
    active: z.boolean().optional(),
    displayOrder: z.number().optional(),
    categoryId: z.string().uuid()
})

export const productOutputSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    price: z.number().nullable().optional(),
    description: z.string().nullable().optional(),
    image: z.string().nullable().optional(),
    promotionalPrice: z.number().nullable().optional(),
    active: z.boolean(),
    displayOrder: z.number().nullable().optional(),
    categoryId: z.string().uuid(),
    storeId: z.string().uuid(),
    createdAt: z.string(),
    updatedAt: z.string()
})

export const productListResponseSchema = createPaginatedResponseSchema(productOutputSchema)

export const productResponseSchema = z.object({
  success: z.literal(true),
  data: productOutputSchema
})

export const productParamsSchema = z.object({
    id: z.string()
})

export const categoryParamsSchema = z.object({
    id: z.string()
})

export type ProductInput = z.infer<typeof productInputSchema>
export type ProductOutput = z.infer<typeof productOutputSchema>
export type ProductListResponse = z.infer<typeof productListResponseSchema>
export type ProductResponse = z.infer<typeof productResponseSchema>
export type ProductParams = z.infer<typeof productParamsSchema>
export type CategoryParams = z.infer<typeof categoryParamsSchema>