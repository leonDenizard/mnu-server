import { Prisma } from "../../generated/prisma"


type ResolveOrderNumberInput = {
  storeId: string
  sequenceKey: string
  tx: Prisma.TransactionClient
}

export async function resolveOrderNumber({ storeId, sequenceKey, tx}: ResolveOrderNumberInput){

    const sequence = await tx.orderSequence.upsert({
      where: {
        storeId_sequenceKey: {
          storeId,
          sequenceKey
        }
      },
      create: {
        storeId,
        sequenceKey,
        current: 1
      },
      update: {
        current: {
          increment: 1
        }
      }
    })

    return sequence.current
}