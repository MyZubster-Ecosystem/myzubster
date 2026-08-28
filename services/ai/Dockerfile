FROM node:20-alpine
WORKDIR /app
COPY services/_shared ./_shared
COPY services/ai ./ai
ENV NODE_ENV=production
ENV AI_PORT=8084
EXPOSE 8084
CMD ["node", "ai/index.js"]
