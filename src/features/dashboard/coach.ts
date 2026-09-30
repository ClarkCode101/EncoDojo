/**
 * The sidebar "coach" (owner's decision, 2026-09-27): small rule-based hints
 * that change as the user practices, so the app feels alive and gives a
 * reason to come back. No AI — just the saved results.
 *
 * - nextFocus: what to practice next ("Susunod na gagawin").
 * (A ✓ for "done today" was tried and removed: it looked like the practice
 * was finished and could not be done again.)
 */
import { translator, type Lang } from '../../lib/i18n';
import { display } from '../../lib/scoring';
import type { Session } from '../../lib/storage';
import {
  JOB_READY_COPY,
  JOB_READY_ENCODING,
  JOB_READY_NUMPAD,
  JOB_READY_QC,
  JOB_READY_TYPING,
} from '../../lib/targets';
import { copyKphOf } from '../copy/scoreCopy';
import { MIXED_DIFFICULTY } from '../numpad/entries';

export type PracticeSkill = 'typing' | 'numpad' | 'copy' | 'encoding' | 'qc';

/**
 * The practice features in the order they are taught (Home rows 01-05).
 * Excel is a learning track ("Matuto"), not job-ready practice, so the coach doesn't push it.
 */
export const SKILL_ORDER: PracticeSkill[] = ['typing', 'numpad', 'copy', 'encoding', 'qc'];

export const SKILL_INFO: Record<PracticeSkill, { label: string; to: string }> = {
  typing: { label: 'Typing Practice', to: '/typing' },
  numpad: { label: 'Numpad Practice', to: '/numpad' },
  copy: { label: 'Copy Test', to: '/copy' },
  encoding: { label: 'Document Encoding', to: '/encoding' },
  qc: { label: 'QC Check', to: '/qc' },
};

export type NextFocus = {
  skill: PracticeSkill | 'assessment';
  label: string;
  to: string;
  /** One short reason, in the app's language. */
  reason: string;
};

type Score = { speed: number; speedTarget: number; accuracy: number; accuracyTarget: number };

const latest = (list: Session[]): Session | null =>
  list.length ? list.reduce((a, b) => (a.startedAt >= b.startedAt ? a : b)) : null;

/** The latest result that counts for each skill (like the Home stats), or null if there is none yet. */
function latestScore(sessions: Session[], skill: PracticeSkill): Score | null {
  if (skill === 'typing') {
    const s = latest(sessions.filter((x) => x.type === 'typing'));
    return (
      s && {
        speed: s.metrics.netWpm,
        speedTarget: JOB_READY_TYPING.netWpm,
        accuracy: s.metrics.accuracy,
        accuracyTarget: JOB_READY_TYPING.accuracy,
      }
    );
  }
  if (skill === 'numpad') {
    // Only "Halo-halo" counts (same numbers as the Assessment).
    const s = latest(sessions.filter((x) => x.type === 'numpad' && x.metrics.difficulty === MIXED_DIFFICULTY));
    return (
      s && {
        speed: s.metrics.kph,
        speedTarget: JOB_READY_NUMPAD.kph,
        accuracy: s.metrics.entryAccuracy,
        accuracyTarget: JOB_READY_NUMPAD.entryAccuracy,
      }
    );
  }
  if (skill === 'copy') {
    // Runs with nothing finished say "100%" (nothing wrong yet), so they don't count.
    const s = latest(sessions.filter((x) => x.type === 'copy' && x.metrics.records > 0));
    return (
      s && {
        speed: copyKphOf(s.metrics),
        speedTarget: JOB_READY_COPY.kph,
        accuracy: s.metrics.fieldAccuracy,
        accuracyTarget: JOB_READY_COPY.fieldAccuracy,
      }
    );
  }
  if (skill === 'qc') {
    const s = latest(sessions.filter((x) => x.type === 'qc' && x.metrics.records > 0));
    return (
      s && {
        speed: s.metrics.perMinute,
        speedTarget: JOB_READY_QC.perMinute,
        accuracy: s.metrics.decisionAccuracy,
        accuracyTarget: JOB_READY_QC.decisionAccuracy,
      }
    );
  }
  const s = latest(sessions.filter((x) => x.type === 'encoding' && x.metrics.documents > 0));
  return (
    s && {
      speed: s.metrics.kph,
      speedTarget: JOB_READY_ENCODING.kph,
      accuracy: s.metrics.fieldAccuracy,
      accuracyTarget: JOB_READY_ENCODING.fieldAccuracy,
    }
  );
}

const n = (v: number) => display(v).toLocaleString('en-US');

function weakReason(skill: PracticeSkill, s: Score, lang: Lang): string {
  const t = translator(lang);
  const accShare = display(s.accuracy) / s.accuracyTarget;
  const speedShare = display(s.speed) / s.speedTarget;
  if (accShare <= speedShare) {
    const what =
      skill === 'typing'
        ? t('tama', 'correct')
        : skill === 'numpad'
          ? t('tamang numero', 'correct numbers')
          : skill === 'qc'
            ? t('tamang check', 'correct checks')
            : t('tamang field', 'correct fields');
    return t(
      `${n(s.accuracy)}% pa lang ang ${what} (target: ${s.accuracyTarget}%).`,
      `Only ${n(s.accuracy)}% ${what} so far (target: ${s.accuracyTarget}%).`,
    );
  }
  const unit = skill === 'typing' ? 'WPM' : skill === 'qc' ? t('record bawat minuto', 'records per minute') : 'KPH';
  return t(
    `${n(s.speed)} ${unit} pa lang (target: ${n(s.speedTarget)}).`,
    `Only ${n(s.speed)} ${unit} so far (target: ${n(s.speedTarget)}).`,
  );
}

/**
 * What to practice next:
 * 1. a practice never tried yet (in the Home order) — first things first;
 * 2. otherwise the one whose latest result is furthest below its target
 *    (speed or accuracy, whichever is weaker);
 * 3. everything at target: the Assessment.
 */
export function nextFocus(sessions: Session[], lang: Lang = 'tl'): NextFocus {
  const t = translator(lang);
  const scores = SKILL_ORDER.map((skill) => ({ skill, score: latestScore(sessions, skill) }));

  const untried = scores.find((x) => x.score === null);
  if (untried) {
    const { skill } = untried;
    let reason = t('Hindi mo pa ito nasusubukan.', "You haven't tried this yet.");
    if (skill === 'typing') reason = t('Dito magsimula.', 'Start here.');
    else if (skill === 'numpad' && sessions.some((s) => s.type === 'numpad')) {
      reason = t(
        'Subukan ang Halo-halo na numero (gaya ng Assessment).',
        'Try the Mixed numbers (like the Assessment).',
      );
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
    return {
      skill: weakest.skill,
      ...SKILL_INFO[weakest.skill],
      reason: weakReason(weakest.skill, weakest.score, lang),
    };
  }
  return {
    skill: 'assessment',
    label: 'Assessment',
    to: '/assessment',
    reason: t(
      'Pasado ka na sa lahat ng practice. Subukan ang Assessment!',
      'You passed every practice. Try the Assessment!',
    ),
  };
}
