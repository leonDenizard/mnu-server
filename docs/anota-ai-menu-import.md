# Importação de cardápio Anota AI

## Objetivo

Importar um arquivo `.xlsx` exportado da Anota AI para a loja autenticada, criando somente identificadores internos do MNU.

## Endpoint

`POST /api/menu/imports/anota-ai`

Requer JWT de uma loja e um corpo `multipart/form-data` com o arquivo no campo `file`.

```bash
curl -X POST http://localhost:3000/api/menu/imports/anota-ai \
  -H "Authorization: Bearer <token>" \
  -F "file=@Cardapio.xlsx"
```

O limite do arquivo é 5 MB. Apenas arquivos `.xlsx` são aceitos.

## Mapeamento

| Planilha | MNU |
| --- | --- |
| Categoria com `Adicional = nao` | Categoria e produtos |
| Categoria com `Adicional = sim` | Grupo de adicionais e opções |
| `Min` e `Max` da categoria adicional | `minSelections` e `maxSelections` |
| `Proximo_passo` de um produto | Vínculo produto × grupo de adicionais |
| `Preco` | Preço do produto ou opção |
| `Imagem` | URL externa salva no campo `image` |

Os campos `Id`, `Item_codigo` e `Categoria_codigo` da Anota AI não são persistidos. Eles existem apenas durante o processamento do arquivo para montar os vínculos corretamente.

## Regras

- A importação apenas adiciona dados; não edita nem remove cardápios existentes.
- Se uma categoria principal do arquivo já existir na loja, a operação falha sem gravar nada.
- A mesma estrutura de planilha não pode ser importada duas vezes para a mesma loja. O bloqueio usa um hash interno do conteúdo, sem armazenar IDs externos.
- Grupos de adicionais sem vínculo com produtos também são importados.
- A criação de categorias, produtos, grupos, opções, vínculos e registro de importação ocorre em uma única transação. Em caso de erro, nada é salvo.
