/**
 * "Job-ready" targets: common minimums in Encoder / Data Entry hiring tests.
 * Change them here and every screen follows.
 */
export const JOB_READY_TYPING = {
  netWpm: 40,
  accuracy: 95,
} as const;

/**
 * Numpad (10-key) targets. About 8,000 net KPH at 95% accuracy is the commonly
 * quoted entry-level minimum for 10-key data entry (checked 2026-09 on
 * typing-test / hiring sites; employers differ, so adjust if needed).
 */
export const JOB_READY_NUMPAD = {
  kph: 8000,
  entryAccuracy: 95,
} as const;

/**
 * Copy Test targets (like an "alphanumeric data entry" hiring test).
 * - Speed: about 8,000 net KPH with 95%+ accuracy is the commonly quoted
 *   minimum for alphanumeric data entry tests (checked 2026-09).
 * - Accuracy is counted per FIELD (stricter than per character). 95%, not
 *   98%, because a 1–2 minute test has only ~10–25 fields; at 98% a single
 *   wrong field would already fail.
 */
export const JOB_READY_COPY = {
  kph: 8000,
  fieldAccuracy: 95,
} as const;

/**
 * Document Encoding targets — EncoDojo ESTIMATES (no public standard found):
 * - 95% of fields exactly right (same reasoning as the Copy Test).
 * - 6,000 net KPH: lower than the Copy Test's 8,000 because the encoder must
 *   first FIND each value on the document and convert dates/amounts.
 */
export const JOB_READY_ENCODING = {
  kph: 6000,
  fieldAccuracy: 95,
} as const;

/**
 * QC / Spot the Difference targets: EncoDojo ESTIMATES (no public standard):
 * - 95% correct decisions (every field of every checked record is one
 *   "may mali / tama" decision; ~1 field in 5 has a mistake, so flagging
 *   nothing scores only ~80%). 95% allows about 1 slip in a 2-minute test.
 * - 3 records per minute (about 20 seconds to compare 5 fields carefully).
 */
export const JOB_READY_QC = {
  decisionAccuracy: 95,
  perMinute: 3,
} as const;

/**
 * Only for the FIRST, timed Excel rounds (saved before the lessons had a
 * Pagsusulit): such a round counts as "pasado" when 85% of the tasks were done
 * and 75% with the shortcut. New lessons pass by their Pagsusulit instead
 * (features/excel: QUIZ_PASS of QUIZ_TASKS, no timer).
 */
export const JOB_READY_EXCEL = {
  taskAccuracy: 85,
  shortcutRate: 75,
} as const;

export type KphLevel = { min: number; label: string; description: string };

/**
 * KPH levels shown on the results, lowest first. The first one is the
 * job-ready minimum. Commonly quoted benchmarks for 10-key data entry:
 * ~8,000 entry-level, ~10,000 the usual requirement, 12,000+ strong.
 */
export const KPH_LEVELS: KphLevel[] = [
  {
    min: JOB_READY_NUMPAD.kph,
    label: 'Pasado (entry-level)',
    description: 'Minimum para sa entry-level na data entry.',
  },
  { min: 10000, label: 'Karaniwang hinihingi', description: 'Ito ang madalas hinihingi ng maraming employer.' },
  { min: 12000, label: 'Magaling', description: 'Pang-mas mahigpit na trabaho, gaya ng billing at banking.' },
];

/**
 * Which KPH level a (rounded) score reached, and the next one to aim for.
 * `reached` is null when the score is below the job-ready minimum.
 */
export function kphLevel(kph: number): { reached: KphLevel | null; next: KphLevel | null } {
  const score = Math.round(kph);
  let reached: KphLevel | null = null;
  for (const level of KPH_LEVELS) {
    if (score >= level.min) reached = level;
  }
  const next = KPH_LEVELS.find((level) => score < level.min) ?? null;
  return { reached, next };
}
