import { FastifyInstance } from "fastify";
import { linkModifierGroupToProductInputSchema, productModifierGroupParamsSchema, productModifierGroupsResponseSchema } from "./productModifierGroup.schemas";
import { linkModifierGroupInProduct } from "./productModifierGroup.service";

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
}