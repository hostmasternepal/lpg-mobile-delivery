import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { RecordVerificationDto } from './dto/record-verification.dto';
import { VerificationService } from './verification.service';

@Controller('requests')
export class VerificationController {
  constructor(private readonly verification: VerificationService) {}

  @Post(':id/verify')
  @Permissions('request:verify')
  record(@Param('id') id: string, @Body() dto: RecordVerificationDto, @CurrentUser() user: AuthenticatedUser) {
    return this.verification.recordVerification(id, dto, user.userId);
  }

  @Get(':id/verifications')
  @Permissions('request:read')
  history(@Param('id') id: string) {
    return this.verification.getVerificationHistory(id);
  }

  @Get(':id/duplicate-candidates')
  @Permissions('request:verify')
  duplicateCandidates(@Param('id') id: string) {
    return this.verification.findDuplicateCandidates(id);
  }
}
