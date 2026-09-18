import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { createHmac, randomInt, timingSafeEqual } from 'crypto';
import Redis from 'ioredis';
import { PrismaService } from '../../common/prisma/prisma.service';
import { REDIS_CLIENT } from '../../common/redis/redis.module';
import { DeliveryStopStatus } from '../delivery-planning/delivery-stop-state-machine';
import { DeliveryPlanningService } from '../delivery-planning/delivery-planning.service';
import { NotificationService } from '../notification/notification.service';

const RESENDABLE_STATUSES: DeliveryStopStatus[] = ['OTP_SENT', 'OTP_SEND_FAILED', 'OTP_VERIFY_FAILED'];

export type VerifyOutcome =
  | { success: true; stop: unknown }
  | { success: false; reason: 'expired' | 'exhausted' | 'mismatch'; attemptsRemaining?: number; stop: unknown };

@Injectable()
export class OtpService {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
    private readonly deliveryPlanning: DeliveryPlanningService,
    private readonly notification: NotificationService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  /** ARCH-DECISION-10: HMAC-SHA256 keyed hash — never argon2 (see docs/ARCHITECTURE_REVIEW.md E-1). */
  private hashCode(code: string): string {
    const secret = this.config.get<string>('otp.hmacSecret');
    return createHmac('sha256', secret!).update(code).digest('hex');
  }

  private generateCode(): string {
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
  }

  /** Constant-time comparison to avoid a hash-comparison timing side channel. */
  private codesMatch(submittedCode: string, storedHash: string): boolean {
    const submittedHash = this.hashCode(submittedCode);
    const a = Buffer.from(submittedHash, 'hex');
    const b = Buffer.from(storedHash, 'hex');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  }

  private attemptsKey(otpCodeId: string): string {
    return `otp:attempts:${otpCodeId}`;
  }

  /**
   * Policy values live in `policy_settings`, seeded with defaults
   * explicitly labeled as pending OPEN-BUSINESS-DECISION-11 (see
   * backend/prisma/seed.ts) — never hardcoded here, so ratifying real
   * values is a data change, not a redeploy (closes review MED-3/B-4).
   */
  private async getPolicyNumber(key: string, fallback: number): Promise<number> {
    const setting = await this.prisma.policySetting.findUnique({ where: { key } });
    if (!setting || typeof setting.value !== 'number') {
      return fallback;
    }
    return setting.value;
  }

  /**
   * Generates and sends a code WITHOUT touching delivery_stops.status —
   * callers (generate/resend) decide what status transition, if any,
   * makes sense around this. ARCH-DECISION-12: any prior ACTIVE code for
   * this stop is invalidated in the same transaction before the new one
   * is inserted, so at most one ACTIVE code exists per stop at a time
   * (also enforced by the partial unique index at the DB level).
   */
  private async issueOtp(stopId: string): Promise<{ sent: boolean }> {
    const stop = await this.prisma.deliveryStop.findUnique({
      where: { id: stopId },
      include: { delivery: { include: { request: { include: { beneficiary: true } } } } },
    });
    if (!stop) {
      throw new NotFoundException(`Delivery stop ${stopId} not found.`);
    }

    const mobileNumber = stop.delivery.request.beneficiary?.mobileNumber;
    const expirySeconds = await this.getPolicyNumber('otp.expiry_seconds', 300);
    const maxAttempts = await this.getPolicyNumber('otp.max_verify_attempts', 3);

    const code = this.generateCode();
    const codeHash = this.hashCode(code);
    const expiresAt = new Date(Date.now() + expirySeconds * 1000);

    const otpCode = await this.prisma.$transaction(async (tx) => {
      await tx.otpCode.updateMany({ where: { deliveryStopId: stopId, status: 'ACTIVE' }, data: { status: 'EXPIRED' } });
      return tx.otpCode.create({
        data: { deliveryStopId: stopId, codeHash, attemptCount: 0, maxAttempts, expiresAt, status: 'ACTIVE' },
      });
    });

    // ARCH-DECISION-11: atomic counter, TTL mirrors the code's own expiry.
    await this.redis.set(this.attemptsKey(otpCode.id), 0, 'EX', expirySeconds);

    if (!mobileNumber) {
      // No fallback is defined for a phoneless/unreachable beneficiary
      // (OPEN-BUSINESS-DECISION-11) — treated as a send failure, visible
      // to the dispatcher, not a silent dead end.
      this.events.emit('otp.generated', { stopId, otpCodeId: otpCode.id, sent: false, occurredAt: new Date() });
      return { sent: false };
    }

    try {
      await this.notification.send({
        deliveryStopId: stopId,
        recipient: mobileNumber,
        purpose: 'OTP',
        message: `Your LPG delivery confirmation code is ${code}. It expires in ${Math.round(expirySeconds / 60)} minute(s).`,
      });
      this.events.emit('otp.generated', { stopId, otpCodeId: otpCode.id, sent: true, occurredAt: new Date() });
      return { sent: true };
    } catch {
      this.events.emit('otp.generated', { stopId, otpCodeId: otpCode.id, sent: false, occurredAt: new Date() });
      return { sent: false };
    }
  }

  /** POST /delivery-stops/:id/start. */
  async generate(stopId: string, actorId: string) {
    await this.deliveryPlanning.beginStopAttempt(stopId, actorId);
    const { sent } = await this.issueOtp(stopId);
    return this.deliveryPlanning.recordOtpOutcome(stopId, sent ? 'OTP_SENT' : 'OTP_SEND_FAILED', actorId);
  }

  /**
   * Resend is only meaningful once a first attempt exists. Cooldown and
   * max-resend caps are enforced from otp_codes history for this stop —
   * defaults again sourced from policy_settings, not hardcoded.
   */
  async resend(stopId: string, actorId: string) {
    const stop = await this.prisma.deliveryStop.findUnique({ where: { id: stopId } });
    if (!stop) {
      throw new NotFoundException(`Delivery stop ${stopId} not found.`);
    }
    if (!RESENDABLE_STATUSES.includes(stop.status as DeliveryStopStatus)) {
      throw new BadRequestException(`Cannot resend an OTP for stop ${stopId} in status ${stop.status}.`);
    }

    const history = await this.prisma.otpCode.findMany({
      where: { deliveryStopId: stopId },
      orderBy: { createdAt: 'desc' },
    });
    if (history.length === 0) {
      throw new BadRequestException(`No OTP has been generated yet for stop ${stopId} — call start first.`);
    }

    const cooldownSeconds = await this.getPolicyNumber('otp.resend_cooldown_seconds', 60);
    const maxResends = await this.getPolicyNumber('otp.max_resends', 3);

    const elapsedMs = Date.now() - history[0].createdAt.getTime();
    if (elapsedMs < cooldownSeconds * 1000) {
      const remaining = Math.ceil((cooldownSeconds * 1000 - elapsedMs) / 1000);
      throw new BadRequestException(`Resend cooldown active — try again in ${remaining}s.`);
    }

    const resendCount = history.length - 1; // history[0] is the most recent generate/resend
    if (resendCount >= maxResends) {
      throw new BadRequestException(`Maximum resends (${maxResends}) exceeded for stop ${stopId}.`);
    }

    // OTP_SEND_FAILED can't send again without re-entering IN_PROGRESS
    // first (see delivery-stop-state-machine.ts) — every other
    // resendable status can issue a new code directly.
    let workingStatus = stop.status as DeliveryStopStatus;
    if (workingStatus === 'OTP_SEND_FAILED') {
      await this.deliveryPlanning.beginStopAttempt(stopId, actorId);
      workingStatus = 'IN_PROGRESS';
    }

    const { sent } = await this.issueOtp(stopId);

    if (workingStatus !== 'OTP_SENT' || !sent) {
      // Already-OTP_SENT + successful resend needs no stop-status change
      // (a fresh code was issued, the stop's status doesn't move) — every
      // other combination is a real transition.
      await this.deliveryPlanning.recordOtpOutcome(stopId, sent ? 'OTP_SENT' : 'OTP_SEND_FAILED', actorId);
    }

    this.events.emit('otp.resent', { stopId, actorId, sent, occurredAt: new Date() });

    return this.prisma.deliveryStop.findUniqueOrThrow({ where: { id: stopId } });
  }

  /**
   * ARCH-DECISION-11: the attempt counter is incremented atomically
   * (Redis INCR) and checked on the RETURNED value — never fetched then
   * separately compared and written, which is exactly the TOCTOU race
   * docs/ARCHITECTURE_REVIEW.md CRIT-4 found in the pre-review design.
   * Only a matching code calls DeliveryPlanningService.recordOtpOutcome()
   * with CONFIRMED (docs/ARCHITECTURE.md §9 / REQ-028's guarantee).
   */
  async verify(stopId: string, submittedCode: string, actorId: string): Promise<VerifyOutcome> {
    const stop = await this.prisma.deliveryStop.findUnique({ where: { id: stopId } });
    if (!stop) {
      throw new NotFoundException(`Delivery stop ${stopId} not found.`);
    }
    if (stop.status !== 'OTP_SENT') {
      throw new BadRequestException(`Stop ${stopId} is ${stop.status}; there is no active OTP to verify.`);
    }

    const activeCode = await this.prisma.otpCode.findFirst({ where: { deliveryStopId: stopId, status: 'ACTIVE' } });
    if (!activeCode) {
      throw new BadRequestException(`No active OTP found for stop ${stopId}.`);
    }

    // Lazy expiry check (docs/ARCHITECTURE.md §9, E-2) — evaluated here,
    // not by a background sweep.
    if (activeCode.expiresAt.getTime() < Date.now()) {
      await this.prisma.otpCode.update({ where: { id: activeCode.id }, data: { status: 'EXPIRED' } });
      const updatedStop = await this.deliveryPlanning.recordOtpOutcome(stopId, 'OTP_VERIFY_FAILED', actorId);
      this.events.emit('otp.verification_failed', { stopId, actorId, reason: 'expired', occurredAt: new Date() });
      return { success: false, reason: 'expired', stop: updatedStop };
    }

    const newCount = await this.redis.incr(this.attemptsKey(activeCode.id));

    if (newCount > activeCode.maxAttempts) {
      // Already exhausted before this call (e.g. a stale/duplicate
      // submission) — reject outright without even comparing the code.
      await this.prisma.otpCode.update({
        where: { id: activeCode.id },
        data: { status: 'EXHAUSTED', attemptCount: newCount },
      });
      const updatedStop = await this.deliveryPlanning.recordOtpOutcome(stopId, 'OTP_VERIFY_FAILED', actorId);
      this.events.emit('otp.verification_failed', { stopId, actorId, reason: 'exhausted', occurredAt: new Date() });
      return { success: false, reason: 'exhausted', attemptsRemaining: 0, stop: updatedStop };
    }

    if (this.codesMatch(submittedCode, activeCode.codeHash)) {
      await this.prisma.otpCode.update({
        where: { id: activeCode.id },
        data: { status: 'VERIFIED', attemptCount: newCount },
      });
      const updatedStop = await this.deliveryPlanning.recordOtpOutcome(stopId, 'CONFIRMED', actorId);
      this.events.emit('otp.verified', { stopId, actorId, occurredAt: new Date() });
      return { success: true, stop: updatedStop };
    }

    const attemptsRemaining = activeCode.maxAttempts - newCount;
    if (attemptsRemaining <= 0) {
      await this.prisma.otpCode.update({
        where: { id: activeCode.id },
        data: { status: 'EXHAUSTED', attemptCount: newCount },
      });
      const updatedStop = await this.deliveryPlanning.recordOtpOutcome(stopId, 'OTP_VERIFY_FAILED', actorId);
      this.events.emit('otp.verification_failed', { stopId, actorId, reason: 'exhausted', occurredAt: new Date() });
      return { success: false, reason: 'exhausted', attemptsRemaining: 0, stop: updatedStop };
    }

    this.events.emit('otp.verification_failed', {
      stopId,
      actorId,
      reason: 'mismatch',
      attemptsRemaining,
      occurredAt: new Date(),
    });
    return { success: false, reason: 'mismatch', attemptsRemaining, stop };
  }

  /**
   * Named per ARCH-DECISION-19's explicit requirement for a distinct,
   * mandatorily-reasoned method — the real state-mutation logic lives in
   * DeliveryPlanningService (which owns delivery_stops), since this is
   * still "never a generic status setter," just one reachable from the
   * OTP context. Who may call it is OPEN-BUSINESS-DECISION-40; enforced
   * for now via the `otp:manual-override` permission on the controller.
   */
  async manualOverride(stopId: string, actorId: string, reason: string) {
    return this.deliveryPlanning.recordManualOverride(stopId, actorId, reason);
  }
}
