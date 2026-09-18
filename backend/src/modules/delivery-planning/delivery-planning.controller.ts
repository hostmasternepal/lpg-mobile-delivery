import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { AdjustVehicleLoadDto } from './dto/adjust-vehicle-load.dto';
import { AssignStopDto } from './dto/assign-stop.dto';
import { AssignVehicleDto } from './dto/assign-vehicle.dto';
import { CreateAgentProfileDto } from './dto/create-agent-profile.dto';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { ExpectedVersionDto } from './dto/expected-version.dto';
import { GeneratePlanDto } from './dto/generate-plan.dto';
import { RescheduleStopDto } from './dto/reschedule-stop.dto';
import { SequenceStopsDto } from './dto/sequence-stops.dto';
import { DeliveryPlanningService } from './delivery-planning.service';

@Controller()
export class DeliveryPlanningController {
  constructor(private readonly deliveryPlanning: DeliveryPlanningService) {}

  // --- Queue (REQ-020/021) ---

  @Post('requests/:id/shortlist')
  @Permissions('request:shortlist')
  shortlist(@Param('id') id: string, @Body() dto: ExpectedVersionDto, @CurrentUser() user: AuthenticatedUser) {
    return this.deliveryPlanning.shortlistRequest(id, user.userId, dto.expectedVersion);
  }

  @Post('requests/:id/queue')
  @Permissions('request:queue')
  queue(@Param('id') id: string, @Body() dto: ExpectedVersionDto, @CurrentUser() user: AuthenticatedUser) {
    return this.deliveryPlanning.queueRequest(id, user.userId, dto.expectedVersion);
  }

  @Get('delivery-queue')
  @Permissions('delivery-plan:read')
  getQueue() {
    return this.deliveryPlanning.getQueue();
  }

  // --- Fleet ---

  @Post('vehicles')
  @Permissions('delivery:assign')
  createVehicle(@Body() dto: CreateVehicleDto) {
    return this.deliveryPlanning.createVehicle(dto);
  }

  @Get('vehicles')
  @Permissions('delivery-plan:read')
  listVehicles() {
    return this.deliveryPlanning.listVehicles();
  }

  @Post('agent-profiles')
  @Permissions('delivery:assign')
  createAgentProfile(@Body() dto: CreateAgentProfileDto) {
    return this.deliveryPlanning.createAgentProfile(dto);
  }

  @Get('agent-profiles')
  @Permissions('delivery-plan:read')
  listAgentProfiles() {
    return this.deliveryPlanning.listAgentProfiles();
  }

  // --- Plans ---

  @Post('delivery-plans')
  @Permissions('delivery-plan:create')
  generatePlan(@Body() dto: GeneratePlanDto, @CurrentUser() user: AuthenticatedUser) {
    return this.deliveryPlanning.generatePlan(dto, user.userId);
  }

  @Get('delivery-plans')
  @Permissions('delivery-plan:read')
  listPlans() {
    return this.deliveryPlanning.listPlans();
  }

  @Get('delivery-plans/:id')
  @Permissions('delivery-plan:read')
  getPlan(@Param('id') id: string) {
    return this.deliveryPlanning.getPlan(id);
  }

  @Post('delivery-plans/:id/vehicles')
  @Permissions('delivery:assign')
  assignVehicle(@Param('id') id: string, @Body() dto: AssignVehicleDto, @CurrentUser() user: AuthenticatedUser) {
    return this.deliveryPlanning.assignVehicle(id, dto, user.userId);
  }

  @Patch('delivery-plan-vehicles/:id/load')
  @Permissions('delivery:assign')
  adjustVehicleLoad(
    @Param('id') id: string,
    @Body() dto: AdjustVehicleLoadDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.deliveryPlanning.adjustVehicleLoad(id, dto, user.userId);
  }

  // --- Stops ---

  @Post('delivery-plan-vehicles/:id/stops')
  @Permissions('delivery:assign')
  assignStop(@Param('id') id: string, @Body() dto: AssignStopDto, @CurrentUser() user: AuthenticatedUser) {
    return this.deliveryPlanning.assignStop(id, dto, user.userId);
  }

  @Post('delivery-plan-vehicles/:id/sequence')
  @Permissions('delivery:assign')
  sequenceStops(@Param('id') id: string, @Body() dto: SequenceStopsDto, @CurrentUser() user: AuthenticatedUser) {
    return this.deliveryPlanning.sequenceStops(id, dto, user.userId);
  }

  @Post('delivery-stops/:id/reschedule')
  @Permissions('delivery:reschedule')
  rescheduleStop(@Param('id') id: string, @Body() dto: RescheduleStopDto, @CurrentUser() user: AuthenticatedUser) {
    return this.deliveryPlanning.rescheduleStop(id, dto, user.userId);
  }

  @Get('agent/delivery-stops')
  @Permissions('delivery:read-own')
  getMyDeliveries(@CurrentUser() user: AuthenticatedUser) {
    return this.deliveryPlanning.getAgentDeliveriesForUser(user.userId);
  }
}
