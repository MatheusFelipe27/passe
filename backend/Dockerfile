FROM node:22-alpine

WORKDIR /app

# O schema e a configuração do Prisma entram antes do npm ci, porque o postinstall gera o cliente.
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000

# A cada subida, as migrations deixam o banco na versão do código (num banco vazio, criam as tabelas).
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
