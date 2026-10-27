FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci

FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# The build prerenders top pages, so it needs a migrated database: the real one when DATABASE_URL is
# passed (docker-compose.prod.yml), otherwise a throwaway one started inside this stage (Dokploy).
# next.config reads ALLOWED_SOURCE_HOSTS and IMAGE_HOSTS at build time (CSP and image hosts).
ARG DATABASE_URL
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_SITE_NAME
ARG NEXT_PUBLIC_DAILYMOTION_PLAYER_ID
ARG ALLOWED_SOURCE_HOSTS
ARG IMAGE_HOSTS
ARG INDEXNOW_KEY
ENV DATABASE_URL=$DATABASE_URL NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL NEXT_PUBLIC_SITE_NAME=$NEXT_PUBLIC_SITE_NAME \
    NEXT_PUBLIC_DAILYMOTION_PLAYER_ID=$NEXT_PUBLIC_DAILYMOTION_PLAYER_ID ALLOWED_SOURCE_HOSTS=$ALLOWED_SOURCE_HOSTS \
    IMAGE_HOSTS=$IMAGE_HOSTS INDEXNOW_KEY=$INDEXNOW_KEY NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate && \
    if [ -n "$DATABASE_URL" ]; then BUILD_STANDALONE=1 npm run build; \
    else apk add --no-cache postgresql17 >/dev/null && sh deploy/build-with-temp-db.sh; fi

# One-shot job: applies pending database migrations (docker compose run --rm migrate).
FROM deps AS migrate
CMD ["npx", "prisma", "migrate", "deploy"]

FROM node:24-alpine AS run
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1
CMD ["node", "server.js"]
