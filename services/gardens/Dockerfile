FROM node:20-alpine
WORKDIR /app
COPY services/_shared ./_shared
COPY services/gardens ./gardens
ENV NODE_ENV=production
ENV GARDENS_PORT=8082
EXPOSE 8082
CMD ["node", "gardens/index.js"]
