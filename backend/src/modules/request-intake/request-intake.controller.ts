import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { CreateRequestDto } from './dto/create-request.dto';
import { ListRequestsQueryDto } from './dto/list-requests-query.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { RequestIntakeService } from './request-intake.service';

@Controller('requests')
export class RequestIntakeController {
  constructor(private readonly requestIntake: RequestIntakeService) {}

  @Post()
  @Permissions('request:create')
  create(@Body() dto: CreateRequestDto, @CurrentUser() user: AuthenticatedUser) {
    return this.requestIntake.createRequest(dto, user.userId);
  }

  @Get()
  @Permissions('request:read')
  list(@Query() query: ListRequestsQueryDto) {
    return this.requestIntake.listRequests(query);
  }

  @Get(':id')
  @Permissions('request:read')
  get(@Param('id') id: string) {
    return this.requestIntake.getRequest(id);
  }

  @Patch(':id')
  @Permissions('request:update')
  update(@Param('id') id: string, @Body() dto: UpdateRequestDto, @CurrentUser() user: AuthenticatedUser) {
    return this.requestIntake.updateRequest(id, dto, user.userId);
  }
}
