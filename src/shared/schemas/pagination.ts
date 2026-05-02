import { z } from "zod";

export const paginationMetaSchema = z.object({
  total: z.number(),
  page: z.number(),
  lastPage: z.number()
});

export const querySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(10)
})