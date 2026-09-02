# Módulo de cliente público

Este documento define as regras de negócio do acesso público ao cardápio e aos pedidos. Ele é a referência para alterações futuras no backend e no frontend.

## Objetivo do MVP

Permitir que uma pessoa faça pedidos pelo cardápio público de uma loja e acompanhe seu histórico sem cadastro, senha ou código por SMS.

A identidade comercial do cliente é o par `storeId + telefone normalizado`. Telefone é uma conveniência do MVP, não uma credencial forte. Portanto, alguém que conheça o telefone pode consultar o histórico público daquela loja. O frontend deve explicar isso de forma clara ao cliente.

## URLs públicas

O frontend resolve a loja pelo subdomínio `nomedaloja.mnu.com.br`. `nomedaloja` corresponde ao `Store.slug`; o `storeId` é interno e não deve ser exposto em URL pública.

Cada link pessoal tem o formato `nomedaloja.mnu.com.br/:shortId`. O `shortId` é opaco, aleatório, não sequencial e persistente até uma invalidação manual. Neste MVP ele é armazenado em texto simples para que futuras automações de WhatsApp possam recuperar e enviar o mesmo link.

## Cliente e links pessoais

### Criação e reutilização

Ao criar um pedido público, a API normaliza o telefone para apenas dígitos (entre 10 e 15) e cria ou reutiliza um `Customer` com a chave única `(storeId, phoneNormalized)`. O nome é atualizado com o valor mais recente informado.

### Emissão de link

O primeiro pedido público cria um `shortId`; os próximos reutilizam o mesmo valor. O frontend e uma futura automação de WhatsApp podem montar o link pessoal diretamente a partir dele.

### Invalidação manual

A loja pode invalidar todos os links ativos de um cliente pelo telefone. A operação revoga os links existentes e cria um novo `shortId` para a loja enviar.

Não há invalidação automática por IP ou dispositivo. Troca de celular, rede móvel e Wi-Fi são situações normais e não devem bloquear o cliente.

## Auditoria de acesso

Ao abrir um link pessoal, a API grava em `CustomerAccessLog`:

- IP recebido pela API;
- User-Agent;
- hash de `X-Device-Id`, quando o frontend enviar esse cabeçalho;
- data do acesso.

O frontend deve criar um identificador aleatório por navegador/dispositivo e guardá-lo localmente. Ele não deve usar fingerprinting invasivo.

Esses dados servem para investigação de link compartilhado, não para comprovar identidade. Em produção, o proxy deve encaminhar o IP real e a retenção desses dados precisa ser definida na política de privacidade/LGPD.

## Privacidade do histórico por telefone

O histórico consultado pelo telefone é sempre limitado à loja do `slug` informado. A resposta pública **não inclui** número do endereço, complemento, CEP ou endereço completo.

Quando houver entrega, a consulta pelo telefone devolve somente um rótulo resumido: rua truncada, bairro e cidade. Pelo link pessoal, os endereços completos salvos podem ser carregados para pré-preencher o checkout.

Um cliente pode ter vários `CustomerAddress`. O endereço de cada pedido continua sendo um snapshot independente; alterações nos endereços salvos não modificam pedidos antigos.

## Pedidos públicos

O pedido feito pelo cardápio público usa a mesma validação de produtos, opcionais, preços, taxa de entrega, loja aberta e tipos de atendimento dos pedidos internos.

Ele também entra na mesma máquina de estados:

```text
PENDING -> IN_PREPARATION -> READY -> FINISHED
                   \-> CANCELED
PENDING ------------> CANCELED
```

Pedidos criados publicamente registram a ação `CREATED` com ator `CUSTOMER` e publicam `order.created` na outbox. Assim, o kanban da loja recebe o novo pedido pelo SSE da mesma forma que recebe qualquer mudança de estado.

As regras de aceite, timeout de cinco minutos, cancelamento, rejeição e histórico detalhado continuam definidas em [order-lifecycle.md](./order-lifecycle.md).

## Contratos HTTP

| Objetivo | Método e rota | Autenticação |
| --- | --- | --- |
| Carregar cardápio | `GET /api/public/menu/:slug` | Pública |
| Criar pedido público | `POST /api/public/menu/:slug/orders` | Pública |
| Consultar histórico por telefone | `POST /api/public/menu/:slug/customers/orders` | Pública |
| Abrir link pessoal e registrar auditoria | `GET /api/public/menu/:slug/customers/access/:shortId` | Pública |
| Cancelar pedido pendente por telefone | `POST /api/public/menu/:slug/customers/orders/:orderId/cancel` | Pública |
| Cancelar pedido pendente por link pessoal | `POST /api/public/menu/:slug/customers/access/:shortId/orders/:orderId/cancel` | Pública |
| Invalidar links e gerar outro | `POST /api/stores/me/customers/access-links/invalidate` | JWT da loja |

### Criação pública de pedido

O payload é o mesmo contrato de pedido, com `customerName` e `customerPhone` obrigatórios. A resposta contém:

```json
{
  "success": true,
  "data": {
    "orderId": "uuid",
    "orderNumber": 12,
    "status": "PENDING",
    "customerShortId": "valor-para-montar-o-link",
    "customerAccessToken": "token-de-acesso-do-pedido"
  }
}
```

`customerShortId` dá acesso ao histórico e aos endereços salvos do cliente. O cancelamento público principal usa telefone ou `shortId`, sempre limitado a pedidos daquele cliente em `PENDING`.

### Invalidação de link pela loja

```http
POST /api/stores/me/customers/access-links/invalidate
Authorization: Bearer <token-da-loja>
Content-Type: application/json

{ "phone": "11999999999" }
```

A resposta contém um novo `shortId`. O frontend administrativo deve montar a URL da loja antes de enviá-la pelo WhatsApp.

## Fora de escopo por enquanto

- autenticação por OTP/SMS/WhatsApp;
- conta, senha ou sessão de cliente;
- detecção automática e bloqueio por dispositivo/IP;
- cadastro global do cliente entre lojas;
- envio automático de WhatsApp;
- acesso público ao endereço completo ou ao histórico interno de auditoria.

Essas escolhas são intencionais para manter o MVP simples. Ao adicionar uma credencial forte, o acesso por telefone deve deixar de ser suficiente para consultar o histórico.
