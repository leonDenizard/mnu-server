import { FastifyInstance } from "fastify"
import {
  cancelOrderInputSchema,
  createOrderInputSchema,
  createOrderResponseSchema,
  listOrdersQuerySchema,
  orderParamsSchema,
  orderResponseSchema,
  ordersListResponseSchema,
  orderStateResponseSchema,
  publicOrderAccessParamsSchema
} from "./order.schema"
import { createOrder, getOrderById, listOrders } from "./order.service"
import { cancelOrderByCustomerToken, transitionStoreOrder } from './order-state.service'
import { getLatestOrderStreamEventId, listOrderStreamEvents } from './order-events.service'

export default function orderRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/api/orders/events',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['Orders'],
        description: 'Live store order events over Server-Sent Events (SSE). Authenticate with a Bearer token.',
        response: {}
      }
    },
    async (request, reply) => {
      const header = request.headers['last-event-id']
      const lastEventId = typeof header === 'string' ? header : undefined
      let cursor = lastEventId ?? await getLatestOrderStreamEventId(request.user.storeId)
      let closed = false
      let polling = false

      reply.hijack()
      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no'
      })
      reply.raw.flushHeaders()
      if (!lastEventId) {
        reply.raw.write(`id: ${cursor}\n`)
        reply.raw.write('event: stream.ready\n')
        reply.raw.write(`data: ${JSON.stringify({ cursor })}\n\n`)
      }

      const writeEvents = async () => {
        if (closed || polling) return
        polling = true

        try {
          const events = await listOrderStreamEvents({
            storeId: request.user.storeId,
            afterEventId: cursor
          })

          for (const event of events) {
            reply.raw.write(`id: ${event.id}\n`)
            reply.raw.write(`event: ${event.type}\n`)
            reply.raw.write(`data: ${JSON.stringify({ ...event.payload as object, occurredAt: event.occurredAt })}\n\n`)
            cursor = event.id
          }
        } catch (error) {
          request.log.error({ err: error }, 'Failed to publish order stream events')
        } finally {
          polling = false
        }
      }

      void writeEvents()
      const interval = setInterval(() => void writeEvents(), 1_000)
      const heartbeat = setInterval(() => {
        if (!closed) reply.raw.write(': keep-alive\n\n')
      }, 15_000)
      interval.unref()
      heartbeat.unref()

      request.raw.on('close', () => {
        closed = true
        clearInterval(interval)
        clearInterval(heartbeat)
      })
    }
  )

  fastify.get(
    "/api/orders",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["Orders"],
        description: "List store orders with pagination and optional status filter",
        querystring: listOrdersQuerySchema,
        response: {
          200: ordersListResponseSchema
        }
      }
    },
    async (request, reply) => {
      const query = listOrdersQuerySchema.parse(request.query)
      const orders = await listOrders({
        storeId: request.user.storeId,
        ...query
      })

      return reply.status(200).send({
        success: true,
        ...orders
      })
    }
  )

  fastify.get(
    "/api/orders/:id",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["Orders"],
        description: "Get complete order details and status history",
        params: orderParamsSchema,
        response: {
          200: orderResponseSchema
        }
      }
    },
    async (request, reply) => {
      const params = orderParamsSchema.parse(request.params)
      const order = await getOrderById({
        storeId: request.user.storeId,
        orderId: params.id
      })

      return reply.status(200).send({ success: true, data: order })
    }
  )

  fastify.post(
    "/api/orders",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["Orders"],
        description: "Create an order with snapshot items and modifier groups",
        body: createOrderInputSchema,
        response: {
          201: createOrderResponseSchema
        }
      }
    },
    async (request, reply) => {
      const body = createOrderInputSchema.parse(request.body)

      const result = await createOrder({
        storeId: request.user.storeId,
        userId: request.user.sub,
        data: body
      })

      return reply.status(201).send({
        success: true,
        data: result
      })
    }
  )

  const registerStoreTransition = (
    path: string,
    action: 'accept' | 'ready' | 'finish'
  ) => {
    fastify.patch(
      path,
      {
        preHandler: [fastify.authenticate],
        schema: {
          tags: ["Orders"],
          description: `${action} order`,
          params: orderParamsSchema,
          response: { 200: orderStateResponseSchema }
        }
      },
      async (request, reply) => {
        const params = orderParamsSchema.parse(request.params)
        const order = await transitionStoreOrder({
          storeId: request.user.storeId,
          userId: request.user.sub,
          orderId: params.id,
          action
        })

        return reply.status(200).send({ success: true, data: order })
      }
    )
  }

  registerStoreTransition('/api/orders/:id/accept', 'accept')
  registerStoreTransition('/api/orders/:id/ready', 'ready')
  registerStoreTransition('/api/orders/:id/finish', 'finish')

  const registerStoreCancellation = (
    path: string,
    action: 'reject' | 'cancel'
  ) => {
    fastify.post(
      path,
      {
        preHandler: [fastify.authenticate],
        schema: {
          tags: ["Orders"],
          description: `${action} order with a required reason`,
          params: orderParamsSchema,
          body: cancelOrderInputSchema,
          response: { 200: orderStateResponseSchema }
        }
      },
      async (request, reply) => {
        const params = orderParamsSchema.parse(request.params)
        const body = cancelOrderInputSchema.parse(request.body)
        const order = await transitionStoreOrder({
          storeId: request.user.storeId,
          userId: request.user.sub,
          orderId: params.id,
          action,
          reason: body.reason
        })

        return reply.status(200).send({ success: true, data: order })
      }
    )
  }

  registerStoreCancellation('/api/orders/:id/reject', 'reject')
  registerStoreCancellation('/api/orders/:id/cancel', 'cancel')

  fastify.post(
    '/api/public/orders/access/:token/cancel',
    {
      schema: {
        tags: ["Public Orders"],
        description: "Cancel an order awaiting acceptance using its customer access token",
        params: publicOrderAccessParamsSchema,
        response: { 200: orderStateResponseSchema }
      }
    },
    async (request, reply) => {
      const params = publicOrderAccessParamsSchema.parse(request.params)
      const order = await cancelOrderByCustomerToken(params.token)

      return reply.status(200).send({ success: true, data: order })
    }
  )
}
