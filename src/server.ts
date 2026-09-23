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
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import multipart from '@fastify/multipart'

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
import { startStoreAvailabilityWorker } from './modules/stores/store-availability.worker.js'

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL ?? 'info',
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.body.password',
        'req.body.ownerPassword',
        'req.body.customerPhone',
        'req.body.deliveryStreet',
        'req.body.deliveryAddressNumber',
        'req.body.deliveryZipCode'
      ],
      censor: '[REDACTED]'
    }
  }
}).withTypeProvider<ZodTypeProvider>()

fastify.setValidatorCompiler(validatorCompiler)
fastify.setSerializerCompiler(serializerCompiler)
fastify.setErrorHandler(globalErrorHandler)

await fastify.register(cors, {
  origin: ['http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'X-Device-Id', 'Last-Event-ID'],
  credentials: false,
  maxAge: 86_400
})

await fastify.register(rateLimit, {
  global: false,
  max: 100,
  timeWindow: '1 minute',
  errorResponseBuilder: (_request, context) => ({
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: `Too many requests. Try again in ${Math.ceil(context.ttl / 1000)} seconds.`
    }
  })
})

await fastify.register(multipart, {
  limits: { files: 1, fileSize: 5 * 1024 * 1024 },
  throwFileSizeLimit: false
})

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
let stopStoreAvailabilityWorker: (() => void) | undefined

fastify.addHook('onClose', async () => {
  stopOrderExpirationWorker?.()
  stopStoreAvailabilityWorker?.()
  await prisma.$disconnect()
})

const start = async () => {
  try {
    await prisma.$connect()
    fastify.log.info('Database connected successfully')

    const PORT = Number(process.env.PORT) || 3000
    const HOST = process.env.HOST || '0.0.0.0'

    await fastify.listen({ port: PORT, host: HOST })
    stopOrderExpirationWorker = startOrderExpirationWorker({ logger: fastify.log })
    stopStoreAvailabilityWorker = startStoreAvailabilityWorker({ logger: fastify.log })
    
    fastify.log.info({ port: PORT, host: HOST }, 'Server started')
    fastify.log.info(`Swagger UI: http://localhost:${PORT}/docs`)
    fastify.log.info(`Scalar Reference: http://localhost:${PORT}/reference`)
  } catch (err) {
    fastify.log.error(err)
    await prisma.$disconnect()
    process.exit(1)
  }
}

start()
