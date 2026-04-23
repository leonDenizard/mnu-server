import { hash } from 'bcryptjs'

import prisma from '../../database'
import { createUser, getCurrentUser, inactivateUser, listUsers } from './users.service'

jest.mock('../../database', () => ({
  __esModule: true,
  default: {
    user: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    }
  }
}))

jest.mock('bcryptjs', () => ({
  hash: jest.fn()
}))

const prismaMock = prisma as unknown as {
  user: {
    findFirst: jest.Mock
    findMany: jest.Mock
    create: jest.Mock
    update: jest.Mock
  }
}

const hashMock = hash as unknown as jest.Mock

const baseDate = new Date('2026-04-23T12:00:00.000Z')

describe('users.service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getCurrentUser', () => {
    it('returns the authenticated user in output format', async () => {
      prismaMock.user.findFirst.mockResolvedValue({
        id: 'user-1',
        name: 'Maria',
        email: 'maria@email.com',
        role: 'OWNER',
        active: true,
        storeId: 'store-1',
        createdAt: baseDate,
        updatedAt: baseDate
      })

      const result = await getCurrentUser({
        userId: 'user-1',
        storeId: 'store-1'
      })

      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'user-1',
          storeId: 'store-1'
        }
      })

      expect(result).toEqual({
        id: 'user-1',
        name: 'Maria',
        email: 'maria@email.com',
        role: 'OWNER',
        active: true,
        storeId: 'store-1',
        createdAt: '2026-04-23T12:00:00.000Z',
        updatedAt: '2026-04-23T12:00:00.000Z'
      })
    })

    it('throws when the authenticated user is not found', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null)

      await expect(
        getCurrentUser({
          userId: 'missing-user',
          storeId: 'store-1'
        })
      ).rejects.toThrow('User not found')
    })
  })

  describe('listUsers', () => {
    it('lists store users mapped to output format', async () => {
      prismaMock.user.findMany.mockResolvedValue([
        {
          id: 'user-1',
          name: 'Maria',
          email: 'maria@email.com',
          role: 'OWNER',
          active: true,
          storeId: 'store-1',
          createdAt: baseDate,
          updatedAt: baseDate
        },
        {
          id: 'user-2',
          name: 'Joao',
          email: 'joao@email.com',
          role: 'STAFF',
          active: true,
          storeId: 'store-1',
          createdAt: baseDate,
          updatedAt: baseDate
        }
      ])

      const result = await listUsers({ storeId: 'store-1' })

      expect(prismaMock.user.findMany).toHaveBeenCalledWith({
        where: { storeId: 'store-1' }
      })

      expect(result).toEqual([
        {
          id: 'user-1',
          name: 'Maria',
          email: 'maria@email.com',
          role: 'OWNER',
          active: true,
          storeId: 'store-1',
          createdAt: '2026-04-23T12:00:00.000Z',
          updatedAt: '2026-04-23T12:00:00.000Z'
        },
        {
          id: 'user-2',
          name: 'Joao',
          email: 'joao@email.com',
          role: 'STAFF',
          active: true,
          storeId: 'store-1',
          createdAt: '2026-04-23T12:00:00.000Z',
          updatedAt: '2026-04-23T12:00:00.000Z'
        }
      ])
    })
  })

  describe('createUser', () => {
    it('creates a staff user with normalized email and hashed password', async () => {
      hashMock.mockResolvedValue('hashed-password')
      prismaMock.user.create.mockResolvedValue({
        id: 'user-2',
        name: 'Joao',
        email: 'joao@email.com',
        role: 'STAFF',
        active: true,
        storeId: 'store-1',
        createdAt: baseDate,
        updatedAt: baseDate
      })

      const result = await createUser({
        name: 'Joao',
        email: '  JOAO@EMAIL.COM ',
        password: '123456',
        storeId: 'store-1'
      })

      expect(hashMock).toHaveBeenCalledWith('123456', 10)
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          name: 'Joao',
          email: 'joao@email.com',
          passwordHash: 'hashed-password',
          role: 'STAFF',
          storeId: 'store-1'
        }
      })

      expect(result).toEqual({
        id: 'user-2',
        name: 'Joao',
        email: 'joao@email.com',
        role: 'STAFF',
        active: true,
        storeId: 'store-1',
        createdAt: '2026-04-23T12:00:00.000Z',
        updatedAt: '2026-04-23T12:00:00.000Z'
      })
    })
  })

  describe('inactivateUser', () => {
    it('inactivates a staff user from the current store', async () => {
      prismaMock.user.findFirst.mockResolvedValue({
        id: 'user-2',
        name: 'Joao',
        email: 'joao@email.com',
        role: 'STAFF',
        active: true,
        storeId: 'store-1',
        createdAt: baseDate,
        updatedAt: baseDate
      })
      prismaMock.user.update.mockResolvedValue({
        id: 'user-2',
        name: 'Joao',
        email: 'joao@email.com',
        role: 'STAFF',
        active: false,
        storeId: 'store-1',
        createdAt: baseDate,
        updatedAt: baseDate
      })

      const result = await inactivateUser({
        userId: 'user-2',
        storeId: 'store-1'
      })

      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'user-2',
          storeId: 'store-1'
        }
      })
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: {
          id: 'user-2'
        },
        data: {
          active: false
        }
      })

      expect(result).toEqual({
        id: 'user-2',
        name: 'Joao',
        email: 'joao@email.com',
        role: 'STAFF',
        active: false,
        storeId: 'store-1',
        createdAt: '2026-04-23T12:00:00.000Z',
        updatedAt: '2026-04-23T12:00:00.000Z'
      })
    })

    it('throws when the user is not found in the current store', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null)

      await expect(
        inactivateUser({
          userId: 'missing-user',
          storeId: 'store-1'
        })
      ).rejects.toThrow('User not found')
    })

    it('throws when trying to inactivate an owner', async () => {
      prismaMock.user.findFirst.mockResolvedValue({
        id: 'user-1',
        name: 'Maria',
        email: 'maria@email.com',
        role: 'OWNER',
        active: true,
        storeId: 'store-1',
        createdAt: baseDate,
        updatedAt: baseDate
      })

      await expect(
        inactivateUser({
          userId: 'user-1',
          storeId: 'store-1'
        })
      ).rejects.toThrow('Owner cannot be inactivated')

      expect(prismaMock.user.update).not.toHaveBeenCalled()
    })
  })
})
