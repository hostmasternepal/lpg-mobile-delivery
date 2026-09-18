import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface SendNotificationInput {
  deliveryStopId?: string;
  recipient: string;
  purpose: 'OTP' | 'STATUS_UPDATE';
  message: string;
}

/**
 * ISmsProvider abstraction point (docs/ARCHITECTURE.md §10). The real
 * provider is OPEN-BUSINESS-DECISION-31; `noop` (default) logs instead of
 * sending, so local dev/tests never depend on a real gateway or budget.
 *
 * Every call is persisted to `notifications` before dispatch is even
 * attempted, and updated to SENT/FAILED afterward — this is what makes
 * "SMS send attempted / SMS send failed" auditable (docs/
 * ARCHITECTURE_REVIEW.md §G catalog), and what lets a dispatcher answer
 * "did the beneficiary actually receive the OTP?" after the fact.
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  async send(input: SendNotificationInput): Promise<void> {
    const notification = await this.prisma.notification.create({
      data: {
        deliveryStopId: input.deliveryStopId,
        channel: 'SMS',
        recipient: input.recipient,
        purpose: input.purpose,
        status: 'QUEUED',
      },
    });

    try {
      await this.dispatch(input);
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: { status: 'SENT', sentAt: new Date() },
      });
      this.events.emit('notification.sent', {
        notificationId: notification.id,
        deliveryStopId: input.deliveryStopId,
        purpose: input.purpose,
        occurredAt: new Date(),
      });
    } catch (err) {
      await this.prisma.notification.update({ where: { id: notification.id }, data: { status: 'FAILED' } });
      this.events.emit('notification.failed', {
        notificationId: notification.id,
        deliveryStopId: input.deliveryStopId,
        purpose: input.purpose,
        error: err instanceof Error ? err.message : String(err),
        occurredAt: new Date(),
      });
      throw err;
    }
  }

  private async dispatch(input: SendNotificationInput): Promise<void> {
    const provider = this.config.get<string>('sms.provider');
    if (provider === 'noop') {
      this.logger.log(`[noop SMS provider] to=${input.recipient} purpose=${input.purpose}`);
      return;
    }
    throw new Error(`No adapter implemented for SMS_PROVIDER=${provider} yet (OPEN-BUSINESS-DECISION-31).`);
  }
}
