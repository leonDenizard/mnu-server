import { FastifyInstance } from "fastify";
import { operatingHourIdSchema, storeOperatingHourByDayResponse, storeOperatingHourInputSchema, storeOperatingHourResponseSchema, storeResponseSchema, updateStoreSchema } from "./stores.schema";
import { createOperatingHour, deleteHourById, getCurrentStore, listOperatingHour, updateOpenStore, updateStore } from "./stores.service";

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

    fastify.post('/api/stores/me/operating-hours', {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ['Store'],
            description: 'Creat hours store operating',
            body: storeOperatingHourInputSchema,
            response: {
                201: storeOperatingHourResponseSchema
            }
        }
    }, async (request, reply) => {

        const body = storeOperatingHourInputSchema.parse(request.body)

        const hours = await createOperatingHour({

            storeId: request.user.storeId, 
            data: body
        })

        return reply.status(201).send({
            success: true,
            data: hours
        })
    })

    fastify.get('/api/stores/me/operating-hours', {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ['Store'],
            description: 'List hours store operating',
            response: {
                200: storeOperatingHourByDayResponse
            }
        }
    }, async (request, reply) => {

        const hours = await listOperatingHour({
            storeId: request.user.storeId 
        })

        return reply.status(200).send({
            success: true,
            data: hours
        })
    })

    fastify.delete('/api/stores/me/operating-hours/:id', {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ['Store'],
            description: 'Delete hours by Id in store operating',
            params: operatingHourIdSchema,
            response: {
                200: storeOperatingHourByDayResponse
            }
        }
    }, async (request, reply) => {

        const params = operatingHourIdSchema.parse(request.params) 
        const hours = await deleteHourById({
            id: params.id,
            storeId: request.user.storeId
        })

        return reply.status(200).send({
            success: true,
            data: hours
        })
    })

}