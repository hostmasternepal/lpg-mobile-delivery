# Multi-stage build for the NestJS modular monolith.
# Built from the monorepo root (see docker-compose.yml `context: .`) so
# npm workspaces resolve correctly.

FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN npm ci --workspace backend --include-workspace-root
COPY backend backend
RUN npm run prisma:generate --workspace backend
RUN npm run build --workspace backend

FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json* ./
COPY backend/package.json backend/package.json
RUN npm ci --workspace backend --omit=dev --include-workspace-root
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/prisma ./backend/prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3001
# Migrations run as a separate deploy-time step (ARCH-DECISION-25: the
# runtime credential should not also run DDL) — see docs/ARCHITECTURE.md §12.
CMD ["node", "backend/dist/main.js"]
