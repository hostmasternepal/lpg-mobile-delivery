/**
 * The predicate LANGUAGE (this file) is a technical/architectural choice —
 * how a rule is structured and evaluated. The predicate CONTENT (which
 * conditions map to which priority group) is government policy and is
 * OPEN-BUSINESS-DECISION-08/09: no rules are seeded, so this evaluator
 * currently has nothing to run against real data. It exists so the
 * mechanism is in place and testable the moment MoICS/NOC ratifies actual
 * rules — adding one is then a `priority_rules` row, not a code change.
 *
 * Intentionally minimal: a single "field contains value" (case-insensitive
 * substring) predicate shape. This is NOT a scoring formula and produces
 * no numeric weight — it only ever contributes a request to the
 * unordered set of matched groups (docs/ARCHITECTURE_REVIEW.md §C /
 * ARCH-DECISION-09), closing the review's CRIT-2 finding (no invented
 * priority-scoring formula).
 */

export interface RuleEvaluationContext {
  lpgNeedDescription: string | null;
  familyGroupStatus: string | null;
}

const EVALUABLE_FIELDS = ['lpgNeedDescription', 'familyGroupStatus'] as const;
type EvaluableField = (typeof EVALUABLE_FIELDS)[number];

export interface ContainsPredicate {
  field: EvaluableField;
  operator: 'contains';
  value: string;
}

function isContainsPredicate(predicate: unknown): predicate is ContainsPredicate {
  if (typeof predicate !== 'object' || predicate === null) return false;
  const p = predicate as Record<string, unknown>;
  return (
    p.operator === 'contains' &&
    typeof p.value === 'string' &&
    typeof p.field === 'string' &&
    (EVALUABLE_FIELDS as readonly string[]).includes(p.field)
  );
}

/**
 * Returns false for any predicate it doesn't recognize, rather than
 * throwing — an unrecognized/malformed rule should never crash
 * assessment for every request, it should just fail to match.
 */
export function evaluatePredicate(predicate: unknown, context: RuleEvaluationContext): boolean {
  if (!isContainsPredicate(predicate)) {
    return false;
  }
  const fieldValue = context[predicate.field];
  if (typeof fieldValue !== 'string') {
    return false;
  }
  return fieldValue.toLowerCase().includes(predicate.value.toLowerCase());
}
