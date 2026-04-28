import { FastifyInstance } from "fastify";
import { storeResponseSchema, updateStoreSchema } from "./stores.schema";
import { getCurrentStore, updateOpenStore, updateStore } from "./stores.service";
import { success } from "zod/v4";

export default function storesRoutes(fastify: FastifyInstance){

    fastify.get('/api/stores/me', {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ['Store'],
            description: 'Get current authenticated store',
            response: {
                200: storeResponseSchema,
            }
        }
    }, async (request, replay) => {

        const store = await getCurrentStore({storeId: request.user.storeId})

        return replay.status(200).send({
            success: true,
            data: store
        })
    })

    fastify.patch('/api/stores/me', {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ['Store'],
            description: 'Update store',
            response: {
                200: storeResponseSchema
            }
        }
    }, async (request, reply) => {


        const body = updateStoreSchema.parse(request.body)
        const updatedStore = await updateStore({storeId: request.user.storeId, data: body})

        return reply.status(200).send({
            success: true,
            data: updatedStore
        })
    })

    fastify.patch('/api/stores/me/open', {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ['Store'],
            description: 'Update store',
            response: {
                200: storeResponseSchema
            }
        }
    }, async (request, reply) => {


        const updatedStore = await updateOpenStore({
            storeId: request.user.storeId, 
            isOpen: true
        })

        return reply.status(200).send({
            success: true,
            data: updatedStore
        })
    })
    
    fastify.patch('/api/stores/me/close', {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ['Store'],
            description: 'Update store',
            response: {
                200: storeResponseSchema
            }
        }
    }, async (request, reply) => {


        const updatedStore = await updateOpenStore({
            storeId: request.user.storeId, 
            isOpen: false
        })

        return reply.status(200).send({
            success: true,
            data: updatedStore
        })
    })
}