import { FastifyInstance } from "fastify";
import { authErrorResponseSchema, loginResponseSchema, loginSchema } from "./auth.schema";
import { buildTokenPayload, login } from "./auth.service";

export default function authRoutes(fastify: FastifyInstance) {
    fastify.post('/auth/login', {
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
