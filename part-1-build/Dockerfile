FROM node:20-alpine AS base
WORKDIR /app

# ─── Install dependencies ─────────────────────────────
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm install

# ─── Generate Prisma client ───────────────────────────
FROM deps AS prisma
COPY prisma ./prisma/
RUN npx prisma generate

# ─── Build TypeScript ──────────────────────────────────
FROM prisma AS build
COPY tsconfig.json ./
COPY src ./src/
RUN npm run build

# ─── Production image ─────────────────────────────────
FROM base AS production
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=prisma /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma/
COPY package.json ./

EXPOSE 3000

# Run migrations then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
