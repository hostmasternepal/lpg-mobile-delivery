import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class DashboardReportingService {
  async getSummary(): Promise<never> {
    // REQ-029's 11 metrics — served from projection tables built by event
    // subscribers, not by joining other modules' operational tables.
    throw new NotImplementedException('DashboardReportingService.getSummary');
  }

  async getDistrictDemand(): Promise<never> {
    throw new NotImplementedException('DashboardReportingService.getDistrictDemand');
  }

  async getDailyDistribution(): Promise<never> {
    throw new NotImplementedException('DashboardReportingService.getDailyDistribution');
  }
}
