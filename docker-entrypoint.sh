#!/bin/sh
set -e

# No Kubernetes (EKS), as migrations rodam via um Job dedicado
# (k8s/02-migrate-job.tpl.yaml), nao a cada Pod subindo - evita todas as
# replicas do Deployment tentando migrar simultaneamente. Para docker-compose
# local, o default (true) mantem a conveniencia de migrar automaticamente.
if [ "${RUN_MIGRATIONS_ON_BOOT:-true}" != "true" ]; then
  echo "[entrypoint] RUN_MIGRATIONS_ON_BOOT=false - pulando migrations, iniciando API..."
  exec node dist/main.js
fi

echo "[entrypoint] Aguardando banco de dados..."

MAX_RETRIES=30
RETRY=0

until npx prisma migrate deploy 2>/dev/null; do
  RETRY=$((RETRY + 1))
  if [ "$RETRY" -ge "$MAX_RETRIES" ]; then
    echo "[entrypoint] Banco indisponivel apos $MAX_RETRIES tentativas. Abortando."
    exit 1
  fi
  echo "[entrypoint] Tentativa $RETRY/$MAX_RETRIES — aguardando 2s..."
  sleep 2
done

echo "[entrypoint] Migrations aplicadas. Iniciando API..."
exec node dist/main.js
