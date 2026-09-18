import {
  DELIVERY_STOP_STATE_TRANSITIONS,
  DELIVERY_STOP_STATUSES,
  getValidStopPredecessors,
  isValidStopTransition,
} from './delivery-stop-state-machine';

describe('delivery-stop-state-machine', () => {
  it('allows the documented happy path', () => {
    expect(isValidStopTransition('SCHEDULED', 'IN_PROGRESS')).toBe(true);
    expect(isValidStopTransition('IN_PROGRESS', 'OTP_SENT')).toBe(true);
    expect(isValidStopTransition('OTP_SENT', 'CONFIRMED')).toBe(true);
  });

  it('only allows CONFIRMED from OTP_SENT (ARCH-DECISION-19)', () => {
    expect(getValidStopPredecessors('CONFIRMED')).toEqual(['OTP_SENT']);
  });

  it('rejects skipping straight to CONFIRMED', () => {
    expect(isValidStopTransition('SCHEDULED', 'CONFIRMED')).toBe(false);
    expect(isValidStopTransition('IN_PROGRESS', 'CONFIRMED')).toBe(false);
  });

  it('allows resend/retry loops but not from a terminal state', () => {
    expect(isValidStopTransition('OTP_VERIFY_FAILED', 'OTP_SENT')).toBe(true);
    expect(isValidStopTransition('OTP_SEND_FAILED', 'IN_PROGRESS')).toBe(true);
    expect(isValidStopTransition('FAILED', 'IN_PROGRESS')).toBe(false);
    expect(isValidStopTransition('CONFIRMED', 'IN_PROGRESS')).toBe(false);
  });

  it('treats CONFIRMED, FAILED, and CANCELLED as terminal', () => {
    expect(DELIVERY_STOP_STATE_TRANSITIONS.CONFIRMED).toEqual([]);
    expect(DELIVERY_STOP_STATE_TRANSITIONS.FAILED).toEqual([]);
    expect(DELIVERY_STOP_STATE_TRANSITIONS.CANCELLED).toEqual([]);
  });

  it('every status is covered by the transition table', () => {
    for (const status of DELIVERY_STOP_STATUSES) {
      expect(Array.isArray(getValidStopPredecessors(status))).toBe(true);
    }
  });
});
