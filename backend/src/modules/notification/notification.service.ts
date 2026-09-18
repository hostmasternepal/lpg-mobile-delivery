import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly config: ConfigService) {}

  async send(input: SendNotificationInput): Promise<void> {
    const provider = this.config.get<string>('sms.provider');
    if (provider === 'noop') {
      this.logger.log(`[noop SMS provider] to=${input.recipient} purpose=${input.purpose}`);
      return;
    }
    throw new NotImplementedException(
      `NotificationService.send — no adapter implemented for SMS_PROVIDER=${provider} yet (OPEN-BUSINESS-DECISION-31).`,
    );
  }
}
