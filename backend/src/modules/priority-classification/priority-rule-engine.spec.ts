import { evaluatePredicate } from './priority-rule-engine';

describe('priority-rule-engine', () => {
  const context = { lpgNeedDescription: 'Elderly widow, no cylinder for 3 weeks', familyGroupStatus: 'lives alone' };

  it('matches a case-insensitive substring on the declared field', () => {
    expect(evaluatePredicate({ field: 'lpgNeedDescription', operator: 'contains', value: 'ELDERLY' }, context)).toBe(
      true,
    );
  });

  it('does not match when the substring is absent', () => {
    expect(evaluatePredicate({ field: 'lpgNeedDescription', operator: 'contains', value: 'student' }, context)).toBe(
      false,
    );
  });

  it('returns false for malformed predicates instead of throwing', () => {
    expect(evaluatePredicate(null, context)).toBe(false);
    expect(evaluatePredicate({}, context)).toBe(false);
    expect(evaluatePredicate({ field: 'notAField', operator: 'contains', value: 'x' }, context)).toBe(false);
    expect(evaluatePredicate({ field: 'lpgNeedDescription', operator: 'equals', value: 'x' }, context)).toBe(false);
  });

  it('returns false when the target field is null', () => {
    expect(
      evaluatePredicate(
        { field: 'familyGroupStatus', operator: 'contains', value: 'x' },
        { lpgNeedDescription: null, familyGroupStatus: null },
      ),
    ).toBe(false);
  });
});
