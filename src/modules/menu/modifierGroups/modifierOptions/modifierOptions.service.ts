import prisma from "../../../../database"
import { ModifierOptionItem, ModifierOptionsOutput } from "./modifierOptions.schema"

type modifierOptionsInput = {
    storeId: string,
    modifierGroupId: string,
    data: ModifierOptionItem[]
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
        where: { modifierGroupId }
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