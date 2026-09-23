import { FastifyInstance } from "fastify";
import {
    inputSlugParamsSchema,
    publicCreateOrderResponseSchema,
    publicCustomerOrdersResponseSchema,
    publicPersonalCustomerResponseSchema,
    publicMenuResponseSchema
} from "./publicMenu.schema";
import { getPublicMenu } from "./publicMenu.service";
import prisma from '../../../database.js'
import { latestStoreAvailabilityEventId, listStoreAvailabilityEvents } from '../../stores/store-availability-events.service.js'
import { createPublicOrder } from '../../orders/order.service.js'
import { createPublicOrderInputSchema, orderStateResponseSchema } from '../../orders/order.schema.js'
import { publicCustomerLookupSchema, publicCustomerOrderParamsSchema, shortIdParamsSchema } from '../../customers/customer.schema.js'
import {
    cancelPublicCustomerOrderByPhone,
    cancelPublicCustomerOrderByShortId,
    getPublicCustomerByShortId,
    getPublicCustomerOrdersByPhone
} from '../../customers/customer.service.js'

export default function publicMenuRoutes(fastify: FastifyInstance){

    fastify.get('/api/public/menu/:slug/events', {
        config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
        schema: { tags: ['Public Menu'], description: 'Live store availability events', params: inputSlugParamsSchema }
    }, async (request, reply) => {
        const { slug } = inputSlugParamsSchema.parse(request.params)
        const store = await prisma.store.findUnique({ where: { slug }, select: { id: true } })
        if (!store) return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Store not found' } })
        const header = request.headers['last-event-id']
        let current = typeof header === 'string' ? header : await latestStoreAvailabilityEventId(store.id)
        let closed = false
        reply.hijack()
        reply.raw.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' })
        reply.raw.flushHeaders()
        if (!header) reply.raw.write(`id: ${current}\nevent: stream.ready\ndata: ${JSON.stringify({ cursor: current })}\n\n`)
        const publish = async () => {
            const events = await listStoreAvailabilityEvents(store.id, current)
            for (const event of events) {
                reply.raw.write(`id: ${event.id}\nevent: ${event.type}\ndata: ${JSON.stringify({ ...event.payload as object, occurredAt: event.occurredAt })}\n\n`)
                current = event.id
            }
        }
        const interval = setInterval(() => { if (!closed) void publish() }, 1_000)
        const heartbeat = setInterval(() => { if (!closed) reply.raw.write(': keep-alive\n\n') }, 15_000)
        interval.unref(); heartbeat.unref()
        request.raw.on('close', () => { closed = true; clearInterval(interval); clearInterval(heartbeat) })
    })

    fastify.post('/api/public/menu/:slug/orders', {
        config: {
            rateLimit: { max: 5, timeWindow: '10 minutes' }
        },
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
        request.log.info({
            workflow: 'public-order',
            stage: 'received',
            storeSlug: params.slug,
            serviceType: body.serviceType,
            paymentMethod: body.paymentMethod,
            itemCount: body.items.length
        }, 'Public order creation started')
        const result = await createPublicOrder({ slug: params.slug, data: body })
        request.log.info({
            workflow: 'public-order',
            stage: 'created',
            storeSlug: params.slug,
            orderId: result.order.id,
            orderNumber: result.order.orderNumber,
            status: result.order.status
        }, 'Public order created')

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
        config: {
            rateLimit: { max: 10, timeWindow: '15 minutes' }
        },
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

    fastify.post('/api/public/menu/:slug/customers/orders/:orderId/cancel', {
        config: {
            rateLimit: { max: 5, timeWindow: '15 minutes' }
        },
        schema: {
            tags: ['Public Menu'],
            description: 'Cancel a pending customer order after identifying by phone',
            params: inputSlugParamsSchema.merge(publicCustomerOrderParamsSchema),
            body: publicCustomerLookupSchema,
            response: { 200: orderStateResponseSchema }
        }
    }, async (request, reply) => {
        const params = inputSlugParamsSchema.merge(publicCustomerOrderParamsSchema).parse(request.params)
        const body = publicCustomerLookupSchema.parse(request.body)
        const order = await cancelPublicCustomerOrderByPhone({ slug: params.slug, phone: body.phone, orderId: params.orderId })
        return reply.status(200).send({ success: true, data: order })
    })

    fastify.get('/api/public/menu/:slug/customers/access/:shortId', {
        config: {
            rateLimit: { max: 30, timeWindow: '1 minute' }
        },
        schema: {
            tags: ['Public Menu'],
            description: 'Open a revocable personal customer link and record its access',
            params: inputSlugParamsSchema.merge(shortIdParamsSchema),
            response: { 200: publicPersonalCustomerResponseSchema }
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

    fastify.post('/api/public/menu/:slug/customers/access/:shortId/orders/:orderId/cancel', {
        config: {
            rateLimit: { max: 5, timeWindow: '15 minutes' }
        },
        schema: {
            tags: ['Public Menu'],
            description: 'Cancel a pending customer order through its personal link',
            params: inputSlugParamsSchema.merge(shortIdParamsSchema).merge(publicCustomerOrderParamsSchema),
            response: { 200: orderStateResponseSchema }
        }
    }, async (request, reply) => {
        const params = inputSlugParamsSchema.merge(shortIdParamsSchema).merge(publicCustomerOrderParamsSchema).parse(request.params)
        const order = await cancelPublicCustomerOrderByShortId({ slug: params.slug, shortId: params.shortId, orderId: params.orderId })
        return reply.status(200).send({ success: true, data: order })
    })

    fastify.get('/api/public/menu/:slug', {
            config: {
                rateLimit: { max: 120, timeWindow: '1 minute' }
            },
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
