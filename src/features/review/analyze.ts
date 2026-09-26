/**
 * Mistake Review: gathers the mistakes from saved sessions and finds patterns.
 *
 * Where mistakes come from:
 * - typing / copy / numpad practice sessions
 * - assessments (each mistake is tagged with its `section`)
 *
 * Typing mistakes are single characters (expected vs typed). Numpad and Copy
 * mistakes are whole values (a number, or a field like an address), so those
 * can be typed again exactly in "retry" mode.
 */
import { passages } from '../../data/passages';
import { makeRng, shuffle, type Rng } from '../../lib/random';
import type { Session, SessionMistake } from '../../lib/storage';
import { PLAIN_TEXT_LEVEL } from '../typing/buildPassage';
import { generateParagraph } from '../typing/generatePassage';

export type Skill = 'typing' | 'numpad' | 'copy';

/** A mistake plus when it happened (for "most recent first"). */
export type DatedMistake = SessionMistake & { at: string };

export type CollectedMistakes = Record<Skill, DatedMistake[]>;

/** All mistakes from sessions started on/after `since` (or all), newest first. */
export function collectMistakes(sessions: Session[], since?: Date): CollectedMistakes {
  const out: CollectedMistakes = { typing: [], numpad: [], copy: [] };
  const sorted = [...sessions].sort((a, b) => b.startedAt.localeCompare(a.startedAt));

  for (const s of sorted) {
    if (since && new Date(s.startedAt) < since) continue;
    for (const m of s.mistakes) {
      const skill: Skill | undefined =
        s.type === 'assessment' ? m.section : s.type === 'typing' || s.type === 'numpad' || s.type === 'copy' ? s.type : undefined;
      if (skill) out[skill].push({ ...m, at: s.startedAt });
    }
  }
  return out;
}

export type MissedChar = {
  /** The character that should have been typed. */
  char: string;
  count: number;
  /** What was typed instead most often ('' = it was skipped). */
  usuallyTyped: string;
};

/**
 * Characters that went wrong most often (wrong or skipped). Extra keys have
 * no "expected" character, so they are counted separately (see kindCounts).
 */
export function topMissedChars(mistakes: SessionMistake[], limit = 8): MissedChar[] {
  const byChar = new Map<string, Map<string, number>>();
  for (const m of mistakes) {
    if (m.expected === '') continue; // extra key
    const typedCounts = byChar.get(m.expected) ?? new Map<string, number>();
    typedCounts.set(m.typed, (typedCounts.get(m.typed) ?? 0) + 1);
    byChar.set(m.expected, typedCounts);
  }
  const rows: MissedChar[] = [...byChar.entries()].map(([char, typedCounts]) => {
    const [usuallyTyped] = [...typedCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    const count = [...typedCounts.values()].reduce((a, b) => a + b, 0);
    return { char, count, usuallyTyped };
  });
  return rows.sort((a, b) => b.count - a.count || a.char.localeCompare(b.char)).slice(0, limit);
}

/** How many typing mistakes of each kind. */
export function kindCounts(mistakes: SessionMistake[]) {
  let wrong = 0;
  let extra = 0;
  let skipped = 0;
  for (const m of mistakes) {
    if (m.expected === '') extra++;
    else if (m.typed === '') skipped++;
    else wrong++;
  }
  return { wrong, extra, skipped };
}

/** How many wrong fields per Copy Test field (e.g. { address: 5, name: 2 }). */
export function fieldCounts(mistakes: SessionMistake[]): { field: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const m of mistakes) if (m.field) counts.set(m.field, (counts.get(m.field) ?? 0) + 1);
  return [...counts.entries()].map(([field, count]) => ({ field, count })).sort((a, b) => b.count - a.count);
}

/**
 * Whole-value mistakes (numbers or fields) to type again: newest first, each
 * correct value only once.
 */
export function uniqueRecent(mistakes: DatedMistake[], limit = 20): DatedMistake[] {
  const seen = new Set<string>();
  const out: DatedMistake[] = [];
  for (const m of mistakes) {
    const key = `${m.field ?? ''}|${m.expected}`;
    if (m.expected === '' || seen.has(key)) continue;
    seen.add(key);
    out.push(m);
    if (out.length >= limit) break;
  }
  return out;
}

// ---------- typing drill ----------

let wordBank: string[] | null = null;

/**
 * Words from plain office text only (hand-written level 1 passages plus many
 * generated ones), matching the Typing Practice — no amounts or codes.
 */
function getWordBank(): string[] {
  if (wordBank) return wordBank;
  const rng = makeRng(2026);
  const texts = [
    ...passages.filter((p) => p.level === PLAIN_TEXT_LEVEL).map((p) => p.text),
    ...Array.from({ length: 150 }, () => generateParagraph(rng, PLAIN_TEXT_LEVEL)),
  ];
  wordBank = [...new Set(texts.join(' ').split(' ').filter(Boolean))];
  return wordBank;
}

/**
 * A short typing drill full of words that contain the given characters, so
 * the problem keys come up again and again. Returns '' when none of the
 * characters can be drilled (e.g. only spaces were missed).
 */
export function buildDrillPassage(rng: Rng, chars: string[], minChars: number): string {
  const targets = chars.filter((c) => c !== ' ');
  if (targets.length === 0) return '';
  const words = getWordBank().filter((w) => targets.some((c) => w.includes(c)));
  if (words.length === 0) return '';

  const parts: string[] = [];
  let length = 0;
  while (length < minChars) {
    for (const w of shuffle(rng, words)) {
      parts.push(w);
      length += w.length + 1;
      if (length >= minChars) break;
    }
  }
  return parts.join(' ');
}

