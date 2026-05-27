# Domain - MNU

## Objetivo do produto
O sistema existe para permitir que estabelecimentos gerenciem pedidos e cardápio com autonomia, sem depender de marketplaces como canal principal.

O foco do MVP é:
- operação simples
- estabilidade
- cardápio configurável
- fluxo rápido para o cliente final

## Atores principais

### Owner
Usuário administrador da loja.

Pode:
- configurar loja
- gerenciar usuários
- gerenciar cardápio
- abrir e fechar loja
- configurar adicionais

### Staff
Usuário operacional da loja.

Pode:
- acessar recursos permitidos pela loja
- operar funcionalidades do dia a dia conforme regras futuras de permissão

### Customer
Cliente final.

Regras:
- não precisa autenticação no MVP
- acessa cardápio público por slug da loja
- deve conseguir montar pedido com poucos passos

## Regra central de tenancy
O sistema é multi-tenant por loja.

Regra obrigatória:
- o client nunca informa `storeId` em rotas administrativas
- o `storeId` vem do contexto autenticado
- toda operação administrativa deve validar o escopo da loja

Observação:
- nem toda tabela precisa ter `storeId` físico no banco
- se uma entidade pertence indiretamente à loja por relacionamento, a validação ainda é obrigatória

Exemplo:
- `ModifierOption` não tem `storeId`, mas pertence a `ModifierGroup`, que pertence à `Store`

## Autenticação

### JWT
O token carrega apenas o contexto mínimo:
- `sub`
- `storeId`
- `role`

### Regras
- `request.user.storeId` é a fonte de verdade da loja autenticada
- `request.user.sub` identifica o usuário autenticado

## Loja

### Conceito
`Store` representa a loja/estabelecimento.

Hoje a loja concentra:
- identidade
- contato
- endereço
- modos de atendimento
- status operacional

### Estado operacional
No estado atual do projeto:
- `isOpen` representa se a loja está aberta
- horários de funcionamento existem como agenda de referência

## Horários de funcionamento

### Modelagem
`StoreOperatingHour` guarda intervalos por dia da semana.

Cada linha representa:
- uma loja
- um dia da semana
- um intervalo de funcionamento

Isso permite:
- múltiplos períodos por dia
- almoço e jantar separados

## Cardápio administrativo

### Category
Categoria pertence à loja.

Regras atuais:
- `title` único por loja
- `displayOrder` controla ordem visual
- `showInMenu`, `showInPos` e `showInWaiter` definem visibilidade por canal

### Product
Produto pertence à loja e a uma categoria.

Regras atuais:
- produto pode estar ativo ou inativo
- ordenação por `displayOrder`
- preço promocional é opcional

### ModifierGroup
Grupo de adicionais pertence à loja, não ao produto.

Decisão importante:
- grupos são reutilizáveis entre produtos da mesma loja

Regras atuais:
- `surname` é identificador interno opcional
- se já existir grupo com mesmo `name` na loja, `surname` passa a ser necessário
- `required`, `minSelections` e `maxSelections` governam a regra de seleção

### ModifierOption
Opção pertence a um `ModifierGroup`.

Regras atuais:
- preço padrão pode ser zero
- opção pode ter `maxQuantity`
- criação, update e delete podem acontecer em lote

### ProductModifierGroup
Tabela de associação entre produto e grupo de adicional.

Regras atuais:
- um grupo pode ser reutilizado em vários produtos
- o mesmo grupo não pode ser vinculado duas vezes ao mesmo produto
- isso é garantido por `@@unique([productId, modifierGroupId])`

## Cardápio público

### Identificação
O cardápio público é acessado por `slug` da loja.

### Regra de exposição
O payload público deve expor apenas o necessário para montagem do pedido.

Em geral, o cardápio público inclui:
- dados básicos da loja
- categorias visíveis
- produtos ativos
- grupos ativos vinculados ao produto
- opções ativas do grupo

## Convenções de modelagem da API

### Admin
- schemas administrativos podem conter mais dados de gestão
- `storeId` nunca vem do body do client

### Public
- schemas públicos devem ser mais enxutos
- evitar expor campos administrativos quando a própria filtragem já garante o estado

## Princípios atuais de implementação
- routes finas
- services concentram regras de negócio
- Zod define contratos HTTP
- Prisma é a fonte de verdade da modelagem
- preferir simplicidade antes de abstrações mais pesadas

## Próximo domínio natural
Pedidos públicos e operacionais:
- criação de pedido
- snapshot de preço
- validação de loja aberta
- histórico do cliente em módulo público separado
