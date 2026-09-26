/**
 * "Job-ready" targets: common minimums in Encoder / Data Entry hiring tests.
 * Change them here and every screen follows.
 */
export const JOB_READY_TYPING = {
  netWpm: 40,
  accuracy: 95,
} as const;

/**
 * Numpad (10-key) targets. 8,000 KPH is a commonly quoted minimum for 10-key
 * data entry, but employers differ — check real job posts and adjust.
 */
export const JOB_READY_NUMPAD = {
  kph: 8000,
  entryAccuracy: 95,
} as const;
