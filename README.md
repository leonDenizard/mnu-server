# MNU Server

API backend para gestão de lojas, cardápio e pedidos, construída com Fastify, PostgreSQL, Prisma, Zod e TypeScript.

## Tecnologias
- TypeScript
- Fastify
- PostgreSQL
- Prisma
- Zod
- Swagger UI
- Scalar
- Docker
- tsx

## Estrutura

O projeto é organizado por módulos de domínio.

Os testes ficam em uma pasta `test/` dentro do domínio correspondente e são
executados com `pnpm test`.

Principais áreas atuais:
- `auth`
- `onboarding`
- `users`
- `stores`
- `menu`
- `public/menu`

Documentação útil:
- [docs/domain.md](./docs/domain.md)
- [docs/api-conventions.md](./docs/api-conventions.md)
- [docs/order-lifecycle.md](./docs/order-lifecycle.md)
- [docs/public-customer-module.md](./docs/public-customer-module.md)

## Instalação

### 1. Instalar dependências
```bash
pnpm install
```

### 2. Subir o PostgreSQL com Docker
```bash
docker-compose up -d
```

### 3. Configurar Prisma
```bash
pnpm db:generate
pnpm db:migrate
```

### 4. Iniciar o servidor
```bash
pnpm dev
```

## Documentação local
- Health Check: http://localhost:3000
- Swagger UI: http://localhost:3000/docs
- Scalar Reference: http://localhost:3000/reference

## Banco de dados

### Prisma Studio
```bash
pnpm db:studio
```

### Parar PostgreSQL
```bash
docker-compose down
```

### Parar e remover volumes
```bash
docker-compose down -v
```

## Variáveis de ambiente

Exemplo:

```env
DATABASE_URL="postgresql://admin:user@localhost:5432/db_name?schema=public"
PORT=3000
HOST=0.0.0.0
```

## Arquitetura

O projeto segue uma arquitetura em camadas por módulo:
- `routes` definem endpoints e contratos HTTP
- `services` concentram regras de negócio
- `schemas` definem contratos com Zod

## Scripts disponíveis
- `pnpm dev` - inicia servidor em desenvolvimento
- `pnpm build` - compila TypeScript
- `pnpm start` - inicia servidor em produção
- `pnpm db:migrate` - cria/aplica migrações
- `pnpm db:generate` - gera o Prisma Client
- `pnpm db:studio` - abre o Prisma Studio
- `pnpm test` - executa os testes
