import prisma from '../../../../database'
import { NotFoundError } from '../../../../shared/errors/app-error'
import { deleteProductById, updateProduct } from '../products.service'

jest.mock('../../../../database', () => ({
  __esModule: true,
  default: {
    product: {
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }
  }
}))

const prismaMock = prisma as unknown as {
  product: {
    findFirst: jest.Mock
    update: jest.Mock
    delete: jest.Mock
  }
}

const productInput = {
  name: 'Pizza grande',
  price: 50,
  categoryId: '10000000-0000-4000-8000-000000000001'
}

describe('product tenancy', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('does not update a product from another store', async () => {
    prismaMock.product.findFirst.mockResolvedValue(null)

    await expect(
      updateProduct({
        productId: 'product-from-store-2',
        storeId: 'store-1',
        data: productInput
      })
    ).rejects.toBeInstanceOf(NotFoundError)

    expect(prismaMock.product.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'product-from-store-2',
        storeId: 'store-1'
      }
    })
    expect(prismaMock.product.update).not.toHaveBeenCalled()
  })

  it('does not delete a product from another store', async () => {
    prismaMock.product.findFirst.mockResolvedValue(null)

    await expect(
      deleteProductById({
        productId: 'product-from-store-2',
        storeId: 'store-1'
      })
    ).rejects.toBeInstanceOf(NotFoundError)

    expect(prismaMock.product.delete).not.toHaveBeenCalled()
  })
})
