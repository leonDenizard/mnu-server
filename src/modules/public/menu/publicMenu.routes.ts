import { FastifyInstance } from "fastify";
import { inputSlugParamsSchema, publicMenuResponseSchema } from "./publicMenu.schema";
import { getPublicMenu } from "./publicMenu.service";

export default function publicMenuRoutes(fastify: FastifyInstance){

    fastify.get('/api/public/menu/:slug', {
            schema: {
                tags: ['Public Menu'],
                description: 'Get current menu on store',
                params: inputSlugParamsSchema,
                response: {
                    200: publicMenuResponseSchema,
                }
            }
        }, async (request, replay) => {
    
            const params = inputSlugParamsSchema.parse(request.params)
            const store = await getPublicMenu({ slug: params.slug })
    
            return replay.status(200).send({
                success: true,
                data: store
            })
        })
}