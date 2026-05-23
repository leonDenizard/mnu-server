import { FastifyInstance } from "fastify"
import { deleteBulkOptionsOutputResponseSchema, deleteBulkOptionsSchema, modifierOptionsBulkUpdateSchema, modifierOptionsInputSchema, modifierOptionsResponseListSchema,  } from "./modifierOptions.schema"
import { modifierGroupsParamsSchema } from "../modifierGroups.schema"
import { createModifierOptions, deleteBulkModifierOptions, updateBulkModifierOptions } from "./modifierOptions.service"

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

        fastify.patch('/api/menu/modifier-groups/:id/options', {
            preHandler: [fastify.authenticate],
            schema: {
                tags: ['Modifier Options'],
                description: 'Updated options in bulk on modifier groups',
                body: modifierOptionsBulkUpdateSchema,
                params: modifierGroupsParamsSchema,
                response: {
                    201: modifierOptionsResponseListSchema
                }
            }
    
        }, async (request, reply) => {
    
            const params = modifierGroupsParamsSchema.parse(request.params)
            const body = modifierOptionsBulkUpdateSchema.parse(request.body)

            const modifierOptions = await updateBulkModifierOptions({ 
                data: body.data, 
                storeId: request.user.storeId, 
                modifierGroupId: params.id 
            })
    
            reply.status(201).send({
                success: true,
                data: modifierOptions
            })
        })

        fastify.delete('/api/menu/modifier-groups/:id/options', {
            preHandler: [fastify.authenticate],
            schema: {
                tags: ['Modifier Options'],
                description: 'Delete options in bulk on modifier groups',
                body: deleteBulkOptionsSchema,
                params: modifierGroupsParamsSchema,
                response: {
                    201: deleteBulkOptionsOutputResponseSchema
                }
            }
    
        }, async (request, reply) => {
    
            const params = modifierGroupsParamsSchema.parse(request.params)
            const body = deleteBulkOptionsSchema.parse(request.body)

            const modifierOptions = await deleteBulkModifierOptions({ 
                ids: body.ids,
                storeId: request.user.storeId, 
                modifierGroupId: params.id 
            })
    
            reply.status(201).send({
                success: true,
                data: modifierOptions
            })
        })
}