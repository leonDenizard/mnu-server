import prisma from '../../../../database'
import { ConflictError, NotFoundError } from '../../../../shared/errors/app-error'
import { deleteCategoryByID, updateCategory } from '../categories.service'

jest.mock('../../../../database', () => ({
  __esModule: true,
  default: {
    category: {
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }
  }
}))

const prismaMock = prisma as unknown as {
  category: {
    findFirst: jest.Mock
    update: jest.Mock
    delete: jest.Mock
  }
}

const baseDate = new Date('2026-08-30T12:00:00.000Z')
const category = {
  id: 'category-1',
  storeId: 'store-1',
  title: 'Pizzas',
  active: true,
  displayOrder: 0,
  showInMenu: true,
  showInPos: false,
  showInWaiter: false,
  createdAt: baseDate,
  updatedAt: baseDate
}

const updateData = {
  title: 'Pizzas',
  active: true,
  displayOrder: 0,
  showInMenu: true,
  showInPos: false,
  showInWaiter: false
}

describe('category tenancy', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('does not update a category from another store', async () => {
    prismaMock.category.findFirst.mockResolvedValue(null)

    await expect(
      updateCategory({ id: category.id, storeId: 'store-2', data: updateData })
    ).rejects.toBeInstanceOf(NotFoundError)

    expect(prismaMock.category.findFirst).toHaveBeenCalledWith({
      where: { id: category.id, storeId: 'store-2' }
    })
    expect(prismaMock.category.update).not.toHaveBeenCalled()
  })

  it('allows keeping the current title when updating a category', async () => {
    prismaMock.category.findFirst
      .mockResolvedValueOnce(category)
      .mockResolvedValueOnce(null)
    prismaMock.category.update.mockResolvedValue(category)

    await updateCategory({ id: category.id, storeId: category.storeId, data: updateData })

    expect(prismaMock.category.findFirst).toHaveBeenNthCalledWith(2, {
      where: {
        storeId: category.storeId,
        title: category.title,
        id: { not: category.id }
      }
    })
    expect(prismaMock.category.update).toHaveBeenCalledWith({
      where: { id: category.id, storeId: category.storeId },
      data: updateData
    })
  })

  it('rejects a title already used by another category in the same store', async () => {
    prismaMock.category.findFirst
      .mockResolvedValueOnce(category)
      .mockResolvedValueOnce({ ...category, id: 'category-2' })

    await expect(
      updateCategory({ id: category.id, storeId: category.storeId, data: updateData })
    ).rejects.toBeInstanceOf(ConflictError)

    expect(prismaMock.category.update).not.toHaveBeenCalled()
  })

  it('does not delete a category from another store', async () => {
    prismaMock.category.findFirst.mockResolvedValue(null)

    await expect(
      deleteCategoryByID({ id: category.id, storeId: 'store-2' })
    ).rejects.toBeInstanceOf(NotFoundError)

    expect(prismaMock.category.findFirst).toHaveBeenCalledWith({
      where: { id: category.id, storeId: 'store-2' }
    })
    expect(prismaMock.category.delete).not.toHaveBeenCalled()
  })

  it('scopes category deletion to the authenticated store', async () => {
    prismaMock.category.findFirst.mockResolvedValue(category)
    prismaMock.category.delete.mockResolvedValue(category)

    await deleteCategoryByID({ id: category.id, storeId: category.storeId })

    expect(prismaMock.category.delete).toHaveBeenCalledWith({
      where: { id: category.id, storeId: category.storeId }
    })
  })
})
