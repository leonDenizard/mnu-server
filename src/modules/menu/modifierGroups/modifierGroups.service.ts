import prisma from "../../../database"
import { CreateInputModifierGroups, ModifierGroupsOutput, UpdateInputModifierGroups, UpdateModifierGroupsOutput } from "./modifierGroups.schema"

type ModifierGroupInput = {
    storeId: string,
    data: CreateInputModifierGroups
}
type GetCurrentStoreInput = {
    storeId: string
}

type UpdateModifierGroup = {
    storeId: string,
    modifierGroupId: string,
    data: UpdateInputModifierGroups
}

export async function createModifierGroups({ storeId, data }: ModifierGroupInput): Promise<ModifierGroupsOutput> {

    const existingName = await prisma.modifierGroup.findFirst({
        where: {
            storeId,
            name: data.name
        }
    })

    if (existingName && !data.surname) {
        throw new Error("Surname is required when a modifier group with the same name already exists")
    }

    if (data.surname) {
        const existingSurname = await prisma.modifierGroup.findFirst({
            where: {
                storeId,
                surname: data.surname
            }
        })

        if (existingSurname) {
            throw new Error("Surname already in use")
        }
    }


    const required = data.required ?? false
    const minSelections = required ? 1 : data.minSelections

    if (data.maxSelections < minSelections) {
        throw new Error("Field maxSelections cannot be smaller than the minSelections")
    }

    const modifierGroup = await prisma.modifierGroup.create({
        data: {
            storeId,
            name: data.name,
            surname: data.surname,
            minSelections,
            maxSelections: data.maxSelections,
            active: data.active,
            required,
            displayOrder: data.displayOrder,
            options: {
                create: data.options.map((option) => ({
                    name: option.name,
                    price: option.price,
                    displayOrder: option.displayOrder,
                    maxQuantity: option.maxQuantity,
                    description: option.description
                }))
            }
        },
        include: {
            options: true
        }
    })

    return {
        id: modifierGroup.id,
        name: modifierGroup.name,
        surname: modifierGroup.surname,
        minSelections: modifierGroup.minSelections,
        maxSelections: modifierGroup.maxSelections,
        required: modifierGroup.required,
        active: modifierGroup.active,
        displayOrder: modifierGroup.displayOrder,
        options: modifierGroup.options.map((option) => ({
            id: option.id,
            price: Number(option.price),
            name: option.name,
            displayOrder: option.displayOrder,
            description: option.description
        })),
        createdAt: modifierGroup.createdAt.toISOString(),
        updatedAt: modifierGroup.updatedAt.toISOString()
    }
}

export async function getAllModifierGroups({ storeId }: GetCurrentStoreInput): Promise<ModifierGroupsOutput[]> {

    const modifierGroup = await prisma.modifierGroup.findMany({
        where: { storeId },
        include: {
            options: true
        }
    })

    const data = modifierGroup.map((mg) => ({
        id: mg.id,
        name: mg.name,
        surname: mg.surname,
        minSelections: mg.minSelections,
        maxSelections: mg.maxSelections,
        required: mg.required,
        active: mg.active,
        displayOrder: mg.displayOrder,
        options: mg.options.map((option) => ({
            id: option.id,
            price: Number(option.price),
            name: option.name,
            displayOrder: option.displayOrder,
            description: option.description
        })),
        createdAt: mg.createdAt.toISOString(),
        updatedAt: mg.updatedAt.toISOString()
    }))

    return data
}

export async function updateModifierGroup({ storeId, modifierGroupId, data }: UpdateModifierGroup): Promise<UpdateModifierGroupsOutput> {

    const currentGroup = await prisma.modifierGroup.findUnique({
        where: { id: modifierGroupId, storeId }
    });

    if (!currentGroup) {
        throw new Error("Modifier group not found")
    }

    const nextName = data.name ?? currentGroup.name
    const nextSurname = data.surname ?? currentGroup.surname

    const nextRequired = data.required ?? currentGroup.required
    const nextMaxSelections = data.maxSelections ?? currentGroup.maxSelections
    const nextMinSelections = data.minSelections ?? currentGroup.minSelections

    
    const normalizedMinSelections = nextRequired ? Math.max(1, nextMinSelections) : nextMinSelections

    if (nextMaxSelections < normalizedMinSelections) {
        throw new Error("maxSelections cannot be smaller than minSelections")
    }

    const existingName = await prisma.modifierGroup.findFirst({
        where: {
            storeId,
            name: nextName,
            id: {
                not: modifierGroupId
            }
        }
    })

    if (existingName && !nextSurname) {
        throw new Error("Surname is required when a modifier group with the same name already exists")
    }

    if (nextSurname) {
        const existingSurname = await prisma.modifierGroup.findFirst({
            where: {
                storeId,
                surname: nextName,
                id: {
                    not: modifierGroupId
                }
            }
        })

        if (existingSurname) {
            throw new Error("Surname already in use")
        }
    }

    const modifierGroup = await prisma.modifierGroup.update({
        where: { id: modifierGroupId, storeId },
        data: {
            ...data,
            minSelections: normalizedMinSelections,
            maxSelections: nextMaxSelections,
            required: nextRequired
        }
    })

    return {
        id: modifierGroup.id,
        name: modifierGroup.name,
        surname: modifierGroup.surname,
        minSelections: modifierGroup.minSelections,
        maxSelections: modifierGroup.maxSelections,
        required: modifierGroup.required,
        active: modifierGroup.active,
        displayOrder: modifierGroup.displayOrder,
        createdAt: modifierGroup.createdAt.toISOString(),
        updatedAt: modifierGroup.updatedAt.toISOString()
    }
}