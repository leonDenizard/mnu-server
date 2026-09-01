import prisma from '../../database.js'
import {
  createCustomerShortId,
  hashCustomerShortId,
  hashDeviceId,
  normalizeCustomerPhone
} from './customer-access-token.js'
import { BadRequestError, NotFoundError } from '../../shared/errors/app-error.js'

type PublicOrderRow = {
  id: string
  orderNumber: number
  status: 'PENDING' | 'IN_PREPARATION' | 'READY' | 'CANCELED' | 'FINISHED'
  serviceType: 'DELIVERY' | 'PICKUP' | 'DINE_IN'
  total: { toString(): string }
  deliveryStreet: string | null
  deliveryNeighborhood: string | null
  deliveryCity: string | null
  createdAt: Date
  updatedAt: Date
}

function truncateAddress(street: string | null) {
  if (!street) return null
  return street.length > 12 ? `${street.slice(0, 12)}…` : street
}

function mapPublicOrder(order: PublicOrderRow) {
  const address = [
    truncateAddress(order.deliveryStreet),
    order.deliveryNeighborhood,
    order.deliveryCity
  ].filter(Boolean).join(', ')

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    serviceType: order.serviceType,
    total: Number(order.total.toString()),
    deliveryAddressLabel: address || null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString()
  }
}

const publicOrderSelect = {
  id: true,
  orderNumber: true,
  status: true,
  serviceType: true,
  total: true,
  deliveryStreet: true,
  deliveryNeighborhood: true,
  deliveryCity: true,
  createdAt: true,
  updatedAt: true
} as const

export async function getPublicCustomerOrdersByPhone({ slug, phone }: { slug: string, phone: string }) {
  let phoneNormalized: string
  try {
    phoneNormalized = normalizeCustomerPhone(phone)
  } catch {
    throw new BadRequestError('A valid customer phone is required')
  }

  const customer = await prisma.customer.findFirst({
    where: { phoneNormalized, store: { slug } },
    select: {
      id: true,
      name: true,
      orders: { select: publicOrderSelect, orderBy: { createdAt: 'desc' } }
    }
  })

  if (!customer) {
    return { customerName: null, orders: [] }
  }

  return {
    customerName: customer.name,
    orders: customer.orders.map(mapPublicOrder)
  }
}

export async function getPublicCustomerByShortId({
  slug,
  shortId,
  ipAddress,
  userAgent,
  deviceId
}: {
  slug: string
  shortId: string
  ipAddress?: string
  userAgent?: string
  deviceId?: string
}) {
  const link = await prisma.customerAccessLink.findFirst({
    where: {
      shortIdHash: hashCustomerShortId(shortId),
      revokedAt: null,
      customer: { store: { slug } }
    },
    select: {
      id: true,
      customer: {
        select: {
          name: true,
          orders: { select: publicOrderSelect, orderBy: { createdAt: 'desc' } }
        }
      }
    }
  })

  if (!link) {
    throw new NotFoundError('Customer link not found or has been revoked')
  }

  await prisma.$transaction([
    prisma.customerAccessLink.update({
      where: { id: link.id },
      data: { lastAccessAt: new Date() }
    }),
    prisma.customerAccessLog.create({
      data: {
        accessLinkId: link.id,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
        deviceIdHash: hashDeviceId(deviceId)
      }
    })
  ])

  return {
    customerName: link.customer.name,
    orders: link.customer.orders.map(mapPublicOrder)
  }
}

export async function invalidateCustomerLink({ storeId, phone }: { storeId: string, phone: string }) {
  let phoneNormalized: string
  try {
    phoneNormalized = normalizeCustomerPhone(phone)
  } catch {
    throw new BadRequestError('A valid customer phone is required')
  }

  const customer = await prisma.customer.findUnique({
    where: { storeId_phoneNormalized: { storeId, phoneNormalized } },
    select: { id: true }
  })

  if (!customer) {
    throw new NotFoundError('Customer not found')
  }

  const link = createCustomerShortId()
  await prisma.$transaction([
    prisma.customerAccessLink.updateMany({
      where: { customerId: customer.id, revokedAt: null },
      data: { revokedAt: new Date() }
    }),
    prisma.customerAccessLink.create({
      data: { customerId: customer.id, shortIdHash: link.shortIdHash }
    })
  ])

  return { shortId: link.shortId }
}
