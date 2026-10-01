/**
 * The tasks of Excel Aralin 8, "Paglinis ng text": TRIM (extra spaces),
 * PROPER inside TRIM (=PROPER(TRIM(A2))) and copying it down, UPPER, and
 * LEFT / RIGHT to take part of a code.
 *
 * The sheet is a messy customer list, like data imported from a web form:
 * names with extra spaces and mixed capitals, reference numbers typed in
 * small letters ("tn-00457"). The clean columns are empty.
 *
 * Checks compare the user's formula with the lesson's own formula: both are
 * computed with HyperFormula on the sheet, and again on a copy where the raw
 * value is changed (another messy name or code), so only a formula that
 * really cleans the text passes. Each task's `prepare` sets up what it needs,
 * so the tasks work in any order (tested).
 */
import { translator, type Lang, type T } from '../../lib/i18n';
import { intBetween, pick, shuffle, type Rng } from '../../lib/random';
import * as ph from '../../data/ph';
import { digits } from '../typing/generatePassage';
import { computeSheet, sameResult } from './formulaEngine';
import { cellName, isFormula, makeSheet, type Pos, type Sheet } from './sheet';
import type { ExcelTask } from './tasks';
import { key, setCells, typeFormula } from './taskHelpers';

export const HEADERS_8 = ['Name (raw)', 'Name', 'Ref (raw)', 'Ref No.', 'Branch', 'No.'];
const COL = { rawName: 0, name: 1, rawRef: 2, ref: 3, branch: 4, no: 5 } as const;
const EXTRA_ROWS = 6;
/** Made-up 2-letter branch codes. */
const BRANCH_CODES = ['TN', 'LP', 'CB', 'IL', 'DV', 'NG', 'ML', 'SP'];

/** Mixed capitals, like careless typing: "DELA", "cruz", "Juan". */
function messyCase(rng: Rng, word: string): string {
  return pick(rng, [word.toUpperCase(), word.toLowerCase(), word.toLowerCase(), word]);
}

const spaces = (n: number) => ' '.repeat(n);

/** A messy name: mixed capitals, spaces before/after, and sometimes 2-3 spaces between words. */
export function messyName(rng: Rng, name: string): string {
  const words = name.split(' ').map((w) => messyCase(rng, w));
  const inner = words.reduce((out, w, i) => (i === 0 ? w : out + spaces(pick(rng, [1, 1, 2, 3])) + w), '');
  const messy = spaces(pick(rng, [0, 1, 2])) + inner + spaces(pick(rng, [0, 1, 2]));
  // Always messy: if nothing changed, add a space in front and lowercase it.
  return messy === name ? ` ${name.toLowerCase()}` : messy;
}

/** A short name (at most 21 letters, so it fits the Name column): one first name + a surname. */
function shortName(rng: Rng): string {
  for (;;) {
    const first = pick(rng, [...ph.femaleFirstNames, ...ph.maleFirstNames]);
    const full = `${first} ${pick(rng, ph.surnames)}`;
    if (full.length <= 21) return full;
  }
}

/** A reference number as typed: "tn-00457" (all small, or the first letter capital). */
function messyRef(rng: Rng): string {
  const ref = `${pick(rng, BRANCH_CODES)}-${digits(rng, 5)}`;
  return pick(rng, [ref.toLowerCase(), ref.toLowerCase(), ref[0] + ref.slice(1).toLowerCase()]);
}

/** The customer list: 10 to 14 records; the clean columns (B, D, E, F) are empty. */
export function makeTable8(rng: Rng): string[][] {
  const count = intBetween(rng, 10, 14);
  const rows: string[][] = [HEADERS_8];
  for (let i = 0; i < count; i++) rows.push([messyName(rng, shortName(rng)), '', messyRef(rng), '', '', '']);
  return rows;
}

function allTasks8(table: string[][], rng: Rng, t: T): Record<string, ExcelTask> {
  const n = table.length - 1; // records are rows 1..n
  const rows = Array.from({ length: n }, (_, i) => i + 1);
  const last = n + 1; // Excel row number of the last record
  const at = (r: number, c: number): Pos => ({ r, c });
  const nameFormula = (r: number) => `=PROPER(TRIM(A${r + 1}))`;
  const refFormula = (r: number) => `=UPPER(C${r + 1})`;
  // Other raw values for the probes (a formula must also clean THESE right).
  const probeName = messyName(rng, shortName(rng));
  const probeRef = messyRef(rng);

  /**
   * The cell `p` holds a formula with every word in `words`, and gives the
   * same value as the lesson's `reference` formula: on the sheet, and on a
   * copy where the raw value at `raw` is changed. Exact (capitals count).
   */
  const sameAs = (s: Sheet, p: Pos, reference: string, words: string[], raw: Pos, other: string) => {
    const f = s.cells[p.r][p.c];
    if (s.editing || !isFormula(f) || !words.every((w) => f.toUpperCase().includes(w))) return false;
    return [s, setCells(s, [[raw, other]])].every((base) => sameResult(base.cells, p, reference));
  };
  const b2 = at(1, COL.name);
  const d2 = at(1, COL.ref);
  const e2 = at(1, COL.branch);
  const f2 = at(1, COL.no);
  const a2 = at(1, COL.rawName);
  const c2 = at(1, COL.rawRef);

  const tasks: ExcelTask[] = [
    {
      id: 'trim',
      text: t(
        `Sa ${cellName(b2)}, tanggalin ang sobrang space ng pangalan sa A2 (sa unahan, sa hulihan, at sa gitna).`,
        `In ${cellName(b2)}, remove the extra spaces of the name in A2 (at the start, at the end, and in between).`,
      ),
      tip: t('=TRIM(A2), tapos Enter', '=TRIM(A2), then Enter'),
      hint: t(
        'Ang =TRIM(cell) ay nagtatanggal ng sobrang space. Isang space na lang ang natitira sa pagitan ng mga salita.',
        '=TRIM(cell) removes extra spaces. Only one space stays between the words.',
      ),
      solution: typeFormula('=TRIM(A2)'),
      start: b2,
      prepare: (s) => setCells(s, [[b2, '']]),
      check: (s) => sameAs(s, b2, '=TRIM(A2)', ['TRIM'], a2, probeName),
      maxKeys: 1,
    },
    {
      id: 'proper',
      text: t(
        `Sa ${cellName(b2)}, ayusin din ang malaki at maliit na titik: Juan Dela Cruz. Isama ang TRIM.`,
        `In ${cellName(b2)}, also fix the capital and small letters: Juan Dela Cruz. Keep the TRIM.`,
      ),
      tip: t('=PROPER(TRIM(A2)), tapos Enter', '=PROPER(TRIM(A2)), then Enter'),
      hint: t(
        'Ang PROPER ay naglalagay ng malaking titik sa simula ng bawat salita. Ilagay ang TRIM sa loob: =PROPER(TRIM(A2)).',
        'PROPER puts a capital letter at the start of every word. Put the TRIM inside: =PROPER(TRIM(A2)).',
      ),
      solution: typeFormula(nameFormula(1)),
      start: b2,
      // The step before: B2 only trims.
      prepare: (s) => setCells(s, [[b2, '=TRIM(A2)']]),
      check: (s) => sameAs(s, b2, nameFormula(1), ['PROPER', 'TRIM'], a2, probeName),
      maxKeys: 1,
    },
    {
      id: 'fillName',
      text: t(
        `Kopyahin ang formula ng B2 pababa hanggang B${last}, para malinis ang lahat ng pangalan.`,
        `Copy the formula in B2 down to B${last}, so every name is clean.`,
      ),
      tip: t(`Shift + ↓ hanggang B${last}, tapos Ctrl + D`, `Shift + ↓ to B${last}, then Ctrl + D`),
      hint: t(
        `Nasa B2 ka. Shift + ↓ hanggang B${last} para mapili, tapos Ctrl + D.`,
        `You are in B2. Shift + ↓ to B${last} to select, then Ctrl + D.`,
      ),
      solution: [...Array.from({ length: n - 1 }, () => key('ArrowDown', { shift: true })), key('d', { ctrl: true })],
      start: b2,
      prepare: (s) =>
        setCells(s, [[b2, nameFormula(1)], ...rows.slice(1).map((r) => [at(r, COL.name), ''] as [Pos, string])]),
      check: (s) => {
        if (s.editing || !rows.every((r) => isFormula(s.cells[r][COL.name]))) return false;
        const mine = computeSheet(s.cells);
        const theirs = computeSheet(
          setCells(
            s,
            rows.map((r) => [at(r, COL.name), nameFormula(r)]),
          ).cells,
        );
        return rows.every((r) => mine[r][COL.name] === theirs[r][COL.name]);
      },
      maxKeys: n + 1,
    },
    {
      id: 'upper',
      text: t(
        `Sa ${cellName(d2)}, isulat ang Ref No. ng C2 sa malalaking titik (TN-00457).`,
        `In ${cellName(d2)}, write the Ref No. of C2 in capital letters (TN-00457).`,
      ),
      tip: t('=UPPER(C2), tapos Enter', '=UPPER(C2), then Enter'),
      hint: t(
        'Ang =UPPER(cell) ay ginagawang malalaking titik lahat. (Ang =LOWER(cell) naman, maliliit.)',
        '=UPPER(cell) makes every letter a capital. (=LOWER(cell) makes them small.)',
      ),
      solution: typeFormula(refFormula(1)),
      start: d2,
      prepare: (s) => setCells(s, [[d2, '']]),
      check: (s) => sameAs(s, d2, refFormula(1), ['UPPER'], c2, probeRef),
      maxKeys: 1,
    },
    {
      id: 'left',
      text: t(
        `Sa ${cellName(e2)}, kunin ang Branch: ang unang 2 titik ng Ref No. sa D2.`,
        `In ${cellName(e2)}, take the Branch: the first 2 letters of the Ref No. in D2.`,
      ),
      tip: t('=LEFT(D2,2), tapos Enter', '=LEFT(D2,2), then Enter'),
      hint: t(
        'Ang =LEFT(cell, ilan) ay kumukuha ng mga titik mula sa kaliwa. Dito: 2 titik mula sa D2.',
        '=LEFT(cell, how many) takes letters from the left. Here: 2 letters from D2.',
      ),
      solution: typeFormula('=LEFT(D2,2)'),
      start: e2,
      prepare: (s) =>
        setCells(s, [
          [d2, refFormula(1)],
          [e2, ''],
        ]),
      check: (s) => sameAs(s, e2, '=LEFT(D2,2)', ['LEFT'], c2, probeRef),
      maxKeys: 1,
    },
    {
      id: 'right',
      text: t(
        `Sa ${cellName(f2)}, kunin ang No.: ang huling 5 numero ng Ref No. sa D2.`,
        `In ${cellName(f2)}, take the No.: the last 5 digits of the Ref No. in D2.`,
      ),
      tip: t('=RIGHT(D2,5), tapos Enter', '=RIGHT(D2,5), then Enter'),
      hint: t(
        'Ang =RIGHT(cell, ilan) ay kumukuha mula sa kanan. Dito: 5 mula sa D2. Mananatili ang 0 sa unahan (00457).',
        '=RIGHT(cell, how many) takes from the right. Here: 5 from D2. The 0 in front stays (00457).',
      ),
      solution: typeFormula('=RIGHT(D2,5)'),
      start: f2,
      prepare: (s) =>
        setCells(s, [
          [d2, refFormula(1)],
          [f2, ''],
        ]),
      check: (s) => sameAs(s, f2, '=RIGHT(D2,5)', ['RIGHT'], c2, probeRef),
      maxKeys: 1,
    },
  ];
  return Object.fromEntries(tasks.map((x) => [x.id, x]));
}

/** A new messy customer list (Excel's number rules on) with one task of every Aralin 8 kind. */
export function makeTaskSet8(rng: Rng, lang: Lang = 'tl'): { sheet: Sheet; tasks: Record<string, ExcelTask> } {
  const table = makeTable8(rng);
  // No extra empty column: all 6 columns fit a 1366px screen (sheetLayout.ts).
  const sheet = makeSheet(table, table.length + EXTRA_ROWS, HEADERS_8.length, { formatting: true });
  return { sheet, tasks: allTasks8(table, rng, translator(lang)) };
}

/** The Aralin 8 Pagsusulit: a new sheet and all 6 task kinds in random order. */
export function makeQuiz8(rng: Rng, lang: Lang = 'tl'): { sheet: Sheet; tasks: ExcelTask[] } {
  const set = makeTaskSet8(rng, lang);
  return { sheet: set.sheet, tasks: shuffle(rng, Object.values(set.tasks)) };
}
