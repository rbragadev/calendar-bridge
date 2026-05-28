FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .
RUN npm run build

RUN npm prune --production

ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "dist/src/main"]
