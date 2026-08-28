FROM node:20-alpine
WORKDIR /app
COPY gateway.js serviceRegistry.js ./
ENV NODE_ENV=production
ENV GATEWAY_PORT=8080
EXPOSE 8080
CMD ["node", "gateway.js"]
