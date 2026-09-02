import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import { Prisma } from '../../../generated/prisma/index.js'
import { ZodError } from 'zod'

import { AppError } from './app-error.js'

type ValidationIssue = {
  path: string
  message: string
}

function sendError(
  reply: FastifyReply,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown
) {
  return reply.status(statusCode).send({
    success: false,
    error: {
      code,
      message,
      ...(details === undefined ? {} : { details })
    }
  })
}

function mapZodIssues(error: ZodError): ValidationIssue[] {
  return error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message
  }))
}

function mapFastifyValidation(error: FastifyError): ValidationIssue[] {
  return (error.validation ?? []).map((issue) => {
    const missingProperty = issue.params?.missingProperty

    return {
      path:
        issue.instancePath ||
        (typeof missingProperty === 'string' ? missingProperty : ''),
      message: issue.message ?? 'Invalid value'
    }
  })
}

export function globalErrorHandler(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (error instanceof AppError) {
    request.log.warn({
      err: error,
      requestId: request.id,
      method: request.method,
      route: request.routeOptions.url,
      statusCode: error.statusCode,
      code: error.code
    }, 'Handled application error')
    return sendError(reply, error.statusCode, error.code, error.message, error.details)
  }

  if (error instanceof ZodError) {
    request.log.warn({
      requestId: request.id,
      method: request.method,
      route: request.routeOptions.url,
      issues: mapZodIssues(error)
    }, 'Request payload validation failed')
    return sendError(
      reply,
      400,
      'VALIDATION_ERROR',
      'Request validation failed',
      mapZodIssues(error)
    )
  }

  if ('validation' in error && error.validation) {
    request.log.warn({
      requestId: request.id,
      method: request.method,
      route: request.routeOptions.url,
      issues: mapFastifyValidation(error as FastifyError)
    }, 'Fastify request validation failed')
    return sendError(
      reply,
      400,
      'VALIDATION_ERROR',
      'Request validation failed',
      mapFastifyValidation(error as FastifyError)
    )
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return sendError(reply, 409, 'CONFLICT', 'A unique value is already in use')
    }

    if (error.code === 'P2025') {
      return sendError(reply, 404, 'NOT_FOUND', 'Resource not found')
    }
  }

  request.log.error({
    err: error,
    requestId: request.id,
    method: request.method,
    route: request.routeOptions.url
  }, 'Unhandled request error')

  return sendError(reply, 500, 'INTERNAL_ERROR', 'Internal server error')
}
