import prisma from "../../../../database"
import { DeleteBulkOptionsOutput, ModifierOptionItem, ModifierOptionsOutput, ModifierOptionUpdateItem } from "./modifierOptions.schema"

type modifierOptionsInput = {
    storeId: string,
    modifierGroupId: string,
    data: ModifierOptionItem[]
}

type UpdateModifierOptionsInput = {
    storeId: string,
    modifierGroupId: string,
    data: ModifierOptionUpdateItem[]
}
type DeleteModifierOptionsInput = {
    storeId: string,
    modifierGroupId: string,
    ids: string[]
}

export async function createModifierOptions({ data, modifierGroupId, storeId }: modifierOptionsInput): Promise<ModifierOptionsOutput[]> {

    const modifierGroup = await prisma.modifierGroup.findFirst({
        where: {
            storeId,
            id: modifierGroupId
        }
    })

    if (!modifierGroup) {
        throw new Error("Modifier group not found")
    }

    const payload = data.map((option) => ({
        modifierGroupId,
        name: option.name,
        description: option.description,
        image: option.image,
        price: option.price ?? 0,
        maxQuantity: option.maxQuantity,
        active: option.active ?? true,
        displayOrder: option.displayOrder ?? 0
    }))

    await prisma.modifierOption.createMany({
        data: payload
    })

    const modifierOptionOutput = await prisma.modifierOption.findMany({
        where: { modifierGroupId },
        orderBy: { displayOrder: 'asc' }
    })

    return modifierOptionOutput.map((option) => ({
        id: option.id,
        name: option.name,
        description: option.description,
        image: option.image,
        price: Number(option.price) ?? 0,
        maxQuantity: option.maxQuantity,
        active: option.active ?? true,
        displayOrder: option.displayOrder ?? 0,
        modifierGroupId: option.modifierGroupId,
        createdAt: option.createdAt.toISOString(),
        updatedAt: option.updatedAt.toISOString(),
    }))
}

export async function updateBulkModifierOptions({ storeId, modifierGroupId, data }: UpdateModifierOptionsInput): Promise<ModifierOptionsOutput[]> {

    const modifierGroup = await prisma.modifierGroup.findFirst({
        where: {
            id: modifierGroupId,
            storeId
        }
    })

    if (!modifierGroup) {
        throw new Error("Modifier group not found")
    }

    await prisma.$transaction(
        data.map((option) => prisma.modifierOption.update({
            where: {
                id: option.id
            },
            data: {
                name: option.name,
                description: option.description,
                price: option.price,
                maxQuantity: option.maxQuantity,
                active: option.active,
                displayOrder: option.displayOrder
            }
        }))
    )

    const updatedOptions = await prisma.modifierOption.findMany({
        where: { modifierGroupId },
        orderBy: { displayOrder: 'asc' }
    })

    return updatedOptions.map((option) => ({
        id: option.id,
        name: option.name,
        description: option.description,
        image: option.image,
        price: Number(option.price) ?? 0,
        maxQuantity: option.maxQuantity,
        active: option.active ?? true,
        displayOrder: option.displayOrder ?? 0,
        modifierGroupId: option.modifierGroupId,
        createdAt: option.createdAt.toISOString(),
        updatedAt: option.updatedAt.toISOString(),
    }))

}

export async function deleteBulkModifierOptions({ ids, modifierGroupId, storeId }: DeleteModifierOptionsInput): Promise<DeleteBulkOptionsOutput> {

    const modifierGroup = await prisma.modifierGroup.findFirst({
        where: { id: modifierGroupId, storeId },
    })

    if (!modifierGroup) {
        throw new Error("Modifier group not found")
    }

    const existingOptions = await prisma.modifierOption.findMany({
        where: {
            modifierGroupId,
            id: {
                in: ids
            }
        }
    })

    if(existingOptions.length !== ids.length){
        throw new Error("Ids not found")
    }

    await prisma.modifierOption.deleteMany({
        where: {
            modifierGroupId,
            id: {
                in: ids
            }
        },
        
    })

    return{
        message: "IDs deleted",
        ids
    }
}