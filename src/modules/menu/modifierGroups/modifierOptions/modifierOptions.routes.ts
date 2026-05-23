import { FastifyInstance } from "fastify"
import { modifierOptionsInputSchema, modifierOptionsResponseListSchema,  } from "./modifierOptions.schema"
import { modifierGroupsParamsSchema } from "../modifierGroups.schema"
import { createModifierOptions } from "./modifierOptions.service"

export default function modifierOptionsRoutes(fastify: FastifyInstance){
    
    fastify.post('/api/menu/modifier-groups/:id/options', {
            preHandler: [fastify.authenticate],
            schema: {
                tags: ['Modifier Options'],
                description: 'Create options in modifier groups',
                body: modifierOptionsInputSchema,
                params: modifierGroupsParamsSchema,
                response: {
                    201: modifierOptionsResponseListSchema
                }
            }
    
        }, async (request, reply) => {
    
            const params = modifierGroupsParamsSchema.parse(request.params)
            const body = modifierOptionsInputSchema.parse(request.body)

            const modifierOptions = await createModifierOptions({ 
                data: body.data, 
                storeId: request.user.storeId, 
                modifierGroupId: params.id 
            })
    
            reply.status(201).send({
                success: true,
                data: modifierOptions
            })
        })

}