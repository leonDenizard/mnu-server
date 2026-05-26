import { FastifyInstance } from "fastify";
import { linkModifierGroupToProductInputSchema, productModifierGroupDeleteParamsSchema, productModifierGroupParamsSchema, productModifierGroupsResponseSchema } from "./productModifierGroup.schemas";
import { getAllProductModifierGroup, linkModifierGroupInProduct, removeModifierGroupInProduct } from "./productModifierGroup.service";

export default function productModifierGroupRoutes(fastify: FastifyInstance) {

    fastify.post('/api/menu/products/:productId/modifier-groups', {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ['Product X Modifier Group'],
            description: 'Linked modifier group on a product',
            body: linkModifierGroupToProductInputSchema,
            params: productModifierGroupParamsSchema,
            response: {
                201: productModifierGroupsResponseSchema
            }
        }

    }, async (request, reply) => {

        const body = linkModifierGroupToProductInputSchema.parse(request.body)
        const params = productModifierGroupParamsSchema.parse(request.params)
        const linkedModifierGroups = await linkModifierGroupInProduct({ 
            modifierGroupId: body.modifierGroupId, 
            productId: params.productId, 
            storeId: request.user.storeId 
        })

        reply.status(201).send({
            success: true,
            data: linkedModifierGroups
        })
    })

    fastify.get('/api/menu/products/:productId/modifier-groups', {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ['Product X Modifier Group'],
            description: 'Get all modifier group on a product',
            params: productModifierGroupParamsSchema,
            response: {
                200: productModifierGroupsResponseSchema
            }
        }

    }, async (request, reply) => {

        const params = productModifierGroupParamsSchema.parse(request.params)
        const linkedModifierGroups = await getAllProductModifierGroup({ 
            productId: params.productId, 
            storeId: request.user.storeId 
        })

        reply.status(200).send({
            success: true,
            data: linkedModifierGroups
        })
    })

    fastify.delete('/api/menu/products/:productId/modifier-groups/:modifierGroupId', {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ['Product X Modifier Group'],
            description: 'Delete modifier group on a product',
            params: productModifierGroupDeleteParamsSchema, 
            response: {
                200: productModifierGroupsResponseSchema
            }
        }

    }, async (request, reply) => {

        const params = productModifierGroupDeleteParamsSchema.parse(request.params)
        const linkedModifierGroups = await removeModifierGroupInProduct({ 
            modifierGroupId: params.modifierGroupId,
            productId: params.productId, 
            storeId: request.user.storeId 
        })

        reply.status(200).send({
            success: true,
            data: linkedModifierGroups
        })
    })
}