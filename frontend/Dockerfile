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

# Nginx config with security headers, gzip, and cache control
RUN echo 'server { \
    listen       80; \
    server_name  localhost; \
    \
    # Gzip compression \
    gzip on; \
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript; \
    gzip_min_length 256; \
    \
    # Security headers \
    add_header X-Frame-Options "SAMEORIGIN" always; \
    add_header X-Content-Type-Options "nosniff" always; \
    add_header X-XSS-Protection "1; mode=block" always; \
    add_header Referrer-Policy "strict-origin-when-cross-origin" always; \
    add_header Content-Security-Policy "default-src \'self\'; script-src \'self\' \'unsafe-inline\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data: https:; connect-src \'self\';" always; \
    \
    location / { \
        root   /usr/share/nginx/html; \
        index  index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
    \
    # Cache static assets \
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
    \
    # Disable cache for HTML \
    location ~* \.html$ { \
        expires -1; \
        add_header Cache-Control "no-store, no-cache, must-revalidate"; \
    } \
    \
    error_page   500 502 503 504  /50x.html; \
    location = /50x.html { \
        root   /usr/share/nginx/html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
