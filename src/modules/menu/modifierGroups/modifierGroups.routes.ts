import { FastifyInstance } from "fastify";
import { createInputModifierGroupsSchema, modifierGroupsArrayResponseSchema, modifierGroupsParamsSchema, modifierGroupsResponse, updateInputModifierGroupsSchema, updateModifierGroupsResponse } from "./modifierGroups.schema";
import { createModifierGroups, deleteModifierGroupById, getAllModifierGroups, updateModifierGroup } from "./modifierGroups.service";

export default function modifierGroups(fastify: FastifyInstance){

    fastify.post('/api/menu/modifier-groups', {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ['Modifier Groups'],
            description: 'Create a modifier groups on menu',
            response: {
                201: modifierGroupsResponse
            }
        }
    }, async (request, reply) => {

        const body = createInputModifierGroupsSchema.parse(request.body)
        const modifierGroup = await createModifierGroups({storeId: request.user.storeId, data: body})

        reply.status(201).send({
            success: true,
            data: modifierGroup
        })
    })

    fastify.get('/api/menu/modifier-groups', {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ['Modifier Groups'],
            description: 'Get all modifier groups on menu',
            response: {
                200: modifierGroupsArrayResponseSchema
            }
        }
    }, async (request, reply) => {

       
        const modifierGroup = await getAllModifierGroups({storeId: request.user.storeId})

        reply.status(200).send({
            success: true,
            data: modifierGroup
        })
    })

    fastify.patch('/api/menu/modifier-groups/:id', {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ['Modifier Groups'],
            description: 'Update modifier groups on menu',
            body: updateInputModifierGroupsSchema,
            params: modifierGroupsParamsSchema,
            response: {
                200: updateModifierGroupsResponse
            }
        }
    }, async (request, reply) => {

       const body = updateInputModifierGroupsSchema.parse(request.body)
       const params = modifierGroupsParamsSchema.parse(request.params)

        const modifierGroup = await updateModifierGroup({
            storeId: request.user.storeId,
            data: body,
            modifierGroupId: params.id     
        })

        reply.status(200).send({
            success: true,
            data: modifierGroup
        })
    })

    fastify.delete('/api/menu/modifier-groups/:id', {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ['Modifier Groups'],
            description: 'Delete a modifier groups on menu',
            params: modifierGroupsParamsSchema,
            response: {
                200: updateModifierGroupsResponse
            }
        }
    }, async (request, reply) => {

       const params = modifierGroupsParamsSchema.parse(request.params)

        const modifierGroup = await deleteModifierGroupById({
            storeId: request.user.storeId,
            id: params.id     
        })

        reply.status(200).send({
            success: true,
            data: modifierGroup
        })
    })
}