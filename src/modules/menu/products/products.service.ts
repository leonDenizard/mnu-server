import prisma from "../../../database"
import { ProductInput, ProductOutput } from "./products.schema"

type GetCurretProductStoreInput = {
    storeId: string,
    categoryId: string,
    data: ProductInput
}

type UpdateCurretProductStoreInput = {
    productId: string,
    storeId: string,
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

type ProductById = {
    storeId: string,
    productId: string
}

export async function getAllProducts({ page, storeId, limit = 20, categoryId }: GetCurretStoreInput): Promise<GetAllProductsResponse> {

    const skip = (page - 1) * limit

    const [products, total] = await Promise.all([
        prisma.product.findMany({
            where: { storeId, categoryId },
            orderBy: { displayOrder: 'asc' },
            skip,
            take: limit
        }),
        prisma.product.count({
            where: { storeId, categoryId }
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
        updatedAt: product.updatedAt.toISOString()
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

export async function getProductById({ storeId, productId }: ProductById): Promise<ProductOutput> {

    const product = await prisma.product.findUnique({
        where: { storeId: storeId, id: productId }
    })

    if(!product){
        throw new Error("Product not found") 
    }
    
    return {
        id: product.id,
        storeId: product.storeId,
        categoryId: product.categoryId,
        name: product.name,
        price: Number(product.price),
        promotionalPrice: product.promotionalPrice !== null ? Number(product.promotionalPrice) : null,
        active: product.active,
        displayOrder: product.displayOrder,
        image: product.image ?? null,
        description: product.description ?? null,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
    }
}

export async function createProduct({ categoryId, storeId, data }: GetCurretProductStoreInput): Promise<ProductOutput> {

    const category = await prisma.category.findFirst({
        where: {
            id: categoryId,
            storeId
        }
    })

    if (!category) {
        throw new Error("Category not found!")
    }

    const product = await prisma.product.create({
        data: {
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

    return {
        id: product.id,
        storeId: product.storeId,
        categoryId: product.categoryId,
        name: product.name,
        price: Number(product.price),
        promotionalPrice: product.promotionalPrice !== null ? Number(product.promotionalPrice) : null,
        active: product.active,
        displayOrder: product.displayOrder,
        image: product.image ?? null,
        description: product.description ?? null,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
    }
}

export async function updateProduct({ data, productId, storeId }: UpdateCurretProductStoreInput): Promise<ProductOutput> {

    const existingProduct = await prisma.product.findFirst({
        where: {
            id: productId,
            storeId
        }
    })

    if (!existingProduct) {
        throw new Error("Product not found")
    }

    const product = await prisma.product.update({
        where: {
            id: productId
        },
        data
    })

    if (!product) {
        throw new Error("Not found product")
    }

    return {
        id: product.id,
        categoryId: product.categoryId,
        storeId: product.storeId,
        name: product.name,
        active: product.active,
        description: product.description ?? null,
        price: Number(product.price),
        promotionalPrice: product.promotionalPrice !== null ? Number(product.promotionalPrice) : null,
        displayOrder: product.displayOrder,
        image: product.image ?? null,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString()
    }
}

export async function deleteProductById({ productId, storeId }: ProductById): Promise<ProductOutput> {

    const existingProduct = await prisma.product.findFirst({
        where: {
            id: productId,
            storeId
        }
    })

    if (!existingProduct) {
        throw new Error("Product not found")
    }

    if (!productId) {
        throw new Error("ID product invalid or empty")
    }

    const product = await prisma.product.delete({
        where: {
            id: productId
        }
    })

    return {
        id: product.id,
        categoryId: product.categoryId,
        storeId: product.storeId,
        name: product.name,
        active: product.active,
        description: product.description ?? null,
        price: Number(product.price),
        promotionalPrice: product.promotionalPrice !== null ? Number(product.promotionalPrice) : null,
        displayOrder: product.displayOrder,
        image: product.image ?? null,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString()
    }
}