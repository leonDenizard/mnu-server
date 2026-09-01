import z from "zod";
import { createPaginatedResponseSchema } from '../../shared/schemas/response';
import { querySchema } from '../../shared/schemas/pagination';

export const orderStatusSchema = z.enum([
    'PENDING',
    'IN_PREPARATION',
    'READY',
    'CANCELED',
    'FINISHED'
])

export const orderServiceTypeSchema = z.enum(['DELIVERY', 'PICKUP', 'DINE_IN'])

export const orderHistoryActionSchema = z.enum([
    'CREATED',
    'AUTO_ACCEPTED',
    'ACCEPTED',
    'REJECTED',
    'CUSTOMER_CANCELED',
    'STORE_CANCELED',
    'ACCEPTANCE_TIMED_OUT',
    'MARKED_READY',
    'FINISHED'
])

export const orderActorTypeSchema = z.enum([
    'CUSTOMER',
    'STORE_USER',
    'SYSTEM',
    'INTEGRATION'
])

export const orderCancellationTypeSchema = z.enum([
    'CUSTOMER_CANCELED',
    'STORE_REJECTED',
    'STORE_CANCELED',
    'ACCEPTANCE_TIMEOUT'
])

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
    serviceType: orderServiceTypeSchema,
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

export const createPublicOrderInputSchema = createOrderInputSchema.extend({
  customerName: z.string().trim().min(1),
  customerPhone: z.string().trim().min(10)
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

export const orderStatusHistoryOutputSchema = z.object({
    id: z.string().uuid(),
    previousStatus: orderStatusSchema.nullable(),
    status: orderStatusSchema,
    action: orderHistoryActionSchema,
    actorType: orderActorTypeSchema,
    actorUserId: z.string().uuid().nullable(),
    actorNameSnapshot: z.string().nullable(),
    reason: z.string().nullable(),
    createdAt: z.string().datetime()
})

export const orderOutputSchema = z.object({
    id: z.string().uuid(),
    storeId: z.string().uuid(),
    orderNumber: z.number().int().positive(),
    sequenceKey: z.string(),
    customerName: z.string().optional().nullable(),
    customerPhone: z.string().optional().nullable(),
    serviceType: orderServiceTypeSchema,
    paymentMethod: z.enum(['PIX', 'CASH', 'CARD', 'OTHER']),
    paymentDetail: z.string().optional().nullable(),
    status: orderStatusSchema,
    couponCode: z.string().optional().nullable(),
    subtotal: z.number().nonnegative(),
    deliveryFee: z.number().nonnegative(),
    discount: z.number().nonnegative(),
    total: z.number().nonnegative(),
    noteOrder: z.string().optional().nullable(),
    cancellationReason: z.string().optional().nullable(),
    cancellationType: orderCancellationTypeSchema.nullable(),
    acceptanceExpiresAt: z.string().datetime().nullable(),
    canceledAt: z.string().datetime().nullable(),
    version: z.number().int().positive(),
    printedAt: z.string().optional().nullable(),
    deliveryStreet: z.string().optional().nullable(),
    deliveryAddressNumber: z.number().int().optional().nullable(),
    deliveryNeighborhood: z.string().optional().nullable(),
    deliveryCity: z.string().optional().nullable(),
    deliveryState: z.string().optional().nullable(),
    deliveryZipCode: z.string().optional().nullable(),
    deliveryComplement: z.string().optional().nullable(),
    items: z.array(orderItemOutputSchema).min(1),
    history: z.array(orderStatusHistoryOutputSchema),
    createdAt: z.string(),
    updatedAt: z.string(),
})

export const orderParamsSchema = z.object({
    id: z.string().uuid(),
})

export const orderStatusUpdateInputSchema = z.object({
    status: orderStatusSchema,
    reason: z.string().optional().nullable(),
})

export const cancelOrderInputSchema = z.object({
    reason: z.string().trim().min(1),
})

export const publicOrderAccessParamsSchema = z.object({
    token: z.string().min(32)
})

export const listOrdersQuerySchema = querySchema.extend({
    status: orderStatusSchema.optional()
})

export const orderSummaryOutputSchema = z.object({
    id: z.string().uuid(),
    orderNumber: z.number().int().positive(),
    customerName: z.string().nullable(),
    customerPhone: z.string().nullable(),
    serviceType: orderServiceTypeSchema,
    paymentMethod: z.enum(['PIX', 'CASH', 'CARD', 'OTHER']),
    status: orderStatusSchema,
    total: z.number().nonnegative(),
    itemCount: z.number().int().nonnegative(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime()
})

export const ordersListResponseSchema = createPaginatedResponseSchema(orderSummaryOutputSchema)

export const orderResponseSchema = z.object({
    success: z.literal(true),
    data: orderOutputSchema,
})

export const createOrderResponseSchema = z.object({
    success: z.literal(true),
    data: z.object({
        order: orderOutputSchema,
        customerAccessToken: z.string().min(32)
    })
})

export const orderStateOutputSchema = z.object({
    id: z.string().uuid(),
    status: orderStatusSchema,
    cancellationType: orderCancellationTypeSchema.nullable(),
    cancellationReason: z.string().nullable(),
    acceptanceExpiresAt: z.string().datetime().nullable(),
    canceledAt: z.string().datetime().nullable(),
    version: z.number().int().positive(),
    updatedAt: z.string().datetime()
})

export const orderStateResponseSchema = z.object({
    success: z.literal(true),
    data: orderStateOutputSchema
})

export type OrderItemModifierOptionInput = z.infer<typeof orderItemModifierOptionInputSchema>
export type OrderItemModifierGroupInput = z.infer<typeof orderItemModifierGroupInputSchema>
export type OrderItemInput = z.infer<typeof orderItemInputSchema>
export type CreateOrderInput = z.infer<typeof createOrderInputSchema>
export type OrderItemModifierOptionOutput = z.infer<typeof orderItemModifierOptionOutputSchema>
export type OrderItemModifierGroupOutput = z.infer<typeof orderItemModifierGroupOutputSchema>
export type OrderItemOutput = z.infer<typeof orderItemOutputSchema>
export type OrderStatusHistoryOutput = z.infer<typeof orderStatusHistoryOutputSchema>
export type OrderOutput = z.infer<typeof orderOutputSchema>
export type OrderParams = z.infer<typeof orderParamsSchema>
export type OrderStatusUpdateInput = z.infer<typeof orderStatusUpdateInputSchema>
export type CancelOrderInput = z.infer<typeof cancelOrderInputSchema>
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>
export type OrderSummaryOutput = z.infer<typeof orderSummaryOutputSchema>
export type OrderStateOutput = z.infer<typeof orderStateOutputSchema>
export type OrdersListResponse = z.infer<typeof ordersListResponseSchema>
export type OrderResponse = z.infer<typeof orderResponseSchema>
