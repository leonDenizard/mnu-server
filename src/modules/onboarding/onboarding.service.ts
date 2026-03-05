import { hash } from "bcryptjs"
import { generateSlug } from "../../utils/slug"
import prisma from "../../database"
import { Prisma } from "@prisma/client"
import type { OnboardingInput } from './onboarding.schema'

async function generateUniqueSlug(baseSlug: string){
    let slug = baseSlug
    let counter = 1

    while(true){
        const existing = await prisma.store.findUnique({
            where: {slug}
        })

        if(!existing) break

        slug = `${baseSlug}-${counter}`
        counter ++
    }

    return slug
}


export async function onboardingService(data: OnboardingInput){

   const {
    storeName,
    ownerName,
    ownerEmail,
    ownerPassword,
    document,
    documentType,
    legalName
  } = data

  const baseSlug = generateSlug(storeName)
  const passwordHash = await hash(ownerPassword, 10) 
  const slug = await generateUniqueSlug(baseSlug)

  try {
    const operation = await prisma.$transaction(async (tx) => {
        const store = await tx.store.create({
            data: {
                name: storeName,
                slug,
                document,
                documentType,
                legalName
            }
        })

        const user = await tx.user.create({
            data: {
                name: ownerName,
                email: ownerEmail,
                passwordHash,
                role: "OWNER",
                storeId: store.id
            }
        })

        return {store, user}
    })

    return{
        store: operation.store,
        user: {
            id: operation.user.id,
            name: operation.user.name,
            email: operation.user.email,
            role: operation.user.role
        }
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        throw new Error("Conflito de dados únicos")
      }
    }

    throw error
  }

}