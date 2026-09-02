import type { FastifyInstance } from 'fastify'
import { onboardingService } from './onboarding.service'
import { onboardingResponseSchema, onboardingSchema, onboardingWebResponseSchema } from './onboarding.schema'
import { buildTokenPayload } from '../auth/auth.service'
import { createOnboardingHandoffCode } from '../auth/auth-handoff.service.js'

export default async function onboardingRoutes(fastify: FastifyInstance) {
  fastify.post('/api/onboarding/web', {
    config: {
      rateLimit: { max: 3, timeWindow: '1 hour' }
    },
    schema: {
      tags: ['Onboarding'],
      description: 'Create a store from the marketing site and return a one-time handoff code',
      body: onboardingSchema,
      response: { 201: onboardingWebResponseSchema }
    }
  }, async (request, reply) => {
    const input = onboardingSchema.parse(request.body)
    const result = await onboardingService(input)
    const handoff = await createOnboardingHandoffCode(result.user.id)

    return reply.status(201).send({ success: true, data: handoff })
  })

  fastify.post('/api/onboarding', {
    schema: {
      tags: ['Onboarding'],
      description: 'Onboarding endpoint',
      body: onboardingSchema,
      response: {
        201: onboardingResponseSchema
      }
    }
  }, async (request, reply) => {

    const input = onboardingSchema.parse(request.body)
    const result = await onboardingService(input)
    const payload = buildTokenPayload(result.user)
    const token = fastify.jwt.sign(payload)

    return reply.status(201).send({
      success: true,
      data: {
        accessToken: token,
        tokenType: 'Bearer',
        expiresIn: 604800,
        user: result.user,
        store: result.store
      }
    })
  }
)}
