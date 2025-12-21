FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npm run build
RUN npx prisma generate


FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3002

CMD [ "npm", "run", "start:prod" ]
