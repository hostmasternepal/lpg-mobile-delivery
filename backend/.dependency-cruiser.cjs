/**
 * CI-enforced module boundaries — see docs/ARCHITECTURE.md §2 and
 * docs/ARCHITECTURE_REVIEW.md ARCH-DECISION-17. A single pooled Postgres
 * credential cannot restrict which module's code writes audit_logs; this
 * is the code-level substitute: only AuditLogModule may import its own
 * service/listener, and no module may import another module's Prisma
 * repository access except via the exported service methods documented
 * in docs/ARCHITECTURE.md §7.
 *
 * Run with: npx depcruise src --config .dependency-cruiser.cjs
 */
module.exports = {
  forbidden: [
    {
      name: 'no-cross-module-reach-into-audit-log-internals',
      comment:
        'Only AuditLogModule may write audit_logs. Other modules must emit a domain ' +
        'event and let AuditLogListener consume it (docs/ARCHITECTURE_REVIEW.md ARCH-DECISION-17).',
      severity: 'error',
      from: { pathNot: '^src/modules/audit-log' },
      to: { path: '^src/modules/audit-log/audit-log\\.service' },
    },
    {
      name: 'no-direct-delivery-stop-status-write-outside-delivery-planning',
      comment:
        'delivery_stops.status = CONFIRMED may only be set via ' +
        'DeliveryPlanningService.recordOtpOutcome() (ARCH-DECISION-19). Only Otp (the ' +
        'caller) and the app/root wiring (module registration, not repository access) ' +
        'may reach into DeliveryPlanning at all.',
      severity: 'warn',
      from: {
        pathNot: '^src/modules/(delivery-planning|otp)|^src/app\\.module\\.ts$',
      },
      to: { path: '^src/modules/delivery-planning/delivery-planning\\.service' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
  },
};
