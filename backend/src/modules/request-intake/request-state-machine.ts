/**
 * Declarative state table for `requests.status`. This file is the single
 * place that says what transition is legal — RequestIntakeService is the
 * only caller, and every other module reaches it only through
 * RequestIntakeService.transition() (docs/ARCHITECTURE.md §2 boundary
 * rule 1 / ARCH-DECISION-18).
 *
 * PENDING and REJECTED are deliberately NOT reachable from any state
 * below. The SRS's own dashboard metric (REQ-029) names them, but no
 * source document defines what triggers either one — see
 * OPEN-BUSINESS-DECISION-07 (verification failure/rejection path) and
 * OPEN-BUSINESS-DECISION-12 (Pending/Rejected trigger criteria). Adding a
 * transition into them here would be inventing the missing business rule
 * instead of leaving it open — do not add one speculatively.
 */
export const REQUEST_STATUSES = [
  'RECORDED',
  'VERIFIED',
  'SHORTLISTED',
  'DELIVERY_QUEUE',
  'DELIVERY_PLANNED',
  'DELIVERY_IN_PROGRESS',
  'DELIVERED',
  'PENDING',
  'REJECTED',
] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const REQUEST_STATE_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  RECORDED: ['VERIFIED'],
  VERIFIED: ['SHORTLISTED'],
  SHORTLISTED: ['DELIVERY_QUEUE'],
  DELIVERY_QUEUE: ['DELIVERY_PLANNED'],
  DELIVERY_PLANNED: ['DELIVERY_IN_PROGRESS'],
  DELIVERY_IN_PROGRESS: ['DELIVERED'],
  DELIVERED: [],
  PENDING: [],
  REJECTED: [],
};

export function isValidTransition(from: string, to: string): boolean {
  const allowedNext = REQUEST_STATE_TRANSITIONS[from as RequestStatus];
  return Boolean(allowedNext?.includes(to as RequestStatus));
}

/** Every status that is a legal predecessor of `to`, per the table above. */
export function getValidPredecessors(to: RequestStatus): RequestStatus[] {
  return REQUEST_STATUSES.filter((from) => REQUEST_STATE_TRANSITIONS[from].includes(to));
}
