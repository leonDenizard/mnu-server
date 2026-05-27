# API Conventions

## Organização por camadas

### Route
Responsável por:
- autenticação
- parsing de `params`, `body` e `query`
- chamar service
- devolver response no envelope padrão

### Service
Responsável por:
- regra de negócio
- validação de escopo
- acesso ao Prisma
- mapeamento de retorno

### Schema
Responsável por:
- contratos HTTP
- inferência de tipos
- validação de entrada e saída

## Regras de origem dos dados

### Params
Usados para identificar o recurso alvo.

Exemplos:
- `productId`
- `modifierGroupId`
- `slug`

### Body
Usado para payload de criação e atualização.

### Contexto autenticado
Usado para dados sensíveis de tenancy:
- `storeId`
- `sub`
- `role`

Regra:
- não confiar em `storeId` vindo do client

## Padrão de response

### Item único
```json
{
  "success": true,
  "data": {}
}
```

### Lista simples
```json
{
  "success": true,
  "data": []
}
```

### Lista paginada
```json
{
  "success": true,
  "data": [],
  "meta": {
    "total": 0,
    "page": 1,
    "lastPage": 1
  }
}
```

## Convenções de update

### Update parcial
Se um campo não vier no payload, o Prisma normalmente não deve alterar esse campo.

Regra prática:
- `undefined` significa "não alterar"
- `null` significa "tentar salvar null", quando o campo permitir

## Convenções de bulk

### Criação em lote
Quando a operação pertence a um recurso já identificado por params, o body deve carregar apenas a lista de itens.

Exemplo:
```json
{
  "data": [
    { "name": "A" },
    { "name": "B" }
  ]
}
```

### Delete em lote
Preferir shape simples:
```json
{
  "ids": ["uuid-1", "uuid-2"]
}
```

Evitar envelopes que gerem estruturas como `ids.ids`.

## Validação de escopo

### Regra obrigatória
Antes de alterar ou remover recursos filhos, validar se eles pertencem ao escopo correto.

Exemplos:
- `Product` deve pertencer à `Store`
- `ModifierGroup` deve pertencer à `Store`
- `ModifierOption` deve pertencer ao `ModifierGroup`

## Padrões úteis para Prisma

### Relação singular
Não aceita `where` dentro do `include`.

### Relação de lista
Aceita `where`, `orderBy`, `take`, `skip`.

### Update/delete com chave não única
Se o `where` não for `unique`, validar com `findFirst` e depois operar por `id`.

### Unique composta
Se existir `@@unique([a, b])`, o Prisma pode gerar um `where` composto no formato:
```ts
where: {
  a_b: {
    a,
    b
  }
}
```

## Convenções do módulo público

### Slug
Rotas públicas da loja devem usar `slug`.

### Cache
O payload público do cardápio deve ser fácil de cachear por chave derivada do slug.

Sugestão de chave:
- `public-menu:${slug}`

### Estrutura do service público
Separar:
1. função que busca do banco
2. função que mapeia o payload
3. função pública que futuramente pode aplicar cache
