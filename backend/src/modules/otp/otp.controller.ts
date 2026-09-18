import { Body, Controller, Param, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { ManualOverrideDto } from './dto/manual-override.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { OtpService } from './otp.service';

@Controller('delivery-stops')
export class OtpController {
  constructor(private readonly otp: OtpService) {}

  @Post(':id/start')
  @Permissions('delivery:start')
  start(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.otp.generate(id, user.userId);
  }

  // Per-actor rate limit in addition to the per-stop attempt/resend caps
  // enforced in OtpService (docs/ARCHITECTURE_REVIEW.md E-5/MED-6).
  @Post(':id/otp/verify')
  @Permissions('otp:verify')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  verify(@Param('id') id: string, @Body() dto: VerifyOtpDto, @CurrentUser() user: AuthenticatedUser) {
    return this.otp.verify(id, dto.code, user.userId);
  }

  @Post(':id/otp/resend')
  @Permissions('otp:resend')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  resend(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.otp.resend(id, user.userId);
  }

  @Post(':id/otp/manual-override')
  @Permissions('otp:manual-override')
  manualOverride(@Param('id') id: string, @Body() dto: ManualOverrideDto, @CurrentUser() user: AuthenticatedUser) {
    return this.otp.manualOverride(id, user.userId, dto.reason);
  }
}
