import prisma from "../../../database"
import { CategoryInput, CategoryOutput } from "./categories.schema"
import { ConflictError, NotFoundError } from '../../../shared/errors/app-error'

type GetCurrentStoreInput = {
    storeId: string,
    page: number,
    limit?: number
}

type UpdateCategoryInput = {
    storeId: string,
    data: CategoryInput
}

type UpdateCategoryById = {
    storeId: string
    id: string,
    data: CategoryInput
}

type DeleteCategoryById = {
    id: string
    storeId: string
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

export async function createCategory({ storeId, data }: UpdateCategoryInput): Promise<CategoryOutput> {

    const category = await prisma.category.create({
        data: {
            storeId,
            title: data.title,
            active: data.active,
            displayOrder: data.displayOrder,
            showInMenu: data.showInMenu,
            showInPos: data.showInPos,
            showInWaiter: data.showInWaiter
        }
    })

    return {
        id: category.id,
        title: category.title,
        active: category.active,
        displayOrder: category.displayOrder,
        showInMenu: category.showInMenu,
        showInPos: category.showInPos,
        showInWaiter: category.showInWaiter,
        createdAt: category.createdAt.toISOString(),
        updatedAt: category.updatedAt.toISOString()
    }

}

export async function updateCategory({ id, data, storeId}: UpdateCategoryById): Promise<CategoryOutput>{

    const currentCategory = await prisma.category.findFirst({
        where: { id, storeId }
    })

    if (!currentCategory) {
        throw new NotFoundError("Category not found in store")
    }

    const duplicateTitle = await prisma.category.findFirst({
        where: {
            storeId,
            title: data.title,
            id: { not: id }
        }
    })

    if(duplicateTitle){
        throw new ConflictError("A category with this name already exists")
    }

    const category = await prisma.category.update({
        where: { id, storeId },
        data
    })

    return{
        id: category.id,
        title: category.title,
        active: category.active,
        displayOrder: category.displayOrder,
        showInMenu: category.showInMenu,
        showInPos: category.showInPos,
        showInWaiter: category.showInWaiter,
        createdAt: category.createdAt.toISOString(),
        updatedAt: category.updatedAt.toISOString()
    }
}

export async function deleteCategoryByID({id, storeId}: DeleteCategoryById): Promise<CategoryOutput>{

    const existsCategory = await prisma.category.findFirst({
        where: { id, storeId }
    })

    if(!existsCategory){
        throw new NotFoundError("Category not found")
    }

    const category = await prisma.category.delete({
        where: { id, storeId }
    })

    

    return{
        id: category.id,
        title: category.title,
        active: category.active,
        displayOrder: category.displayOrder,
        showInMenu: category.showInMenu,
        showInPos: category.showInPos,
        showInWaiter: category.showInWaiter,
        createdAt: category.createdAt.toISOString(),
        updatedAt: category.updatedAt.toISOString()
    }
}
