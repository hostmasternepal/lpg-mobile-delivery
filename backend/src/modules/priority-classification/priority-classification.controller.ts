import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { ActivatePolicyVersionDto } from './dto/activate-policy-version.dto';
import { AssessPriorityDto } from './dto/assess-priority.dto';
import { OverridePriorityDto } from './dto/override-priority.dto';
import { PriorityClassificationService } from './priority-classification.service';

@Controller()
export class PriorityClassificationController {
  constructor(private readonly priorityClassification: PriorityClassificationService) {}

  @Get('priority-groups')
  @Permissions('request:read')
  listGroups() {
    return this.priorityClassification.listPriorityGroups();
  }

  @Post('priority-policy-versions')
  @Permissions('priority-policy:manage')
  activatePolicyVersion(@Body() dto: ActivatePolicyVersionDto, @CurrentUser() user: AuthenticatedUser) {
    return this.priorityClassification.activatePolicyVersion(dto, user.userId);
  }

  @Get('priority-policy-versions/active')
  @Permissions('priority-policy:manage')
  getActivePolicyVersion() {
    return this.priorityClassification.getActivePolicyVersion();
  }

  @Post('requests/:id/priority-groups')
  @Permissions('request:classify-priority')
  assess(@Param('id') id: string, @Body() dto: AssessPriorityDto, @CurrentUser() user: AuthenticatedUser) {
    return this.priorityClassification.assess(id, dto, user.userId);
  }

  @Get('requests/:id/priority-groups')
  @Permissions('request:read')
  getGroups(@Param('id') id: string) {
    return this.priorityClassification.getGroupsFor(id);
  }

  @Post('requests/:id/priority-override')
  @Permissions('request:classify-priority')
  override(@Param('id') id: string, @Body() dto: OverridePriorityDto, @CurrentUser() user: AuthenticatedUser) {
    return this.priorityClassification.override(id, dto, user.userId);
  }

  @Get('requests/:id/priority-overrides')
  @Permissions('request:read')
  getOverrideHistory(@Param('id') id: string) {
    return this.priorityClassification.getOverrideHistory(id);
  }
}
