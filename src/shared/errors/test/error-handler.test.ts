import Fastify from 'fastify'
import { z } from 'zod'

import { BadRequestError, NotFoundError } from '../app-error'
import { globalErrorHandler } from '../error-handler'

function buildTestApp() {
  const app = Fastify({ logger: false })
  app.setErrorHandler(globalErrorHandler)
  return app
}

describe('globalErrorHandler', () => {
  it('maps application errors to their HTTP status and public code', async () => {
    const app = buildTestApp()
    app.get('/resource', async () => {
      throw new NotFoundError('Resource not found')
    })

    const response = await app.inject({ method: 'GET', url: '/resource' })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Resource not found'
      }
    })

    await app.close()
  })

  it('includes safe details provided by a known application error', async () => {
    const app = buildTestApp()
    app.get('/business-rule', async () => {
      throw new BadRequestError('Invalid selection', [{ field: 'options' }])
    })

    const response = await app.inject({ method: 'GET', url: '/business-rule' })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'Invalid selection',
        details: [{ field: 'options' }]
      }
    })

    await app.close()
  })

  it('maps Zod issues without exposing the original error object', async () => {
    const app = buildTestApp()
    app.post('/zod', async (request) => {
      z.object({ email: z.string().email() }).parse(request.body)
      return { success: true }
    })

    const response = await app.inject({
      method: 'POST',
      url: '/zod',
      payload: { email: 'invalid' }
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: [{ path: 'email', message: 'Invalid email' }]
      }
    })

    await app.close()
  })

  it('maps Fastify request validation errors', async () => {
    const app = buildTestApp()
    app.post(
      '/fastify-validation',
      {
        schema: {
          body: {
            type: 'object',
            required: ['name'],
            properties: {
              name: { type: 'string' }
            }
          }
        }
      },
      async () => ({ success: true })
    )

    const response = await app.inject({
      method: 'POST',
      url: '/fastify-validation',
      payload: {}
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: [{ path: 'name', message: "must have required property 'name'" }]
      }
    })

    await app.close()
  })

  it('hides internal error details', async () => {
    const app = buildTestApp()
    app.get('/unexpected', async () => {
      throw new Error('database password leaked')
    })

    const response = await app.inject({ method: 'GET', url: '/unexpected' })

    expect(response.statusCode).toBe(500)
    expect(response.json()).toEqual({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    })

    await app.close()
  })
})
