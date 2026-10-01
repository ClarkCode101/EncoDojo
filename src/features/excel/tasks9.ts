/**
 * The tasks of Excel Aralin 9, "Pagdugtong at paghiwalay": splitting a full
 * name with Flash Fill (Ctrl+E) and with Text to Columns, joining names with
 * & (=C2&" "&B2) and copying it down, and Paste Values (Ctrl+Shift+V) so the
 * joined names stay when the source columns are deleted.
 *
 * The sheet is an employee list with the name as "Last, First" in one column
 * (Full Name), and empty Last Name, First Name and Name Tag columns. Each
 * task's `prepare` sets up exactly what it needs, so the tasks work in any
 * order (tested). Formulas are computed with HyperFormula (formulaEngine.ts);
 * the sheet also gets `compute`, so a copy remembers the values for Paste Values.
 */
import { translator, type Lang, type T } from '../../lib/i18n';
import { intBetween, pick, shuffle, type Rng } from '../../lib/random';
import * as ph from '../../data/ph';
import { computeSheet } from './formulaEngine';
import { cellName, isFormula, makeSheet, type Pos, type Sheet } from './sheet';
import type { ExcelTask, SolutionStep } from './tasks';

export const HEADERS_9 = ['Full Name', 'Last Name', 'First Name', 'Name Tag'];
const COL = { full: 0, last: 1, first: 2, tag: 3 } as const;
const EXTRA_ROWS = 6;

export type Person9 = { last: string; first: string };

/** 8 to 12 different people; "Last, First" is at most 22 letters so it fits the column. */
export function makePeople9(rng: Rng): Person9[] {
  const count = intBetween(rng, 8, 12);
  const people: Person9[] = [];
  const seen = new Set<string>();
  while (people.length < count) {
    const p = { last: pick(rng, ph.surnames), first: pick(rng, [...ph.femaleFirstNames, ...ph.maleFirstNames]) };
    const full = `${p.last}, ${p.first}`;
    if (full.length > 22 || seen.has(full)) continue;
    seen.add(full);
    people.push(p);
  }
  return people;
}

const key = (k: string, mods: { ctrl?: boolean; shift?: boolean } = {}): SolutionStep => ({
  press: { key: k, ...mods },
});
/** Type a value into the active cell (the first letter starts the edit, like a person typing). */
const typeValue = (v: string): SolutionStep[] => [key(v[0]), { type: v }];

/** Set cells directly (a task's starting state, not an undo step). */
function setCells(s: Sheet, changes: [Pos, string][]): Sheet {
  const cells = s.cells.map((row) => [...row]);
  for (const [p, v] of changes) cells[p.r][p.c] = v;
  return { ...s, cells };
}

function allTasks9(people: Person9[], t: T): Record<string, ExcelTask> {
  const n = people.length; // people are rows 1..n
  const rows = Array.from({ length: n }, (_, i) => i + 1);
  const last = n + 1; // Excel row number of the last person
  const at = (r: number, c: number): Pos => ({ r, c });
  const person = (r: number) => people[r - 1];
  const tag = (r: number) => `${person(r).first} ${person(r).last}`;
  const tagFormula = (r: number) => `=C${r + 1}&" "&B${r + 1}`;
  /** Every row of column `c` set by `value(r)`. */
  const column = (c: number, value: (r: number) => string) => rows.map((r) => [at(r, c), value(r)] as [Pos, string]);
  const clear = (c: number) => column(c, () => '');
  const names = [...column(COL.last, (r) => person(r).last), ...column(COL.first, (r) => person(r).first)];
  const p1 = person(1);
  const b2 = at(1, COL.last);
  const c2 = at(1, COL.first);
  const d2 = at(1, COL.tag);

  const tasks: ExcelTask[] = [
    {
      id: 'flashLast',
      text: t(
        `Sa ${cellName(b2)}, i-type ang Last Name ng A2 (${p1.last}), tapos Enter at Ctrl + E. Pupunuin ng Flash Fill ang iba.`,
        `In ${cellName(b2)}, type the Last Name of A2 (${p1.last}), then Enter and Ctrl + E. Flash Fill fills in the rest.`,
      ),
      tip: t(`I-type ang ${p1.last}, Enter, tapos Ctrl + E`, `Type ${p1.last}, Enter, then Ctrl + E`),
      hint: t(
        'Isang halimbawa lang ang i-type. Sa kasunod na cell, pindutin ang Ctrl + E: gagayahin ng Excel ang ginawa mo sa lahat ng row.',
        'Type just one example. In the next cell, press Ctrl + E: Excel copies what you did in every row.',
      ),
      solution: [...typeValue(p1.last), key('Enter'), key('e', { ctrl: true })],
      start: b2,
      prepare: (s) => setCells(s, [...clear(COL.last), ...clear(COL.first), ...clear(COL.tag)]),
      check: (s) => !s.editing && rows.every((r) => s.cells[r][COL.last] === person(r).last),
      maxKeys: 2,
    },
    {
      id: 'flashFirst',
      text: t(
        `Sa ${cellName(c2)}, i-type ang First Name ng A2 (${p1.first}), tapos Enter at Ctrl + E.`,
        `In ${cellName(c2)}, type the First Name of A2 (${p1.first}), then Enter and Ctrl + E.`,
      ),
      tip: t(`I-type ang ${p1.first}, Enter, tapos Ctrl + E`, `Type ${p1.first}, Enter, then Ctrl + E`),
      hint: t(
        'Gaya ng Last Name: isang halimbawa, tapos Ctrl + E sa kasunod na cell.',
        'Like the Last Name: one example, then Ctrl + E in the next cell.',
      ),
      solution: [...typeValue(p1.first), key('Enter'), key('e', { ctrl: true })],
      start: c2,
      prepare: (s) => setCells(s, [...column(COL.last, (r) => person(r).last), ...clear(COL.first), ...clear(COL.tag)]),
      check: (s) => !s.editing && rows.every((r) => s.cells[r][COL.first] === person(r).first),
      maxKeys: 2,
    },
    {
      id: 'textToColumns',
      text: t(
        `Hatiin ang Full Name (A2 hanggang A${last}) sa Last Name at First Name gamit ang Text to Columns. Ilagay sa B2.`,
        `Split the Full Name (A2 to A${last}) into Last Name and First Name with Text to Columns. Put them in B2.`,
      ),
      tip: `Ctrl + Shift + ↓, Text to Columns, Comma, Destination B2`,
      hint: t(
        `Piliin ang A2 hanggang A${last} (Ctrl + Shift + ↓). Sa Data toolbar: Text to Columns. Piliin ang Comma, at sa Destination isulat ang B2.`,
        `Select A2 to A${last} (Ctrl + Shift + ↓). On the Data toolbar: Text to Columns. Choose Comma, and in Destination write B2.`,
      ),
      solution: [
        key('ArrowDown', { ctrl: true, shift: true }),
        { command: { kind: 'textToColumns', delimiter: ',', dest: { r: 1, c: 1 } } },
      ],
      start: at(1, COL.full),
      prepare: (s) => setCells(s, [...clear(COL.last), ...clear(COL.first), ...clear(COL.tag)]),
      // The Full Name stays; the parts may keep the space after the comma (" Juan"), like Excel.
      check: (s) =>
        !s.editing &&
        rows.every(
          (r) =>
            s.cells[r][COL.full] === `${person(r).last}, ${person(r).first}` &&
            s.cells[r][COL.last].trim() === person(r).last &&
            s.cells[r][COL.first].trim() === person(r).first,
        ),
      maxKeys: 3,
    },
    {
      id: 'join',
      text: t(
        `Sa ${cellName(d2)}, gawin ang Name Tag: First Name, isang space, tapos Last Name (${tag(1)}).`,
        `In ${cellName(d2)}, make the Name Tag: First Name, a space, then Last Name (${tag(1)}).`,
      ),
      tip: t('=C2&" "&B2, tapos Enter', '=C2&" "&B2, then Enter'),
      hint: t(
        'Ang & ay nagdudugtong. Ang space ay text din, kaya nasa loob ng " ": =C2&" "&B2.',
        '& joins things. A space is text too, so it goes inside " ": =C2&" "&B2.',
      ),
      solution: [key('='), { type: tagFormula(1) }, key('Enter')],
      start: d2,
      prepare: (s) => setCells(s, [...names, ...clear(COL.tag)]),
      check: (s) => {
        if (s.editing || !isFormula(s.cells[d2.r][d2.c])) return false;
        // It must follow B2 and C2 when they change (a typed name does not).
        const probe = computeSheet(setCells(s, [[b2, 'Lopez']]).cells)[d2.r][d2.c];
        return computeSheet(s.cells)[d2.r][d2.c] === tag(1) && probe === `${p1.first} Lopez`;
      },
      maxKeys: 1,
    },
    {
      id: 'joinFill',
      text: t(
        `Kopyahin ang formula ng D2 pababa hanggang D${last}, para may Name Tag ang lahat.`,
        `Copy the formula in D2 down to D${last}, so everyone has a Name Tag.`,
      ),
      tip: t(`Shift + ↓ hanggang D${last}, tapos Ctrl + D`, `Shift + ↓ to D${last}, then Ctrl + D`),
      hint: t(
        `Nasa D2 ka. Shift + ↓ hanggang D${last} para mapili, tapos Ctrl + D.`,
        `You are in D2. Shift + ↓ to D${last} to select, then Ctrl + D.`,
      ),
      solution: [...Array.from({ length: n - 1 }, () => key('ArrowDown', { shift: true })), key('d', { ctrl: true })],
      start: d2,
      prepare: (s) => setCells(s, [...names, ...clear(COL.tag), [d2, tagFormula(1)]]),
      check: (s) => {
        if (s.editing) return false;
        const values = computeSheet(s.cells);
        return rows.every((r) => isFormula(s.cells[r][COL.tag]) && values[r][COL.tag] === tag(r));
      },
      maxKeys: n + 1,
    },
    {
      id: 'pasteValues',
      text: t(
        `Gawing value ang Name Tag (D2 hanggang D${last}), para hindi ito masira kapag binura ang Last Name at First Name.`,
        `Turn the Name Tags (D2 to D${last}) into values, so they do not break when the Last Name and First Name are deleted.`,
      ),
      tip: t(
        `Shift + ↓ hanggang D${last}, Ctrl + C, tapos Ctrl + Shift + V`,
        `Shift + ↓ to D${last}, Ctrl + C, then Ctrl + Shift + V`,
      ),
      hint: t(
        `Piliin ang D2 hanggang D${last} at kopyahin (Ctrl + C). Tapos Ctrl + Shift + V: ang ipe-paste ay ang nakikitang pangalan, hindi ang formula.`,
        `Select D2 to D${last} and copy (Ctrl + C). Then Ctrl + Shift + V: it pastes the name you see, not the formula.`,
      ),
      solution: [
        ...Array.from({ length: n - 1 }, () => key('ArrowDown', { shift: true })),
        key('c', { ctrl: true }),
        key('v', { ctrl: true, shift: true }),
      ],
      start: d2,
      prepare: (s) => setCells(s, [...names, ...column(COL.tag, tagFormula)]),
      check: (s) => !s.editing && rows.every((r) => s.cells[r][COL.tag] === tag(r)),
      maxKeys: n + 1,
    },
  ];
  return Object.fromEntries(tasks.map((x) => [x.id, x]));
}

/** A new employee list (Excel's number rules on) with one task of every Aralin 9 kind. */
export function makeTaskSet9(rng: Rng, lang: Lang = 'tl'): { sheet: Sheet; tasks: Record<string, ExcelTask> } {
  const people = makePeople9(rng);
  const table = [HEADERS_9, ...people.map((p) => [`${p.last}, ${p.first}`, '', '', ''])];
  const sheet = makeSheet(table, table.length + EXTRA_ROWS, HEADERS_9.length, {
    formatting: true,
    compute: computeSheet,
  });
  return { sheet, tasks: allTasks9(people, translator(lang)) };
}

/** The Aralin 9 Pagsusulit: a new sheet and all 6 task kinds in random order. */
export function makeQuiz9(rng: Rng, lang: Lang = 'tl'): { sheet: Sheet; tasks: ExcelTask[] } {
  const set = makeTaskSet9(rng, lang);
  return { sheet: set.sheet, tasks: shuffle(rng, Object.values(set.tasks)) };
}
