import { FastifyInstance } from "fastify";
import categoriesRoutes from "./categories/categories.routes";
import productsRoutes from "./products/products.routes";
import modifierGroupsRoutes from "./modifierGroups/modifierGroups.routes";
import modifierOptionsRoutes from "./modifierGroups/modifierOptions/modifierOptions.routes";
import productModifierGroupRoutes from "./productModifierGroup/productModifierGroup.routes";
import anotaAiImportRoutes from './imports/anota-ai-import.routes.js'

export  default async function menuRoutes(fastify: FastifyInstance){
    fastify.register(categoriesRoutes) 
    fastify.register(productsRoutes)
    fastify.register(modifierGroupsRoutes)
    fastify.register(modifierOptionsRoutes)
    fastify.register(productModifierGroupRoutes)
    fastify.register(anotaAiImportRoutes)
}
