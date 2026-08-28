FROM node:20-alpine
WORKDIR /app
COPY services/_shared ./_shared
COPY services/auth ./auth
ENV NODE_ENV=production
ENV AUTH_PORT=8081
EXPOSE 8081
CMD ["node", "auth/index.js"]
