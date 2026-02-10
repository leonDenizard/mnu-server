# MNU Server

API Server construída com Fastify, PostgreSQL, Prisma 7, Zod e TypeScript, com documentação Swagger e Scalar.

## 🚀 Tecnologias

- **TypeScript** - Superset JavaScript com tipagem estática
- **Fastify** - Framework web rápido e eficiente
- **PostgreSQL** - Banco de dados relacional
- **Prisma 7** - ORM moderno para Node.js e TypeScript
- **Zod** - Validação de schemas TypeScript-first
- **Swagger UI** - Documentação interativa da API
- **Scalar** - Documentação alternativa moderna da API
- **Docker** - Containerização do PostgreSQL
- **tsx** - Executor TypeScript para desenvolvimento

## 📁 Estrutura do Projeto

```
├── docs
│   └── domain.md
├── prisma
│   └── schema.prisma
├── src
│   ├── modules
│   │   ├── health
│   │   │   ├── health.routes.ts
│   │   │   └── health.schema.ts
│   │   └── domain
│   │       ├── domain.controller.ts
│   │       ├── domain.routes.ts
│   │       ├── domain.schema.ts
│   │       └── domain.service.ts
│   ├── database.ts
│   └── server.ts
├── .gitignore
├── README.md
├── docker-compose.yml
├── package-lock.json
├── package.json
├── prisma.config.ts
└── tsconfig.json
```ckage.json
```

## 🔧 Instalação e Configuração

### 1. Instalar Dependências

```bash
cd mnu-server
npm install
```

### 2. Subir o PostgreSQL com Docker

```bash
docker-compose up -d
```

Para verificar se o container está rodando:
```bash
docker ps
```

### 3. Configurar o Prisma

Gerar o Prisma Client:
```bash
npm run db:generate
```

Criar as tabelas no banco de dados:
```bash
npm run db:migrate
```

Durante a migração, você será solicitado a dar um nome para a migration (exemplo: "init").

### 4. Iniciar o Servidor

Modo desenvolvimento (com hot reload via tsx):
```bash
npm run dev
```

Modo produção (compilar e executar):
```bash
npm run build
npm start
```

## 📚 Acessando a Documentação

Após iniciar o servidor, acesse:

- **API Health Check**: http://localhost:3000
- **Swagger UI**: http://localhost:3000/docs
- **Scalar Reference**: http://localhost:3000/reference

## 🗄️ Gerenciamento do Banco de Dados

### Prisma Studio

Para visualizar e editar dados do banco através de uma interface gráfica:
```bash
npm run db:studio
```

Acesse: http://localhost:5555

### Parar o PostgreSQL

```bash
docker-compose down
```

### Parar e remover volumes

```bash
docker-compose down -v
```

## ⚙️ Variáveis de Ambiente

O arquivo `.env` já está configurado com as seguintes variáveis:

```env
DATABASE_URL="postgresql://admin:user@localhost:5432/db_name?schema=public"
PORT=3000
HOST=0.0.0.0
```

## 🏗️ Arquitetura

O projeto segue uma arquitetura em camadas por domain com TypeScript:

Dentro de modules/domain possui os arquivos:

1. **Routes** - Define os endpoints e suas configurações (validação, documentação)
2. **Controllers** - Gerencia requisições HTTP e respostas com tipagem Fastify
3. **Services** - Contém a lógica de negócio e interage com o banco
4. **Schemas** - Define e valida estruturas de dados com Zod e inferência de tipos

## 🔍 Validação com Zod

Todas as rotas que recebem dados utilizam Zod para validação com type-safety:

Os tipos TypeScript são automaticamente inferidos dos schemas Zod.

## 📦 Scripts Disponíveis

- `npm run dev` - Inicia servidor em modo desenvolvimento com tsx watch
- `npm run build` - Compila TypeScript para JavaScript
- `npm start` - Inicia servidor em modo produção (requer build)
- `npm run db:migrate` - Cria/aplica migrações do banco
- `npm run db:generate` - Gera o Prisma Client com tipos TypeScript
- `npm run db:studio` - Abre interface gráfica do Prisma