import { z } from "zod";
import { paginationMetaSchema } from "./pagination";

export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional()
  })
})

export function createPaginatedResponseSchema<T extends z.ZodTypeAny>(
  itemSchema: T
) {
  return z.object({
    success: z.literal(true),
    data: z.array(itemSchema),
    meta: paginationMetaSchema
  });
}
