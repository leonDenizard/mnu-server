import { z } from "zod"


export const loginSchema = z.object({
    email: z.string().email("Invalid e-mail"),
    password: z.string().min(8, "Password must be at least 8 charactes long")
})

export const authUserSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
    role: z.enum(['OWNER', 'STAFF']),
    storeId: z.string().uuid()
})

export const loginResponseSchema = z.object({
    success: z.literal(true),
    data: z.object({
        accessToken: z.string(),
        tokenType: z.literal('Bearer'),
        expiresIn: z.number(),
        user: authUserSchema
    })
})

export const authErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string()
})

export type LoginInput = z.infer<typeof loginSchema>
export type AuthUser = z.infer<typeof authUserSchema>