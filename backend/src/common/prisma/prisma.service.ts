import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Single Prisma client for the whole monolith (one pooled DB credential —
 * see docs/ARCHITECTURE_REVIEW.md H-1: this is why audit_logs write-identity
 * is enforced by CI import-boundary lint, not by a per-module DB role).
 *
 * ARCH-DECISION-25: this credential must be non-superuser with no DDL
 * grants in any deployed environment; migrations run under a separate,
 * deploy-time-only credential (see backend/prisma/README or CI config).
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
