import Fastify from 'fastify'
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

const fastify = Fastify({
  logger: true
}).withTypeProvider<ZodTypeProvider>()

fastify.setValidatorCompiler(validatorCompiler)
fastify.setSerializerCompiler(serializerCompiler)

await fastify.register(swagger, {
  openapi: {
    info: {
      title: 'MNU Server API',
      description: 'API Server with Fastify, PostgreSQL, Prisma and Zod',
      version: '1.0.0'
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    tags: [
      { name: 'Health', description: 'Health check endpoints' },
      { name: 'Onboarding', description: 'Onboarding endpoints' },
      { name: 'Users', description: 'User management endpoints' }
    ]
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

fastify.decorate('authenticate', async function (request: any, reply: any) {
  try {
    await request.jwtVerify()
  } catch {
    return reply.status(401).send({ success: false, error: 'Unauthorized' })
  }
})

await fastify.register(healthRoutes)
await fastify.register(onboardingRoutes)
await fastify.register(authRoutes)
//await fastify.register(userRoutes, { prefix: '/api' })

fastify.addHook('onClose', async () => {
  await prisma.$disconnect()
})

const start = async () => {
  try {
    await prisma.$connect()
    console.log('✅ Database connected successfully')

    const PORT = Number(process.env.PORT) || 3000
    const HOST = process.env.HOST || '0.0.0.0'

    await fastify.listen({ port: PORT, host: HOST })
    
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
