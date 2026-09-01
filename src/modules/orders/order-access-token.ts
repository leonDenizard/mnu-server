import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

export function createOrderAccessToken() {
  const token = randomBytes(32).toString('base64url')

  return {
    token,
    tokenHash: hashOrderAccessToken(token)
  }
}

export function hashOrderAccessToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export function orderAccessTokenMatches(token: string, tokenHash: string) {
  const candidate = Buffer.from(hashOrderAccessToken(token), 'hex')
  const expected = Buffer.from(tokenHash, 'hex')

  return candidate.length === expected.length && timingSafeEqual(candidate, expected)
}
