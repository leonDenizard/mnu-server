import { hash } from "bcryptjs";
import prisma from "../../database";
import { CreateUser, UserOutput } from "./users.schema";

type GetCurrentUserInput = {
    userId: string,
    storeId: string
}
type ListUsersInput = {
    storeId: string
}
type CreateUserServiceInput = CreateUser & {
    storeId: string
}

export async function getCurrentUser({ userId, storeId }: GetCurrentUserInput): Promise<UserOutput> {

    const user = await prisma.user.findFirst({
        where: {
            id: userId,
            storeId
        }
    })

    if (!user) {
        throw new Error('User not found')
    }

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
        storeId: user.storeId,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
    }
}

export async function listUsers({ storeId }: ListUsersInput): Promise<UserOutput[]> {

    const users = await prisma.user.findMany({
        where: { storeId }
    })

    return users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
        storeId: user.storeId,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
    }))
}

export async function createUser({ name, email, password, storeId }: CreateUserServiceInput): Promise<UserOutput> {

    const normalizedEmail = email.trim().toLocaleLowerCase()
    const passwordHash = await hash(password, 10)

    const newUser = await prisma.user.create({
        data: {
            name,
            email: normalizedEmail,
            passwordHash,
            role: 'STAFF',
            storeId
        }


    })

    return {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        active: newUser.active,
        storeId: newUser.storeId,
        createdAt: newUser.createdAt.toISOString(),
        updatedAt: newUser.updatedAt.toISOString()
    }
}

export async function inactivateUser({ storeId, userId }: GetCurrentUserInput) {

    const user = await prisma.user.findFirst({
        where: {
            id: userId,
            storeId
        }
    })

    if (!user) {
        throw new Error('User not found')
    }
    if (user.role === 'OWNER') {
        throw new Error('Owner cannot be inactivated')
    }

    const updatedUser = await prisma.user.update({
        where: {
            id: userId,
        },
        data: {
            active: false
        }
    })

    return {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        active: updatedUser.active,
        storeId: updatedUser.storeId,
        createdAt: updatedUser.createdAt.toISOString(),
        updatedAt: updatedUser.updatedAt.toISOString()
    }
}