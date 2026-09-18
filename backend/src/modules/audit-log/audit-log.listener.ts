import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuditLogService } from './audit-log.service';

/**
 * Domain-event-driven capture, per docs/ARCHITECTURE.md §2 boundary rule 5
 * and ARCH-DECISION-17: this is the ONLY audit capture mechanism (the
 * pre-review design's second path — an HTTP interceptor — was removed
 * because running both risked duplicate or inconsistent audit rows,
 * closing docs/ARCHITECTURE_REVIEW.md A-5/MED-1).
 *
 * As each business module (RequestIntake, Verification,
 * PriorityClassification, DeliveryPlanning, Otp, ExternalIntegration) is
 * built out, it emits its own domain events (see the catalog in
 * docs/ARCHITECTURE_REVIEW.md §G) and a handler is added here. Only the
 * IdentityAccess and AuditLog-self events exist so far.
 */
@Injectable()
export class AuditLogListener {
  constructor(private readonly auditLog: AuditLogService) {}

  @OnEvent('identity.login_succeeded')
  async onLoginSucceeded(payload: { actorId: string; occurredAt: Date }) {
    await this.auditLog.record({
      actorId: payload.actorId,
      action: 'USER_LOGGED_IN',
      entityType: 'User',
      entityId: payload.actorId,
    });
  }

  @OnEvent('identity.login_failed')
  async onLoginFailed(payload: { phoneOrUsername: string; occurredAt: Date }) {
    await this.auditLog.record({
      actorId: null,
      action: 'USER_LOGIN_FAILED',
      entityType: 'User',
      entityId: payload.phoneOrUsername,
    });
  }

  @OnEvent('audit.log_queried')
  async onAuditLogQueried(payload: { actorId: string; filters: unknown; occurredAt: Date }) {
    await this.auditLog.record({
      actorId: payload.actorId,
      action: 'AUDIT_LOG_QUERIED',
      entityType: 'AuditLog',
      entityId: payload.actorId,
      afterState: payload.filters,
    });
  }
}
