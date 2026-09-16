import * as XLSX from 'xlsx'

import { parseAnotaAiWorkbook } from '../anota-ai-import.service.js'

const categoryHeaders = ['Id', 'Titulo', 'Adicional', 'Min', 'Max', 'Extra', 'Categoria_codigo', 'Precificacao']
const itemHeaders = ['Categoria', 'Categoria_codigo', 'Id', 'Item_codigo', 'Titulo', 'Descricao', 'Imagem', 'Preco', 'Max', 'Proximo_passo']

function makeWorkbook({ nextStep = 'extras', optionMax = 2 }: { nextStep?: string, optionMax?: number } = {}) {
  const workbook = XLSX.utils.book_new()
  const categories = XLSX.utils.aoa_to_sheet([
    categoryHeaders,
    ['source-main', 'Lanches', 'nao', null, null, 'nao', 'lanches', 'SOMATORIO'],
    ['source-group', 'Adicionais', 'sim', 0, 3, 'nao', 'extras', 'SOMATORIO']
  ])
  const items = XLSX.utils.aoa_to_sheet([
    itemHeaders,
    ['Lanches', 'lanches', 'item-main', 'burger', 'Hambúrguer', 'Pão e carne', 'https://image.test/burger.jpg', 20, 1, nextStep],
    ['Adicionais', 'extras', 'item-option', 'bacon', 'Bacon', null, 'https://image.test/bacon.jpg', 4.5, optionMax, '']
  ])
  XLSX.utils.book_append_sheet(workbook, categories, 'categorias')
  XLSX.utils.book_append_sheet(workbook, items, 'itens')
  return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }))
}

describe('parseAnotaAiWorkbook', () => {
  it('converts categories, products, modifier groups and links without retaining source ids', () => {
    const parsed = parseAnotaAiWorkbook(makeWorkbook())

    expect(parsed.categories).toEqual([
      expect.objectContaining({ sourceCode: 'lanches', title: 'Lanches', isModifierGroup: false }),
      expect.objectContaining({ sourceCode: 'extras', title: 'Adicionais', isModifierGroup: true, minSelections: 0, maxSelections: 3 })
    ])
    expect(parsed.items).toEqual([
      expect.objectContaining({ name: 'Hambúrguer', price: 20, nextStepCodes: ['extras'] }),
      expect.objectContaining({ name: 'Bacon', price: 4.5, maxQuantity: 2, nextStepCodes: [] })
    ])
    expect(parsed.contentHash).toHaveLength(64)
  })

  it('rejects links to a missing modifier group', () => {
    expect(() => parseAnotaAiWorkbook(makeWorkbook({ nextStep: 'missing-group' })))
      .toThrow('Unknown or non-modifier Proximo_passo: missing-group')
  })

  it('converts Anota AI unlimited option quantities to null', () => {
    const parsed = parseAnotaAiWorkbook(makeWorkbook({ optionMax: -1 }))

    expect(parsed.items[1].maxQuantity).toBeNull()
  })
})
