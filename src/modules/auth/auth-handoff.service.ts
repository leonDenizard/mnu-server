import { createHash, randomBytes } from 'node:crypto'

import prisma from '../../database.js'
import { ConflictError, UnauthorizedError } from '../../shared/errors/app-error.js'
import { buildTokenPayload } from './auth.service.js'

const HANDOFF_TTL_MS = 60_000

function hashCode(code: string) {
  return createHash('sha256').update(code).digest('hex')
}

export async function createOnboardingHandoffCode(userId: string) {
  const code = randomBytes(32).toString('base64url')

  await prisma.authHandoffCode.create({
    data: {
      userId,
      codeHash: hashCode(code),
      expiresAt: new Date(Date.now() + HANDOFF_TTL_MS)
    }
  })

  return { code, expiresIn: Math.floor(HANDOFF_TTL_MS / 1000) }
}

export async function exchangeOnboardingHandoffCode(code: string) {
  const now = new Date()

  const handoff = await prisma.$transaction(async (tx) => {
    const existing = await tx.authHandoffCode.findUnique({
      where: { codeHash: hashCode(code) },
      include: { user: { include: { store: true } } }
    })

    if (!existing || existing.usedAt || existing.expiresAt <= now) {
      throw new UnauthorizedError('Invalid or expired onboarding code')
    }

    const used = await tx.authHandoffCode.updateMany({
      where: { id: existing.id, usedAt: null },
      data: { usedAt: now }
    })

    if (used.count === 0) {
      throw new ConflictError('Onboarding code has already been used')
    }

    return existing
  })

  if (!handoff.user.active) {
    throw new UnauthorizedError('Inactive user')
  }

  return {
    payload: buildTokenPayload({
      id: handoff.user.id,
      storeId: handoff.user.storeId,
      role: handoff.user.role
    }),
    user: {
      id: handoff.user.id,
      name: handoff.user.name,
      email: handoff.user.email,
      role: handoff.user.role,
      storeId: handoff.user.storeId,
      slug: handoff.user.store.slug,
      storeName: handoff.user.store.name
    }
  }
}
