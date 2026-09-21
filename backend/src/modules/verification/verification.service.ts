import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RequestIntakeService } from '../request-intake/request-intake.service';
import { RecordVerificationDto } from './dto/record-verification.dto';

@Injectable()
export class VerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly requestIntake: RequestIntakeService,
    private readonly events: EventEmitter2,
  ) {}

  /**
   * REQ-019/022. Records the verification attempt unconditionally, then
   * — only on a CONFIRMED outcome — asks RequestIntakeService to move
   * the request to VERIFIED. This service NEVER writes requests.status
   * itself (docs/ARCHITECTURE.md §2 boundary rule 1); a FAILED outcome
   * is history only, since no rejection/failure path is defined
   * (OPEN-BUSINESS-DECISION-07) — the request simply stays where it was,
   * available for a future re-attempt.
   */
  async recordVerification(requestId: string, dto: RecordVerificationDto, actorId: string) {
    const request = await this.prisma.request.findUnique({ where: { id: requestId } });
    if (!request) {
      throw new NotFoundException(`Request ${requestId} not found.`);
    }

    const outcome = await this.prisma.verificationOutcome.findUnique({ where: { code: dto.outcome } });
    if (!outcome) {
      // Seed data (backend/prisma/seed.ts) is expected to always provide
      // CONFIRMED/FAILED — reaching here means the seed hasn't run.
      throw new BadRequestException(`Unknown verification outcome '${dto.outcome}'.`);
    }

    const verification = await this.prisma.verification.create({
      data: {
        requestId,
        verifiedById: actorId,
        method: dto.method,
        outcomeId: outcome.id,
        notes: dto.notes,
      },
    });

    this.events.emit('verification.recorded', {
      requestId,
      actorId,
      verificationId: verification.id,
      method: dto.method,
      outcome: dto.outcome,
      afterState: verification,
      occurredAt: new Date(),
    });

    if (dto.outcome === 'CONFIRMED') {
      const updatedRequest = await this.requestIntake.transition(requestId, 'VERIFIED', actorId, dto.expectedVersion);
      return { verification, request: updatedRequest };
    }

    return { verification, request };
  }

  async getVerificationHistory(requestId: string) {
    return this.prisma.verification.findMany({
      where: { requestId },
      include: { outcome: true, verifiedBy: { select: { id: true, fullName: true, phoneOrUsername: true } } },
      orderBy: { verifiedAt: 'desc' },
    });
  }

  /**
   * Closes docs/ARCHITECTURE_REVIEW.md I-1: a structural, non-invented
   * safety net for duplicate detection. Since RequestIntakeService
   * already reuses a Beneficiary row on an exact mobile-number match
   * (see request-intake.service.ts findOrCreateBeneficiary), two
   * requests for the same phone number already share one
   * beneficiaryId — so "candidates" is simply every other request
   * against that same beneficiary. This surfaces information to the
   * VerificationOfficer; it does not itself merge, reject, or resolve
   * anything — the matching/merge *policy* remains OPEN-BUSINESS-DECISION-06.
   */
  async findDuplicateCandidates(requestId: string) {
    const request = await this.prisma.request.findUnique({ where: { id: requestId } });
    if (!request) {
      throw new NotFoundException(`Request ${requestId} not found.`);
    }
    if (!request.beneficiaryId) {
      return [];
    }
    return this.prisma.request.findMany({
      where: {
        beneficiaryId: request.beneficiaryId,
        id: { not: requestId },
      },
      include: { beneficiary: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
