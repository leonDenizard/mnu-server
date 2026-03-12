import { FastifyInstance } from "fastify";
import { authErrorResponseSchema, loginResponseSchema, loginSchema } from "./auth.schema";
import { buildTokenPayload, InactiveUserError, InvalidCredentialsError, login } from "./auth.service";

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

        try {
            const payload = loginSchema.parse(request.body)
            const result = await login(payload)

            const accessToken = await (reply as any).jwtSign(buildTokenPayload(result.user), {
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
        } catch (error) {
            if (error instanceof InvalidCredentialsError) {
                return reply.status(401).send({
                    success: false,
                    error: 'Invalid credentials'
                })
            }

            if (error instanceof InactiveUserError) {
                return reply.status(403).send({
                    success: false,
                    error: 'Inactive user'
                })
            }

            throw error

        }
    })
}