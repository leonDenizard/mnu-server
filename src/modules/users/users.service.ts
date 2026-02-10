import prisma from '../../database.js'
import type { CreateUserInput, UpdateUserInput } from './users.schema.js'

export class UserService {
  async getAll() {
    return await prisma.user.findMany()
  }

  async getById(id: string) {
    return await prisma.user.findUnique({
      where: { id }
    })
  }

  async create(data: CreateUserInput) {
    return await prisma.user.create({
      data
    })
  }

  async update(id: string, data: UpdateUserInput) {
    return await prisma.user.update({
      where: { id },
      data
    })
  }

  async delete(id: string) {
    return await prisma.user.delete({
      where: { id }
    })
  }
}
