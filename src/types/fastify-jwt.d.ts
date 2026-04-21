import '@fastify/jwt'
import type { JwtPayload } from '../modules/auth/auth.schema'

declare module '@fastify/jwt' {
    interface FastifyJWT{
        payload: JwtPayload,
        user: JwtPayload
    }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>
  }
}