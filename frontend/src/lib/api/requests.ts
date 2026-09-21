import { apiFetch } from '../api-client';
import { LocationDto } from './shared-dto';
import { LpgRequest, PaginatedRequests, SourceChannel } from './types';

export interface CreateRequestInput {
  sourceChannel: SourceChannel;
  beneficiaryName?: string;
  mobileNumber?: string;
  addressText?: string;
  location?: LocationDto;
  lpgNeedDescription?: string;
  familyGroupStatus?: string;
  requestedAt?: string;
}

export type UpdateRequestInput = Omit<CreateRequestInput, 'sourceChannel'>;

export function createRequest(accessToken: string, input: CreateRequestInput) {
  return apiFetch<LpgRequest>('/requests', { method: 'POST', body: JSON.stringify(input), accessToken });
}

export function updateRequest(accessToken: string, id: string, input: UpdateRequestInput) {
  return apiFetch<LpgRequest>(`/requests/${id}`, { method: 'PATCH', body: JSON.stringify(input), accessToken });
}

export function getRequest(accessToken: string, id: string) {
  return apiFetch<LpgRequest>(`/requests/${id}`, { accessToken });
}

export function listRequests(
  accessToken: string,
  params: { status?: string; sourceChannel?: string; limit?: number; offset?: number } = {},
) {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.sourceChannel) query.set('sourceChannel', params.sourceChannel);
  if (params.limit) query.set('limit', String(params.limit));
  if (params.offset) query.set('offset', String(params.offset));
  const qs = query.toString();
  return apiFetch<PaginatedRequests>(`/requests${qs ? `?${qs}` : ''}`, { accessToken });
}
