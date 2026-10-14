FROM node:24-alpine

WORKDIR /app

COPY package.json .
COPY verify.mjs .

RUN mkdir -p /output

ENV NODE_ENV=production
ENV MYZUBSTER_NODE_URL=https://bridge.myzubster.com/open-period-care

CMD ["node", "verify.mjs"]
