import { apiFetch } from '../api-client';
import { PriorityGroup, PriorityGroupCode, PriorityOverride, PriorityPolicyVersion, RequestPriorityGroup } from './types';

export function listPriorityGroups(accessToken: string) {
  return apiFetch<PriorityGroup[]>('/priority-groups', { accessToken });
}

export function getActivePolicyVersion(accessToken: string) {
  return apiFetch<PriorityPolicyVersion>('/priority-policy-versions/active', { accessToken });
}

export function activatePolicyVersion(
  accessToken: string,
  input: { versionLabel: string; scoringFormula?: Record<string, unknown> },
) {
  return apiFetch<PriorityPolicyVersion>('/priority-policy-versions', {
    method: 'POST',
    body: JSON.stringify(input),
    accessToken,
  });
}

export function assessPriority(accessToken: string, requestId: string, manualGroupCodes?: PriorityGroupCode[]) {
  return apiFetch<RequestPriorityGroup[]>(`/requests/${requestId}/priority-groups`, {
    method: 'POST',
    body: JSON.stringify({ manualGroupCodes }),
    accessToken,
  });
}

export function getGroupsForRequest(accessToken: string, requestId: string) {
  return apiFetch<RequestPriorityGroup[]>(`/requests/${requestId}/priority-groups`, { accessToken });
}

export function overridePriority(
  accessToken: string,
  requestId: string,
  input: { newGroupCodes: PriorityGroupCode[]; reason: string },
) {
  return apiFetch<RequestPriorityGroup[]>(`/requests/${requestId}/priority-override`, {
    method: 'POST',
    body: JSON.stringify(input),
    accessToken,
  });
}

export function getPriorityOverrideHistory(accessToken: string, requestId: string) {
  return apiFetch<PriorityOverride[]>(`/requests/${requestId}/priority-overrides`, { accessToken });
}
