import prisma from "../../../database"
import { ProductOutput } from "./products.schema"

type GetCurretProductStoreInput = {
    storeId: string,
    categoryId: string,
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