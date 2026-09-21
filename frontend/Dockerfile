# Multi-stage build for the Next.js app. Built from the monorepo root
# (see docker-compose.yml `context: .`) so npm workspaces resolve.

FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN npm ci --workspace frontend --include-workspace-root
COPY frontend frontend
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api/v1
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
RUN npm run build --workspace frontend

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/frontend/.next/standalone ./
COPY --from=build /app/frontend/.next/static ./frontend/.next/static
COPY --from=build /app/frontend/public ./frontend/public

EXPOSE 3000
CMD ["node", "frontend/server.js"]
