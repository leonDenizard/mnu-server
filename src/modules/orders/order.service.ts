import prisma from "../../database"
import { Prisma } from "../../../generated/prisma/index.js"
import { buildSequenceKey } from "../../utils/buildSequenceKey"
import { resolveOrderNumber } from "../../utils/resolveOrderNumber"
import {
  CreateOrderInput,
  OrderItemInput,
  OrderItemModifierGroupInput,
  OrderOutput,
} from "./order.schema"

type CreateOrderServiceInput = {
  storeId: string
  userId: string
  data: CreateOrderInput
}

type LoadedProduct = Prisma.ProductGetPayload<{
  include: {
    modifierGroups: {
      where: {
        modifierGroup: {
          active: true
        }
      }
      include: {
        modifierGroup: {
          include: {
            options: {
              where: {
                active: true
              }
              orderBy: {
                displayOrder: "asc"
              }
            }
          }
        }
      }
    }
  }
}>

type CreatedOrder = Prisma.OrderGetPayload<{
  include: {
    orderItems: {
      include: {
        modifierGroups: {
          include: {
            options: true
          }
        }
      }
    }
  }
}>

type BuiltOrderItem = {
  productId: string
  productNameSnapshot: string
  unitPrice: Prisma.Decimal
  quantity: number
  total: Prisma.Decimal
  noteItem: string | null
  modifierGroups: Array<{
    snapshot: {
      modifierGroupId: string | null
      groupNameSnapshot: string
      required: boolean
      minSelections: number
      maxSelections: number
      displayOrder: number | null
      options: {
        create: Array<{
          modifierOptionId: string | null
          optionNameSnapshot: string
          optionPriceSnapshot: Prisma.Decimal
          quantity: number
          displayOrder: number | null
        }>
      }
    }
    total: Prisma.Decimal
  }>
}

type BuiltOrderPayload = {
  items: BuiltOrderItem[]
  subtotal: Prisma.Decimal
  total: Prisma.Decimal
  deliveryFee: Prisma.Decimal
}

function toDecimal(value: number | string | Prisma.Decimal) {
  return new Prisma.Decimal(value)
}

function validateDeliveryAddress(data: CreateOrderInput) {
  if (data.serviceType !== "DELIVERY") {
    return
  }

  const requiredFields = [
    data.customerName,
    data.customerPhone,
    data.deliveryStreet,
    data.deliveryAddressNumber,
    data.deliveryNeighborhood,
    data.deliveryCity,
    data.deliveryState,
    data.deliveryZipCode
  ]

  if (requiredFields.some((field) => field === null || field === undefined || field === "")) {
    throw new Error("Delivery orders require customer and address information")
  }
}

async function loadProductForOrder({
  tx,
  storeId,
  productId
}: {
  tx: Prisma.TransactionClient
  storeId: string
  productId: string
}): Promise<LoadedProduct> {
  const product = await tx.product.findFirst({
    where: {
      id: productId,
      storeId,
      active: true
    },
    include: {
      modifierGroups: {
        where: {
          modifierGroup: {
            active: true
          }
        },
        include: {
          modifierGroup: {
            include: {
              options: {
                where: {
                  active: true
                },
                orderBy: {
                  displayOrder: "asc"
                }
              }
            }
          }
        }
      }
    }
  })

  if (!product) {
    throw new Error("Product not found or inactive")
  }

  return product
}

function buildModifierGroupSnapshot(
  groupSelection: OrderItemModifierGroupInput,
  linkedGroup: LoadedProduct["modifierGroups"][number]["modifierGroup"]
) {
  const selectedCount = groupSelection.options.reduce((sum, option) => sum + option.quantity, 0)

  if (selectedCount < linkedGroup.minSelections || selectedCount > linkedGroup.maxSelections) {
    throw new Error(
      `Modifier group "${linkedGroup.name}" has invalid selections for min/max rules`
    )
  }

  const availableOptions = new Map(linkedGroup.options.map((option) => [option.id, option]))

  const options = groupSelection.options.map((selection) => {
    const option = availableOptions.get(selection.modifierOptionId)

    if (!option) {
      throw new Error(
        `Modifier option "${selection.modifierOptionId}" is not linked to modifier group "${linkedGroup.name}"`
      )
    }

    if (option.maxQuantity !== null && selection.quantity > option.maxQuantity) {
      throw new Error(
        `Modifier option "${option.name}" exceeds its maximum quantity`
      )
    }

    return {
      modifierOptionId: option.id,
      optionNameSnapshot: option.name,
      optionPriceSnapshot: option.price,
      quantity: selection.quantity,
      displayOrder: option.displayOrder
    }
  })

  const total = options.reduce((sum, option) => {
    return sum.add(toDecimal(option.optionPriceSnapshot).mul(option.quantity))
  }, new Prisma.Decimal(0))

  return {
    snapshot: {
      modifierGroupId: linkedGroup.id,
      groupNameSnapshot: linkedGroup.name,
      required: linkedGroup.required,
      minSelections: linkedGroup.minSelections,
      maxSelections: linkedGroup.maxSelections,
      displayOrder: linkedGroup.displayOrder,
      options: {
        create: options
      }
    },
    total
  }
}

async function buildOrderItemPayload({
  tx,
  storeId,
  item
}: {
  tx: Prisma.TransactionClient
  storeId: string
  item: OrderItemInput
}): Promise<BuiltOrderItem> {
  const product = await loadProductForOrder({
    tx,
    storeId,
    productId: item.productId
  })

  const linkedGroupsById = new Map(
    product.modifierGroups.map((link) => [link.modifierGroupId, link.modifierGroup] as const)
  )

  const modifierGroups = item.orderModifierGroups.map((groupSelection) => {
    const linkedGroup = linkedGroupsById.get(groupSelection.modifierGroupId)

    if (!linkedGroup) {
      throw new Error(
        `Modifier group "${groupSelection.modifierGroupId}" is not linked to product "${product.name}"`
      )
    }

    return buildModifierGroupSnapshot(groupSelection, linkedGroup)
  })

  const modifiersPerUnit = modifierGroups.reduce((sum, group) => sum.add(group.total), new Prisma.Decimal(0))
  const unitPrice = toDecimal(product.price)
  const total = unitPrice.add(modifiersPerUnit).mul(item.quantity)

  return {
    productId: product.id,
    productNameSnapshot: product.name,
    unitPrice,
    quantity: item.quantity,
    total,
    noteItem: item.noteItem ?? null,
    modifierGroups
  }
}

async function buildOrderPayload({
  tx,
  storeId,
  data,
  sequenceMode,
  deliveryFeeCents
}: {
  tx: Prisma.TransactionClient
  storeId: string
  data: CreateOrderInput
  sequenceMode: "DAILY" | "CONTINUOUS"
  deliveryFeeCents: number | null
}): Promise<BuiltOrderPayload & { orderNumber: number; sequenceKey: string }> {
  const sequenceKey = buildSequenceKey({ mode: sequenceMode })
  const orderNumber = await resolveOrderNumber({
    storeId,
    sequenceKey,
    tx
  })

  const builtItems = await Promise.all(
    data.items.map((item) =>
      buildOrderItemPayload({
        tx,
        storeId,
        item
      })
    )
  )

  const subtotal = builtItems.reduce((sum, item) => sum.add(item.total), new Prisma.Decimal(0))
  const deliveryFee =
    data.serviceType === "DELIVERY"
      ? toDecimal(deliveryFeeCents ?? 0).div(100)
      : new Prisma.Decimal(0)
  const discount = new Prisma.Decimal(0)
  const total = subtotal.add(deliveryFee).sub(discount)

  return {
    orderNumber,
    sequenceKey,
    items: builtItems,
    subtotal,
    deliveryFee,
    total
  }
}

function mapOrderOutput(order: CreatedOrder): OrderOutput {
  return {
    id: order.id,
    storeId: order.storeId,
    orderNumber: order.orderNumber,
    sequenceKey: order.sequenceKey,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    serviceType: order.serviceType,
    paymentMethod: order.paymentMethod,
    paymentDetail: order.paymentDetail,
    status: order.status,
    couponCode: order.couponCode,
    subtotal: Number(order.subtotal),
    deliveryFee: Number(order.deliveryFee),
    discount: Number(order.discount),
    total: Number(order.total),
    noteOrder: order.noteOrder,
    cancellationReason: order.cancellationReason,
    printedAt: order.printedAt ? order.printedAt.toISOString() : null,
    deliveryStreet: order.deliveryStreet,
    deliveryAddressNumber: order.deliveryAddressNumber,
    deliveryNeighborhood: order.deliveryNeighborhood,
    deliveryCity: order.deliveryCity,
    deliveryState: order.deliveryState,
    deliveryZipCode: order.deliveryZipCode,
    deliveryComplement: order.deliveryComplement,
    items: order.orderItems.map((item) => ({
      id: item.id,
      orderId: item.orderId,
      productId: item.productId,
      productNameSnapshot: item.productNameSnapshot,
      unitPrice: Number(item.unitPrice),
      quantity: item.quantity,
      total: Number(item.total),
      noteItem: item.noteItem,
      orderModifierGroups: item.modifierGroups.map((group) => ({
        id: group.id,
        modifierGroupId: group.modifierGroupId,
        groupNameSnapshot: group.groupNameSnapshot,
        required: group.required,
        minSelections: group.minSelections,
        maxSelections: group.maxSelections,
        displayOrder: group.displayOrder,
        options: group.options.map((option) => ({
          id: option.id,
          modifierOptionId: option.modifierOptionId,
          optionNameSnapshot: option.optionNameSnapshot,
          optionPriceSnapshot: Number(option.optionPriceSnapshot),
          quantity: option.quantity,
          displayOrder: option.displayOrder
        }))
      }))
    })),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString()
  }
}

export async function createOrder({
  storeId,
  userId,
  data
}: CreateOrderServiceInput): Promise<OrderOutput> {
  validateDeliveryAddress(data)

  const store = await prisma.store.findFirst({
    where: {
      id: storeId
    },
    select: {
      orderSequenceMode: true,
      deliveryFeeCents: true
    }
  })

  if (!store) {
    throw new Error("Store not found")
  }

  const order = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const payload = await buildOrderPayload({
      tx,
      storeId,
      data,
      sequenceMode: store.orderSequenceMode,
      deliveryFeeCents: store.deliveryFeeCents
    })

    return tx.order.create({
      data: {
        storeId,
        orderNumber: payload.orderNumber,
        sequenceKey: payload.sequenceKey,
        customerName: data.customerName ?? null,
        customerPhone: data.customerPhone ?? null,
        serviceType: data.serviceType,
        paymentMethod: data.paymentMethod,
        paymentDetail: data.paymentDetail ?? null,
        subtotal: payload.subtotal,
        deliveryFee: payload.deliveryFee,
        discount: new Prisma.Decimal(0),
        couponCode: data.couponCode ?? null,
        total: payload.total,
        noteOrder: data.noteOrder ?? null,
        cancellationReason: null,
        printedAt: null,
        deliveryStreet: data.deliveryStreet ?? null,
        deliveryAddressNumber: data.deliveryAddressNumber ?? null,
        deliveryNeighborhood: data.deliveryNeighborhood ?? null,
        deliveryCity: data.deliveryCity ?? null,
        deliveryState: data.deliveryState ?? null,
        deliveryZipCode: data.deliveryZipCode ?? null,
        deliveryComplement: data.deliveryComplement ?? null,
        orderItems: {
          create: payload.items.map((item) => ({
            productId: item.productId,
            productNameSnapshot: item.productNameSnapshot,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            total: item.total,
            noteItem: item.noteItem,
            modifierGroups: {
              create: item.modifierGroups.map((group) => group.snapshot)
            }
          }))
        },
        orderStatusHistories: {
          create: {
            status: "PENDING",
            userId,
            reason: null
          }
        }
      },
      include: {
        orderItems: {
          include: {
            modifierGroups: {
              include: {
                options: true
              }
            }
          }
        }
      }
    })
  })

  return mapOrderOutput(order)
}
