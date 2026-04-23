import { FastifyInstance } from "fastify";
import { createUserSchema, userParamsSchema, userResponseSchema, usersListResponseSchema } from "./users.schema";
import { createUser, getCurrentUser, inactivateUser, listUsers } from "./users.service";

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

        return reply.status(200).send({
            success: true,
            data: user
        })
    })

    fastify.get('/api/users', {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ['Users'],
            description: 'Get all users of store',
            response: {
                200: usersListResponseSchema
            }
        }
    }, async (request, reply) => {

        const user = await listUsers({
            storeId: request.user.storeId
        })

        return reply.status(200).send({
            success: true,
            data: user
        })
    })

    fastify.post('/api/users', {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ['Users'],
            description: 'Create an user on store',
            response: {
                201: userResponseSchema
            }
        }
    }, async (request, reply) => {

        const body = createUserSchema.parse(request.body)

        const newUser = await createUser({
            ...body,
            storeId: request.user.storeId,
        })

        return reply.status(201).send({
            success: true,
            data: newUser
        })
    })

    fastify.patch('/api/users/:id/inactivate', {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ['Users'],
            description: 'Inactivate user',
            params: userParamsSchema,
            response: {
                200: userResponseSchema
            }
        }
    }, async (request, reply) => {

        const params = userParamsSchema.parse(request.params) 
        const storeId = request.user.storeId

        const updatedUser = await inactivateUser({
            storeId, 
            userId: params.id
        })

        return reply.status(200).send({
            success: true,
            data: updatedUser
        })
    })
}
