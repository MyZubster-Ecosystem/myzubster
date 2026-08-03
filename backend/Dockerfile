# ============================================================
# MyZubster Backend — Dockerfile
# Node.js + Express + Mongoose API server
# ============================================================

# ---- Build stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Install dependencies first (layer caching)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

# Run npm audit to check for vulnerabilities
RUN npm audit --audit-level=high || true

# ---- Runtime stage ----
FROM node:20-alpine AS runtime

WORKDIR /app

# Install curl and dumb-init
RUN apk add --no-cache curl dumb-init

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy built node_modules and source from builder
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
COPY src/ ./src/

# Set NODE_ENV for production
ENV NODE_ENV=production

# Switch to non-root user
USER appuser

EXPOSE 3009

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3009/api/health || exit 1

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/index.js"]
