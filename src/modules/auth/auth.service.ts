import { compare } from 'bcryptjs'

import prisma from '../../database.js'
import { AuthUser, LoginInput } from './auth.schema.js'

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid Credentials')
    this.name = 'InvalidCredentialsError'
  }
}

export class InactiveUserError extends Error {
  constructor() {
    super('Inactive user')
    this.name = 'InactiveUserError'
  }
}

export async function login({ email, password }: LoginInput){
  const normalizedEmail = email.trim().toLowerCase()

  const user = await prisma.user.findFirst({
    where: { email: normalizedEmail }
  })

  if (!user) {
    throw new InvalidCredentialsError()
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
      storeId: user.storeId
    }
  }
}

export function buildTokenPayload(user: AuthUser) {
  return {
    sub: user.id,
    storeId: user.storeId,
    role: user.role
  }
}