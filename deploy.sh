#!/usr/bin/env bash
# =============================================================================
# deploy.sh — Build da imagem, deploy no Cloud Run e aplicação das env vars
#
# Uso (sempre da raiz do projeto):
#   chmod +x deploy.sh
#   ./deploy.sh
# =============================================================================

set -euo pipefail

PROJECT_ID="nexicore"
REGION="southamerica-east1"
SERVICE_NAME="calendar-bridge-api"
IMAGE="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"
ENV_FILE="api/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌ Arquivo $ENV_FILE não encontrado. Rode na raiz do projeto."
  exit 1
fi

# ---------------------------------------------------------------------------
# 1. Montar string de env vars a partir do api/.env
# ---------------------------------------------------------------------------
ENV_VARS="NODE_ENV=production"

while IFS= read -r line || [[ -n "$line" ]]; do
  [[ -z "$line" || "$line" == \#* ]] && continue

  KEY=$(echo "$line" | cut -d= -f1 | xargs)
  VALUE=$(echo "$line" | cut -d= -f2- | xargs)

  [[ -z "$KEY" || -z "$VALUE" ]] && continue
  [[ "$KEY" == "PORT" ]] && continue
  [[ "$KEY" == "NODE_ENV" ]] && continue

  # Escapar vírgulas (Cloud Run usa vírgula como separador)
  VALUE=$(echo "$VALUE" | sed 's/,/\\,/g')

  ENV_VARS="${ENV_VARS},${KEY}=${VALUE}"
done < "$ENV_FILE"

# ---------------------------------------------------------------------------
# 2. Build e push da imagem via Cloud Build
# ---------------------------------------------------------------------------
echo "🔨 Building image..."
gcloud builds submit ./api \
  --tag "${IMAGE}" \
  --project "${PROJECT_ID}"

# ---------------------------------------------------------------------------
# 3. Deploy no Cloud Run com as env vars
# ---------------------------------------------------------------------------
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE}" \
  --platform managed \
  --region "${REGION}" \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 2 \
  --memory 512Mi \
  --cpu 1 \
  --timeout 60 \
  --set-env-vars "${ENV_VARS}" \
  --project "${PROJECT_ID}"

echo ""
echo "✅ Deploy concluído!"
echo ""
echo "URL da API:"
gcloud run services describe "${SERVICE_NAME}" \
  --region "${REGION}" \
  --project "${PROJECT_ID}" \
  --format "value(status.url)"
