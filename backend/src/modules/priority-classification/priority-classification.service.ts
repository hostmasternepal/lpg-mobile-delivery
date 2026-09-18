import { Injectable, NotImplementedException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class PriorityClassificationService {
  constructor(private readonly prisma: PrismaService) {}

  async assess(_requestId: string): Promise<never> {
    throw new NotImplementedException(
      'PriorityClassificationService.assess — runs active policy version rules; ' +
        'falls back to manual tagging when no rule matches (OPEN-BUSINESS-DECISION-08/09).',
    );
  }

  async override(_requestId: string, _newGroupIds: string[], _actorId: string, _reason: string): Promise<never> {
    // reason is mandatory (see priority_overrides.reason NOT NULL). Who may
    // call this is OPEN-BUSINESS-DECISION-39 — enforce via @Permissions()
    // on the controller once the RBAC matrix is ratified for this action.
    throw new NotImplementedException('PriorityClassificationService.override');
  }

  async getGroupsFor(requestId: string) {
    return this.prisma.requestPriorityGroup.findMany({
      where: { requestId },
      include: { priorityGroup: true },
    });
  }

  async activatePolicyVersion(): Promise<never> {
    throw new NotImplementedException('PriorityClassificationService.activatePolicyVersion');
  }
}
