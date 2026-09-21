-- Manual follow-up migration: two controls Prisma's schema DSL cannot
-- express directly. See docs/ARCHITECTURE.md §4 and
-- docs/ARCHITECTURE_REVIEW.md ARCH-DECISION-12 / ARCH-DECISION-17 / H-1.

-- ARCH-DECISION-12: at most one ACTIVE otp_codes row per delivery_stop_id
-- at any time (a resend must invalidate the prior code before issuing a
-- new one — this partial unique index is what makes that enforceable at
-- the database level, not just by application discipline).
CREATE UNIQUE INDEX idx_otp_one_active_per_stop
    ON otp_codes (delivery_stop_id)
    WHERE status = 'ACTIVE';

-- Append-only audit_logs: UPDATE/DELETE are revoked for the application
-- role. This is a real, DB-enforced control (unlike write-identity
-- restriction, which docs/ARCHITECTURE_REVIEW.md H-1 explains a single
-- pooled credential cannot provide — that part is enforced by CI lint
-- instead, see backend/.dependency-cruiser.cjs).
--
-- NOTE: this statement is intentionally commented out in a fresh local
-- dev database, because the seed/dev credential (e.g. lpg_app) is also
-- the migration-running credential here and would lock itself out of
-- future `prisma migrate dev` runs against audit_logs. In staging/
-- production, migrations run under a separate, more-privileged
-- credential than the runtime application credential (ARCH-DECISION-25)
-- — uncomment and apply this against the RUNTIME credential once that
-- separation exists:
--
-- REVOKE UPDATE, DELETE ON audit_logs FROM <runtime_application_role>;
