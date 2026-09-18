import { Inject, Injectable, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { createHmac, randomInt } from 'crypto';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../common/redis/redis.module';
import { DeliveryPlanningService } from '../delivery-planning/delivery-planning.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class OtpService {
  constructor(
    private readonly config: ConfigService,
    private readonly events: EventEmitter2,
    private readonly deliveryPlanning: DeliveryPlanningService,
    private readonly notification: NotificationService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  /** ARCH-DECISION-10: HMAC-SHA256 keyed hash — not argon2 (see docs/ARCHITECTURE_REVIEW.md E-1). */
  private hashCode(code: string): string {
    const secret = this.config.get<string>('otp.hmacSecret');
    return createHmac('sha256', secret!).update(code).digest('hex');
  }

  private generateCode(): string {
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
  }

  async generate(_deliveryStopId: string): Promise<never> {
    // ARCH-DECISION-12: must invalidate any prior ACTIVE otp for this stop
    // (atomically, same transaction/pipeline) before storing the new one.
    throw new NotImplementedException('OtpService.generate');
  }

  async verify(_deliveryStopId: string, _submittedCode: string): Promise<never> {
    // ARCH-DECISION-11: attempt counter must be incremented atomically
    // (Redis INCR, checked on the returned value) — never fetch-then-write.
    // On success: this.deliveryPlanning.recordOtpOutcome(stopId, 'CONFIRMED').
    // On failure: emit OtpVerificationFailedEvent (audited — closes HIGH-4).
    throw new NotImplementedException('OtpService.verify');
  }

  async resend(_deliveryStopId: string): Promise<never> {
    throw new NotImplementedException('OtpService.resend');
  }

  /**
   * Sanctioned bypass of the OTP gate after exhaustion/expiry. Mandatory
   * reason, always audited. Who may call this is OPEN-BUSINESS-DECISION-40
   * — enforce via @Permissions() once ratified, not by omission here.
   */
  async manualOverride(_deliveryStopId: string, _actorId: string, _reason: string): Promise<never> {
    throw new NotImplementedException('OtpService.manualOverride');
  }
}
