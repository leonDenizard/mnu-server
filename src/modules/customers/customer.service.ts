import prisma from '../../database.js'
import {
  createCustomerShortId,
  hashDeviceId,
  normalizeCustomerPhone
} from './customer-access-token.js'
import { BadRequestError, NotFoundError } from '../../shared/errors/app-error.js'
import { cancelOrderByCustomerId } from '../orders/order-state.service.js'

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

function mapMaskedAddress(address: { id: string, label: string | null, street: string, neighborhood: string, city: string }) {
  return {
    id: address.id,
    label: address.label,
    addressLabel: [truncateAddress(address.street), address.neighborhood, address.city].filter(Boolean).join(', ')
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
      addresses: { where: { active: true }, select: { id: true, label: true, street: true, neighborhood: true, city: true } },
      orders: { select: publicOrderSelect, orderBy: { createdAt: 'desc' } }
    }
  })

  if (!customer) {
    return { customerName: null, orders: [], addresses: [] }
  }

  return {
    customerName: customer.name,
    orders: customer.orders.map(mapPublicOrder),
    addresses: customer.addresses.map(mapMaskedAddress)
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
      shortId,
      revokedAt: null,
      customer: { store: { slug } }
    },
    select: {
      id: true,
      customer: {
        select: {
          name: true,
          addresses: {
            where: { active: true },
            select: { id: true, label: true, street: true, number: true, neighborhood: true, city: true, state: true, zipCode: true, complement: true, isDefault: true },
            orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }]
          },
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
    orders: link.customer.orders.map(mapPublicOrder),
    addresses: link.customer.addresses
  }
}

export async function deletePublicCustomerAddressByShortId({
  slug,
  shortId,
  addressId
}: {
  slug: string
  shortId: string
  addressId: string
}) {
  const link = await prisma.customerAccessLink.findFirst({
    where: {
      shortId,
      revokedAt: null,
      customer: { store: { slug } }
    },
    select: { customerId: true }
  })

  if (!link) throw new NotFoundError('Customer link not found or has been revoked')

  const result = await prisma.customerAddress.updateMany({
    where: { id: addressId, customerId: link.customerId, active: true },
    data: { active: false }
  })

  if (!result.count) throw new NotFoundError('Customer address not found')
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
      data: { customerId: customer.id, shortId: link }
    })
  ])

  return { shortId: link }
}

export async function cancelPublicCustomerOrderByPhone({ slug, phone, orderId }: { slug: string, phone: string, orderId: string }) {
  let phoneNormalized: string
  try { phoneNormalized = normalizeCustomerPhone(phone) } catch { throw new BadRequestError('A valid customer phone is required') }
  const customer = await prisma.customer.findFirst({
    where: { phoneNormalized, store: { slug } }, select: { id: true }
  })
  if (!customer) throw new NotFoundError('Customer not found')
  return cancelOrderByCustomerId({ customerId: customer.id, orderId })
}

export async function cancelPublicCustomerOrderByShortId({ slug, shortId, orderId }: { slug: string, shortId: string, orderId: string }) {
  const link = await prisma.customerAccessLink.findFirst({
    where: { shortId, revokedAt: null, customer: { store: { slug } } },
    select: { customerId: true }
  })
  if (!link) throw new NotFoundError('Customer link not found or has been revoked')
  return cancelOrderByCustomerId({ customerId: link.customerId, orderId })
}
