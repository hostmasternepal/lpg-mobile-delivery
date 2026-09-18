/**
 * Declarative state table for `delivery_stops.status`, mirroring
 * request-state-machine.ts's pattern for `requests.status`. This is the
 * single place that says what a delivery-stop transition is legal —
 * DeliveryPlanningService is the only writer, and per ARCH-DECISION-19
 * only its recordOtpOutcome()/beginStopAttempt() methods call it. The Otp
 * module (not yet built) will trigger these via those methods; it will
 * never write delivery_stops.status directly.
 *
 * One row per delivery ATTEMPT already exists structurally
 * (ARCH-DECISION-07); this table governs what happens WITHIN one
 * attempt. A terminal FAILED/CANCELLED does not reopen — a new attempt
 * (new row, next attemptNumber) is created instead by
 * DeliveryPlanningService.rescheduleStop().
 */
export const DELIVERY_STOP_STATUSES = [
  'SCHEDULED',
  'IN_PROGRESS',
  'OTP_SENT',
  'OTP_SEND_FAILED',
  'OTP_VERIFY_FAILED',
  'CONFIRMED',
  'FAILED',
  'CANCELLED',
] as const;

export type DeliveryStopStatus = (typeof DELIVERY_STOP_STATUSES)[number];

export const DELIVERY_STOP_STATE_TRANSITIONS: Record<DeliveryStopStatus, DeliveryStopStatus[]> = {
  SCHEDULED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['OTP_SENT', 'OTP_SEND_FAILED', 'CANCELLED'],
  // ARCH-DECISION-19: OTP_SENT -> CONFIRMED is the only path to CONFIRMED
  // anywhere in the system.
  OTP_SENT: ['CONFIRMED', 'OTP_VERIFY_FAILED'],
  OTP_SEND_FAILED: ['IN_PROGRESS', 'FAILED'], // retry the send, or give up
  OTP_VERIFY_FAILED: ['OTP_SENT', 'FAILED'], // resend a new code, or give up
  CONFIRMED: [],
  FAILED: [],
  CANCELLED: [],
};

export function isValidStopTransition(from: string, to: string): boolean {
  const allowedNext = DELIVERY_STOP_STATE_TRANSITIONS[from as DeliveryStopStatus];
  return Boolean(allowedNext?.includes(to as DeliveryStopStatus));
}

export function getValidStopPredecessors(to: DeliveryStopStatus): DeliveryStopStatus[] {
  return DELIVERY_STOP_STATUSES.filter((from) => DELIVERY_STOP_STATE_TRANSITIONS[from].includes(to));
}
