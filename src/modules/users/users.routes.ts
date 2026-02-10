import type { FastifyInstance } from 'fastify'
import { UserController } from './users.controller.js'
import {
  createUserSchema,
  deleteUserResponseSchema,
  errorResponseSchema,
  updateUserSchema,
  userParamsSchema,
  userResponseSchema,
  usersResponseSchema
} from './users.schema.js'

const userController = new UserController()

export default async function userRoutes(fastify: FastifyInstance) {
  fastify.get('/users', {
    schema: {
      tags: ['Users'],
      description: 'Get all users',
      response: {
        200: usersResponseSchema
      }
    }
  }, userController.getAll.bind(userController))

  fastify.get('/users/:id', {
    schema: {
      tags: ['Users'],
      description: 'Get user by ID',
      params: userParamsSchema,
      response: {
        200: userResponseSchema,
        404: errorResponseSchema
      }
    }
  }, userController.getById.bind(userController))

  fastify.post('/users', {
    schema: {
      tags: ['Users'],
      description: 'Create a new user',
      body: createUserSchema,
      response: {
        201: userResponseSchema
      }
    }
  }, userController.create.bind(userController) as any)

  fastify.put('/users/:id', {
    schema: {
      tags: ['Users'],
      description: 'Update user',
      params: userParamsSchema,
      body: updateUserSchema,
      response: {
        200: userResponseSchema
      }
    }
  }, userController.update.bind(userController) as any)

  fastify.delete('/users/:id', {
    schema: {
      tags: ['Users'],
      description: 'Delete user',
      params: userParamsSchema,
      response: {
        200: deleteUserResponseSchema
      }
    }
  }, userController.delete.bind(userController))
}
