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

export type KphLevel = { min: number; label: string; description: string };

/**
 * KPH levels shown on the results, lowest first. The first one is the
 * job-ready minimum. Commonly quoted benchmarks for 10-key data entry:
 * ~8,000 entry-level, ~10,000 the usual requirement, 12,000+ strong.
 */
export const KPH_LEVELS: KphLevel[] = [
  { min: JOB_READY_NUMPAD.kph, label: 'Pasado (entry-level)', description: 'Minimum para sa entry-level na data entry.' },
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
