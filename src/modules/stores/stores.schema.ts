import { z } from "zod";

export const storeOutputSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
    document: z.string(),
    documentType: z.enum(['CPF', 'CNPJ']),
    legalName: z.string().optional().nullable(),
    status: z.enum(['ACTIVE', 'SUSPENDED', 'BLOCKED']).nullable(),
    phone: z.string().optional().nullable(),
    whatsapp: z.string().nullable(),
    addressLine: z.string().nullable(),
    addressNumber: z.string().nullable(),
    neighborhood: z.string().nullable(),
    city: z.string().nullable(),
    state: z.string().nullable(),
    zipCode: z.string().nullable(),

    latitude: z.number().optional().nullable().nullable(),
    longitude: z.number().optional().nullable().nullable(),

    isOpen: z.boolean(),

    supportsDelivery: z.boolean(),
    supportsPickup: z.boolean(),
    supportsDineIn: z.boolean(),
    deliveryRadiusKm: z.number().nullable(),
    deliveryFeeCents: z.number().nullable(),

    trialEndsAt: z.string().datetime().optional(),

    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime()
})

export const storeResponseSchema = z.object({
    success: z.literal(true),
    data: storeOutputSchema
})

export const updateStoreSchema = z.object({

    name: z.string().optional(),
    legalName: z.string().optional(),
    phone: z.string().optional(),
    whatsapp: z.string().optional(),
    addressLine: z.string().optional(),
    addressNumber: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),

    latitude: z.number().optional(),
    longitude: z.number().optional(),

    supportsDelivery: z.boolean().optional(),
    supportsPickup: z.boolean().optional(),
    supportsDineIn: z.boolean().optional(),
    deliveryRadiusKm: z.number().optional(),
    deliveryFeeCents: z.number().optional(),

})
export type StoreOutput = z.infer<typeof storeOutputSchema>
export type StoreRsponse = z.infer<typeof storeResponseSchema>
export type UpdateStore = z.infer<typeof updateStoreSchema>