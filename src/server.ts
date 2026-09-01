import Fastify, { FastifyRequest } from 'fastify'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import scalar from '@scalar/fastify-api-reference'
import {
  ZodTypeProvider,
  jsonSchemaTransform,
  createJsonSchemaTransformObject,
  serializerCompiler,
  validatorCompiler
} from 'fastify-type-provider-zod'
import 'dotenv/config'
import jwt from '@fastify/jwt'

import prisma from './database.js'
import healthRoutes from './modules/health/health.routes.js'
import { healthResponseSchema } from './modules/health/health.schema.js'
import onboardingRoutes from './modules/onboarding/onboarding.routes.js'
import authRoutes from './modules/auth/auth.routes.js'
import usersRoutes from './modules/users/users.routes.js'
import storesRoutes from './modules/stores/stores.routes.js'
import menuRoutes from './modules/menu/menu.routes.js'
import publicMenuRoutes from './modules/public/menu/publicMenu.routes.js'
import orderRoutes from './modules/orders/order.routes.js'
import { UnauthorizedError } from './shared/errors/app-error.js'
import { globalErrorHandler } from './shared/errors/error-handler.js'
import { startOrderExpirationWorker } from './modules/orders/order-expiration.worker.js'

const fastify = Fastify({
  logger: false
}).withTypeProvider<ZodTypeProvider>()

fastify.setValidatorCompiler(validatorCompiler)
fastify.setSerializerCompiler(serializerCompiler)
fastify.setErrorHandler(globalErrorHandler)

await fastify.register(swagger, {
  openapi: {
    info: {
      title: 'MNU Server API',
      description: 'API Server with Typescript, Fastify, PostgreSQL, Prisma and Zod',
      version: '1.0.0'
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    // tags: [
    //   { name: 'Health', description: 'Health check endpoints' },
    //   { name: 'Onboarding', description: 'Onboarding endpoints' },
    //   { name: 'Users', description: 'User management endpoints' }
    // ]
  },
  transform: jsonSchemaTransform,
  transformObject: createJsonSchemaTransformObject({
    schemas: {
      HealthResponse: healthResponseSchema
    }
  })
})

await fastify.register(swaggerUi, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: true
  },
  staticCSP: true,
  transformStaticCSP: (header) => header
})

await fastify.register(scalar, {
  routePrefix: '/reference',
  configuration: {
    theme: 'fastify',
    layout: 'modern',
    defaultHttpClient: {
      targetKey: 'js',
      clientKey: 'fetch'
    }
  }
})

await fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'dev-secret-change-me'
})

fastify.decorate('authenticate', async function (request: FastifyRequest) {
  try {
    await request.jwtVerify()
  } catch {
    throw new UnauthorizedError()
  }
})

await fastify.register(healthRoutes)
await fastify.register(onboardingRoutes)
await fastify.register(authRoutes)
await fastify.register(usersRoutes)
await fastify.register(storesRoutes)
await fastify.register(menuRoutes)
await fastify.register(publicMenuRoutes)
await fastify.register(orderRoutes)
//await fastify.register(userRoutes, { prefix: '/api' })

let stopOrderExpirationWorker: (() => void) | undefined

fastify.addHook('onClose', async () => {
  stopOrderExpirationWorker?.()
  await prisma.$disconnect()
})

const start = async () => {
  try {
    await prisma.$connect()
    console.log('✅ Database connected successfully')

    const PORT = Number(process.env.PORT) || 3000
    const HOST = process.env.HOST || '0.0.0.0'

    await fastify.listen({ port: PORT, host: HOST })
    stopOrderExpirationWorker = startOrderExpirationWorker({ logger: fastify.log })
    
    console.log(`Server running at http://localhost:${PORT}`)
    console.log(`Swagger UI: http://localhost:${PORT}/docs`)
    console.log(`Scalar Reference: http://localhost:${PORT}/reference`)
  } catch (err) {
    fastify.log.error(err)
    await prisma.$disconnect()
    process.exit(1)
  }
}

console.log("Satar server")
start()
