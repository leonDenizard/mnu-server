import { FastifyInstance } from "fastify"
import { createOrderInputSchema, listOrdersQuerySchema, orderResponseSchema, ordersListResponseSchema } from "./order.schema"
import { createOrder, listOrders } from "./order.service"

export default function orderRoutes(fastify: FastifyInstance) {
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

  fastify.post(
    "/api/orders",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["Orders"],
        description: "Create an order with snapshot items and modifier groups",
        body: createOrderInputSchema,
        response: {
          201: orderResponseSchema
        }
      }
    },
    async (request, reply) => {
      const body = createOrderInputSchema.parse(request.body)

      const order = await createOrder({
        storeId: request.user.storeId,
        userId: request.user.sub,
        data: body
      })

      return reply.status(201).send({
        success: true,
        data: order
      })
    }
  )
}
