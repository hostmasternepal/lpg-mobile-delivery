/** Must match the seeded `verification_outcomes` rows (backend/prisma/seed.ts). */
export const VERIFICATION_METHODS = ['PHONE', 'OTHER'] as const;
export type VerificationMethod = (typeof VERIFICATION_METHODS)[number];

export const VERIFICATION_OUTCOMES = ['CONFIRMED', 'FAILED'] as const;
export type VerificationOutcomeCode = (typeof VERIFICATION_OUTCOMES)[number];
