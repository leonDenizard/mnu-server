import { FastifyInstance } from "fastify";
import {
    authErrorResponseSchema,
    loginResponseSchema,
    loginSchema,
    onboardingHandoffExchangeResponseSchema,
    onboardingHandoffExchangeSchema
} from "./auth.schema";
import { buildTokenPayload, login } from "./auth.service";
import { exchangeOnboardingHandoffCode } from './auth-handoff.service.js'

export default function authRoutes(fastify: FastifyInstance) {
    fastify.post('/auth/exchange-onboarding-code', {
        config: {
            rateLimit: { max: 10, timeWindow: '15 minutes' }
        },
        schema: {
            tags: ['Auth'],
            description: 'Exchange a one-time onboarding code for an access token',
            body: onboardingHandoffExchangeSchema,
            response: { 200: onboardingHandoffExchangeResponseSchema }
        }
    }, async (request, reply) => {
        const body = onboardingHandoffExchangeSchema.parse(request.body)
        const result = await exchangeOnboardingHandoffCode(body.code)
        const accessToken = await reply.jwtSign(result.payload, { expiresIn: '7d' })

        return reply.status(200).send({
            success: true,
            data: { accessToken, tokenType: 'Bearer', expiresIn: 604800, user: result.user }
        })
    })

    fastify.post('/auth/login', {
        config: {
            rateLimit: { max: 5, timeWindow: '15 minutes' }
        },
        schema: {
            tags: ['Auth'],
            description: 'Authenticate user and return access token',
            body: loginSchema,
            response: {
                200: loginResponseSchema,
                401: authErrorResponseSchema,
                403: authErrorResponseSchema
            }
        }
    }, async (request, reply) => {
        const payload = loginSchema.parse(request.body)
        const result = await login(payload)

        const accessToken = await reply.jwtSign(buildTokenPayload(result.user), {
            expiresIn: '7d'
        })

        return reply.status(200).send({
            success: true,
            data: {
                accessToken,
                tokenType: 'Bearer',
                expiresIn: 604800,
                user: result.user
            }
        })
    })
}
