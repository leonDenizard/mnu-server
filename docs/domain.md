# Domain — MNU (nome provisório)

## 🎯 Objetivo do Produto
O sistema existe para permitir que estabelecimentos tenham controle total sobre seus pedidos online sem depender de marketplaces.

O foco é simplicidade operacional, autonomia e estabilidade.

---

## 👤 Atores do Sistema

### Store Owner
Dono do estabelecimento.

Pode:
- gerenciar cardápio
- gerenciar as configurações do estabelecimento
- abrir/fechar loja
- receber pedidos
- alterar produtos
- editar pedidos
- cancelar pedidos

Não pode:
- acessar dados de outras lojas

---

### Customer
Cliente final que realiza pedidos.

Regras:
- não precisa criar conta
- deve conseguir pedir em menos de 1 minuto
- experiência mobile-first

---

## Entidade Central (Aggregate Root)

### Store

Toda entidade do sistema DEVE pertencer a uma Store.

Exemplos:
- Products pertencem a uma Store
- Categories pertencem a uma Store
- Orders pertencem a uma Store
- Users pertencem a uma Store


⚠️ REGRA CRÍTICA:
Nenhuma query deve acessar dados sem filtrar por `storeId`.

---

## 🍔 Cardápio

Estrutura:

Store
 └── Categories
       └── Items
            └── modifierGroups (Grupo de adicionais)
                        └── Modifier

Regras:

- Produto pode ser ativado/desativado
- Produto indisponível não aparece para o cliente ou UI trata como "grayscale"
- Categoria vazia não deve ser exibida
- Ordem de exibição deve ser configurável

Regras das Categorias.
- Uma categoria é única
- Os modifierGroups devem ter min max configurável
- As categorias precisam ter um channel pra facilitar a exibição no futuro por diferentes canais de vendas
- As categorias precisam ter um schedule de exibição mesmo que não sejam implementados no momento.
- ModifierGroups e Modifiers pertencem exclusivamente ao Product.
- O sistema permite duplicação para acelerar a configuração, evitando compartilhamento entre produtos no MVP.

---

## 🧾 Pedidos

Regras iniciais:

- Pedido só pode ser criado se a loja estiver aberta
- Pedido não pode ser vazio
- Preço do pedido deve ser congelado no momento da compra
  (mudanças futuras no produto NÃO afetam pedidos antigos)
- Somente o Owner do restaurante pode editar um pedido.
- Pedidos finalizados não podem voltar pra produção.
- Os pedidos precisam ser finalizados após 8 horas se ficarem sem movimentação
- Pedidos editados, movimentados, finalizados pelo usuário precisam guardar o id do owner ou funcionário e updateTime, para rastreabilidade

Status iniciais:

- PENDING
- ACCEPTED
- PREPARING
- READY
- CANCELED
- FINISHED

---

## 🔐 Multi-Tenant

O sistema é multi-tenant por `storeId`.

Regras obrigatórias:

- Toda tabela deve ter `storeId`
- Toda busca deve filtrar por `storeId`
- Nunca confiar em `storeId` vindo do client
- Extrair store do contexto autenticado

Falha nessa regra = vazamento de dados (erro crítico).

---

## 🚫 Não Objetivos do MVP

Para evitar escopo infinito, o sistema NÃO deve ter inicialmente:

- relatórios avançados
- CRM
- cupons
- programa de fidelidade
- split de pagamento
- integrações complexas
- chatbot
- automações

Se não ajuda a loja a vender hoje → não entra.

---

## 🧭 Princípios de Arquitetura

- Preferir simplicidade a flexibilidade prematura
- Evitar overengineering
- Controllers devem ser finos
- Services contêm regras de negócio
- Prisma é a fonte da verdade dos modelos

---

## ⚠️ Decisões Técnicas Importantes

- Preços armazenados em centavos (inteiro)
- Soft delete apenas se houver necessidade real
- Slug da loja deve ser único
- Sistema deve funcionar bem em conexões móveis lentas

---

## 💡 Filosofia do Produto

Este software prioriza:

1. Velocidade operacional
2. Facilidade de uso
3. Estabilidade
4. Autonomia do estabelecimento