import type { FastifyInstance } from 'fastify'
import { onboardingService } from './onboarding.service'
import { onboardingSchema } from './onboarding.schema'
//import { healthResponseSchema } from './health.schema.js'

export default async function onboardingRoutes(fastify: FastifyInstance) {
  fastify.post('/api/onboarding', {
    schema: {
      tags: ['Onboarding'],
      description: 'Onboarding endpoint',
      body: onboardingSchema
    }
  }, async (request, reply) => {

    const input = onboardingSchema.parse(request.body)
    const result = await onboardingService(input)
    return reply.status(201).send(result)
  })
}
