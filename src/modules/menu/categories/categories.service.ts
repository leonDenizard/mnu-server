import prisma from "../../../database"
import { CategoryInput, CategoryOutput } from "./categories.schema"

type GetCurrentStoreInput = {
    storeId: string
}

type UpdateCategoryInput = {
    storeId: string,
    data: CategoryInput
}

type DeleteCategoryById = {
    storeId: string,
    id: string
}

export async function getCategories({ storeId }: GetCurrentStoreInput): Promise<CategoryOutput[]> {

    const categories = await prisma.category.findMany({
        where: { storeId }
    })

    return categories.map((categorie) => ({
        id: categorie.id,
        title: categorie.title,
        active: categorie.active,
        displayOrder: categorie.displayOrder,
        showInMenu: categorie.showInMenu,
        showInPos: categorie.showInPos,
        showInWaiter: categorie.showInWaiter,
        createdAt: categorie.createdAt.toISOString(),
        updatedAt: categorie.updatedAt.toISOString()
    }))
}