/**
 * QC / Spot the Difference (Phase 3, owner's choice 2026-09-27: "Record QC").
 *
 * Each item is a fake record (the ORIGINAL, same generator as the Copy Test)
 * and a copy of it "encoded by someone else" (the ENCODED one) with 0 to 2
 * realistic encoding mistakes: two letters swapped, a missing letter, a wrong
 * digit, a missing period ("Ma." -> "Ma"), or a lowercase name. The user must
 * find the fields with a mistake, like a QC checker at work.
 */
import { intBetween, pick, type Rng } from '../../lib/random';
import { FIELDS, makeRecord, type CopyRecord, type FieldKey } from '../copy/records';

export { FIELDS as QC_FIELDS };

export type QcItem = {
  original: CopyRecord;
  encoded: CopyRecord;
  /** The fields where `encoded` is different from `original` (in form order). */
  errors: FieldKey[];
};

/** How many fields get a mistake: about 30% none, 45% one, 25% two. */
export function errorCount(rng: Rng): number {
  const r = rng();
  if (r < 0.3) return 0;
  return r < 0.75 ? 1 : 2;
}

const isLetter = (c: string) => /[A-Za-z]/.test(c);
const isDigit = (c: string) => /[0-9]/.test(c);

/** Positions in `text` where `test` is true. */
function positions(text: string, test: (c: string, i: number) => boolean): number[] {
  return Array.from(text)
    .map((c, i) => (test(c, i) ? i : -1))
    .filter((i) => i >= 0);
}

/** Letters that sit next to each other on the keyboard (a common typo). */
const NEAR_KEYS: Record<string, string> = {
  a: 'sq', b: 'vn', c: 'xv', d: 'sf', e: 'wr', f: 'dg', g: 'fh', h: 'gj', i: 'uo', j: 'hk', k: 'jl', l: 'k',
  m: 'n', n: 'bm', o: 'ip', p: 'o', q: 'w', r: 'et', s: 'ad', t: 'ry', u: 'yi', v: 'cb', w: 'qe', x: 'zc',
  y: 'tu', z: 'x',
};

type Mutation = (text: string, rng: Rng) => string | null;

/** Two neighboring letters or digits swapped: "Cabrera" -> "Cabrrea", "4098" -> "4089". */
const swapNeighbors: Mutation = (text, rng) => {
  const spots = positions(text, (c, i) => {
    const next = text[i + 1] ?? '';
    const sameKind = (isLetter(c) && isLetter(next)) || (isDigit(c) && isDigit(next));
    return sameKind && c.toLowerCase() !== next.toLowerCase();
  });
  if (spots.length === 0) return null;
  const i = pick(rng, spots);
  return text.slice(0, i) + text[i + 1] + text[i] + text.slice(i + 2);
};

/** One letter left out (only inside a word of 4+ letters, so it is a real misspelling). */
const dropLetter: Mutation = (text, rng) => {
  const spots = positions(text, (c, i) => isLetter(c) && i > 0 && isLetter(text[i - 1]) && isLetter(text[i + 1] ?? ''));
  if (spots.length === 0) return null;
  const i = pick(rng, spots);
  return text.slice(0, i) + text.slice(i + 1);
};

/** One wrong digit, or a letter replaced by its neighbor on the keyboard. */
const wrongKey: Mutation = (text, rng) => {
  const spots = positions(text, (c) => isDigit(c) || (isLetter(c) && c.toLowerCase() in NEAR_KEYS));
  if (spots.length === 0) return null;
  const i = pick(rng, spots);
  const c = text[i];
  let replacement: string;
  if (isDigit(c)) {
    replacement = String((Number(c) + intBetween(rng, 1, 9)) % 10);
  } else {
    const near = pick(rng, Array.from(NEAR_KEYS[c.toLowerCase()]));
    replacement = c === c.toUpperCase() ? near.toUpperCase() : near;
  }
  return text.slice(0, i) + replacement + text.slice(i + 1);
};

/** A period left out: "Ma." -> "Ma", "Brgy." -> "Brgy", "St." -> "St". */
const dropPeriod: Mutation = (text, rng) => {
  const spots = positions(text, (c, i) => c === '.' && i > 0 && isLetter(text[i - 1]));
  if (spots.length === 0) return null;
  const i = pick(rng, spots);
  return text.slice(0, i) + text.slice(i + 1);
};

/** A capitalized word typed in lowercase: "Cabrera" -> "cabrera". */
const lowercaseWord: Mutation = (text, rng) => {
  const words = [...text.matchAll(/\b[A-Z][a-z]{2,}\b/g)];
  if (words.length === 0) return null;
  const w = pick(rng, words);
  const start = w.index ?? 0;
  return text.slice(0, start) + w[0].toLowerCase() + text.slice(start + w[0].length);
};

/** Which kinds of mistakes fit each field (numbers only get digit mistakes). */
const MUTATIONS: Record<FieldKey, Mutation[]> = {
  name: [swapNeighbors, dropLetter, wrongKey, dropPeriod, lowercaseWord],
  birthDate: [swapNeighbors, wrongKey],
  address: [swapNeighbors, dropLetter, wrongKey, dropPeriod, lowercaseWord],
  contactNo: [swapNeighbors, wrongKey],
  idNo: [swapNeighbors, wrongKey],
};

/**
 * `text` with one realistic mistake. Always different from `text` (after
 * trimming, the way fields are compared); falls back to a wrong key.
 */
export function addMistake(text: string, field: FieldKey, rng: Rng): string {
  const tries = [...MUTATIONS[field]];
  while (tries.length > 0) {
    const mutation = tries.splice(Math.floor(rng() * tries.length), 1)[0];
    const result = mutation(text, rng);
    if (result !== null && result.trim() !== text.trim()) return result;
  }
  // Every record value has digits or letters, so a wrong key always works.
  let result = wrongKey(text, rng) ?? `${text}x`;
  while (result.trim() === text.trim()) result = wrongKey(text, rng) ?? `${text}x`;
  return result;
}

export function makeQcItem(rng: Rng): QcItem {
  const original = makeRecord(rng);
  const count = errorCount(rng);
  const keys = FIELDS.map((f) => f.key);
  const chosen = new Set<FieldKey>();
  while (chosen.size < count) chosen.add(pick(rng, keys));
  const encoded = { ...original };
  for (const key of chosen) encoded[key] = addMistake(original[key], key, rng);
  return { original, encoded, errors: keys.filter((k) => chosen.has(k)) };
}
