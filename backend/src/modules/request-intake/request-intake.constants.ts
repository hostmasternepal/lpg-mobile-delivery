/**
 * Intake sources named in the concept paper §3 / SRS REQ-011. OTHER covers
 * "other official references" — the source text's own catch-all, not an
 * invented category.
 */
export const SOURCE_CHANNELS = [
  'HELLO_SARKAR',
  'SOCIAL_MEDIA',
  'NEWS_MEDIA',
  'CALL_CENTRE',
  'LOCAL_GOV',
  'COMMUNITY_REP',
  'OTHER',
] as const;

export type SourceChannel = (typeof SOURCE_CHANNELS)[number];
