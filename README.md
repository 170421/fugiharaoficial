# Farma-X — WhatsApp Bulk Messaging Platform

Sistema completo de disparo em massa via WhatsApp usando a **API Oficial da Meta (Cloud API)**.

## Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                   │
│  Dashboard | Contatos | Campanhas | Templates | Reports │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP/REST
┌───────────────────────▼─────────────────────────────────┐
│              BACKEND (Node.js + TypeScript)              │
│                                                         │
│  Auth | Contacts | Campaigns | Templates | Reports      │
│                                                         │
│  ┌────────────────────┐   ┌─────────────────────────┐  │
│  │  WhatsApp Service  │   │   BullMQ Queue Worker   │  │
│  │  (Meta Cloud API)  │   │  (rate limit: 10 msg/s) │  │
│  └────────────────────┘   └─────────────────────────┘  │
└────────┬───────────────────────────┬────────────────────┘
         │                           │
┌────────▼───────┐         ┌─────────▼──────┐
│  PostgreSQL    │         │     Redis      │
│  (dados)       │         │  (fila BullMQ) │
└────────────────┘         └────────────────┘
```

## Pré-requisitos

- Node.js 20+
- Docker + Docker Compose
- Conta Meta Business verificada
- App criado em https://developers.facebook.com/

## Configuração da Meta Cloud API

1. Acesse [Meta for Developers](https://developers.facebook.com/apps/)
2. Crie um app do tipo **Business**
3. Adicione o produto **WhatsApp**
4. Em **WhatsApp > API Setup**:
   - Copie o **Phone Number ID**
   - Copie o **WhatsApp Business Account ID**
   - Gere um **System User Token** permanente
5. Configure o webhook: `https://seu-dominio.com/webhooks/whatsapp`
   - **Verify token**: mesmo valor de `WEBHOOK_VERIFY_TOKEN` no `.env`
   - **Campos**: `messages`

## Setup Rápido (desenvolvimento)

```bash
# 1. Infraestrutura
docker compose up postgres redis -d

# 2. Backend
cd backend
cp .env.example .env   # Configure com suas credenciais da Meta
npm install
npx prisma migrate dev
npm run dev

# 3. Frontend (outro terminal)
cd frontend
npm install
npm run dev
```

Acesse: http://localhost:3000

## Setup com Docker (produção)

```bash
cp backend/.env.example backend/.env
# Configure o backend/.env com credenciais reais
docker compose up -d
```

## Como funciona o disparo em massa

```
1. Crie Templates de mensagem (corpo com variáveis {{1}}, {{2}})
2. Envie para aprovação na Meta (aguardar até 24h)
3. Importe contatos via CSV ou cadastre manualmente
4. Organize contatos em Listas
5. Crie uma Campanha selecionando template + lista
6. Clique em "Iniciar" → mensagens entram na fila BullMQ
7. Worker envia com rate limit configurável (padrão: 10 msg/s)
8. Webhook atualiza status em tempo real (enviado/entregue/lido)
```

## Estrutura

```
Farma-x/
├── backend/src/
│   ├── modules/
│   │   ├── auth/          # JWT login/registro
│   │   ├── contacts/      # CRUD + import CSV
│   │   ├── campaigns/     # Campanhas + lançamento
│   │   ├── templates/     # Templates + aprovação Meta
│   │   ├── webhooks/      # Status updates + opt-outs
│   │   └── reports/       # Analytics e métricas
│   ├── services/
│   │   ├── whatsapp/      # Meta Cloud API client
│   │   └── queue/         # BullMQ worker
│   └── prisma/schema.prisma
├── frontend/src/pages/    # Dashboard, Contacts, Campaigns...
└── docker-compose.yml
```

## Rate Limits da Meta

| Tier | Limite diário              |
|------|---------------------------|
| 1    | 1.000 contatos únicos/dia |
| 2    | 10.000 contatos únicos/dia |
| 3    | 100.000 contatos únicos/dia |
| 4    | Ilimitado                 |

Configure `MESSAGES_PER_SECOND` no `.env` conforme seu tier.

## Opt-out automático

Contatos que respondem "PARAR", "SAIR", "STOP", "CANCELAR" são automaticamente removidos das campanhas futuras via webhook.
