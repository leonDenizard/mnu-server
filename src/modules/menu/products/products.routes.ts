import { FastifyInstance } from "fastify"
import { querySchema } from "../../../shared/schemas/pagination"
import { categoryParamsSchema, productListResponseSchema } from "./products.schema"
import { getAllProducts } from "./products.service"

export default function productsRoutes(fastify: FastifyInstance) {

    fastify.get('/api/menu/products/:id', {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ['Product'],
            description: 'Get all product on category',
            querystring: querySchema,
            params: categoryParamsSchema,
            response: {
                200: productListResponseSchema
            }
        }
    }, async (request, reply) => {

        const { page, limit} = querySchema.parse(request.query)
        const params = categoryParamsSchema.parse(request.params)
        const products = await getAllProducts({storeId: request.user.storeId, page, limit, categoryId: params.id})

        reply.status(200).send({
            success: true,
            ...products
        })
    })

    // fastify.post('/api/menu/categories', {
    //     preHandler: [fastify.authenticate],
    //     schema: {
    //         tags: ['Category'],
    //         description: 'Create category',
    //         body:
    //         response: {
    //             201: 
    //         }
    //     }

    // }, async (request, reply) => {

        
    // })

    // fastify.patch('/api/menu/categories/:id', {
    //     preHandler: [fastify.authenticate],
    //     schema: {
    //         tags: ['Category'],
    //         description: 'Update category by ID',
    //         body: categoryInputSchema,
    //         params: categoryParamsSchema,
    //         response: {
    //             201: categoryResponseSchema
    //         }
    //     }
    // }, async (request, reply) => {

    //     reply.status(201).send({
    //         success: true,
    //         data: category
    //     })
    // })

    // fastify.delete('/api/menu/categories/:id', {
    //     preHandler: [fastify.authenticate],
    //     schema: {
    //         tags: ['Category'],
    //         description: 'Delete category by ID',
    //         params: ,
    //         response: {
    //             201: 
    //         }
    //     }
    // }, async (request, reply) => {

       
    // })

}