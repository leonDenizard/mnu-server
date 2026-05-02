import { FastifyInstance } from "fastify"
import { categoryListResponseSchema } from "./categories.schema"
import { getAllCategories } from "./categories.service"
import { querySchema } from "../../../shared/schemas/pagination"

export default function categoriesRoutes(fastify: FastifyInstance){

    fastify.get('/api/menu/categories', {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ['Category'],
            description: 'Get all categories',
            querystring: querySchema,
            response: {
                200: categoryListResponseSchema
            }
        }
    }, async (request, reply) => {


        const {page, limit} = request.query
        const categories = await getAllCategories({storeId: request.user.storeId, page, limit})

        return reply.status(200).send({
            success: true,
            ...categories
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