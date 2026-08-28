FROM node:20-alpine
WORKDIR /app
COPY services/registry ./registry
ENV NODE_ENV=production
ENV REGISTRY_PORT=8500
EXPOSE 8500
CMD ["node", "registry/index.js"]
