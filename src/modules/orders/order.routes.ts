import { FastifyInstance } from "fastify"
import { createOrderInputSchema, orderResponseSchema } from "./order.schema"
import { createOrder } from "./order.service"

export default function orderRoutes(fastify: FastifyInstance) {
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
