import { FastifyInstance } from "fastify";
import {
    inputSlugParamsSchema,
    publicCreateOrderResponseSchema,
    publicCustomerOrdersResponseSchema,
    publicMenuResponseSchema
} from "./publicMenu.schema";
import { getPublicMenu } from "./publicMenu.service";
import { createPublicOrder } from '../../orders/order.service.js'
import { createPublicOrderInputSchema } from '../../orders/order.schema.js'
import { publicCustomerLookupSchema, shortIdParamsSchema } from '../../customers/customer.schema.js'
import { getPublicCustomerByShortId, getPublicCustomerOrdersByPhone } from '../../customers/customer.service.js'

export default function publicMenuRoutes(fastify: FastifyInstance){

    fastify.post('/api/public/menu/:slug/orders', {
        schema: {
            tags: ['Public Menu'],
            description: 'Create an order from the public menu',
            params: inputSlugParamsSchema,
            body: createPublicOrderInputSchema,
            response: { 201: publicCreateOrderResponseSchema }
        }
    }, async (request, reply) => {
        const params = inputSlugParamsSchema.parse(request.params)
        const body = createPublicOrderInputSchema.parse(request.body)
        const result = await createPublicOrder({ slug: params.slug, data: body })

        return reply.status(201).send({
            success: true,
            data: {
                orderId: result.order.id,
                orderNumber: result.order.orderNumber,
                status: result.order.status,
                customerShortId: result.customerShortId,
                customerAccessToken: result.customerAccessToken
            }
        })
    })

    fastify.post('/api/public/menu/:slug/customers/orders', {
        schema: {
            tags: ['Public Menu'],
            description: 'List customer order history by phone for one store',
            params: inputSlugParamsSchema,
            body: publicCustomerLookupSchema,
            response: { 200: publicCustomerOrdersResponseSchema }
        }
    }, async (request, reply) => {
        const params = inputSlugParamsSchema.parse(request.params)
        const body = publicCustomerLookupSchema.parse(request.body)
        const result = await getPublicCustomerOrdersByPhone({ slug: params.slug, phone: body.phone })
        return reply.status(200).send({ success: true, data: result })
    })

    fastify.get('/api/public/menu/:slug/customers/access/:shortId', {
        schema: {
            tags: ['Public Menu'],
            description: 'Open a revocable personal customer link and record its access',
            params: inputSlugParamsSchema.merge(shortIdParamsSchema),
            response: { 200: publicCustomerOrdersResponseSchema }
        }
    }, async (request, reply) => {
        const params = inputSlugParamsSchema.merge(shortIdParamsSchema).parse(request.params)
        const deviceId = typeof request.headers['x-device-id'] === 'string'
            ? request.headers['x-device-id']
            : undefined
        const result = await getPublicCustomerByShortId({
            slug: params.slug,
            shortId: params.shortId,
            ipAddress: request.ip,
            userAgent: request.headers['user-agent'],
            deviceId
        })
        return reply.status(200).send({ success: true, data: result })
    })

    fastify.get('/api/public/menu/:slug', {
            schema: {
                tags: ['Public Menu'],
                description: 'Get current menu on store',
                params: inputSlugParamsSchema,
                response: {
                    200: publicMenuResponseSchema,
                }
            }
        }, async (request, replay) => {
    
            const params = inputSlugParamsSchema.parse(request.params)
            const store = await getPublicMenu({ slug: params.slug })
    
            return replay.status(200).send({
                success: true,
                data: store
            })
        })
}
