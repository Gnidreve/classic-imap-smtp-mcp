# Production image for Phase 4: HTTP/SSE-capable MCP runtime in a container.
FROM node:20.20.2-alpine AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && corepack prepare pnpm@10.12.4 --activate && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# Use tini as PID 1 to reap zombie processes
FROM node:20.20.2-alpine
RUN apk add --no-cache tini curl
WORKDIR /app
ENV NODE_ENV=production
ENV MCP_TRANSPORT=http
ENV MCP_HOST=0.0.0.0
ENV MCP_PORT=3000
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY package.json ./
RUN addgroup -S mcp && adduser -S -G mcp mcp \
  && chown -R mcp:mcp /app
USER mcp
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -sf http://localhost:3000/healthz || exit 1
ENTRYPOINT ["/sbin/tini", "--", "node", "dist/main.js"]
