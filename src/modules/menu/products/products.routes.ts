import { FastifyInstance } from "fastify"
import { querySchema } from "../../../shared/schemas/pagination"
import { productInputSchema, productListResponseSchema, productParamsSchema, productResponseSchema } from "./products.schema"
import { createProduct, getAllProducts, updateProduct } from "./products.service"

export default function productsRoutes(fastify: FastifyInstance) {

    fastify.get('/api/menu/products/:id', {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ['Product'],
            description: 'Get all product on category',
            querystring: querySchema,
            params: productParamsSchema,
            response: {
                200: productListResponseSchema
            }
        }
    }, async (request, reply) => {

        const { page, limit} = querySchema.parse(request.query)
        const params = productParamsSchema.parse(request.params)
        const products = await getAllProducts({storeId: request.user.storeId, page, limit, categoryId: params.id})

        reply.status(200).send({
            success: true,
            ...products
        })
    })

    fastify.post('/api/menu/products', {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ['Product'],
            description: 'Create category',
            body: productInputSchema,
            response: {
                201: productResponseSchema
            }
        }

    }, async (request, reply) => {

        const body = productInputSchema.parse(request.body)
        const product = await createProduct({categoryId: body.categoryId, data: body, storeId: request.user.storeId})

        reply.status(201).send({
            success: true,
            data: product
        })
        
    })

    fastify.patch('/api/menu/products/:id', {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ['Product'],
            description: 'Update product by ID',
            body: productInputSchema,
            params: productParamsSchema,
            response: {
                201: productResponseSchema
            }
        }
    }, async (request, reply) => {

        const params = productParamsSchema.parse(request.params)
        const body = productInputSchema.parse(request.body)

        const product = await updateProduct({
            productId: params.id, 
            storeId: request.user.storeId, 
            data: body
        })

        reply.status(201).send({
            success: true,
            data: product
        })
    })

    // fastify.delete('/api/menu/categories/:id', {
    //     preHandler: [fastify.authenticate],
    //     schema: {
    //         tags: ['Product'],
    //         description: 'Delete category by ID',
    //         params: ,
    //         response: {
    //             201: 
    //         }
    //     }
    // }, async (request, reply) => {

       
    // })

}