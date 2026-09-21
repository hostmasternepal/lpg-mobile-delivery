import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';

/**
 * Responsibility (docs/ARCHITECTURE.md §10): async outbound SMS dispatch
 * behind an ISmsProvider abstraction (provider itself is
 * OPEN-BUSINESS-DECISION-31 — 'noop' provider used until then, see
 * common/config/configuration.ts sms.provider). Owns notifications.
 * Scaffolded, not yet implemented (queueing via BullMQ/Redis is the next
 * step — send() currently only defines the interface).
 */
@Module({
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
