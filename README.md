# LPG Emergency Priority Delivery System

Digital complaint-to-delivery system for MoICS/NOC: collects LPG demand from
multiple sources, verifies and priority-classifies requests, plans priority
van deliveries, and confirms each delivery via OTP.

## Documentation (read in this order)

1. [`docs/SRS.md`](docs/SRS.md) — Software Requirements Specification. Every
   requirement has a `REQ-xxx` ID; every gap in the source concept paper is
   marked `OPEN-BUSINESS-DECISION-xx` and is **not resolved** in code.
2. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — the current architecture
   (v2, incorporates the review below). This is the source of truth for
   implementation.
3. [`docs/ARCHITECTURE_REVIEW.md`](docs/ARCHITECTURE_REVIEW.md) — the formal
   review that produced v2's fixes; kept as the historical record of what was
   found and why.

**Before changing business logic**, check whether the behavior you're about
to implement touches an `OPEN-BUSINESS-DECISION-xx` item. If it does, do not
invent the answer — implement it as configuration with an explicit default
and a comment citing the decision ID (see `backend/prisma/seed.ts` for the
pattern already used for RBAC and OTP policy).

## Stack

- **Frontend:** Next.js + TypeScript (`frontend/`), role-gated route groups.
- **Backend:** NestJS + TypeScript (`backend/`), modular monolith — see
  `docs/ARCHITECTURE.md` §2 for module boundaries.
- **Database:** PostgreSQL, via Prisma (`backend/prisma/schema.prisma`).
- **Cache/queue:** Redis (OTP TTL/attempt counters, refresh tokens, SMS job
  queue).
- **Infra:** Docker Compose for local dev and the pilot deployment.

## Local development

```bash
cp .env.example .env        # fill in real secrets for anything beyond local dev
npm install
npm run docker:up           # postgres + redis + backend + frontend
```

Or run the app processes outside Docker against dockerized Postgres/Redis:

```bash
docker compose up -d postgres redis
npm run prisma:migrate --workspace backend
npm run prisma:seed --workspace backend
npm run dev:backend         # http://localhost:3001
npm run dev:frontend        # http://localhost:3000
```

## Repository layout

```
backend/    NestJS API — modular monolith (see docs/ARCHITECTURE.md §2/§7)
  prisma/   schema.prisma (full ERD) + seed.ts (roles/permissions/priority groups/policy defaults)
  src/
    common/       shared guards, decorators, filters, config — no business logic
    modules/      one folder per bounded-context module
frontend/   Next.js app — role-gated route groups: (admin), (ops), (agent)
docs/       SRS, architecture, and architecture review documents
```
