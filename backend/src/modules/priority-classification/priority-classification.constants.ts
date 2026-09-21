/** Must match the seeded `priority_groups` rows (backend/prisma/seed.ts) — the 8 groups named in REQ-023. */
export const PRIORITY_GROUP_CODES = [
  'EXTREME_POVERTY',
  'STUDENT',
  'MARGINALIZED_AT_RISK',
  'SENIOR_CITIZEN',
  'PERSON_WITH_DISABILITY',
  'WOMEN_HEADED_POOR_FAMILY',
  'ESSENTIAL_SERVICE',
  'OTHER_HUMANITARIAN_NEED',
] as const;

export type PriorityGroupCode = (typeof PRIORITY_GROUP_CODES)[number];
