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
import { intBetween, pick, shuffle, type Rng } from '../../lib/random';
import * as ph from '../../data/ph';
import { digits } from '../typing/generatePassage';
import { computeSheet, sameResult } from './formulaEngine';
import { cellName, isFormula, makeSheet, type Pos, type Sheet } from './sheet';
import type { ExcelTask, SolutionStep } from './tasks';

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

const key = (k: string, mods: { ctrl?: boolean; shift?: boolean } = {}): SolutionStep => ({
  press: { key: k, ...mods },
});
const typeFormula = (f: string): SolutionStep[] => [key('='), { type: f }, key('Enter')];

/** Set cells directly (a task's starting state, not an undo step). */
function setCells(s: Sheet, changes: [Pos, string][]): Sheet {
  const cells = s.cells.map((row) => [...row]);
  for (const [p, v] of changes) cells[p.r][p.c] = v;
  return { ...s, cells };
}

function allTasks8(table: string[][], rng: Rng): Record<string, ExcelTask> {
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
      text: `Sa ${cellName(b2)}, tanggalin ang sobrang space ng pangalan sa A2 (sa unahan, sa hulihan, at sa gitna).`,
      tip: '=TRIM(A2), tapos Enter',
      hint: 'Ang =TRIM(cell) ay nagtatanggal ng sobrang space. Isang space na lang ang natitira sa pagitan ng mga salita.',
      solution: typeFormula('=TRIM(A2)'),
      start: b2,
      prepare: (s) => setCells(s, [[b2, '']]),
      check: (s) => sameAs(s, b2, '=TRIM(A2)', ['TRIM'], a2, probeName),
      maxKeys: 1,
    },
    {
      id: 'proper',
      text: `Sa ${cellName(b2)}, ayusin din ang malaki at maliit na titik: Juan Dela Cruz. Isama ang TRIM.`,
      tip: '=PROPER(TRIM(A2)), tapos Enter',
      hint: 'Ang PROPER ay naglalagay ng malaking titik sa simula ng bawat salita. Ilagay ang TRIM sa loob: =PROPER(TRIM(A2)).',
      solution: typeFormula(nameFormula(1)),
      start: b2,
      // The step before: B2 only trims.
      prepare: (s) => setCells(s, [[b2, '=TRIM(A2)']]),
      check: (s) => sameAs(s, b2, nameFormula(1), ['PROPER', 'TRIM'], a2, probeName),
      maxKeys: 1,
    },
    {
      id: 'fillName',
      text: `Kopyahin ang formula ng B2 pababa hanggang B${last}, para malinis ang lahat ng pangalan.`,
      tip: `Shift + ↓ hanggang B${last}, tapos Ctrl + D`,
      hint: `Nasa B2 ka. Shift + ↓ hanggang B${last} para mapili, tapos Ctrl + D.`,
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
      text: `Sa ${cellName(d2)}, isulat ang Ref No. ng C2 sa malalaking titik (TN-00457).`,
      tip: '=UPPER(C2), tapos Enter',
      hint: 'Ang =UPPER(cell) ay ginagawang malalaking titik lahat. (Ang =LOWER(cell) naman, maliliit.)',
      solution: typeFormula(refFormula(1)),
      start: d2,
      prepare: (s) => setCells(s, [[d2, '']]),
      check: (s) => sameAs(s, d2, refFormula(1), ['UPPER'], c2, probeRef),
      maxKeys: 1,
    },
    {
      id: 'left',
      text: `Sa ${cellName(e2)}, kunin ang Branch: ang unang 2 titik ng Ref No. sa D2.`,
      tip: '=LEFT(D2,2), tapos Enter',
      hint: 'Ang =LEFT(cell, ilan) ay kumukuha ng mga titik mula sa kaliwa. Dito: 2 titik mula sa D2.',
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
      text: `Sa ${cellName(f2)}, kunin ang No.: ang huling 5 numero ng Ref No. sa D2.`,
      tip: '=RIGHT(D2,5), tapos Enter',
      hint: 'Ang =RIGHT(cell, ilan) ay kumukuha mula sa kanan. Dito: 5 mula sa D2. Mananatili ang 0 sa unahan (00457).',
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
  return Object.fromEntries(tasks.map((t) => [t.id, t]));
}

/** A new messy customer list (Excel's number rules on) with one task of every Aralin 8 kind. */
export function makeTaskSet8(rng: Rng): { sheet: Sheet; tasks: Record<string, ExcelTask> } {
  const table = makeTable8(rng);
  // No extra empty column: all 6 columns fit a 1366px screen (sheetLayout.ts).
  const sheet = makeSheet(table, table.length + EXTRA_ROWS, HEADERS_8.length, { formatting: true });
  return { sheet, tasks: allTasks8(table, rng) };
}

/** The Aralin 8 Pagsusulit: a new sheet and all 6 task kinds in random order. */
export function makeQuiz8(rng: Rng): { sheet: Sheet; tasks: ExcelTask[] } {
  const set = makeTaskSet8(rng);
  return { sheet: set.sheet, tasks: shuffle(rng, Object.values(set.tasks)) };
}
