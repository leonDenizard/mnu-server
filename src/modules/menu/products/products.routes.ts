import { FastifyInstance } from "fastify";

export default function productsRoutes(fastify: FastifyInstance){

    fastify.get('/api/menu/products', {

    }, async (request, reply) => {

    })

    fastify.post('/api/menu/products', {

    }, async (request, reply) => {})

    fastify.patch('/api/menu/products/:id', {

    }, async (request, reply) => {})

    fastify.delete('/api/menu/products/:id', {

    }, async (request, reply) => {})

    
}