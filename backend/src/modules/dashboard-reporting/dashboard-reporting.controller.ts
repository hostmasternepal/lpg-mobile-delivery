import { Controller, Get } from '@nestjs/common';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { DashboardReportingService } from './dashboard-reporting.service';

@Controller()
export class DashboardReportingController {
  constructor(private readonly dashboardReporting: DashboardReportingService) {}

  @Get('dashboard/summary')
  @Permissions('dashboard:read')
  getSummary() {
    return this.dashboardReporting.getSummary();
  }

  @Get('dashboard/district-demand')
  @Permissions('dashboard:read')
  getDistrictDemand() {
    return this.dashboardReporting.getDistrictDemand();
  }

  @Get('reports/daily-distribution')
  @Permissions('report:read')
  getDailyDistribution() {
    return this.dashboardReporting.getDailyDistribution();
  }
}
