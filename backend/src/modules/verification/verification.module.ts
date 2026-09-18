import { Module } from '@nestjs/common';
import { RequestIntakeModule } from '../request-intake/request-intake.module';
import { VerificationService } from './verification.service';

/**
 * Responsibility (docs/ARCHITECTURE.md §2/§7): records verification
 * attempts (REQ-019/022) and REQUESTS a status transition via
 * RequestIntakeModule — never sets requests.status itself.
 * Scaffolded, not yet implemented.
 */
@Module({
  imports: [RequestIntakeModule],
  providers: [VerificationService],
  exports: [VerificationService],
})
export class VerificationModule {}
