FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
COPY prisma/ ./prisma/

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

# ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./
COPY --from=build /app/public ./public
COPY docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x ./docker-entrypoint.sh

# `prisma` (CLI) e um devDependency - "npm ci --omit=dev" nao o instala
# aqui. O entrypoint roda "npx prisma migrate deploy", que entao tenta
# instalar o pacote por conta propria em node_modules - sem isso, o
# usuario sem privilegios abaixo nao tem permissao de escrita no
# diretorio (criado pelo root no passo anterior) e a migration falha.
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
