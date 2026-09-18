import { apiFetch } from '../api-client';
import { DailyDistribution, DashboardSummary, DistrictDemand } from './types';

export function getSummary(accessToken: string) {
  return apiFetch<DashboardSummary>('/dashboard/summary', { accessToken });
}

export function getDistrictDemand(accessToken: string) {
  return apiFetch<DistrictDemand[]>('/dashboard/district-demand', { accessToken });
}

export function getDailyDistribution(accessToken: string) {
  return apiFetch<DailyDistribution[]>('/reports/daily-distribution', { accessToken });
}
