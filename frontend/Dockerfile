# 建置階段
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install --force
COPY . .
RUN npm run build

FROM node:18-alpine AS runner

WORKDIR /app

# 從建置階段複製必要檔案
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"]
