import { z } from "zod"


export const loginSchema = z.object({
    email: z.string().email("Invalid e-mail"),
    password: z.string().min(6, "Password must be at least 6 charactes long")
})

export const authUserSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
    role: z.enum(['OWNER', 'STAFF']),
    storeId: z.string().uuid(),
    slug: z.string(),
    storeName: z.string()
})

export const jwtPayloadSchema = z.object({
  sub: z.string().uuid(),
  storeId: z.string().uuid(),
  role: z.enum(['OWNER', 'STAFF'])
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

export type LoginResult = {
  user: AuthUser
}

export type JwtPayload = z.infer<typeof jwtPayloadSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type AuthUser = z.infer<typeof authUserSchema>
export type TokenUser = Pick<AuthUser, 'id' | 'storeId' | 'role'>