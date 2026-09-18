import { Module } from '@nestjs/common';
import { DeliveryPlanningModule } from '../delivery-planning/delivery-planning.module';
import { NotificationModule } from '../notification/notification.module';
import { OtpService } from './otp.service';

/**
 * Responsibility (docs/ARCHITECTURE.md §9, ARCHITECTURE_REVIEW.md §E):
 * OTP generation/verification/expiry/attempt policy. Owns otp_codes.
 *
 * Hard rules to preserve when implementing:
 * - Hash with HMAC-SHA256 (config.otp.hmacSecret), never argon2 (ARCH-DECISION-10).
 * - Attempt/resend counters via Redis INCR (atomic), never read-then-write (ARCH-DECISION-11).
 * - A resend must invalidate the prior ACTIVE code before issuing a new one (ARCH-DECISION-12).
 * - On success, call DeliveryPlanningService.recordOtpOutcome() — never write delivery_stops directly.
 * Scaffolded, not yet implemented.
 */
@Module({
  imports: [DeliveryPlanningModule, NotificationModule],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule {}
