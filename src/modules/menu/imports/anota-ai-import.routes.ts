import type { FastifyInstance } from 'fastify'

import { BadRequestError } from '../../../shared/errors/app-error.js'
import { anotaAiImportResponseSchema } from './anota-ai-import.schema.js'
import { importAnotaAiMenu } from './anota-ai-import.service.js'

export default async function anotaAiImportRoutes(fastify: FastifyInstance) {
  fastify.post('/api/menu/imports/anota-ai', {
    preHandler: [fastify.authenticate],
    config: { rateLimit: { max: 5, timeWindow: '15 minutes' } },
    schema: {
      tags: ['Menu imports'],
      description: 'Import categories, products and modifier groups from an Anota AI XLSX export',
      consumes: ['multipart/form-data'],
      response: { 201: anotaAiImportResponseSchema }
    }
  }, async (request, reply) => {
    const upload = await request.file()
    if (!upload) throw new BadRequestError('XLSX file is required in the file field')
    if (!upload.filename.toLowerCase().endsWith('.xlsx')) {
      throw new BadRequestError('Only XLSX files are supported')
    }

    const file = await upload.toBuffer()
    if (upload.file.truncated) throw new BadRequestError('XLSX file exceeds the 5 MB limit')

    const result = await importAnotaAiMenu(request.user.storeId, file)
    return reply.status(201).send({ success: true, data: result })
  })
}
