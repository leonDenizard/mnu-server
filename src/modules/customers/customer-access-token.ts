import { createHash, randomBytes } from 'node:crypto'

export function hashCustomerShortId(shortId: string) {
  return createHash('sha256').update(shortId).digest('hex')
}

export function createCustomerShortId() {
  const shortId = randomBytes(16).toString('base64url')

  return {
    shortId,
    shortIdHash: hashCustomerShortId(shortId)
  }
}

export function normalizeCustomerPhone(phone: string) {
  const digits = phone.replace(/\D/g, '')

  if (digits.length < 10 || digits.length > 15) {
    throw new Error('Invalid phone number')
  }

  return digits
}

export function hashDeviceId(deviceId: string | undefined) {
  return deviceId ? createHash('sha256').update(deviceId).digest('hex') : null
}
