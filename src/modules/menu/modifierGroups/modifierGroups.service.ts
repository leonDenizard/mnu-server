import prisma from "../../../database"
import { CreateInputModifierGroups, ModifierGroupsOutput } from "./modifierGroups.schema"

type modifierGroupInput = {
    storeId: string,
    data: CreateInputModifierGroups
}
export async function createModifierGroups({ storeId, data }: modifierGroupInput): Promise<ModifierGroupsOutput> {

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
            description: data.description,
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
                    maxQuantity: option.maxQuantity
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
        description: modifierGroup.description,
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
        })),
        createdAt: modifierGroup.createdAt.toISOString(),
        updatedAt: modifierGroup.updatedAt.toISOString()
    }
}