# Calendar Bridge

Sincronize compromissos entre múltiplas contas Google automaticamente. Cria blocos "Busy" privados no calendário destino sem copiar dados sensíveis.

## Estrutura do projeto

```
calendar-bridge/
├── api/          # Backend NestJS
├── web/          # Frontend React + Vite
└── .github/
    └── workflows/
        └── sync.yml
```

---

## 1. Configurar o Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Crie um novo projeto (ex: `calendar-bridge`)
3. Aguarde o projeto inicializar
4. Vá em **Settings → Database**
5. Copie a **Connection string (URI)** — escolha a aba **URI**
   - Formato: `postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres`
6. Substitua `[PASSWORD]` pela senha do banco definida na criação

Essa string vai no `DATABASE_URL` do seu `.env`.

---

## 2. Configurar Google OAuth no Google Cloud Console

1. Acesse [console.cloud.google.com](https://console.cloud.google.com)
2. Crie um projeto novo ou selecione existente
3. Vá em **APIs & Services → Library** e ative:
   - **Google Calendar API**
   - **Google People API** (ou Google+ API)
4. Vá em **APIs & Services → OAuth consent screen**:
   - Tipo: **External**
   - Preencha nome do app, e-mail de suporte
   - Em **Scopes**, adicione:
     - `https://www.googleapis.com/auth/calendar.readonly`
     - `https://www.googleapis.com/auth/calendar.events`
     - `https://www.googleapis.com/auth/userinfo.email`
   - Em **Test users**, adicione os e-mails das contas Google que você vai usar
5. Vá em **APIs & Services → Credentials → Create Credentials → OAuth Client ID**:
   - Tipo: **Web application**
   - Nome: `calendar-bridge`
   - **Authorized redirect URIs**:
     - Local: `http://localhost:3000/google/oauth/callback`
     - Produção: `https://seu-api.onrender.com/google/oauth/callback`
6. Copie o **Client ID** e **Client Secret**

---

## 3. Gerar a ENCRYPTION_KEY

Execute no terminal para gerar uma chave AES-256 segura:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

O resultado (64 caracteres hex) vai no `ENCRYPTION_KEY`.

---

## 4. Gerar o INTERNAL_SYNC_TOKEN

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 5. Configurar variáveis de ambiente locais

### Backend (`api/.env`)

```bash
cp api/.env.example api/.env
```

Edite `api/.env`:

```env
DATABASE_URL=postgresql://postgres:[SENHA]@db.[REF].supabase.co:5432/postgres
GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-seu-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/google/oauth/callback
FRONTEND_URL=http://localhost:5173
INTERNAL_SYNC_TOKEN=seu-token-gerado
ENCRYPTION_KEY=sua-chave-hex-64-chars
PORT=3000
```

### Frontend (`web/.env`)

```bash
cp web/.env.example web/.env
```

Edite `web/.env`:

```env
VITE_API_URL=http://localhost:3000
```

---

## 6. Instalar dependências

```bash
# Backend
cd api
npm install

# Frontend
cd ../web
npm install
```

---

## 7. Executar migration do banco

```bash
cd api

# Gera o client Prisma
npx prisma generate

# Cria as tabelas no banco (development)
npx prisma migrate dev --name init

# Ou em produção/staging:
npx prisma migrate deploy
```

> O usuário padrão `default-user` é criado automaticamente ao iniciar a API.

---

## 8. Rodar localmente

### Terminal 1 — Backend

```bash
cd api
npm run start:dev
```

A API estará em `http://localhost:3000`

### Terminal 2 — Frontend

```bash
cd web
npm run dev
```

O frontend estará em `http://localhost:5173`

---

## 9. Fluxo de teste completo

Siga esta sequência para validar o funcionamento:

**1. Abra** `http://localhost:5173`

**2. Conectar Conta Google A**
- Vá em **Contas Google → Conectar conta Google**
- Faça login com a conta A (ex: pessoal@gmail.com)
- Autorize os escopos de calendário
- Você será redirecionado de volta com "Conta conectada com sucesso!"

**3. Conectar Conta Google B**
- Clique novamente em **Conectar conta Google**
- Faça login com a conta B (ex: trabalho@gmail.com)
- Autorize os escopos

**4. Ver as agendas disponíveis**
- Vá em **Agendas**
- Selecione cada conta e veja as agendas listadas
- Anote o nome da agenda que quer usar como origem e destino

**5. Criar uma Bridge**
- Vá em **Bridges → Nova Bridge**
- Conta origem: selecione Conta A
- Agenda origem: selecione a agenda desejada
- Conta destino: selecione Conta B
- Agenda destino: selecione a agenda desejada
- Título: `Busy` (padrão)
- Dias passados: `1`, Dias futuros: `30`
- Clique em **Criar Bridge**

**6. Criar evento teste**
- Abra Google Calendar com a Conta A
- Crie um evento qualquer (ex: "Reunião Importante") com horário ocupado
- Aguarde alguns segundos para sincronizar com a API do Google

**7. Sincronizar**
- Volte ao Calendar Bridge
- Na bridge criada, clique em **Sincronizar**
- Você verá: `1 criados · 0 atualizados · 0 deletados`

**8. Verificar no Google Calendar da Conta B**
- Abra Google Calendar com a Conta B
- Verifique se apareceu um evento "Busy" (privado) no mesmo horário
- Confirme que não tem título original, localização, convidados, etc.

**9. Alterar horário do evento original**
- Na Conta A, altere o horário do evento
- Clique em **Sincronizar** novamente
- O evento "Busy" na Conta B deve ser atualizado com o novo horário
- Você verá: `0 criados · 1 atualizados · 0 deletados`

**10. Cancelar/apagar o evento original**
- Na Conta A, delete o evento
- Clique em **Sincronizar**
- O evento "Busy" na Conta B deve ser removido
- Você verá: `0 criados · 0 atualizados · 1 deletados`

**11. Ver Logs**
- Vá em **Logs** para ver o histórico de sincronizações

---

## 10. Deploy no Render

### Pré-requisitos

- Conta no [render.com](https://render.com)
- Repositório no GitHub com o projeto
- `render.yaml` já está configurado na raiz

### Passos

**1.** Faça push do projeto para um repositório GitHub

**2.** No Render, vá em **New → Blueprint** e conecte ao repositório

**3.** O Render detectará o `render.yaml` automaticamente e criará:
- `calendar-bridge-api` (Web Service — Node)
- `calendar-bridge-web` (Static Site)

**4.** Configure as variáveis de ambiente do backend:

| Variável | Valor |
|---|---|
| `DATABASE_URL` | Connection string do Supabase |
| `GOOGLE_CLIENT_ID` | Client ID do Google |
| `GOOGLE_CLIENT_SECRET` | Client Secret do Google |
| `GOOGLE_REDIRECT_URI` | `https://calendar-bridge-api.onrender.com/google/oauth/callback` |
| `FRONTEND_URL` | `https://calendar-bridge-web.onrender.com` |
| `INTERNAL_SYNC_TOKEN` | Token gerado |
| `ENCRYPTION_KEY` | Chave hex de 64 chars |
| `PORT` | `3000` |

**5.** Configure a variável do frontend:

| Variável | Valor |
|---|---|
| `VITE_API_URL` | `https://calendar-bridge-api.onrender.com` |

**6.** No Google Cloud Console, adicione o redirect URI de produção:
```
https://calendar-bridge-api.onrender.com/google/oauth/callback
```

**7.** O primeiro deploy executará automaticamente `prisma migrate deploy`

> **Atenção sobre o plano free do Render**: serviços free "dormem" após 15 minutos de inatividade. Considere upgrade para o plano Starter para uso contínuo, ou use o Render Cron Jobs como alternativa ao GitHub Actions.

---

## 11. Configurar GitHub Actions para sync automático

**1.** No repositório GitHub, vá em **Settings → Secrets and variables → Actions**

**2.** Crie os seguintes secrets:

| Secret | Valor |
|---|---|
| `CALENDAR_BRIDGE_API_URL` | URL da API no Render (ex: `https://calendar-bridge-api.onrender.com`) |
| `INTERNAL_SYNC_TOKEN` | O mesmo token configurado na API |

**3.** O workflow `.github/workflows/sync.yml` já está configurado para rodar a cada 10 minutos

**4.** Para testar manualmente: vá em **Actions → Calendar Bridge Sync → Run workflow**

---

## 12. Endpoints da API

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/google/oauth/url` | Retorna URL de autorização Google |
| `GET` | `/google/oauth/callback` | Callback OAuth (redirect) |
| `GET` | `/google/accounts` | Lista contas conectadas |
| `DELETE` | `/google/accounts/:id` | Remove conta |
| `GET` | `/google/accounts/:id/calendars` | Lista agendas da conta |
| `POST` | `/bridges` | Cria bridge |
| `GET` | `/bridges` | Lista bridges |
| `GET` | `/bridges/:id` | Detalhes da bridge |
| `PATCH` | `/bridges/:id` | Atualiza bridge |
| `DELETE` | `/bridges/:id` | Remove bridge |
| `POST` | `/bridges/:id/sync-now` | Sync manual |
| `GET` | `/bridges/:id/logs` | Logs da bridge |
| `GET` | `/bridges/logs` | Todos os logs |
| `POST` | `/internal/sync` | Sync automático (token obrigatório) |

---

## 13. Segurança

- Refresh tokens são criptografados com AES-256-GCM antes de salvar no banco
- O endpoint `/internal/sync` exige `Authorization: Bearer <token>`
- CORS configurado para aceitar apenas o `FRONTEND_URL`
- Eventos sincronizados nunca expõem título original, descrição, localização ou convidados
- Eventos criados pelo próprio Calendar Bridge são ignorados no sync (evita loops infinitos)

---

## 14. Variáveis de ambiente — referência completa

### `/api/.env`

```env
DATABASE_URL=            # Postgres connection string (Supabase)
GOOGLE_CLIENT_ID=        # OAuth Client ID
GOOGLE_CLIENT_SECRET=    # OAuth Client Secret
GOOGLE_REDIRECT_URI=     # URL do callback OAuth
FRONTEND_URL=            # URL do frontend (para CORS e redirect)
INTERNAL_SYNC_TOKEN=     # Token secreto para /internal/sync
ENCRYPTION_KEY=          # 64 chars hex (32 bytes AES-256)
PORT=3000                # Porta da API
```

### `/web/.env`

```env
VITE_API_URL=            # URL base da API
```

---

## 15. Desenvolvimento

### Prisma Studio (UI do banco)

```bash
cd api
npx prisma studio
```

### Testar endpoint de sync manualmente

```bash
curl -X POST http://localhost:3000/internal/sync \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json"
```

### Resetar banco (development)

```bash
cd api
npx prisma migrate reset
```
