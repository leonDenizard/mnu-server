import { FastifyInstance } from "fastify"
import { categoryInputSchema, categoryListResponseSchema, categoryResponseSchema } from "./categories.schema"
import { createCategory, getAllCategories } from "./categories.service"
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


        const {page, limit} = querySchema.parse(request.query) 
        const categories = await getAllCategories({storeId: request.user.storeId, page, limit})

        return reply.status(200).send({
            success: true,
            ...categories
        })
    })

    fastify.post('/api/menu/categories', {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ['Category'],
            description: 'Create category',
            body: categoryInputSchema,
            response: {
                201: categoryResponseSchema
            }
        }

    }, async (request, reply) => {

        const body = categoryInputSchema.parse(request.body)
        const category = await createCategory({data: body, storeId: request.user.storeId})

        reply.status(201).send({
            success: true,
            data: category
        })
    })

    fastify.patch('/api/menu/categories/:id', {

    }, async(request, reply) => {

    })

    fastify.delete('/api/menu/categories/:id', {

    }, async(request, reply) => {

    })
    
}