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

## Instalação

### 1. Instalar dependências
```bash
npm install
```

### 2. Subir o PostgreSQL com Docker
```bash
docker-compose up -d
```

### 3. Configurar Prisma
```bash
npm run db:generate
npm run db:migrate
```

### 4. Iniciar o servidor
```bash
npm run dev
```

## Documentação local
- Health Check: http://localhost:3000
- Swagger UI: http://localhost:3000/docs
- Scalar Reference: http://localhost:3000/reference

## Banco de dados

### Prisma Studio
```bash
npm run db:studio
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
- `npm run dev` - inicia servidor em desenvolvimento
- `npm run build` - compila TypeScript
- `npm start` - inicia servidor em produção
- `npm run db:migrate` - cria/aplica migrações
- `npm run db:generate` - gera o Prisma Client
- `npm run db:studio` - abre o Prisma Studio
- `npm test` - executa os testes
