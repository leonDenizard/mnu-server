import { z } from "zod";
import { paginationMetaSchema } from "./pagination";

export function createPaginatedResponseSchema<T extends z.ZodTypeAny>(
  itemSchema: T
) {
  return z.object({
    success: z.literal(true),
    data: z.array(itemSchema),
    meta: paginationMetaSchema
  });
}