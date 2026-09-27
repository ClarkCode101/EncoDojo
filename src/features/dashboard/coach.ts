/**
 * The sidebar "coach" (owner's decision, 2026-09-27): small rule-based hints
 * that change as the user practices, so the app feels alive and gives a
 * reason to come back. No AI — just the saved results.
 *
 * - practicedToday: which practice features were done today (the ✓ marks).
 * - nextFocus: what to practice next ("Susunod na gagawin").
 */
import { display } from '../../lib/scoring';
import type { Session, SessionType } from '../../lib/storage';
import { JOB_READY_COPY, JOB_READY_ENCODING, JOB_READY_NUMPAD, JOB_READY_TYPING } from '../../lib/targets';
import { copyKphOf } from '../copy/scoreCopy';
import { MIXED_DIFFICULTY } from '../numpad/entries';
import { localDayKey } from './stats';

export type PracticeSkill = 'typing' | 'numpad' | 'copy' | 'encoding';

/** The practice features in the order they are taught (Home steps 1-4). */
export const SKILL_ORDER: PracticeSkill[] = ['typing', 'numpad', 'copy', 'encoding'];

export const SKILL_INFO: Record<PracticeSkill, { label: string; to: string }> = {
  typing: { label: 'Typing Practice', to: '/typing' },
  numpad: { label: 'Numpad Practice', to: '/numpad' },
  copy: { label: 'Copy Test', to: '/copy' },
  encoding: { label: 'Document Encoding', to: '/encoding' },
};

/** Practice features with at least one saved session today (local day). */
export function practicedToday(sessions: Session[], today: Date = new Date()): Set<SessionType> {
  const key = localDayKey(today);
  return new Set(
    sessions
      .filter((s) => s.type !== 'assessment' && localDayKey(new Date(s.startedAt)) === key)
      .map((s) => s.type),
  );
}

export type NextFocus = {
  skill: PracticeSkill | 'assessment';
  label: string;
  to: string;
  /** One short Taglish reason. */
  reason: string;
};

type Score = { speed: number; speedTarget: number; accuracy: number; accuracyTarget: number };

const latest = (list: Session[]): Session | null =>
  list.length ? list.reduce((a, b) => (a.startedAt >= b.startedAt ? a : b)) : null;

/** The latest result that counts for each skill (like the Home stats), or null if there is none yet. */
function latestScore(sessions: Session[], skill: PracticeSkill): Score | null {
  if (skill === 'typing') {
    const s = latest(sessions.filter((x) => x.type === 'typing'));
    return s && { speed: s.metrics.netWpm, speedTarget: JOB_READY_TYPING.netWpm, accuracy: s.metrics.accuracy, accuracyTarget: JOB_READY_TYPING.accuracy };
  }
  if (skill === 'numpad') {
    // Only "Halo-halo" counts (same numbers as the Assessment).
    const s = latest(sessions.filter((x) => x.type === 'numpad' && x.metrics.difficulty === MIXED_DIFFICULTY));
    return s && { speed: s.metrics.kph, speedTarget: JOB_READY_NUMPAD.kph, accuracy: s.metrics.entryAccuracy, accuracyTarget: JOB_READY_NUMPAD.entryAccuracy };
  }
  if (skill === 'copy') {
    // Runs with nothing finished say "100%" (nothing wrong yet), so they don't count.
    const s = latest(sessions.filter((x) => x.type === 'copy' && x.metrics.records > 0));
    return s && { speed: copyKphOf(s.metrics), speedTarget: JOB_READY_COPY.kph, accuracy: s.metrics.fieldAccuracy, accuracyTarget: JOB_READY_COPY.fieldAccuracy };
  }
  const s = latest(sessions.filter((x) => x.type === 'encoding' && x.metrics.documents > 0));
  return s && { speed: s.metrics.kph, speedTarget: JOB_READY_ENCODING.kph, accuracy: s.metrics.fieldAccuracy, accuracyTarget: JOB_READY_ENCODING.fieldAccuracy };
}

const n = (v: number) => display(v).toLocaleString('en-US');

function weakReason(skill: PracticeSkill, s: Score): string {
  const accShare = display(s.accuracy) / s.accuracyTarget;
  const speedShare = display(s.speed) / s.speedTarget;
  if (accShare <= speedShare) {
    const what = skill === 'typing' ? 'tama' : skill === 'numpad' ? 'tamang numero' : 'tamang field';
    return `${n(s.accuracy)}% pa lang ang ${what} (target: ${s.accuracyTarget}%).`;
  }
  const unit = skill === 'typing' ? 'WPM' : 'KPH';
  return `${n(s.speed)} ${unit} pa lang (target: ${n(s.speedTarget)}).`;
}

/**
 * What to practice next:
 * 1. a practice never tried yet (in the Home order) — first things first;
 * 2. otherwise the one whose latest result is furthest below its target
 *    (speed or accuracy, whichever is weaker);
 * 3. everything at target: the Assessment.
 */
export function nextFocus(sessions: Session[]): NextFocus {
  const scores = SKILL_ORDER.map((skill) => ({ skill, score: latestScore(sessions, skill) }));

  const untried = scores.find((x) => x.score === null);
  if (untried) {
    const { skill } = untried;
    let reason = 'Hindi mo pa ito nasusubukan.';
    if (skill === 'typing') reason = 'Dito magsimula.';
    else if (skill === 'numpad' && sessions.some((s) => s.type === 'numpad')) {
      reason = 'Subukan ang Halo-halo na numero (gaya ng Assessment).';
    }
    return { skill, ...SKILL_INFO[skill], reason };
  }

  let weakest: { skill: PracticeSkill; share: number; score: Score } | null = null;
  for (const { skill, score } of scores) {
    const s = score!;
    const share = Math.min(display(s.speed) / s.speedTarget, display(s.accuracy) / s.accuracyTarget);
    if (share < 1 && (!weakest || share < weakest.share)) weakest = { skill, share, score: s };
  }
  if (weakest) {
    return { skill: weakest.skill, ...SKILL_INFO[weakest.skill], reason: weakReason(weakest.skill, weakest.score) };
  }
  return {
    skill: 'assessment',
    label: 'Assessment',
    to: '/assessment',
    reason: 'Pasado ka na sa lahat ng practice. Subukan ang Assessment!',
  };
}
