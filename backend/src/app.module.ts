import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import configuration from './common/config/configuration';
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { AppController } from './app.controller';
import { IdentityAccessModule } from './modules/identity-access/identity-access.module';
import { RequestIntakeModule } from './modules/request-intake/request-intake.module';
import { VerificationModule } from './modules/verification/verification.module';
import { PriorityClassificationModule } from './modules/priority-classification/priority-classification.module';
import { DeliveryPlanningModule } from './modules/delivery-planning/delivery-planning.module';
import { OtpModule } from './modules/otp/otp.module';
import { NotificationModule } from './modules/notification/notification.module';
import { DashboardReportingModule } from './modules/dashboard-reporting/dashboard-reporting.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { ExternalIntegrationModule } from './modules/external-integration/external-integration.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    EventEmitterModule.forRoot(),
    // Login-endpoint and OTP-endpoint rate limiting (docs/ARCHITECTURE.md §6/§9,
    // ARCHITECTURE_REVIEW.md E-5) — a stricter per-route limit is applied
    // with @Throttle() once the Otp/IdentityAccess controllers are built out.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 20 }]),
    PrismaModule,
    RedisModule,
    IdentityAccessModule,
    RequestIntakeModule,
    VerificationModule,
    PriorityClassificationModule,
    DeliveryPlanningModule,
    OtpModule,
    NotificationModule,
    DashboardReportingModule,
    AuditLogModule,
    ExternalIntegrationModule,
  ],
  controllers: [AppController],
  providers: [
    // Order matters: authenticate first, then authorize. Both are global
    // and deny-by-default — see docs/ARCHITECTURE.md §6/§7/§15.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
