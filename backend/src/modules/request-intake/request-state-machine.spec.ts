import {
  getValidPredecessors,
  isValidTransition,
  REQUEST_STATE_TRANSITIONS,
  REQUEST_STATUSES,
} from './request-state-machine';

describe('request-state-machine', () => {
  it('allows the documented happy path in order', () => {
    const happyPath = [
      'RECORDED',
      'VERIFIED',
      'SHORTLISTED',
      'DELIVERY_QUEUE',
      'DELIVERY_PLANNED',
      'DELIVERY_IN_PROGRESS',
      'DELIVERED',
    ];
    for (let i = 0; i < happyPath.length - 1; i++) {
      expect(isValidTransition(happyPath[i], happyPath[i + 1])).toBe(true);
    }
  });

  it('rejects skipping a stage', () => {
    expect(isValidTransition('RECORDED', 'SHORTLISTED')).toBe(false);
    expect(isValidTransition('RECORDED', 'DELIVERED')).toBe(false);
  });

  it('rejects moving backwards', () => {
    expect(isValidTransition('VERIFIED', 'RECORDED')).toBe(false);
    expect(isValidTransition('DELIVERED', 'DELIVERY_IN_PROGRESS')).toBe(false);
  });

  it('treats DELIVERED as terminal (no outgoing transitions)', () => {
    expect(REQUEST_STATE_TRANSITIONS.DELIVERED).toEqual([]);
  });

  it('has no legal predecessor for PENDING or REJECTED (OPEN-BUSINESS-DECISION-07/12)', () => {
    expect(getValidPredecessors('PENDING')).toEqual([]);
    expect(getValidPredecessors('REJECTED')).toEqual([]);
  });

  it('every status is covered by the transition table', () => {
    for (const status of REQUEST_STATUSES) {
      expect(Array.isArray(getValidPredecessors(status))).toBe(true);
    }
  });
});
