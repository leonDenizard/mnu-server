import prisma from "../../../database"
import { ProductInput, ProductOutput } from "./products.schema"

type GetCurretProductStoreInput = {
    storeId: string,
    categoryId: string,
    data: ProductInput
}

type GetCurretStoreInput = {
    storeId: string,
    categoryId: string,
    page: number,
    limit?: number
}

type GetAllProductsResponse = {
    data: ProductOutput[]
    meta: {
        total: number
        page: number
        lastPage: number
    }
}

export async function getAllProducts({ page, storeId, limit = 20, categoryId }: GetCurretStoreInput): Promise<GetAllProductsResponse> {

    const skip = (page - 1) * limit

    const [products, total] = await Promise.all([
        prisma.product.findMany({
            where: { storeId },
            orderBy: { displayOrder: 'asc' },
            skip,
            take: limit
        }),
        prisma.product.count({
            where: { categoryId }
        })
    ])

    const data = products.map((product) => ({
        id: product.id,
        name: product.name,
        price: Number(product.price),
        description: product.description ? product.description : null,
        image: product.image ? product.image : null,
        promotionalPrice: product.promotionalPrice ? Number(product.promotionalPrice) : null,
        active: product.active,
        displayOrder: product.displayOrder,
        categoryId: product.categoryId,
        storeId: product.storeId,
        createdAt: product.createdAt.toISOString(),
        updatedAt:product.updatedAt.toISOString() 
    }))

    return{
        data,
        meta: {
            total,
            page,
            lastPage: Math.ceil(total/limit)
        }
    }
}

export async function createProduct({categoryId, storeId, data}:GetCurretProductStoreInput): Promise<ProductOutput>{

    if(!categoryId){
        throw new Error ("Categoria não encontrada")
    }

    const product = await prisma.product.create({
        data:{
            storeId,
            categoryId,
            name: data.name,
            description: data.description,
            displayOrder: data.displayOrder,
            price: data.price,
            promotionalPrice: data.promotionalPrice,
            active: data.active,
            image: data.image,
        }
    })

    return{
        id: product.categoryId,
        storeId: product.storeId,
        categoryId: product.categoryId,
        name: product.name,
        price: Number(product.price),
        promotionalPrice: Number(product.promotionalPrice),
        active: product.active,
        displayOrder: product.displayOrder,
        image: product.image,
        description: product.description ? product.description : null,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
    }
}