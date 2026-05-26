import prisma from "../../../database"
import { LinkedModifierGroupOutput } from "./productModifierGroup.schemas"

type GetCurrentInputStore = {
    storeId: string,
    productId: string
    modifierGroupId: string
}

type GetProductAllModifierGroup = {
    storeId: string,
    productId: string,
}

export async function linkModifierGroupInProduct({ modifierGroupId, productId, storeId }: GetCurrentInputStore): Promise<LinkedModifierGroupOutput[]> {

    const modifierExists = await prisma.modifierGroup.findFirst({
        where: {
            id: modifierGroupId, storeId
        }
    })

    if (!modifierExists) {
        throw new Error("Modifier group not found in store")
    }

    const productExists = await prisma.product.findFirst({
        where: {
            id: productId, storeId
        }
    })

    if (!productExists) {
        throw new Error("Product not found in store")
    }

    const linkedExists = await prisma.productModifierGroup.findFirst({
        where: { modifierGroupId, productId }
    })

    if (linkedExists) {
        throw new Error("Group is already exist on product")
    }

    await prisma.productModifierGroup.create({
        data: { productId, modifierGroupId },
    })

    const response = await prisma.productModifierGroup.findMany({
        where: { productId },
        include: {
            modifierGroup: {
                include: {
                    options: {
                        orderBy: { displayOrder: "asc" }
                    }
                }
            }
        }
    })


    return response.map((link) => ({
        id: link.modifierGroup.id,
        name: link.modifierGroup.name,
        surname: link.modifierGroup.surname,
        active: link.modifierGroup.active,
        required: link.modifierGroup.required,
        minSelections: link.modifierGroup.minSelections,
        maxSelections: link.modifierGroup.maxSelections,
        displayOrder: link.modifierGroup.displayOrder,
        options: link.modifierGroup.options.map((option) => ({
            id: option.id,
            name: option.name,
            price: Number(option.price),
            description: option.description,
            displayOrder: option.displayOrder
        })),
        createdAt: link.modifierGroup.createdAt.toISOString(),
        updatedAt: link.modifierGroup.updatedAt.toISOString()
    }))

}

export async function removeModifierGroupInProduct({ modifierGroupId, productId, storeId }: GetCurrentInputStore): Promise<LinkedModifierGroupOutput[]> {

    const modifierExists = await prisma.modifierGroup.findFirst({
        where: {
            id: modifierGroupId, storeId
        }
    })

    if (!modifierExists) {
        throw new Error("Modifier group not found in store")
    }

    const productExists = await prisma.product.findFirst({
        where: {
            id: productId, storeId
        }
    })

    if (!productExists) {
        throw new Error("Product not found in store")
    }

    const linkedExists = await prisma.productModifierGroup.findFirst({
        where: { modifierGroupId, productId }
    })

    if (!linkedExists) {
        throw new Error("Group not found on product")
    }

    await prisma.productModifierGroup.delete({
        where: { productId_modifierGroupId: { modifierGroupId, productId } }
    })

    const response = await prisma.productModifierGroup.findMany({
        where: { productId },
        include: {
            modifierGroup: {
                include: {
                    options: {
                        orderBy: { displayOrder: "asc" }
                    }
                }
            }
        }
    })

    return response.map((link) => ({
        id: link.modifierGroup.id,
        name: link.modifierGroup.name,
        surname: link.modifierGroup.surname,
        active: link.modifierGroup.active,
        required: link.modifierGroup.required,
        minSelections: link.modifierGroup.minSelections,
        maxSelections: link.modifierGroup.maxSelections,
        displayOrder: link.modifierGroup.displayOrder,
        options: link.modifierGroup.options.map((option) => ({
            id: option.id,
            name: option.name,
            price: Number(option.price),
            description: option.description,
            displayOrder: option.displayOrder
        })),
        createdAt: link.modifierGroup.createdAt.toISOString(),
        updatedAt: link.modifierGroup.updatedAt.toISOString()
    }))
}

export async function getAllProductModifierGroup({ productId, storeId }: GetProductAllModifierGroup): Promise<LinkedModifierGroupOutput[]> {

    const productExists = await prisma.product.findFirst({
        where: {
            id: productId, storeId
        }
    })

    if (!productExists) {
        throw new Error("Product not found in store")
    }


    const response = await prisma.productModifierGroup.findMany({
        where: { productId },
        include: {
            modifierGroup: {
                include: {
                    options: {
                        orderBy: { displayOrder: "asc" }
                    }
                }
            }
        }
    })


    return response.map((link) => ({
        id: link.modifierGroup.id,
        name: link.modifierGroup.name,
        surname: link.modifierGroup.surname,
        active: link.modifierGroup.active,
        required: link.modifierGroup.required,
        minSelections: link.modifierGroup.minSelections,
        maxSelections: link.modifierGroup.maxSelections,
        displayOrder: link.modifierGroup.displayOrder,
        options: link.modifierGroup.options.map((option) => ({
            id: option.id,
            name: option.name,
            price: Number(option.price),
            description: option.description,
            displayOrder: option.displayOrder
        })),
        createdAt: link.modifierGroup.createdAt.toISOString(),
        updatedAt: link.modifierGroup.updatedAt.toISOString()
    }))

}