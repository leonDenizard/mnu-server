import { FastifyInstance } from "fastify";
import categoriesRoutes from "./categories/categories.routes";
import productsRoutes from "./products/products.routes";

export  default async function menuRoutes(fastify: FastifyInstance){
    fastify.register(categoriesRoutes) 
    fastify.register(productsRoutes)
}