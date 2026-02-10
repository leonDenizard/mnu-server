import { z } from 'zod'

const dateStringSchema = z.preprocess((value) => {
  if (value instanceof Date) {
    return value.toISOString()
  }
  return value
}, z.string().datetime())

export const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  createdAt: dateStringSchema,
  updatedAt: dateStringSchema
})

export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format')
})

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional()
})

export const userParamsSchema = z.object({
  id: z.string().uuid()
})

export const userResponseSchema = z.object({
  success: z.boolean(),
  data: userSchema
})

export const usersResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(userSchema)
})

export const deleteUserResponseSchema = z.object({
  success: z.boolean(),
  message: z.string()
})

export const errorResponseSchema = z.object({
  success: z.boolean(),
  error: z.string()
})

export type User = z.infer<typeof userSchema>
export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
