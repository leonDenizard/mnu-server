import { Prisma } from '@prisma/client'
import { hash } from 'bcryptjs'

import prisma from '../../database'
import { generateSlug } from '../../utils/slug'
import type { OnboardingInput } from './onboarding.schema'
import { onboardingService } from './onboarding.service'

jest.mock('../../database', () => ({
  __esModule: true,
  default: {
    store: {
      findUnique: jest.fn()
    },
    $transaction: jest.fn()
  }
}))

jest.mock('../../utils/slug', () => ({
  generateSlug: jest.fn()
}))

jest.mock('bcryptjs', () => ({
  hash: jest.fn()
}))

const prismaMock = prisma as unknown as {
  store: {
    findUnique: jest.Mock
  }
  $transaction: jest.Mock
}

const generateSlugMock = generateSlug as jest.MockedFunction<typeof generateSlug>
const hashMock = hash as unknown as jest.Mock

const onboardingInput: OnboardingInput = {
  storeName: 'Pizza da Maria',
  ownerName: 'Maria',
  ownerEmail: '  MARIA@EMAIL.COM ',
  ownerPassword: '123456',
  document: '12345678901',
  documentType: 'CPF',
  legalName: 'Maria LTDA'
}

describe('onboardingService', () => {
  beforeEach(() => {
    generateSlugMock.mockReturnValue('pizza-da-maria')
    hashMock.mockResolvedValue('hashed-password')
    prismaMock.store.findUnique.mockResolvedValue(null)
  })

  it('creates store and owner user with normalized email', async () => {
    const createdStore = {
      id: 'store-1',
      name: 'Pizza da Maria',
      slug: 'pizza-da-maria'
    }

    const createdUser = {
      id: 'user-1',
      name: 'Maria',
      email: 'maria@email.com',
      role: 'OWNER',
      storeId: 'store-1'
    }

    const tx = {
      store: {
        create: jest.fn().mockResolvedValue(createdStore)
      },
      user: {
        create: jest.fn().mockResolvedValue(createdUser)
      }
    }

    prismaMock.$transaction.mockImplementation(async (callback: (client: typeof tx) => unknown) => {
      return callback(tx)
    })

    const result = await onboardingService(onboardingInput)

    expect(generateSlugMock).toHaveBeenCalledWith('Pizza da Maria')
    expect(hashMock).toHaveBeenCalledWith('123456', 10)
    expect(tx.store.create).toHaveBeenCalledWith({
      data: {
        name: 'Pizza da Maria',
        slug: 'pizza-da-maria',
        document: '12345678901',
        documentType: 'CPF',
        legalName: 'Maria LTDA'
      }
    })
    expect(tx.user.create).toHaveBeenCalledWith({
      data: {
        name: 'Maria',
        email: 'maria@email.com',
        passwordHash: 'hashed-password',
        role: 'OWNER',
        storeId: 'store-1'
      }
    })
    expect(result).toEqual({
      store: createdStore,
      user: createdUser
    })
  })

  it('increments slug when the base slug already exists', async () => {
    prismaMock.store.findUnique
      .mockResolvedValueOnce({ id: 'existing-store' })
      .mockResolvedValueOnce(null)

    const tx = {
      store: {
        create: jest.fn().mockResolvedValue({
          id: 'store-2',
          name: 'Pizza da Maria',
          slug: 'pizza-da-maria-1'
        })
      },
      user: {
        create: jest.fn().mockResolvedValue({
          id: 'user-2',
          name: 'Maria',
          email: 'maria@email.com',
          role: 'OWNER',
          storeId: 'store-2'
        })
      }
    }

    prismaMock.$transaction.mockImplementation(async (callback: (client: typeof tx) => unknown) => {
      return callback(tx)
    })

    await onboardingService(onboardingInput)

    expect(prismaMock.store.findUnique).toHaveBeenNthCalledWith(1, {
      where: { slug: 'pizza-da-maria' }
    })
    expect(prismaMock.store.findUnique).toHaveBeenNthCalledWith(2, {
      where: { slug: 'pizza-da-maria-1' }
    })
    expect(tx.store.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          slug: 'pizza-da-maria-1'
        })
      })
    )
  })

  it('maps unique constraint violations to a business error', async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError('duplicate key', {
      code: 'P2002',
      clientVersion: 'test'
    })

    prismaMock.$transaction.mockRejectedValue(prismaError)

    await expect(onboardingService(onboardingInput)).rejects.toThrow('Conflito de dados')
  })
})
