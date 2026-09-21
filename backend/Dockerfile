# Multi-stage build for the NestJS modular monolith.
# Built from the monorepo root (see docker-compose.yml `context: .`) so
# npm workspaces resolve correctly.

FROM node:20-alpine AS build
# Prisma's engine-selection at both generate-time and runtime shells out to
# `openssl version` to pick the right musl+OpenSSL query-engine binary; a
# bare node:20-alpine has no openssl binary at all, so that detection
# silently fails and Prisma falls back to guessing (observed: "Defaulting
# to openssl-1.1.x", then trying to load a bare `linux-musl` engine that
# was never even bundled, since this schema's binaryTargets specify
# linux-musl-openssl-3.0.x, not the OpenSSL-less legacy name).
RUN apk add --no-cache openssl
WORKDIR /app
COPY package.json package-lock.json* ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN npm ci --workspace backend --include-workspace-root
COPY backend backend
RUN npm run prisma:generate --workspace backend
RUN npm run build --workspace backend

FROM node:20-alpine AS runtime
RUN apk add --no-cache openssl
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json* ./
COPY backend/package.json backend/package.json
RUN npm ci --workspace backend --omit=dev --include-workspace-root
COPY --from=build /app/backend/dist ./backend/dist
# dist-scripts holds the compiled prisma/seed.ts and scripts/*.ts — run as
# plain `node`, never `ts-node`, in this image: ts-node's require.extensions
# hook for .ts fights Node's own ESM-vs-CJS module-type auto-detection on
# ambiguous (no "type" field) package.json in Alpine's Node build, which
# throws (observed: "Unknown file extension \".ts\"") or silently no-ops
# depending on the exact Node patch version.
COPY --from=build /app/backend/dist-scripts ./backend/dist-scripts
COPY --from=build /app/backend/prisma ./backend/prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3001
# Migrations run as a separate deploy-time step (ARCH-DECISION-25: the
# runtime credential should not also run DDL) — see docs/ARCHITECTURE.md §12.
CMD ["node", "backend/dist/main.js"]
