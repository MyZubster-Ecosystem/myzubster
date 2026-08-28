FROM node:20-alpine
WORKDIR /app
COPY services/_shared ./_shared
COPY services/bounties ./bounties
ENV NODE_ENV=production
ENV BOUNTIES_PORT=8083
EXPOSE 8083
CMD ["node", "bounties/index.js"]
