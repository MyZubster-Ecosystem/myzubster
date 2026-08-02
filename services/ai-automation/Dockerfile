# ============================================================
# MyZubster AI Automation — Dockerfile
# Express + Mongoose + GitHub API + Telegram Bot + Cron
# ============================================================

# ---- Build stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer caching)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

# ---- Runtime stage ----
FROM node:20-alpine AS runtime

WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy built node_modules and source from builder
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
COPY src/ ./src/

# Switch to non-root user
USER appuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

CMD ["node", "src/index.js"]