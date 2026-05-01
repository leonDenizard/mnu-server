import { FastifyInstance } from "fastify"
import { categoryListResponseSchema } from "./categories.schema"
import { getCategories } from "./categories.service"

export default function categoriesRoutes(fastify: FastifyInstance){

    fastify.get('/api/menu/categories', {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ['Category'],
            description: 'Get all categories',
            response: {
                200: categoryListResponseSchema
            }
        }
    }, async (request, reply) => {

        const categories = await getCategories({storeId: request.user.storeId})

        return reply.status(200).send({
            success: true,
            data: categories
        })
    })

    fastify.post('/api/menu/categories', {

    }, async (request, reply) => {

    })

    fastify.patch('/api/menu/categories/:id', {

    }, async(request, reply) => {

    })

    fastify.delete('/api/menu/categories/:id', {

    }, async(request, reply) => {

    })
    
}