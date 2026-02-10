import type { FastifyRequest, FastifyReply } from 'fastify'
import { UserService } from './users.service.js'
import type { CreateUserInput, UpdateUserInput } from './users.schema.js'

const userService = new UserService()

interface UserParams {
  id: string
}

export class UserController {
  async getAll(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const users = await userService.getAll()
      return reply.status(200).send({
        success: true,
        data: users
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return reply.status(500).send({
        success: false,
        error: message
      })
    }
  }

  async getById(request: FastifyRequest<{ Params: UserParams }>, reply: FastifyReply) {
    try {
      const { id } = request.params
      const user = await userService.getById(id)
      
      if (!user) {
        return reply.status(404).send({
          success: false,
          error: 'User not found'
        })
      }

      return reply.status(200).send({
        success: true,
        data: user
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return reply.status(500).send({
        success: false,
        error: message
      })
    }
  }

  async create(request: FastifyRequest<{ Body: CreateUserInput }>, reply: FastifyReply) {
    try {
      const user = await userService.create(request.body)
      return reply.status(201).send({
        success: true,
        data: user
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return reply.status(500).send({
        success: false,
        error: message
      })
    }
  }

  async update(request: FastifyRequest<{ Params: UserParams; Body: UpdateUserInput }>, reply: FastifyReply) {
    try {
      const { id } = request.params
      const user = await userService.update(id, request.body)
      return reply.status(200).send({
        success: true,
        data: user
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return reply.status(500).send({
        success: false,
        error: message
      })
    }
  }

  async delete(request: FastifyRequest<{ Params: UserParams }>, reply: FastifyReply) {
    try {
      const { id } = request.params
      await userService.delete(id)
      return reply.status(200).send({
        success: true,
        message: 'User deleted successfully'
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return reply.status(500).send({
        success: false,
        error: message
      })
    }
  }
}
