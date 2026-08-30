import prisma from '../../../../../database'
import { NotFoundError } from '../../../../../shared/errors/app-error'
import { updateBulkModifierOptions } from '../modifierOptions.service'

jest.mock('../../../../../database', () => ({
  __esModule: true,
  default: {
    modifierGroup: {
      findFirst: jest.fn()
    },
    modifierOption: {
      findMany: jest.fn(),
      update: jest.fn()
    },
    $transaction: jest.fn()
  }
}))

const prismaMock = prisma as unknown as {
  modifierGroup: {
    findFirst: jest.Mock
  }
  modifierOption: {
    findMany: jest.Mock
    update: jest.Mock
  }
  $transaction: jest.Mock
}

describe('modifier option tenancy', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('does not update options through a modifier group from another store', async () => {
    prismaMock.modifierGroup.findFirst.mockResolvedValue(null)

    await expect(
      updateBulkModifierOptions({
        storeId: 'store-1',
        modifierGroupId: 'group-from-store-2',
        data: [{ id: 'option-from-store-2', name: 'Bacon' }]
      })
    ).rejects.toBeInstanceOf(NotFoundError)

    expect(prismaMock.modifierGroup.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'group-from-store-2',
        storeId: 'store-1'
      }
    })
    expect(prismaMock.modifierOption.findMany).not.toHaveBeenCalled()
    expect(prismaMock.$transaction).not.toHaveBeenCalled()
  })
})
