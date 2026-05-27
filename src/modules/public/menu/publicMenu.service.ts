import prisma from "../../../database"
import { PublicMenuStore } from "./publicMenu.schema"

type Slug = {
    slug: string
}

export async function fetchPublicMenuFromDb(slug: string): Promise<PublicMenuStore> {

    const store = await prisma.store.findUnique({
        where: { slug },
        include: {
            categories: {
                where: {
                    active: true,
                    showInMenu: true,
                },
                orderBy: {
                    displayOrder: 'asc'
                },
                include: {
                    product: {
                        where: {
                            active: true,
                        },
                        orderBy: { displayOrder: 'asc' },
                        include: {
                            modifierGroups: {
                                where: {
                                    modifierGroup: {
                                        active: true
                                    }
                                },
                                include: {
                                    modifierGroup: {
                                        include: {
                                            options: {
                                                where: {
                                                    active: true
                                                },
                                                orderBy: {
                                                    displayOrder: 'asc'
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                }
            }
        }
    })

    if (!store) {
        throw new Error("Store not found")
    }

    return {
        id: store.id,
        name: store.name,
        slug: store.slug,
        addressLine: store.addressLine,
        addressNumber: store.addressNumber,
        neighborhood: store.neighborhood,
        isOpen: store.isOpen,
        supportsDelivery: store.supportsDelivery,
        supportsPickup: store.supportsPickup,
        supportsDineIn: store.supportsDineIn,
        deliveryFeeCents: store.deliveryFeeCents,
        categories: store.categories.map((category) => ({
            id: category.id,
            title: category.title,
            displayOrder: category.displayOrder,
            products: category.product.map((product) => ({
                id: product.id,
                name: product.name,
                price: Number(product.price),
                description: product.description,
                image: product.image,
                promotionalPrice: product.promotionalPrice !== null ? Number(product.promotionalPrice) : null,
                displayOrder: product.displayOrder,
                modifierGroups: product.modifierGroups.map((link) => ({
                    id: link.modifierGroup.id,
                    name: link.modifierGroup.name,
                    required: link.modifierGroup.required,
                    minSelections: link.modifierGroup.minSelections,
                    maxSelections: link.modifierGroup.maxSelections,
                    displayOrder: link.modifierGroup.displayOrder,
                    options: link.modifierGroup.options.map((option) => ({
                        id: option.id,
                        name: option.name,
                        description: option.description,
                        image: option.image,
                        price: Number(option.price),
                        maxQuantity: option.maxQuantity,
                        displayOrder: option.displayOrder
                    }))
                }))
            }))
        }))
    }
}

export async function getPublicMenu({ slug }: Slug): Promise<PublicMenuStore> {
    // const cacheKey = `public-menu:${slug}`

    // const cached = await cache.get(cacheKey)
    // if (cached) {
    //     return cached
    // }

    const menu = await fetchPublicMenuFromDb(slug)

    // await cache.set(cacheKey, menu, 60)

    return menu
}