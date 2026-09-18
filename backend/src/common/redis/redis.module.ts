import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

/**
 * Single Redis connection for the monolith: refresh-token store (IdentityAccess),
 * OTP TTL + atomic attempt counters (Otp — ARCH-DECISION-11), and the SMS job
 * queue (Notification). See docs/ARCHITECTURE.md ARCH-DECISION-02.
 */
@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (config: ConfigService) => new Redis(config.get<string>('redisUrl')!),
      inject: [ConfigService],
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
