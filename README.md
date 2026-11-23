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
- PostgreSQL <versão>

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

O sistema usa PostgreSQL. A conexão está configurada em `backend/database/connection.js` com os dados abaixo, então crie o usuário e o banco exatamente assim:

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

2. Execute o script na raiz do repositório. Ele cria as tabelas e insere o administrador inicial:

```bash
psql -h localhost -U Biluga -d sistemalauffens -f SistemaLauffens.sql
```

Usuário inicial do sistema: login `admin`, senha `<senha>`.

## Configuração do backend

Crie o arquivo `backend/pass.env` (há um modelo em `backend/pass.env.example`):

```env
JWT_SECRET=troque-por-uma-chave-secreta-longa
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:seu-email@exemplo.com
```

| Variável | Descrição |
|---|---|
| `JWT_SECRET` | Chave usada para assinar os tokens de login. Obrigatória. |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | Chaves das notificações push. Opcionais: se ficarem fora, são geradas na primeira execução em `backend/.push-keys.json`. |
| `VAPID_SUBJECT` | Contato (e-mail com `mailto:` ou URL) enviado ao serviço de push. Opcional. |

## Como executar

### Backend

```bash
cd backend
npm install
npm start
```

A API fica em `http://localhost:9001`. Para reiniciar automaticamente a cada alteração, use `npm run dev`.

### Frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

Abra o endereço mostrado pelo Vite no terminal. O frontend usa `/api`, e o proxy do Vite encaminha as chamadas para o backend na porta 9001.

## Testando a API

Importe a coleção da pasta `insomnia/` no Insomnia. As rotas exigem o cabeçalho `Authorization: Bearer <token>`, obtido no login.

## Autores

- Ryan Morais
- Eduardo Mariano