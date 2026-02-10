import type { FastifyInstance } from 'fastify'
import { healthResponseSchema } from './health.schema.js'

export default async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/', {
    schema: {
      tags: ['Health'],
      description: 'Health check endpoint',
      response: {
        200: healthResponseSchema
      }
    }
  }, async (_request, reply) => {
    return reply.status(200).send({
      status: 'ok',
      message: 'Server is running',
      timestamp: new Date().toISOString()
    })
  })
}
