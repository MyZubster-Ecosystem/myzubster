FROM node:20-alpine
WORKDIR /app
COPY services/_shared ./_shared
COPY services/notifications ./notifications
ENV NODE_ENV=production
ENV NOTIFICATIONS_PORT=8085
EXPOSE 8085
CMD ["node", "notifications/index.js"]
