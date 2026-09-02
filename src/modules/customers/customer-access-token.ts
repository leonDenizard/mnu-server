import { createHash, randomBytes } from 'node:crypto'

export function createCustomerShortId() {
  return randomBytes(16).toString('base64url')
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
