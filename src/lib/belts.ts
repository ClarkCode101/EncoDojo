/**
 * Belt ranks (owner's decision, 2026-09-26): an early version of the Phase 4
 * belt system, shown in the sidebar to make progress visible and memorable.
 *
 * The belt comes from the user's BEST Assessment, so it is never taken away
 * (like a real dojo):
 *   White  — no assessment yet, or below 25% of the targets
 *   Yellow — 25%+ of the targets met   (2 of 8)
 *   Orange — 50%+                       (4 of 8)
 *   Green  — 75%+                       (6 of 8)
 *   Blue   — Job-ready (all targets) at least once
 *   Black  — Job-ready on 3 different days
 * Percentages (not counts) so older assessments with 4 or 6 targets still count.
 */
import type { Session } from './storage';

export type BeltRank = 'white' | 'yellow' | 'orange' | 'green' | 'blue' | 'black';

export type Belt = {
  rank: BeltRank;
  label: string;
  /** Fill color of the belt drawing (the real belt color). */
  color: string;
};

export const BELTS: Belt[] = [
  { rank: 'white', label: 'White Belt', color: '#F5F5F4' },
  { rank: 'yellow', label: 'Yellow Belt', color: '#F5B301' },
  { rank: 'orange', label: 'Orange Belt', color: '#F97316' },
  { rank: 'green', label: 'Green Belt', color: '#16A34A' },
  { rank: 'blue', label: 'Blue Belt', color: '#2563EB' },
  { rank: 'black', label: 'Black Belt', color: '#1C1917' },
];

/** Share of targets needed for Yellow, Orange, Green. */
const SHARE_NEEDED: Partial<Record<BeltRank, number>> = { yellow: 0.25, orange: 0.5, green: 0.75 };

/** Job-ready on this many different days = Black Belt. */
export const BLACK_BELT_DAYS = 3;

/** The current Assessment has 8 targets; used to say "2 sa 8" in the hints. */
const CURRENT_TARGETS = 8;

export type BeltStatus = {
  belt: Belt;
  next: Belt | null;
  /** Best assessment so far (targets met / total), or null when there is none. */
  best: { met: number; total: number } | null;
  /** Different days with a Job-ready assessment. */
  jobReadyDays: number;
  /** 0-1: how far along to the next belt (1 for Black Belt). */
  progress: number;
  /** What to do for the next belt, in Taglish. */
  nextHint: string;
};

const byRank = (rank: BeltRank) => BELTS.find((b) => b.rank === rank)!;

/** Local calendar day, e.g. "2026-09-26" (so two assessments on one day count once). */
function localDay(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function beltStatus(sessions: Session[]): BeltStatus {
  const assessments = sessions.filter((s) => s.type === 'assessment' && s.metrics.targetsTotal > 0);

  let best: { met: number; total: number } | null = null;
  for (const a of assessments) {
    const met = a.metrics.targetsMet;
    const total = a.metrics.targetsTotal;
    if (!best || met / total > best.met / best.total || (met / total === best.met / best.total && total > best.total)) {
      best = { met, total };
    }
  }
  const share = best ? best.met / best.total : 0;
  const jobReadyDays = new Set(assessments.filter((a) => a.metrics.jobReady === 1).map((a) => localDay(a.startedAt)))
    .size;

  let rank: BeltRank = 'white';
  if (jobReadyDays >= BLACK_BELT_DAYS) rank = 'black';
  else if (jobReadyDays >= 1) rank = 'blue';
  else if (share >= SHARE_NEEDED.green!) rank = 'green';
  else if (share >= SHARE_NEEDED.orange!) rank = 'orange';
  else if (share >= SHARE_NEEDED.yellow!) rank = 'yellow';

  const belt = byRank(rank);
  const next = BELTS[BELTS.indexOf(belt) + 1] ?? null;

  let progress = 1;
  let nextHint = 'Pinakamataas na belt na ito. Ang galing mo!';
  if (next?.rank === 'black') {
    const left = BLACK_BELT_DAYS - jobReadyDays;
    progress = jobReadyDays / BLACK_BELT_DAYS;
    nextHint = `Maging Job-ready ulit sa ${left} pang ibang araw.`;
  } else if (next?.rank === 'blue') {
    progress = share;
    nextHint = `Maging Job-ready: ${CURRENT_TARGETS} sa ${CURRENT_TARGETS} target sa Assessment.`;
  } else if (next) {
    progress = share / SHARE_NEEDED[next.rank]!;
    const need = Math.ceil(SHARE_NEEDED[next.rank]! * CURRENT_TARGETS);
    nextHint = best
      ? `Pumasa sa ${need} sa ${CURRENT_TARGETS} target sa Assessment.`
      : `Gawin ang Assessment at pumasa sa ${need} sa ${CURRENT_TARGETS} target.`;
  }

  return { belt, next, best, jobReadyDays, progress: Math.min(1, progress), nextHint };
}
