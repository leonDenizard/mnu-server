import z from "zod";

export const inputSlugParamsSchema = z.object({
    slug: z.string()
})

const publicMenuOptionSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(3),
    description: z.string().max(300).optional().nullable(),
    image: z.string().optional().nullable(),
    price: z.number(),
    maxQuantity: z.number().optional().nullable(),
    displayOrder: z.number().int(),
})

export const publicMenuModifierGroupSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    required: z.boolean(),
    minSelections: z.number(),
    maxSelections: z.number(),
    displayOrder: z.number(),
    options: z.array(publicMenuOptionSchema),
})

export const publicMenuProductSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    price: z.number().nullable().optional(),
    description: z.string().nullable().optional(),
    image: z.string().nullable().optional(),
    promotionalPrice: z.number().nullable().optional(),
    displayOrder: z.number().nullable().optional(),
    modifierGroups: z.array(publicMenuModifierGroupSchema)
})

export const publicMenuCategorySchema = z.object({
    id: z.string(),
    title: z.string(),
    displayOrder: z.number(),
    products: z.array(publicMenuProductSchema)
})

export const publicMenuStoreSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
    addressLine: z.string().nullable(),
    addressNumber: z.string().nullable(),
    neighborhood: z.string().nullable(),
    isOpen: z.boolean(),
    supportsDelivery: z.boolean(),
    supportsPickup: z.boolean(),
    supportsDineIn: z.boolean(),
    deliveryFeeCents: z.number().nullable(),
    categories: z.array(publicMenuCategorySchema)

})

export const publicMenuResponseSchema = z.object({
    success: z.literal(true),
    data: publicMenuStoreSchema
})


export type SlugParams = z.infer<typeof inputSlugParamsSchema>
export type PublicMenuStore = z.infer<typeof publicMenuStoreSchema>
export type PublicMenuResponse = z.infer<typeof publicMenuResponseSchema>