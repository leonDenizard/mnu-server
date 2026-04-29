import prisma from "../../database"
import { StoreOutput, UpdateStore, StoreOperatingHourInput, StoreOperatingHourOutput, OperatingHoursByDay } from "./stores.schema"

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

type CreateStoreOperatingHours = {

    storeId: string,
    data: StoreOperatingHourInput
}

type DeleteHourByIdInput = {
    storeId: string,
    id: string
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

export async function createOperatingHour({ storeId, data }: CreateStoreOperatingHours): Promise<StoreOperatingHourOutput> {

    const existingHour = await prisma.storeOperatingHour.findMany({
        where: {
            storeId,
            weekday: data.weekday
        }
    })

    if (data.openTime >= data.closeTime) {
        throw new Error('Open time must be before close time')
    }

    const duplicated = existingHour.some((hour) => {
        hour.openTime === data.openTime && hour.closeTime === data.closeTime
    })

    if (duplicated) {
        throw new Error('The registered schedule already exists.')
    }

    const hasOverlap = existingHour.some((hour) =>
        data.openTime < hour.closeTime &&
        data.closeTime > hour.openTime
    )

    if (hasOverlap) {
        throw new Error('Time slot cannot be used.')
    }



    const newHour = await prisma.storeOperatingHour.create({
        data: {
            storeId,
            closeTime: data.closeTime,
            openTime: data.openTime,
            weekday: data.weekday
        }
    })

    return {
        id: newHour.id,
        openTime: newHour.openTime,
        closeTime: newHour.closeTime,
        weekday: newHour.weekday,
        createdAt: newHour.createdAt.toISOString(),
        updatedAt: newHour.updatedAt.toISOString()
    }
}

export async function listOperatingHour({ storeId }: GetCurrentStoreInput): Promise<OperatingHoursByDay> {

    const hours = await prisma.storeOperatingHour.findMany({
        where: { storeId },
        orderBy: [
            { weekday: 'asc' },
            { openTime: 'asc' }
        ]
    })

    // const grouped = hour.reduce<Record<string, { openTime: string; closeTime: string }[]>>(
    //     (acc, hour) => {
    //         if (!acc[hour.weekday]) {
    //             acc[hour.weekday] = []
    //         }
    //         acc[hour.weekday].push({
    //             openTime: hour.openTime,
    //             closeTime: hour.closeTime
    //         })

    //         return acc
    //     },
    //     {}

    // )

    const grouped = <OperatingHoursByDay>{
        SUNDAY: [],
        MONDAY: [],
        TUESDAY: [],
        WEDNESDAY: [],
        THURSDAY: [],
        FRIDAY: [],
        SATURDAY: []
    }
    for (const hour of hours) {
        grouped[hour.weekday].push({
            id: hour.id,
            openTime: hour.openTime,
            closeTime: hour.closeTime
        })
    }
    return grouped
}
export async function deleteHourById({ storeId, id }: DeleteHourByIdInput): Promise<OperatingHoursByDay> {

    await prisma.storeOperatingHour.delete({
        where: {
            id
        }
    })

    const hours = await prisma.storeOperatingHour.findMany({
        where: { storeId },
        orderBy: [
            { weekday: 'asc' },
            { openTime: 'asc' }
        ]
    })

    const grouped = <OperatingHoursByDay>{
        SUNDAY: [],
        MONDAY: [],
        TUESDAY: [],
        WEDNESDAY: [],
        THURSDAY: [],
        FRIDAY: [],
        SATURDAY: []
    }
    for (const hour of hours) {
        grouped[hour.weekday].push({
            id: hour.id,
            openTime: hour.openTime,
            closeTime: hour.closeTime
        })
    }
    return grouped
}