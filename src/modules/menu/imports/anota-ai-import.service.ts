import { createHash } from 'node:crypto'

import * as XLSX from 'xlsx'

import prisma from '../../../database.js'
import { BadRequestError, ConflictError } from '../../../shared/errors/app-error.js'

const PROVIDER = 'ANOTA_AI'
const CATEGORY_SHEET = 'categorias'
const ITEM_SHEET = 'itens'
const CATEGORY_HEADERS = ['Id', 'Titulo', 'Adicional', 'Min', 'Max', 'Extra', 'Categoria_codigo', 'Precificacao']
const ITEM_HEADERS = ['Categoria', 'Categoria_codigo', 'Id', 'Item_codigo', 'Titulo', 'Descricao', 'Imagem', 'Preco', 'Max', 'Proximo_passo']

type SourceCategory = {
  sourceCode: string
  title: string
  isModifierGroup: boolean
  minSelections: number
  maxSelections: number
  displayOrder: number
}

type SourceItem = {
  categoryCode: string
  name: string
  description: string | null
  image: string | null
  price: number
  maxQuantity: number | null
  nextStepCodes: string[]
  displayOrder: number
}

export type ParsedAnotaAiMenu = {
  categories: SourceCategory[]
  items: SourceItem[]
  contentHash: string
}

type ImportResult = {
  categories: number
  products: number
  modifierGroups: number
  modifierOptions: number
  productModifierGroups: number
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim()
}

function requiredText(value: unknown, field: string, row: number, sheet: string) {
  const result = text(value)
  if (!result) throw new BadRequestError(`Missing ${field} in ${sheet} row ${row}`)
  return result
}

function nonNegativeNumber(value: unknown, field: string, row: number, sheet: string) {
  const parsed = typeof value === 'number' ? value : Number(text(value))
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new BadRequestError(`Invalid ${field} in ${sheet} row ${row}`)
  }
  return parsed
}

function positiveInteger(value: unknown, field: string, row: number, sheet: string) {
  const parsed = nonNegativeNumber(value, field, row, sheet)
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new BadRequestError(`Invalid ${field} in ${sheet} row ${row}`)
  }
  return parsed
}

function optionMaxQuantity(value: unknown, row: number) {
  const raw = text(value)
  if (!raw) return null

  const parsed = Number(raw)
  if (!Number.isInteger(parsed) || parsed < -1) {
    throw new BadRequestError(`Invalid Max in itens row ${row}`)
  }

  // Anota AI exports -1 as an unlimited option quantity.
  return parsed > 0 ? parsed : null
}

function assertHeaders(actual: unknown[], expected: string[], sheet: string) {
  const normalized = actual.map(text)
  if (expected.some((header, index) => normalized[index] !== header)) {
    throw new BadRequestError(`Invalid columns in ${sheet} sheet`)
  }
}

function getRows(workbook: XLSX.WorkBook, sheetName: string, expectedHeaders: string[]) {
  const sheet = workbook.Sheets[sheetName]
  if (!sheet) throw new BadRequestError(`Missing ${sheetName} sheet`)

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null, raw: true })
  if (rows.length < 2) throw new BadRequestError(`${sheetName} sheet has no data`)
  assertHeaders(rows[0], expectedHeaders, sheetName)

  return rows.slice(1).filter((row) => row.some((value) => text(value) !== ''))
}

function createContentHash(categories: SourceCategory[], items: SourceItem[]) {
  const canonical = JSON.stringify({
    categories: [...categories].sort((a, b) => a.sourceCode.localeCompare(b.sourceCode)),
    items: [...items].sort((a, b) => `${a.categoryCode}:${a.displayOrder}`.localeCompare(`${b.categoryCode}:${b.displayOrder}`))
  })

  return createHash('sha256').update(canonical).digest('hex')
}

export function parseAnotaAiWorkbook(buffer: Buffer): ParsedAnotaAiMenu {
  let workbook: XLSX.WorkBook
  try {
    workbook = XLSX.read(buffer, { type: 'buffer' })
  } catch {
    throw new BadRequestError('Unable to read XLSX file')
  }

  const categoryRows = getRows(workbook, CATEGORY_SHEET, CATEGORY_HEADERS)
  const itemRows = getRows(workbook, ITEM_SHEET, ITEM_HEADERS)
  const categoryCodes = new Set<string>()

  const categories = categoryRows.map((row, index) => {
    const rowNumber = index + 2
    const sourceCode = requiredText(row[6], 'Categoria_codigo', rowNumber, CATEGORY_SHEET)
    if (categoryCodes.has(sourceCode)) throw new BadRequestError(`Duplicate Categoria_codigo in categorias row ${rowNumber}`)
    categoryCodes.add(sourceCode)

    const isModifierGroup = requiredText(row[2], 'Adicional', rowNumber, CATEGORY_SHEET).toLowerCase() === 'sim'
    const minSelections = isModifierGroup ? nonNegativeNumber(row[3], 'Min', rowNumber, CATEGORY_SHEET) : 0
    const maxSelections = isModifierGroup ? positiveInteger(row[4], 'Max', rowNumber, CATEGORY_SHEET) : 1

    if (minSelections > maxSelections) {
      throw new BadRequestError(`Min cannot be greater than Max in categorias row ${rowNumber}`)
    }

    return {
      sourceCode,
      title: requiredText(row[1], 'Titulo', rowNumber, CATEGORY_SHEET),
      isModifierGroup,
      minSelections,
      maxSelections,
      displayOrder: index
    }
  })

  const categoryByCode = new Map(categories.map((category) => [category.sourceCode, category]))
  const items = itemRows.map((row, index) => {
    const rowNumber = index + 2
    const categoryCode = requiredText(row[1], 'Categoria_codigo', rowNumber, ITEM_SHEET)
    if (!categoryByCode.has(categoryCode)) {
      throw new BadRequestError(`Unknown Categoria_codigo in itens row ${rowNumber}`)
    }

    const category = categoryByCode.get(categoryCode)!
    const nextStepCodes = text(row[9]).split(',').map((code) => code.trim()).filter(Boolean)

    if (category.isModifierGroup && nextStepCodes.length > 0) {
      throw new BadRequestError(`Modifier option cannot have Proximo_passo in itens row ${rowNumber}`)
    }

    return {
      categoryCode,
      name: requiredText(row[4], 'Titulo', rowNumber, ITEM_SHEET),
      description: text(row[5]) || null,
      image: text(row[6]) || null,
      price: nonNegativeNumber(row[7], 'Preco', rowNumber, ITEM_SHEET),
      maxQuantity: category.isModifierGroup ? optionMaxQuantity(row[8], rowNumber) : null,
      nextStepCodes,
      displayOrder: index
    }
  })

  const modifierCodes = new Set(categories.filter((category) => category.isModifierGroup).map((category) => category.sourceCode))
  for (const item of items) {
    for (const nextStepCode of item.nextStepCodes) {
      if (!modifierCodes.has(nextStepCode)) {
        throw new BadRequestError(`Unknown or non-modifier Proximo_passo: ${nextStepCode}`)
      }
    }
  }

  return { categories, items, contentHash: createContentHash(categories, items) }
}

export async function importAnotaAiMenu(storeId: string, file: Buffer): Promise<ImportResult> {
  const parsed = parseAnotaAiWorkbook(file)
  const primaryCategories = parsed.categories.filter((category) => !category.isModifierGroup)
  const modifierGroups = parsed.categories.filter((category) => category.isModifierGroup)

  try {
    return await prisma.$transaction(async (tx) => {
      const priorImport = await tx.menuImport.findUnique({
        where: { storeId_provider_contentHash: { storeId, provider: PROVIDER, contentHash: parsed.contentHash } }
      })
      if (priorImport) throw new ConflictError('This menu file was already imported for this store')

      const duplicateCategories = await tx.category.findMany({
        where: { storeId, title: { in: primaryCategories.map((category) => category.title) } },
        select: { title: true }
      })
      if (duplicateCategories.length > 0) {
        throw new ConflictError('A category from this import already exists in the store', {
          categories: duplicateCategories.map((category) => category.title)
        })
      }

      const categoryIdBySourceCode = new Map<string, string>()
      const modifierGroupIdBySourceCode = new Map<string, string>()

      for (const category of primaryCategories) {
        const created = await tx.category.create({
          data: {
            storeId,
            title: category.title,
            active: true,
            displayOrder: category.displayOrder,
            showInMenu: true,
            showInPos: false,
            showInWaiter: false
          }
        })
        categoryIdBySourceCode.set(category.sourceCode, created.id)
      }

      for (const group of modifierGroups) {
        const suffix = `${parsed.contentHash.slice(0, 8)}-${group.displayOrder}`
        const created = await tx.modifierGroup.create({
          data: {
            storeId,
            name: group.title,
            surname: `import-${suffix}`,
            minSelections: group.minSelections,
            maxSelections: group.maxSelections,
            required: group.minSelections > 0,
            active: true,
            displayOrder: group.displayOrder
          }
        })
        modifierGroupIdBySourceCode.set(group.sourceCode, created.id)
      }

      const productIdByItemIndex = new Map<number, string>()
      let productCount = 0
      let optionCount = 0

      for (const [itemIndex, item] of parsed.items.entries()) {
        const sourceCategory = parsed.categories.find((category) => category.sourceCode === item.categoryCode)!
        if (sourceCategory.isModifierGroup) {
          await tx.modifierOption.create({
            data: {
              modifierGroupId: modifierGroupIdBySourceCode.get(item.categoryCode)!,
              name: item.name,
              description: item.description,
              image: item.image,
              price: item.price,
              maxQuantity: item.maxQuantity,
              displayOrder: item.displayOrder
            }
          })
          optionCount += 1
          continue
        }

        const product = await tx.product.create({
          data: {
            storeId,
            categoryId: categoryIdBySourceCode.get(item.categoryCode)!,
            name: item.name,
            description: item.description,
            image: item.image,
            price: item.price,
            active: true,
            displayOrder: item.displayOrder
          }
        })
        productIdByItemIndex.set(itemIndex, product.id)
        productCount += 1
      }

      let productModifierGroups = 0
      for (const [itemIndex, item] of parsed.items.entries()) {
        const productId = productIdByItemIndex.get(itemIndex)
        if (!productId) continue

        for (const modifierCode of item.nextStepCodes) {
          await tx.productModifierGroup.create({
            data: { productId, modifierGroupId: modifierGroupIdBySourceCode.get(modifierCode)! }
          })
          productModifierGroups += 1
        }
      }

      await tx.menuImport.create({
        data: {
          storeId,
          provider: PROVIDER,
          contentHash: parsed.contentHash,
          categoryCount: primaryCategories.length,
          productCount,
          groupCount: modifierGroups.length,
          optionCount
        }
      })

      return {
        categories: primaryCategories.length,
        products: productCount,
        modifierGroups: modifierGroups.length,
        modifierOptions: optionCount,
        productModifierGroups
      }
    })
  } catch (error) {
    if (error instanceof ConflictError) throw error
    throw error
  }
}
