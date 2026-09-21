import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ActivatePolicyVersionDto } from './dto/activate-policy-version.dto';
import { AssessPriorityDto } from './dto/assess-priority.dto';
import { OverridePriorityDto } from './dto/override-priority.dto';
import { evaluatePredicate } from './priority-rule-engine';

@Injectable()
export class PriorityClassificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  /**
   * "Active" = the policy version with the latest non-null activatedAt.
   * Activating a new version never mutates old rows — it just inserts one
   * with a later timestamp — so past assessments stay attributable to the
   * policy version that was active when they were made (see assess()).
   */
  async getActivePolicyVersion() {
    const active = await this.prisma.priorityPolicyVersion.findFirst({
      where: { activatedAt: { not: null } },
      orderBy: { activatedAt: 'desc' },
      include: { rules: true },
    });
    if (!active) {
      throw new NotFoundException(
        'No active priority policy version exists. Run the seed script (backend/prisma/seed.ts).',
      );
    }
    return active;
  }

  async activatePolicyVersion(dto: ActivatePolicyVersionDto, actorId: string) {
    const created = await this.prisma.priorityPolicyVersion.create({
      data: {
        versionLabel: dto.versionLabel,
        scoringFormula: dto.scoringFormula ? (dto.scoringFormula as Prisma.InputJsonValue) : undefined,
        activatedAt: new Date(),
        activatedById: actorId,
      },
    });

    this.events.emit('priority.policy_version_activated', {
      policyVersionId: created.id,
      actorId,
      afterState: created,
      occurredAt: new Date(),
    });

    return created;
  }

  async listPriorityGroups() {
    return this.prisma.priorityGroup.findMany({ orderBy: { code: 'asc' } });
  }

  /**
   * REQ-023 / docs/ARCHITECTURE_REVIEW.md §C. Runs the active policy
   * version's rules (if any) against the request's own fields, unions
   * that with any manually-supplied groups, and REPLACES the request's
   * current group set with the union. Requires the request to have
   * already been verified — REQ-023 says "classify each VERIFIED
   * request" — classifying a not-yet-verified one would put priority
   * ahead of the verification gate the source document requires.
   *
   * When the active policy has no rules and no manual groups are
   * supplied, this legitimately results in an empty group set — it does
   * NOT invent a default group. OPEN-BUSINESS-DECISION-08/09 remain open.
   */
  async assess(requestId: string, dto: AssessPriorityDto, actorId: string) {
    const request = await this.prisma.request.findUnique({ where: { id: requestId } });
    if (!request) {
      throw new NotFoundException(`Request ${requestId} not found.`);
    }
    if (request.status === 'RECORDED') {
      throw new BadRequestException(
        `Request ${requestId} has not been verified yet — priority classification requires a verified request (REQ-023).`,
      );
    }

    const activePolicy = await this.getActivePolicyVersion();

    const matchedGroupIds = new Set<string>();
    for (const rule of activePolicy.rules) {
      if (
        evaluatePredicate(rule.predicate, {
          lpgNeedDescription: request.lpgNeedDescription,
          familyGroupStatus: request.familyGroupStatus,
        })
      ) {
        matchedGroupIds.add(rule.targetGroupId);
      }
    }

    if (dto.manualGroupCodes?.length) {
      const manualGroups = await this.prisma.priorityGroup.findMany({
        where: { code: { in: dto.manualGroupCodes } },
      });
      for (const group of manualGroups) {
        matchedGroupIds.add(group.id);
      }
    }

    const before = await this.getGroupsFor(requestId);

    await this.prisma.$transaction([
      this.prisma.requestPriorityGroup.deleteMany({ where: { requestId } }),
      this.prisma.requestPriorityGroup.createMany({
        data: Array.from(matchedGroupIds).map((priorityGroupId) => ({
          requestId,
          priorityGroupId,
          assessedUnderPolicyVersionId: activePolicy.id,
        })),
      }),
    ]);

    const after = await this.getGroupsFor(requestId);

    this.events.emit('priority.assessed', {
      requestId,
      actorId,
      policyVersionId: activePolicy.id,
      beforeState: before,
      afterState: after,
      occurredAt: new Date(),
    });

    return after;
  }

  /**
   * Human correction of a prior/automated classification — REPLACES the
   * group set (unlike assess(), which unions). Mandatory reason,
   * independently queryable via priority_overrides in addition to the
   * generic audit log (docs/ARCHITECTURE_REVIEW.md §C, closes HIGH-8).
   */
  async override(requestId: string, dto: OverridePriorityDto, actorId: string) {
    const request = await this.prisma.request.findUnique({ where: { id: requestId } });
    if (!request) {
      throw new NotFoundException(`Request ${requestId} not found.`);
    }

    const before = await this.getGroupsFor(requestId);
    const newGroups = await this.prisma.priorityGroup.findMany({
      where: { code: { in: dto.newGroupCodes } },
    });

    const overrideRecord = await this.prisma.$transaction(async (tx) => {
      await tx.requestPriorityGroup.deleteMany({ where: { requestId } });
      if (newGroups.length > 0) {
        await tx.requestPriorityGroup.createMany({
          data: newGroups.map((group) => ({ requestId, priorityGroupId: group.id })),
        });
      }
      return tx.priorityOverride.create({
        data: {
          requestId,
          previousGroups: before as unknown as Prisma.InputJsonValue,
          newGroups: newGroups as unknown as Prisma.InputJsonValue,
          actorId,
          reason: dto.reason,
        },
      });
    });

    const after = await this.getGroupsFor(requestId);

    this.events.emit('priority.overridden', {
      requestId,
      actorId,
      overrideId: overrideRecord.id,
      reason: dto.reason,
      beforeState: before,
      afterState: after,
      occurredAt: new Date(),
    });

    return after;
  }

  async getOverrideHistory(requestId: string) {
    return this.prisma.priorityOverride.findMany({
      where: { requestId },
      include: { actor: { select: { id: true, fullName: true, phoneOrUsername: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getGroupsFor(requestId: string) {
    return this.prisma.requestPriorityGroup.findMany({
      where: { requestId },
      include: { priorityGroup: true },
    });
  }
}
