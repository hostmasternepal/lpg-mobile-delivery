import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { ListRequestsQueryDto } from './dto/list-requests-query.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { getValidPredecessors, RequestStatus } from './request-state-machine';

const REQUEST_INCLUDE = {
  beneficiary: true,
  priorityGroups: { include: { priorityGroup: true } },
} satisfies Prisma.RequestInclude;

@Injectable()
export class RequestIntakeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  /**
   * REQ-016/017/018. Beneficiary rows are reused by exact mobile-number
   * match rather than duplicated on every request — a structural,
   * non-invented step toward REQ-022's duplicate reduction. This is NOT a
   * resolution of OPEN-BUSINESS-DECISION-06 (the fuzzy matching/merge
   * *policy* for REQUESTS themselves stays open); it only avoids an
   * obviously redundant Beneficiary row when the phone number is
   * identical.
   */
  async createRequest(dto: CreateRequestDto, actorId: string) {
    const beneficiaryId = await this.findOrCreateBeneficiary(dto);

    const request = await this.prisma.request.create({
      data: {
        beneficiaryId,
        lpgNeedDescription: dto.lpgNeedDescription,
        familyGroupStatus: dto.familyGroupStatus,
        sourceChannel: dto.sourceChannel,
        requestedAt: dto.requestedAt ? new Date(dto.requestedAt) : undefined,
        createdById: actorId,
        status: 'RECORDED',
        version: 0,
      },
      include: REQUEST_INCLUDE,
    });

    this.events.emit('request.created', {
      requestId: request.id,
      actorId,
      sourceChannel: request.sourceChannel,
      afterState: request,
      occurredAt: new Date(),
    });

    return request;
  }

  async updateRequest(id: string, dto: UpdateRequestDto, actorId: string) {
    const existing = await this.prisma.request.findUnique({
      where: { id },
      include: REQUEST_INCLUDE,
    });
    if (!existing) {
      throw new NotFoundException(`Request ${id} not found.`);
    }

    if (existing.beneficiaryId && this.hasBeneficiaryFields(dto)) {
      await this.prisma.beneficiary.update({
        where: { id: existing.beneficiaryId },
        data: {
          name: dto.beneficiaryName ?? undefined,
          mobileNumber: dto.mobileNumber ?? undefined,
          addressText: dto.addressText ?? undefined,
          location: dto.location ? (dto.location as unknown as Prisma.InputJsonValue) : undefined,
        },
      });
    } else if (!existing.beneficiaryId && this.hasBeneficiaryFields(dto)) {
      const beneficiaryId = await this.findOrCreateBeneficiary(dto);
      await this.prisma.request.update({ where: { id }, data: { beneficiaryId } });
    }

    const updated = await this.prisma.request.update({
      where: { id },
      data: {
        lpgNeedDescription: dto.lpgNeedDescription ?? undefined,
        familyGroupStatus: dto.familyGroupStatus ?? undefined,
      },
      include: REQUEST_INCLUDE,
    });

    this.events.emit('request.updated', {
      requestId: id,
      actorId,
      beforeState: existing,
      afterState: updated,
      occurredAt: new Date(),
    });

    return updated;
  }

  async getRequest(id: string) {
    const request = await this.prisma.request.findUnique({ where: { id }, include: REQUEST_INCLUDE });
    if (!request) {
      throw new NotFoundException(`Request ${id} not found.`);
    }
    return request;
  }

  async listRequests(query: ListRequestsQueryDto) {
    const where: Prisma.RequestWhereInput = {
      status: query.status,
      sourceChannel: query.sourceChannel,
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.request.findMany({
        where,
        include: REQUEST_INCLUDE,
        orderBy: { createdAt: 'desc' },
        take: query.limit,
        skip: query.offset,
      }),
      this.prisma.request.count({ where }),
    ]);
    return { items, total, limit: query.limit, offset: query.offset };
  }

  /**
   * ARCH-DECISION-18: the ONLY method in the system permitted to write
   * requests.status. Atomic in a single conditional update — the WHERE
   * clause checks id + version + "current status is a legal predecessor
   * of `toStatus`" all at once, so two concurrent transition() calls on
   * the same row can never both succeed (closes docs/ARCHITECTURE_REVIEW.md
   * I-2/I-3). The caller supplies `expectedVersion` from whatever read
   * of the request it last performed.
   */
  async transition(requestId: string, toStatus: RequestStatus, actorId: string, expectedVersion: number) {
    const validFromStatuses = getValidPredecessors(toStatus);
    if (validFromStatuses.length === 0) {
      // toStatus has no legal predecessor at all (e.g. PENDING/REJECTED —
      // see request-state-machine.ts). This is a caller bug, not a race.
      throw new BadRequestException(
        `No transition into ${toStatus} is defined. See OPEN-BUSINESS-DECISION-07/12.`,
      );
    }

    const beforeState = await this.prisma.request.findUnique({ where: { id: requestId } });
    if (!beforeState) {
      throw new NotFoundException(`Request ${requestId} not found.`);
    }

    const result = await this.prisma.request.updateMany({
      where: {
        id: requestId,
        version: expectedVersion,
        status: { in: validFromStatuses },
      },
      data: {
        status: toStatus,
        version: { increment: 1 },
      },
    });

    if (result.count === 0) {
      // Re-fetch only to produce an accurate error — the update itself
      // already failed atomically; this read cannot un-fail it.
      const current = await this.prisma.request.findUnique({ where: { id: requestId } });
      if (!current) {
        throw new NotFoundException(`Request ${requestId} not found.`);
      }
      if (current.version !== expectedVersion) {
        throw new ConflictException(
          `Request ${requestId} was modified concurrently (expected version ${expectedVersion}, found ${current.version}). Reload and retry.`,
        );
      }
      throw new BadRequestException(
        `Illegal transition: request ${requestId} is in status ${current.status}, cannot move to ${toStatus}.`,
      );
    }

    const afterState = await this.prisma.request.findUnique({ where: { id: requestId }, include: REQUEST_INCLUDE });

    this.events.emit('request.status_changed', {
      requestId,
      actorId,
      fromStatus: beforeState.status,
      toStatus,
      beforeState,
      afterState,
      occurredAt: new Date(),
    });

    return afterState;
  }

  private hasBeneficiaryFields(dto: UpdateRequestDto): boolean {
    return Boolean(dto.beneficiaryName || dto.mobileNumber || dto.addressText || dto.location);
  }

  private async findOrCreateBeneficiary(
    dto: Pick<CreateRequestDto, 'beneficiaryName' | 'mobileNumber' | 'addressText' | 'location'>,
  ): Promise<string | undefined> {
    const hasAnyBeneficiaryData = dto.beneficiaryName || dto.mobileNumber || dto.addressText || dto.location;
    if (!hasAnyBeneficiaryData) {
      return undefined;
    }

    if (dto.mobileNumber) {
      const existing = await this.prisma.beneficiary.findFirst({
        where: { mobileNumber: dto.mobileNumber },
        orderBy: { createdAt: 'desc' },
      });
      if (existing) {
        return existing.id;
      }
    }

    const created = await this.prisma.beneficiary.create({
      data: {
        name: dto.beneficiaryName,
        mobileNumber: dto.mobileNumber,
        addressText: dto.addressText,
        location: dto.location ? (dto.location as unknown as Prisma.InputJsonValue) : undefined,
      },
    });
    return created.id;
  }
}
