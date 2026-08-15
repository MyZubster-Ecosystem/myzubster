# ============================================================
# MyZubster Frontend — Dockerfile
# React (react-scripts 5.0.1) with react-leaflet map
# Multi-stage: build → nginx serve
# ============================================================

# ---- Build stage ----
FROM node:20-alpine AS build

WORKDIR /app

# Build args
ARG REACT_APP_API_URL=http://localhost:3009
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Copy source and build
COPY public/ ./public/
COPY src/ ./src/
RUN npm run build

# ---- Serve stage ----
FROM nginx:alpine AS serve

# Copy built assets from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Minimal nginx config for SPA routing
RUN echo 'server { \
    listen       80; \
    server_name  localhost; \
    location / { \
        root   /usr/share/nginx/html; \
        index  index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
    error_page   500 502 503 504  /50x.html; \
    location = /50x.html { \
        root   /usr/share/nginx/html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]