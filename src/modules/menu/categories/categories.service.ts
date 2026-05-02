import prisma from "../../../database"
import { CategoryInput, CategoryOutput } from "./categories.schema"

type GetCurrentStoreInput = {
    storeId: string,
    page: number,
    limit?: number
}

type UpdateCategoryInput = {
    storeId: string,
    data: CategoryInput
}

type DeleteCategoryById = {
    storeId: string,
    id: string
}

type GetAllCategoriesResponse = {
  data: CategoryOutput[]
  meta: {
    total: number
    page: number
    lastPage: number
  }
}

export async function getAllCategories({ storeId, limit = 10, page = 1 }: GetCurrentStoreInput): Promise<GetAllCategoriesResponse> {

    const skip = (page - 1) * limit

    const [categories, total] = await Promise.all([
        prisma.category.findMany({
            where: { storeId },
            orderBy: { displayOrder: 'asc' },
            skip,
            take: limit
        }),
        prisma.category.count({
            where: { storeId }
        })
    ])

    const data = categories.map((categorie) => ({
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

    return {
        data,
        meta: {
            total,
            page,
            lastPage: Math.ceil(total / limit)
        }
    }
}