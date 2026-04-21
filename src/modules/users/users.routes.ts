import { FastifyInstance } from "fastify";
import { userResponseSchema } from "./users.schema";
import { getCurrentUser } from "./users.service";

export default function usersRoutes(fastify: FastifyInstance) {
    fastify.get('/api/users/me', {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ['Users'],
            description: 'Get current authenticated user',
            response: {
                200: userResponseSchema
            }
        }
    }, async (request, reply) => {

        const user = await getCurrentUser({
            userId: request.user.sub,
            storeId: request.user.storeId
        })

        console.log(user)
        return reply.status(200).send({
            success: true,
            data: user
        })
    })
}