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
 * As each business module (DeliveryPlanning, Otp, ExternalIntegration) is
 * built out, it emits its own domain events (see the catalog in
 * docs/ARCHITECTURE_REVIEW.md §G) and a handler is added here.
 * IdentityAccess, RequestIntake, Verification, PriorityClassification,
 * and AuditLog-self events are wired so far.
 */
@Injectable()
export class AuditLogListener {
  constructor(private readonly auditLog: AuditLogService) {}

  @OnEvent('priority.assessed')
  async onPriorityAssessed(payload: {
    requestId: string;
    actorId: string;
    policyVersionId: string;
    beforeState: unknown;
    afterState: unknown;
    occurredAt: Date;
  }) {
    await this.auditLog.record({
      actorId: payload.actorId,
      action: 'PRIORITY_ASSESSED',
      entityType: 'Request',
      entityId: payload.requestId,
      beforeState: payload.beforeState,
      afterState: payload.afterState,
    });
  }

  @OnEvent('priority.overridden')
  async onPriorityOverridden(payload: {
    requestId: string;
    actorId: string;
    overrideId: string;
    reason: string;
    beforeState: unknown;
    afterState: unknown;
    occurredAt: Date;
  }) {
    await this.auditLog.record({
      actorId: payload.actorId,
      action: 'PRIORITY_OVERRIDDEN',
      entityType: 'Request',
      entityId: payload.requestId,
      beforeState: payload.beforeState,
      afterState: payload.afterState,
    });
  }

  @OnEvent('priority.policy_version_activated')
  async onPolicyVersionActivated(payload: {
    policyVersionId: string;
    actorId: string;
    afterState: unknown;
    occurredAt: Date;
  }) {
    await this.auditLog.record({
      actorId: payload.actorId,
      action: 'PRIORITY_POLICY_VERSION_ACTIVATED',
      entityType: 'PriorityPolicyVersion',
      entityId: payload.policyVersionId,
      afterState: payload.afterState,
    });
  }

  @OnEvent('verification.recorded')
  async onVerificationRecorded(payload: {
    requestId: string;
    actorId: string;
    verificationId: string;
    method: string;
    outcome: string;
    afterState: unknown;
    occurredAt: Date;
  }) {
    await this.auditLog.record({
      actorId: payload.actorId,
      action: `VERIFICATION_${payload.outcome}`,
      entityType: 'Request',
      entityId: payload.requestId,
      afterState: payload.afterState,
    });
  }

  @OnEvent('request.created')
  async onRequestCreated(payload: { requestId: string; actorId: string; afterState: unknown; occurredAt: Date }) {
    await this.auditLog.record({
      actorId: payload.actorId,
      action: 'REQUEST_CREATED',
      entityType: 'Request',
      entityId: payload.requestId,
      afterState: payload.afterState,
    });
  }

  @OnEvent('request.updated')
  async onRequestUpdated(payload: {
    requestId: string;
    actorId: string;
    beforeState: unknown;
    afterState: unknown;
    occurredAt: Date;
  }) {
    await this.auditLog.record({
      actorId: payload.actorId,
      action: 'REQUEST_UPDATED',
      entityType: 'Request',
      entityId: payload.requestId,
      beforeState: payload.beforeState,
      afterState: payload.afterState,
    });
  }

  @OnEvent('request.status_changed')
  async onRequestStatusChanged(payload: {
    requestId: string;
    actorId: string;
    fromStatus: string;
    toStatus: string;
    beforeState: unknown;
    afterState: unknown;
    occurredAt: Date;
  }) {
    await this.auditLog.record({
      actorId: payload.actorId,
      action: `REQUEST_STATUS_CHANGED_${payload.fromStatus}_TO_${payload.toStatus}`,
      entityType: 'Request',
      entityId: payload.requestId,
      beforeState: payload.beforeState,
      afterState: payload.afterState,
    });
  }

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
