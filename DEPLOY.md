# Deploy — GCP Cloud Run + Vercel

## Visão geral

```
Vercel (React)  →  Cloud Run (NestJS API)  →  Supabase (PostgreSQL)
                         ▲
                Cloud Scheduler (cron)
```

---

## Pré-requisitos

- [gcloud CLI](https://cloud.google.com/sdk/docs/install) instalado e autenticado (`gcloud auth login`)
- Projeto GCP criado
- APIs habilitadas:

```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  cloudscheduler.googleapis.com \
  --project SEU_PROJECT_ID
```

---

## 1. Preparar o `api/.env` para produção

Copie o `api/.env.example` e preencha com os valores reais:

```bash
cp api/.env.example api/.env
```

Edite `api/.env` com:
- `DATABASE_URL` e `DIRECT_URL` — URLs do Supabase (connection pooler e direct)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — do Google Cloud Console
- `GOOGLE_REDIRECT_URI` — será `https://SUA_URL_CLOUD_RUN/google/oauth/callback` (preencher após o deploy)
- `FRONTEND_URL` — URL do seu projeto na Vercel
- `INTERNAL_SYNC_TOKEN` — gere com `openssl rand -hex 32`
- `ENCRYPTION_KEY` — gere com `openssl rand -hex 32` (64 chars)
- `JWT_SECRET` — gere com `openssl rand -hex 32`

---

## 2. Rodar migrations (uma vez, da sua máquina)

As migrations devem rodar antes do deploy — não no startup do container.

```bash
cd api
npx prisma migrate deploy
cd ..
```

> O Prisma usa as URLs do `api/.env` automaticamente.

---

## 3. Primeiro deploy

```bash
# Edite PROJECT_ID no topo do arquivo antes de rodar
chmod +x deploy.sh scripts/set-cloudrun-envs.sh
./deploy.sh
```

O script faz:
1. Build da imagem via Cloud Build (sem precisar do Docker local)
2. Deploy no Cloud Run

Anote a URL retornada — ex: `https://calendar-bridge-api-xxxx-uc.a.run.app`

---

## 4. Configurar variáveis de ambiente no Cloud Run

```bash
./scripts/set-cloudrun-envs.sh
```

O script lê o `api/.env` e aplica todas as variáveis no Cloud Run.

---

## 5. Atualizar GOOGLE_REDIRECT_URI

Após obter a URL do Cloud Run:

1. Edite `api/.env` e atualize `GOOGLE_REDIRECT_URI`:
   ```
   GOOGLE_REDIRECT_URI=https://SUA_URL_CLOUD_RUN/google/oauth/callback
   ```

2. Aplique no Cloud Run:
   ```bash
   ./scripts/set-cloudrun-envs.sh
   ```

3. No [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials), adicione a URI de redirecionamento OAuth.

---

## 6. Configurar Cloud Scheduler (cron de sync)

```bash
PROJECT_ID="SEU_PROJECT_ID"
REGION="southamerica-east1"
API_URL="https://SUA_URL_CLOUD_RUN"
SYNC_TOKEN="SEU_INTERNAL_SYNC_TOKEN"  # mesmo valor do .env

gcloud scheduler jobs create http calendar-bridge-sync \
  --schedule "*/15 * * * *" \
  --uri "${API_URL}/internal/sync" \
  --http-method POST \
  --headers "Authorization=Bearer ${SYNC_TOKEN},Content-Type=application/json" \
  --message-body "{}" \
  --time-zone "America/Sao_Paulo" \
  --location "${REGION}" \
  --project "${PROJECT_ID}"
```

> `*/15 * * * *` = a cada 15 minutos. Ajuste conforme necessário.

---

## 7. Deploy do frontend na Vercel

1. Importe o repositório na Vercel
2. Configure:
   - **Root Directory**: `web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Adicione variável de ambiente:
   - `VITE_API_URL` = `https://SUA_URL_CLOUD_RUN`

---

## Fluxo para deploys futuros

**Só atualizar o código:**
```bash
./deploy.sh
```

**Só atualizar variáveis de ambiente:**
```bash
./scripts/set-cloudrun-envs.sh
```

**As duas coisas:**
```bash
./deploy.sh && ./scripts/set-cloudrun-envs.sh
```

---

## Custos estimados

| Serviço | Free tier | Custo esperado |
|---|---|---|
| Cloud Run | 2M req/mês + 360k GB-s | **R$ 0** |
| Cloud Build | 120 min/dia | **R$ 0** |
| Artifact Registry | 0,5 GB/mês | **R$ 0** |
| Cloud Scheduler | 3 jobs grátis | **R$ 0** |
| Supabase | 500 MB / 2 projetos | **R$ 0** |
| Vercel | Hobby plan | **R$ 0** |

**Total: R$ 0 / mês** para uso pessoal típico.
