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
 * Every business module named in docs/ARCHITECTURE.md §2's module table
 * now has its events wired here: IdentityAccess, RequestIntake,
 * Verification, PriorityClassification, DeliveryPlanning, Otp,
 * Notification, ExternalIntegration, and AuditLog-self.
 */
@Injectable()
export class AuditLogListener {
  constructor(private readonly auditLog: AuditLogService) {}

  @OnEvent('integration.inbound_received')
  async onInboundReceived(payload: {
    inboxEntryId: string;
    sourceChannel: string;
    externalReferenceId: string;
    occurredAt: Date;
  }) {
    await this.auditLog.record({
      action: 'INTEGRATION_INBOUND_RECEIVED',
      entityType: 'IntegrationInboxEntry',
      entityId: payload.inboxEntryId,
      afterState: { sourceChannel: payload.sourceChannel, externalReferenceId: payload.externalReferenceId },
    });
  }

  @OnEvent('integration.inbound_duplicate')
  async onInboundDuplicate(payload: {
    inboxEntryId: string;
    sourceChannel: string;
    externalReferenceId: string;
    occurredAt: Date;
  }) {
    await this.auditLog.record({
      action: 'INTEGRATION_INBOUND_DUPLICATE',
      entityType: 'IntegrationInboxEntry',
      entityId: payload.inboxEntryId,
      afterState: { sourceChannel: payload.sourceChannel, externalReferenceId: payload.externalReferenceId },
    });
  }

  @OnEvent('integration.inbound_processed')
  async onInboundProcessed(payload: { inboxEntryId: string; requestId: string; occurredAt: Date }) {
    await this.auditLog.record({
      action: 'INTEGRATION_INBOUND_PROCESSED',
      entityType: 'IntegrationInboxEntry',
      entityId: payload.inboxEntryId,
      afterState: { requestId: payload.requestId },
    });
  }

  @OnEvent('integration.inbound_failed')
  async onInboundFailed(payload: {
    inboxEntryId: string;
    sourceChannel: string;
    externalReferenceId: string;
    error: string;
    occurredAt: Date;
  }) {
    await this.auditLog.record({
      action: 'INTEGRATION_INBOUND_FAILED',
      entityType: 'IntegrationInboxEntry',
      entityId: payload.inboxEntryId,
      afterState: { sourceChannel: payload.sourceChannel, error: payload.error },
    });
  }

  @OnEvent('integration.outbound_dispatched')
  async onOutboundDispatched(payload: {
    planId: string;
    vehicleIdentifier: string;
    stopCount: number;
    actorId: string;
    occurredAt: Date;
  }) {
    await this.auditLog.record({
      actorId: payload.actorId,
      action: 'INTEGRATION_OUTBOUND_DISPATCHED',
      entityType: 'DeliveryPlan',
      entityId: payload.planId,
      afterState: { vehicleIdentifier: payload.vehicleIdentifier, stopCount: payload.stopCount },
    });
  }

  @OnEvent('integration.outbound_dispatch_failed')
  async onOutboundDispatchFailed(payload: {
    planId: string;
    vehicleIdentifier: string;
    actorId: string;
    error: string;
    occurredAt: Date;
  }) {
    await this.auditLog.record({
      actorId: payload.actorId,
      action: 'INTEGRATION_OUTBOUND_DISPATCH_FAILED',
      entityType: 'DeliveryPlan',
      entityId: payload.planId,
      afterState: { vehicleIdentifier: payload.vehicleIdentifier, error: payload.error },
    });
  }

  @OnEvent('otp.generated')
  async onOtpGenerated(payload: {
    stopId: string;
    otpCodeId: string;
    sent: boolean;
    occurredAt: Date;
  }) {
    await this.auditLog.record({
      action: payload.sent ? 'OTP_GENERATED' : 'OTP_SEND_FAILED',
      entityType: 'DeliveryStop',
      entityId: payload.stopId,
      afterState: { otpCodeId: payload.otpCodeId, sent: payload.sent },
    });
  }

  @OnEvent('otp.resent')
  async onOtpResent(payload: { stopId: string; actorId: string; sent: boolean; occurredAt: Date }) {
    await this.auditLog.record({
      actorId: payload.actorId,
      action: payload.sent ? 'OTP_RESENT' : 'OTP_RESEND_SEND_FAILED',
      entityType: 'DeliveryStop',
      entityId: payload.stopId,
    });
  }

  /**
   * The failure case is the audit-relevant one: it is what lets a
   * brute-force pattern be detected after the fact (docs/
   * ARCHITECTURE_REVIEW.md HIGH-4 — the pre-review design only named a
   * success event).
   */
  @OnEvent('otp.verification_failed')
  async onOtpVerificationFailed(payload: {
    stopId: string;
    actorId: string;
    reason: string;
    attemptsRemaining?: number;
    occurredAt: Date;
  }) {
    await this.auditLog.record({
      actorId: payload.actorId,
      action: `OTP_VERIFICATION_FAILED_${payload.reason.toUpperCase()}`,
      entityType: 'DeliveryStop',
      entityId: payload.stopId,
      afterState: { attemptsRemaining: payload.attemptsRemaining },
    });
  }

  @OnEvent('otp.verified')
  async onOtpVerified(payload: { stopId: string; actorId: string; occurredAt: Date }) {
    await this.auditLog.record({
      actorId: payload.actorId,
      action: 'OTP_VERIFIED',
      entityType: 'DeliveryStop',
      entityId: payload.stopId,
    });
  }

  @OnEvent('delivery.manual_override_confirmed')
  async onManualOverrideConfirmed(payload: {
    stopId: string;
    requestId: string;
    actorId: string;
    reason: string;
    beforeState: unknown;
    afterState: unknown;
    occurredAt: Date;
  }) {
    await this.auditLog.record({
      actorId: payload.actorId,
      action: 'DELIVERY_MANUAL_OVERRIDE_CONFIRMED',
      entityType: 'DeliveryStop',
      entityId: payload.stopId,
      beforeState: { ...(payload.beforeState as object), reason: payload.reason },
      afterState: payload.afterState,
    });
  }

  @OnEvent('notification.sent')
  async onNotificationSent(payload: {
    notificationId: string;
    deliveryStopId?: string;
    purpose: string;
    occurredAt: Date;
  }) {
    await this.auditLog.record({
      action: 'NOTIFICATION_SENT',
      entityType: 'Notification',
      entityId: payload.notificationId,
      afterState: { deliveryStopId: payload.deliveryStopId, purpose: payload.purpose },
    });
  }

  @OnEvent('notification.failed')
  async onNotificationFailed(payload: {
    notificationId: string;
    deliveryStopId?: string;
    purpose: string;
    error: string;
    occurredAt: Date;
  }) {
    await this.auditLog.record({
      action: 'NOTIFICATION_FAILED',
      entityType: 'Notification',
      entityId: payload.notificationId,
      afterState: { deliveryStopId: payload.deliveryStopId, purpose: payload.purpose, error: payload.error },
    });
  }

  @OnEvent('delivery.plan_created')
  async onPlanCreated(payload: { planId: string; actorId: string; afterState: unknown; occurredAt: Date }) {
    await this.auditLog.record({
      actorId: payload.actorId,
      action: 'DELIVERY_PLAN_CREATED',
      entityType: 'DeliveryPlan',
      entityId: payload.planId,
      afterState: payload.afterState,
    });
  }

  @OnEvent('delivery.vehicle_assigned')
  async onVehicleAssigned(payload: {
    planVehicleId: string;
    planId: string;
    actorId: string;
    afterState: unknown;
    occurredAt: Date;
  }) {
    await this.auditLog.record({
      actorId: payload.actorId,
      action: 'DELIVERY_VEHICLE_ASSIGNED',
      entityType: 'DeliveryPlanVehicle',
      entityId: payload.planVehicleId,
      afterState: payload.afterState,
    });
  }

  @OnEvent('delivery.vehicle_load_adjusted')
  async onVehicleLoadAdjusted(payload: {
    planVehicleId: string;
    actorId: string;
    beforeState: unknown;
    afterState: unknown;
    occurredAt: Date;
  }) {
    await this.auditLog.record({
      actorId: payload.actorId,
      action: 'DELIVERY_VEHICLE_LOAD_ADJUSTED',
      entityType: 'DeliveryPlanVehicle',
      entityId: payload.planVehicleId,
      beforeState: payload.beforeState,
      afterState: payload.afterState,
    });
  }

  @OnEvent('delivery.stop_assigned')
  async onStopAssigned(payload: {
    stopId: string;
    requestId: string;
    deliveryPlanVehicleId: string;
    actorId: string;
    afterState: unknown;
    occurredAt: Date;
  }) {
    await this.auditLog.record({
      actorId: payload.actorId,
      action: 'DELIVERY_STOP_ASSIGNED',
      entityType: 'DeliveryStop',
      entityId: payload.stopId,
      afterState: payload.afterState,
    });
  }

  @OnEvent('delivery.stops_sequenced')
  async onStopsSequenced(payload: {
    deliveryPlanVehicleId: string;
    actorId: string;
    orderedStopIds: string[];
    occurredAt: Date;
  }) {
    await this.auditLog.record({
      actorId: payload.actorId,
      action: 'DELIVERY_STOPS_SEQUENCED',
      entityType: 'DeliveryPlanVehicle',
      entityId: payload.deliveryPlanVehicleId,
      afterState: { orderedStopIds: payload.orderedStopIds },
    });
  }

  @OnEvent('delivery.stop_started')
  async onStopStarted(payload: { stopId: string; actorId: string; afterState: unknown; occurredAt: Date }) {
    await this.auditLog.record({
      actorId: payload.actorId,
      action: 'DELIVERY_STOP_STARTED',
      entityType: 'DeliveryStop',
      entityId: payload.stopId,
      afterState: payload.afterState,
    });
  }

  @OnEvent('delivery.stop_status_changed')
  async onStopStatusChanged(payload: {
    stopId: string;
    actorId: string;
    toStatus: string;
    afterState: unknown;
    occurredAt: Date;
  }) {
    await this.auditLog.record({
      actorId: payload.actorId,
      action: `DELIVERY_STOP_${payload.toStatus}`,
      entityType: 'DeliveryStop',
      entityId: payload.stopId,
      afterState: payload.afterState,
    });
  }

  @OnEvent('delivery.confirmed')
  async onDeliveryConfirmed(payload: {
    stopId: string;
    requestId: string;
    actorId: string;
    afterState: unknown;
    occurredAt: Date;
  }) {
    await this.auditLog.record({
      actorId: payload.actorId,
      action: 'DELIVERY_CONFIRMED',
      entityType: 'DeliveryStop',
      entityId: payload.stopId,
      afterState: payload.afterState,
    });
  }

  @OnEvent('delivery.stop_rescheduled')
  async onStopRescheduled(payload: {
    previousStopId: string;
    newStopId: string;
    actorId: string;
    afterState: unknown;
    occurredAt: Date;
  }) {
    await this.auditLog.record({
      actorId: payload.actorId,
      action: 'DELIVERY_STOP_RESCHEDULED',
      entityType: 'DeliveryStop',
      entityId: payload.newStopId,
      beforeState: { previousStopId: payload.previousStopId },
      afterState: payload.afterState,
    });
  }

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
