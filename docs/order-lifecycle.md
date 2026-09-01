# Ciclo de vida dos pedidos

## Objetivo

O estado atual do pedido é uma informação operacional. As ações que levaram o
pedido até esse estado são registradas separadamente em `OrderStatusHistory`
para auditoria.

O banco de dados é a fonte de verdade. Interfaces Kanban, acompanhamento do
cliente e integrações não podem criar estados localmente.

## Estados válidos

- `PENDING`: aguardando aceite da loja
- `IN_PREPARATION`: aceito e em preparo
- `READY`: pronto para retirada, consumo ou entrega
- `CANCELED`: encerrado por cancelamento, rejeição ou timeout
- `FINISHED`: concluído

`CANCELED` e `FINISHED` são estados terminais. Um pedido terminal não pode ser
reaberto ou avançado.

`ACCEPTED` não é um estado. O aceite é uma ação do histórico que leva o pedido
de `PENDING` para `IN_PREPARATION`.

## Transições

```text
PENDING -- aceite manual/automático --> IN_PREPARATION --> READY --> FINISHED
   |                                      |               |
   |-- cliente cancela -------------------+---------------+--> CANCELED
   |-- loja rejeita ---------------------------------------> CANCELED
   `-- timeout de aceite ----------------------------------> CANCELED
```

Regras exatas:

| Ação | Estado anterior | Próximo estado | Ator |
| --- | --- | --- | --- |
| `ACCEPTED` | `PENDING` | `IN_PREPARATION` | `STORE_USER` |
| `AUTO_ACCEPTED` | `PENDING` | `IN_PREPARATION` | `SYSTEM` |
| `REJECTED` | `PENDING` | `CANCELED` | `STORE_USER` |
| `CUSTOMER_CANCELED` | `PENDING` | `CANCELED` | `CUSTOMER` |
| `ACCEPTANCE_TIMED_OUT` | `PENDING` | `CANCELED` | `SYSTEM` |
| `MARKED_READY` | `IN_PREPARATION` | `READY` | `STORE_USER` |
| `STORE_CANCELED` | `IN_PREPARATION` ou `READY` | `CANCELED` | `STORE_USER` |
| `FINISHED` | `READY` | `FINISHED` | `STORE_USER` |

Transições inválidas retornam `409 CONFLICT`.

## Aceite automático

Cada loja possui `autoAcceptOrders`, com padrão `false`.

Quando desativado:

1. o pedido é criado em `PENDING`;
2. `acceptanceExpiresAt` recebe o horário de criação mais cinco minutos;
3. a loja precisa aceitar ou rejeitar o pedido.

Quando ativado:

1. o histórico registra `CREATED`;
2. o histórico registra `AUTO_ACCEPTED` com ator `SYSTEM`;
3. o pedido fica imediatamente em `IN_PREPARATION`;
4. `acceptanceExpiresAt` fica vazio.

## Timeout de aceite

O prazo inicial é fixo em cinco minutos.

Um worker consulta pedidos `PENDING` vencidos a cada 15 segundos. A expiração
fica armazenada no banco, portanto reiniciar a API não perde o timeout.

A atualização usa `status` e `version` como controle otimista. Várias
instâncias podem executar o worker, mas apenas uma consegue concluir a
transição e gravar o histórico.

Ao expirar:

- status: `CANCELED`
- cancellationType: `ACCEPTANCE_TIMEOUT`
- action: `ACCEPTANCE_TIMED_OUT`
- actorType: `SYSTEM`

## Cancelamentos

O cliente só pode cancelar enquanto o pedido estiver em `PENDING`.

A loja deve:

- rejeitar um pedido `PENDING` usando motivo obrigatório;
- cancelar um pedido `IN_PREPARATION` ou `READY` usando motivo obrigatório.

Tipos de encerramento:

- `CUSTOMER_CANCELED`
- `STORE_REJECTED`
- `STORE_CANCELED`
- `ACCEPTANCE_TIMEOUT`

O motivo informado pela loja é preservado no pedido e no histórico.

## Auditoria

Cada registro de `OrderStatusHistory` contém:

- estado anterior e novo estado;
- ação executada;
- tipo do ator;
- ID do usuário da loja, quando aplicável;
- snapshot do nome do usuário;
- motivo;
- data da ação.

Tipos de ator disponíveis:

- `CUSTOMER`
- `STORE_USER`
- `SYSTEM`
- `INTEGRATION`

O usuário é opcional e usa exclusão `SET NULL`. Excluir um usuário não pode
apagar o histórico do pedido.

## Acesso simplificado do cliente

Cada pedido recebe um token aleatório de 256 bits. A API retorna o token bruto
somente na criação e armazena apenas o SHA-256 em
`publicAccessTokenHash`.

No MVP, quem possuir o token poderá acompanhar o pedido e cancelá-lo enquanto
estiver em `PENDING`. Duas pessoas com o mesmo link terão o mesmo acesso. Essa
limitação é aceita nesta fase.

Telefone e `storeId` são referências comerciais, não credenciais de acesso.

## Eventos e SSE

Toda criação ou mudança de estado grava um registro em `OrderEventOutbox` na
mesma transação do pedido e do histórico.

Eventos atuais:

- `order.created`
- `order.status.changed`

O payload contém `orderId`, `storeId`, estado, ação, versão e data. A versão
permite ao cliente ignorar eventos antigos ou duplicados.

O publicador SSE ainda será implementado. Ele deverá consumir a outbox,
publicar o evento e preencher `publishedAt`. Em reconexões, o frontend deve
consultar o estado atual via REST; o SSE sinaliza mudanças, mas não substitui o
banco como fonte de verdade.

## Endpoints operacionais

- `GET /api/orders`
- `GET /api/orders/:id`
- `PATCH /api/orders/:id/accept`
- `PATCH /api/orders/:id/ready`
- `PATCH /api/orders/:id/finish`
- `POST /api/orders/:id/reject`
- `POST /api/orders/:id/cancel`
- `POST /api/public/orders/access/:token/cancel`

Rejeição e cancelamento da loja recebem:

```json
{
  "reason": "Produto indisponível"
}
```
