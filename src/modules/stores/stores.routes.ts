import { FastifyInstance } from "fastify";
import { storeResponseSchema } from "./stores.schema";
import { getCurrentStore } from "./stores.service";

export default function storesRoutes(fastify: FastifyInstance){

    fastify.get('/api/stores/me', {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ['Store'],
            description: 'Get curretn authenticated store',
            response: {
                200: storeResponseSchema,
            }
        }
    }, async (request, replay) => {

        const store = await getCurrentStore({storeId: request.user.storeId})

        return replay.status(200).send({
            success: true,
            data: store
        })
    })
}