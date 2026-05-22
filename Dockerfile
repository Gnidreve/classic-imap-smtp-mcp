# Production-Image (PHASE 5/v2.x): Multi-Stage-Build, baut dist/ und startet den stdio-Server. Aktuell Geruest.
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY package.json ./
ENTRYPOINT ["node", "dist/bin/main.js"]
