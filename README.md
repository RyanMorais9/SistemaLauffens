# SistemaLauffens

Sistema de acompanhamento da produção de móveis da Lauffens, com projetos, etapas, controle de tempo, manutenção, custos de mão de obra e notificações.

## Estrutura do repositório

```text
backend/              API Express (src/, database/, index.js, package.json)
frontend/             React com Vite, Axios e Material UI
insomnia/             Coleção de requisições para testar a API
SistemaLauffens.sql   Script de criação das tabelas e dados iniciais
```

## Pré-requisitos

- Node.js 20.19 ou superior (recomendado 22) e npm
- PostgreSQL 16

## Bibliotecas utilizadas

Todas são instaladas com `npm install` em cada pasta (`backend` e `frontend`).

**Backend**

| Biblioteca | Uso |
|---|---|
| express | Servidor e rotas da API |
| cors | Liberação de acesso ao frontend |
| sequelize, pg, pg-hstore | ORM e conexão com o PostgreSQL |
| bcrypt | Hash das senhas |
| jsonwebtoken, passport, passport-jwt | Autenticação por JWT |
| web-push | Notificações push |
| nodemon (dev) | Reinício automático no desenvolvimento |
| sequelize-cli (dev) | Ferramentas de linha de comando do Sequelize |

**Frontend**

| Biblioteca | Uso |
|---|---|
| react, react-dom | Interface |
| @mui/material, @mui/icons-material, @emotion/react, @emotion/styled | Material UI |
| axios | Requisições à API |
| vite, @vitejs/plugin-react (dev) | Build e servidor de desenvolvimento |
| eslint e plugins (dev) | Verificação de código |

## Banco de dados

O sistema usa PostgreSQL. Crie o usuário e o banco com os dados abaixo (são os do `backend/pass.env.example`):

| Item | Valor |
|---|---|
| Banco | `sistemalauffens` |
| Usuário | `Biluga` |
| Senha | `f7c3h2f6` |
| Host | `localhost` |

1. Crie o usuário e o banco:

```bash
sudo -u postgres psql
```

```sql
CREATE USER "Biluga" WITH PASSWORD 'f7c3h2f6';
CREATE DATABASE sistemalauffens OWNER "Biluga";
\q
```

2. Execute o script na raiz do repositório. Ele cria as tabelas e insere os dados iniciais:

```bash
psql -h localhost -U Biluga -d sistemalauffens -f SistemaLauffens.sql
```

Usuários iniciais do sistema:

| Perfil | Login | Senha |
|---|---|---|
| Administrador | `demo.marice` | `TesteLauffens123!` |
| Marceneiro | `marceneiro` | `TesteMarceneiro123!` |

O script também cadastra um cliente de exemplo.

## Configuração do backend

Copie o modelo para criar o arquivo `backend/pass.env`:

```bash
cd backend
cp pass.env.example pass.env
```

Conteúdo do arquivo (se usou outros dados no PostgreSQL, ajuste as variáveis `DB_*`):