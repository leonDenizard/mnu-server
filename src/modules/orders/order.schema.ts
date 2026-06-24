import z from "zod";

export const orderItemModifierOptionInputSchema = z.object({
    modifierOptionId: z.string().uuid(),
    quantity: z.number().int().positive(),
})

export const orderItemModifierGroupInputSchema = z.object({
    modifierGroupId: z.string().uuid(),
    options: z.array(orderItemModifierOptionInputSchema).min(1),
})

export const orderItemInputSchema = z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
    noteItem: z.string().optional().nullable(),
    orderModifierGroups: z.array(orderItemModifierGroupInputSchema).optional().default([]),
})

export const createOrderInputSchema = z.object({
    customerName: z.string().optional().nullable(),
    customerPhone: z.string().optional().nullable(),
    serviceType: z.enum(['DELIVERY', 'PICKUP', 'DINE_IN']),
    paymentMethod: z.enum(['PIX', 'CASH', 'CARD', 'OTHER']),
    paymentDetail: z.string().optional().nullable(),
    couponCode: z.string().optional().nullable(),
    noteOrder: z.string().optional().nullable(),
    deliveryStreet: z.string().optional().nullable(),
    deliveryAddressNumber: z.number().int().optional().nullable(),
    deliveryNeighborhood: z.string().optional().nullable(),
    deliveryCity: z.string().optional().nullable(),
    deliveryState: z.string().optional().nullable(),
    deliveryZipCode: z.string().optional().nullable(),
    deliveryComplement: z.string().optional().nullable(),
    items: z.array(orderItemInputSchema).min(1),
})

export const orderItemModifierOptionOutputSchema = z.object({
    id: z.string().uuid(),
    modifierOptionId: z.string().uuid().optional().nullable(),
    optionNameSnapshot: z.string(),
    optionPriceSnapshot: z.number().nonnegative(),
    quantity: z.number().int().positive(),
    displayOrder: z.number().int().optional().nullable(),
})

export const orderItemModifierGroupOutputSchema = z.object({
    id: z.string().uuid(),
    modifierGroupId: z.string().uuid().optional().nullable(),
    groupNameSnapshot: z.string(),
    required: z.boolean(),
    minSelections: z.number().int(),
    maxSelections: z.number().int(),
    displayOrder: z.number().int().optional().nullable(),
    options: z.array(orderItemModifierOptionOutputSchema),
})

export const orderItemOutputSchema = z.object({
    id: z.string().uuid(),
    orderId: z.string().uuid(),
    productId: z.string().uuid(),
    productNameSnapshot: z.string(),
    unitPrice: z.number().nonnegative(),
    quantity: z.number().int().positive(),
    total: z.number().nonnegative(),
    noteItem: z.string().optional().nullable(),
    orderModifierGroups: z.array(orderItemModifierGroupOutputSchema),
})

export const orderOutputSchema = z.object({
    id: z.string().uuid(),
    storeId: z.string().uuid(),
    orderNumber: z.number().int().positive(),
    sequenceKey: z.string(),
    customerName: z.string().optional().nullable(),
    customerPhone: z.string().optional().nullable(),
    serviceType: z.enum(['DELIVERY', 'PICKUP', 'DINE_IN']),
    paymentMethod: z.enum(['PIX', 'CASH', 'CARD', 'OTHER']),
    paymentDetail: z.string().optional().nullable(),
    status: z.enum(['PENDING', 'ACCEPTED', 'IN_PREPARATION', 'READY', 'CANCELED', 'FINISHED']),
    couponCode: z.string().optional().nullable(),
    subtotal: z.number().nonnegative(),
    deliveryFee: z.number().nonnegative(),
    discount: z.number().nonnegative(),
    total: z.number().nonnegative(),
    noteOrder: z.string().optional().nullable(),
    cancellationReason: z.string().optional().nullable(),
    printedAt: z.string().optional().nullable(),
    deliveryStreet: z.string().optional().nullable(),
    deliveryAddressNumber: z.number().int().optional().nullable(),
    deliveryNeighborhood: z.string().optional().nullable(),
    deliveryCity: z.string().optional().nullable(),
    deliveryState: z.string().optional().nullable(),
    deliveryZipCode: z.string().optional().nullable(),
    deliveryComplement: z.string().optional().nullable(),
    items: z.array(orderItemOutputSchema).min(1),
    createdAt: z.string(),
    updatedAt: z.string(),
})

export const orderParamsSchema = z.object({
    id: z.string().uuid(),
})

export const orderStatusUpdateInputSchema = z.object({
    status: z.enum(['PENDING', 'ACCEPTED', 'IN_PREPARATION', 'READY', 'CANCELED', 'FINISHED']),
    reason: z.string().optional().nullable(),
})

export const cancelOrderInputSchema = z.object({
    reason: z.string().min(1),
})

export const ordersListResponseSchema = z.object({
    success: z.literal(true),
    data: z.array(orderOutputSchema),
})

export const orderResponseSchema = z.object({
    success: z.literal(true),
    data: orderOutputSchema,
})

export type OrderItemModifierOptionInput = z.infer<typeof orderItemModifierOptionInputSchema>
export type OrderItemModifierGroupInput = z.infer<typeof orderItemModifierGroupInputSchema>
export type OrderItemInput = z.infer<typeof orderItemInputSchema>
export type CreateOrderInput = z.infer<typeof createOrderInputSchema>
export type OrderItemModifierOptionOutput = z.infer<typeof orderItemModifierOptionOutputSchema>
export type OrderItemModifierGroupOutput = z.infer<typeof orderItemModifierGroupOutputSchema>
export type OrderItemOutput = z.infer<typeof orderItemOutputSchema>
export type OrderOutput = z.infer<typeof orderOutputSchema>
export type OrderParams = z.infer<typeof orderParamsSchema>
export type OrderStatusUpdateInput = z.infer<typeof orderStatusUpdateInputSchema>
export type CancelOrderInput = z.infer<typeof cancelOrderInputSchema>
export type OrdersListResponse = z.infer<typeof ordersListResponseSchema>
export type OrderResponse = z.infer<typeof orderResponseSchema>
