# ─── Multi-Stage Production Dockerfile for Buggers ──────────────────

# Build Stage
FROM node:22-alpine AS builder
WORKDIR /app

# Install dependencies required for native builds
RUN apk add --no-cache libc6-compat python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .

# Build production bundle
ENV NODE_ENV=production
RUN npm run build

# Runner Stage
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Security: Run as unprivileged non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

COPY --from=builder --chown=appuser:nodejs /app/.output ./.output
COPY --from=builder --chown=appuser:nodejs /app/public ./public
COPY --from=builder --chown=appuser:nodejs /app/package.json ./package.json

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

CMD ["node", ".output/server/index.mjs"]
