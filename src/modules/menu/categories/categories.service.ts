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

type UpdateCategoryById = {
    storeId: string
    id: string,
    data: CategoryInput
}

type DeleteCategoryById = {
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

    const exists = await prisma.category.findFirst({
        where: {storeId: storeId, title: data.title}
    })
    
    if(exists){
        throw new Error ("A category with this name already exists")
    }

    const category = await prisma.category.update({
        where: { id },
        data
    })

    

    if(!category){
        throw new Error ("Not found categories on store")
    }

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

export async function deleteCategoryByID({id}: DeleteCategoryById): Promise<CategoryOutput>{

    const existsCategory = await prisma.category.findUnique({
        where: {id}
    })

    if(!existsCategory){
        throw new Error("Not found Category")
    }

    const category = await prisma.category.delete({
        where: {id}
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