import prisma from '../../../database'
import { NotFoundError } from '../../../shared/errors/app-error'
import { deleteHourById } from '../stores.service'

jest.mock('../../../database', () => ({
  __esModule: true,
  default: {
    storeOperatingHour: {
      findFirst: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn()
    }
  }
}))

const prismaMock = prisma as unknown as {
  storeOperatingHour: {
    findFirst: jest.Mock
    delete: jest.Mock
    findMany: jest.Mock
  }
}

describe('store operating hour tenancy', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('does not delete an operating hour from another store', async () => {
    prismaMock.storeOperatingHour.findFirst.mockResolvedValue(null)

    await expect(
      deleteHourById({ id: 'hour-from-store-2', storeId: 'store-1' })
    ).rejects.toBeInstanceOf(NotFoundError)

    expect(prismaMock.storeOperatingHour.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'hour-from-store-2',
        storeId: 'store-1'
      }
    })
    expect(prismaMock.storeOperatingHour.delete).not.toHaveBeenCalled()
  })
})
