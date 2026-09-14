import { hash } from "bcryptjs"
import { generateSlug } from "../../utils/slug"
import prisma from "../../database"
import { Prisma } from "../../../generated/prisma/index.js"
import type { OnboardingInput } from './onboarding.schema'
import type { AuthUser } from '../auth/auth.schema'
import { ConflictError } from '../../shared/errors/app-error'
import { createOnboardingHandoffCode } from '../auth/auth-handoff.service.js'

type OnboardingServiceResult = {
    store: {
        id: string
        name: string
        slug: string
    }
    user: AuthUser
}

type OnboardingWebServiceResult = OnboardingServiceResult & {
  handoff: {
    handoffCode: string
    expiresIn: number
  }
}

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


export async function onboardingService(data: OnboardingInput): Promise<OnboardingServiceResult> {

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
                email: ownerEmail.trim().toLowerCase(),
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
            role: operation.user.role,
            storeId: operation.user.storeId,
            slug: operation.store.slug,
            storeName: operation.store.name
        }
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        throw new ConflictError("Conflito de dados únicos")
      }
    }

    throw error
  }

}

/**
 * Creates the store, owner and one-time handoff code in one database transaction.
 * If issuing the handoff code fails, the store and owner are rolled back as well.
 */
export async function onboardingWebService(data: OnboardingInput): Promise<OnboardingWebServiceResult> {
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
    return await prisma.$transaction(async (tx) => {
      const store = await tx.store.create({
        data: { name: storeName, slug, document, documentType, legalName }
      })

      const user = await tx.user.create({
        data: {
          name: ownerName,
          email: ownerEmail.trim().toLowerCase(),
          passwordHash,
          role: 'OWNER',
          storeId: store.id
        }
      })

      const handoff = await createOnboardingHandoffCode(user.id, tx)

      return {
        store: { id: store.id, name: store.name, slug: store.slug },
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          storeId: user.storeId,
          slug: store.slug,
          storeName: store.name
        },
        handoff
      }
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictError('Conflito de dados únicos')
    }

    throw error
  }
}
