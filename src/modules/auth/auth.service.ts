import { compare } from 'bcryptjs'

import prisma from '../../database.js'
import { JwtPayload, LoginInput, LoginResult, TokenUser } from './auth.schema.js'

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid Credentials')
    this.name = 'InvalidCredentialsError'
  }
}
export class UserNotFoundError extends Error {
  constructor() {
    super('User not found')
    this.name = 'UserNotFoundError'
  }
}

export class InactiveUserError extends Error {
  constructor() {
    super('Inactive user')
    this.name = 'InactiveUserError'
  }
}

export async function login({ email, password }: LoginInput): Promise<LoginResult> {
  const normalizedEmail = email.trim().toLowerCase()

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  })

  if (!user) {
    throw new InvalidCredentialsError()
  }
  const store = await prisma.store.findUnique({
    where: { id: user.storeId }
  })

  if (!store) {
    throw new Error('Store not found for user')
  }

  const passwordIsValid = await compare(password, user.passwordHash)

  if (!passwordIsValid) {
    throw new InvalidCredentialsError()
  }

  if (!user.active) {
    throw new InactiveUserError()
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      storeId: user.storeId,
      slug: store?.slug,
      storeName: store?.name
    }
  }
}


export function buildTokenPayload(user: TokenUser): JwtPayload {
  return {
    sub: user.id,
    storeId: user.storeId,
    role: user.role
  }
}
