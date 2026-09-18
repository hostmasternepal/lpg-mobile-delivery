import { Module } from '@nestjs/common';
import { RequestIntakeModule } from '../request-intake/request-intake.module';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';

/**
 * Responsibility (docs/ARCHITECTURE.md §2/§7): records verification
 * attempts (REQ-019/022) and REQUESTS a status transition via
 * RequestIntakeModule — never sets requests.status itself. Also surfaces
 * exact-beneficiary duplicate candidates (docs/ARCHITECTURE_REVIEW.md I-1).
 */
@Module({
  imports: [RequestIntakeModule],
  controllers: [VerificationController],
  providers: [VerificationService],
  exports: [VerificationService],
})
export class VerificationModule {}
