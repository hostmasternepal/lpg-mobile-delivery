import { apiFetch } from '../api-client';
import { LpgRequest, Verification } from './types';

export interface RecordVerificationInput {
  method: 'PHONE' | 'OTHER';
  outcome: 'CONFIRMED' | 'FAILED';
  notes?: string;
  expectedVersion: number;
}

export interface RecordVerificationResult {
  verification: Verification;
  request: LpgRequest;
}

export function recordVerification(accessToken: string, requestId: string, input: RecordVerificationInput) {
  return apiFetch<RecordVerificationResult>(`/requests/${requestId}/verify`, {
    method: 'POST',
    body: JSON.stringify(input),
    accessToken,
  });
}

export function getVerificationHistory(accessToken: string, requestId: string) {
  return apiFetch<Verification[]>(`/requests/${requestId}/verifications`, { accessToken });
}

export function getDuplicateCandidates(accessToken: string, requestId: string) {
  return apiFetch<LpgRequest[]>(`/requests/${requestId}/duplicate-candidates`, { accessToken });
}
