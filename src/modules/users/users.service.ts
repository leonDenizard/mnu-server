import prisma from "../../database";
import { UserOutput } from "./users.schema";

type GetCurrentUserInput = {
    userId: string,
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