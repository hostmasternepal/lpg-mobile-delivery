import { Module } from '@nestjs/common';
import { DeliveryPlanningModule } from '../delivery-planning/delivery-planning.module';
import { NotificationModule } from '../notification/notification.module';
import { OtpController } from './otp.controller';
import { OtpService } from './otp.service';

/**
 * Responsibility (docs/ARCHITECTURE.md §9, ARCHITECTURE_REVIEW.md §E):
 * OTP generation/verification/expiry/attempt policy. Owns otp_codes.
 *
 * Hard rules preserved by this implementation:
 * - Hash with HMAC-SHA256 (config.otp.hmacSecret), never argon2 (ARCH-DECISION-10).
 * - Attempt/resend counters via Redis INCR (atomic), never read-then-write (ARCH-DECISION-11).
 * - A resend invalidates the prior ACTIVE code before issuing a new one (ARCH-DECISION-12).
 * - On success, calls DeliveryPlanningService.recordOtpOutcome('CONFIRMED') — never writes
 *   delivery_stops directly; manualOverride() calls recordManualOverride() instead, which
 *   is a distinct, wider-eligibility path (ARCH-DECISION-19).
 */
@Module({
  imports: [DeliveryPlanningModule, NotificationModule],
  controllers: [OtpController],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule {}
