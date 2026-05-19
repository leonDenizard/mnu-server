import { FastifyInstance } from "fastify";
import { createInputModifierGroupsSchema, modifierGroupsResponse } from "./modifierGroups.schema";
import { createModifierGroups } from "./modifierGroups.service";

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
}