import prisma from "../../database"
import { StoreOutput, UpdateStore } from "./stores.schema"

type GetCurrentStoreInput = {
    storeId: string
}

type UpdateStoreInput = {
    storeId: string,
    data: UpdateStore
}

type UpdateStoreOpenStatusInput = {
    storeId: string,
    isOpen: boolean
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

export async function updateStore({ storeId, data }: UpdateStoreInput): Promise<StoreOutput> {

    const updateStore = await prisma.store.update({
        where: { id: storeId },
        data
    })

    return {
        id: updateStore.id,
        name: updateStore.name,
        slug: updateStore.slug,
        document: updateStore.document,
        documentType: updateStore.documentType,
        legalName: updateStore.legalName,
        status: updateStore.status,
        phone: updateStore.phone,
        whatsapp: updateStore.whatsapp,
        addressLine: updateStore.addressLine,
        addressNumber: updateStore.addressNumber,
        neighborhood: updateStore.neighborhood,
        city: updateStore.city,
        state: updateStore.state,
        zipCode: updateStore.zipCode,
        latitude: updateStore.latitude ? Number(updateStore.latitude) : null,
        longitude: updateStore.longitude ? Number(updateStore.longitude) : null,
        isOpen: updateStore.isOpen,
        supportsDelivery: updateStore.supportsDelivery,
        supportsPickup: updateStore.supportsPickup,
        supportsDineIn: updateStore.supportsDineIn,
        deliveryRadiusKm: updateStore.deliveryRadiusKm ? Number(updateStore.deliveryRadiusKm) : null,
        deliveryFeeCents: updateStore.deliveryFeeCents,
        trialEndsAt: updateStore.trialEndsAt?.toISOString(),
        createdAt: updateStore.createdAt.toISOString(),
        updatedAt: updateStore.updatedAt.toISOString()
    }
}

export async function updateOpenStore({ storeId, isOpen }: UpdateStoreOpenStatusInput): Promise<StoreOutput> {


    const openStore = await prisma.store.update({
        where: { id: storeId },
        data: { isOpen },
    })

    return {
        id: openStore.id,
        name: openStore.name,
        slug: openStore.slug,
        document: openStore.document,
        documentType: openStore.documentType,
        legalName: openStore.legalName,
        status: openStore.status,
        phone: openStore.phone,
        whatsapp: openStore.whatsapp,
        addressLine: openStore.addressLine,
        addressNumber: openStore.addressNumber,
        neighborhood: openStore.neighborhood,
        city: openStore.city,
        state: openStore.state,
        zipCode: openStore.zipCode,
        latitude: openStore.latitude ? Number(openStore.latitude) : null,
        longitude: openStore.longitude ? Number(openStore.longitude) : null,
        isOpen: openStore.isOpen,
        supportsDelivery: openStore.supportsDelivery,
        supportsPickup: openStore.supportsPickup,
        supportsDineIn: openStore.supportsDineIn,
        deliveryRadiusKm: openStore.deliveryRadiusKm ? Number(openStore.deliveryRadiusKm) : null,
        deliveryFeeCents: openStore.deliveryFeeCents,
        trialEndsAt: openStore.trialEndsAt?.toISOString(),
        createdAt: openStore.createdAt.toISOString(),
        updatedAt: openStore.updatedAt.toISOString()

    }

}