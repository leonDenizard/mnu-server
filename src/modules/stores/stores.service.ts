import prisma from "../../database"
import { StoreOutput } from "./stores.schema"

type GetCurrentStoreInput = {
    storeId: string
}

export async function getCurrentStore({ storeId }: GetCurrentStoreInput): Promise<StoreOutput> {

    const store = await prisma.store.findUnique({
        where: {
            id: storeId
        }
    })

    if (!store) {
        throw new Error('Store not found')
    }

    return {
    id: store.id,
    name: store.name,
    slug: store.slug,
    document: store.document,
    documentType: store.documentType,
    legalName: store.legalName,
    status: store.status,
    phone: store.phone,
    whatsapp: store.whatsapp,
    addressLine: store.addressLine,
    addressNumber: store.addressNumber,
    neighborhood: store.neighborhood,
    city: store.city,
    state: store.state,
    zipCode: store.zipCode,
    latitude: Number(store.latitude),
    longitude: Number(store.longitude),
    isOpen: store.isOpen,
    supportsDelivery: store.supportsDelivery,
    supportsPickup: store.supportsPickup,
    supportsDineIn: store.supportsDineIn,
    deliveryRadiusKm: Number(store.deliveryRadiusKm),
    deliveryFeeCents: store.deliveryFeeCents,
    trialEndsAt: store.trialEndsAt?.toISOString(),
    createdAt: store.createdAt.toISOString(),
    updatedAt: store.updatedAt.toISOString()
  }
}