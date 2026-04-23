import {z} from "zod"

export const userOutputSchema = z.object({

    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
    role: z.enum(['OWNER', 'STAFF']),
    active: z.boolean(),
    storeId: z.string().uuid(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime()
})

export const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6)
})

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(['OWNER', 'STAFF']).optional(),

})

export const userResponseSchema = z.object({
  success: z.literal(true),
  data: userOutputSchema
})

export const usersListResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(userOutputSchema)
})

export const userParamsSchema = z.object({
    id: z.string().uuid()
})
export type UserOutput = z.infer<typeof userOutputSchema>
export type CreateUser = z.infer<typeof createUserSchema>
export type UpdateUser = z.infer<typeof updateUserSchema>
export type UserResponse = z.infer<typeof userResponseSchema>
export type UsersListResponse = z.infer<typeof usersListResponseSchema>
export type UserParms = z.infer<typeof userParamsSchema>