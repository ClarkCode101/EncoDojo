/**
 * The tasks of Excel Aralin 11, "Petsa": typing a date the right way
 * (mm/dd/yyyy, so it is a real date), =TODAY(), counting with dates
 * (=B2+30, =TODAY()-B2), =TEXT(B2,"mmmm"), and turning a dd/mm/yyyy text
 * date from a supplier into a real date with DATE(RIGHT, MID, LEFT).
 *
 * The sheet is an invoice list (Invoice No., Date, Due Date, Age, Month,
 * Supplier Date, Fixed Date) with one invoice without a Date, and a "Today"
 * cell under the table. The Supplier Dates are TEXT (formatted as text, like
 * data imported from another system). Formula checks compare with the lesson's
 * own formula (`sameResult`) on the sheet and on a copy with another date.
 */
import { translator, type Lang, type T } from '../../lib/i18n';
import { intBetween, shuffle, type Rng } from '../../lib/random';
import { digits } from '../typing/generatePassage';
import { computeSheet, sameResult } from './formulaEngine';
import { cellName, cellsForCompute, isDateText, isFormula, makeSheet, type Pos, type Sheet } from './sheet';
import type { ExcelTask, SolutionStep } from './tasks';

export const HEADERS_11 = ['Invoice No.', 'Date', 'Due Date', 'Age', 'Month', 'Supplier Date', 'Fixed Date'];
const COL = { invoice: 0, date: 1, due: 2, age: 3, month: 4, supplier: 5, fixed: 6 } as const;
const EXTRA_ROWS = 5;
export const TERMS = 30;

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]; // prettier-ignore
const pad = (n: number) => String(n).padStart(2, '0');

export type Day = { y: number; m: number; d: number };
export const mmddyyyy = ({ y, m, d }: Day) => `${pad(m)}/${pad(d)}/${y}`;
export const ddmmyyyy = ({ y, m, d }: Day) => `${pad(d)}/${pad(m)}/${y}`;
const longDate = ({ y, m, d }: Day) => `${MONTHS[m - 1]} ${d}, ${y}`;
function addDays({ y, m, d }: Day, days: number): Day {
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}
/** A date in 2026, January to August (days 1-28, so every month has it). */
const randomDay = (rng: Rng): Day => ({ y: 2026, m: intBetween(rng, 1, 8), d: intBetween(rng, 1, 28) });

export type Table11 = {
  table: string[][];
  /** The invoices' dates (index 0 = sheet row 1). */
  dates: Day[];
  /** The Supplier Dates as real dates. */
  supplier: Day[];
  /** The sheet row (0-based) whose Date is blank (to type). */
  blankRow: number;
};

/**
 * 8 to 10 invoices. Due Date = Date + 30 (C2 is left for the task). Supplier
 * Dates are dd/mm/yyyy: some with a day over 12 (clearly not mm/dd), and some
 * with a day of 12 or less (they LOOK like mm/dd dates, but are not).
 */
export function makeTable11(rng: Rng): Table11 {
  const n = intBetween(rng, 8, 10);
  const dates = Array.from({ length: n }, () => randomDay(rng));
  const supplier = Array.from({ length: n }, (_, i) => ({
    ...randomDay(rng),
    // Alternate: day 13-28, then day 1-12 (the confusing ones).
    d: i % 2 === 0 ? intBetween(rng, 13, 28) : intBetween(rng, 1, 12),
  }));
  const blankRow = intBetween(rng, 3, n);
  const rows: string[][] = [HEADERS_11];
  for (let r = 1; r <= n; r++) {
    const date = dates[r - 1];
    rows.push([
      `SI-${digits(rng, 5)}`,
      r === blankRow ? '' : mmddyyyy(date),
      r === 1 ? '' : mmddyyyy(addDays(date, TERMS)),
      '',
      '',
      ddmmyyyy(supplier[r - 1]),
      '',
    ]);
  }
  return { table: rows, dates, supplier, blankRow };
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

/** m/d/yyyy or mm/dd/yyyy text -> the date, or null. */
function parseTyped(v: string): Day | null {
  if (!isDateText(v)) return null;
  const [m, d, y] = v.split('/').map(Number);
  return { y, m, d };
}

function allTasks11({ dates, supplier, blankRow }: Table11, n: number, rng: Rng, t: T): Record<string, ExcelTask> {
  const at = (r: number, c: number): Pos => ({ r, c });
  const todayRow = n + 2; // two rows under the table
  const b2 = at(1, COL.date);
  const c2 = at(1, COL.due);
  const d2 = at(1, COL.age);
  const e2 = at(1, COL.month);
  const f2 = at(1, COL.supplier);
  const g2 = at(1, COL.fixed);
  const today = at(todayRow, COL.date);
  const blank = at(blankRow, COL.date);
  const target = dates[blankRow - 1];
  // Other dates for the probes: a different month than row 2's (so a typed answer cannot pass).
  const other: Day = { y: 2026, m: (dates[0].m % 12) + 1, d: 15 };
  const otherSupplier: Day = { y: 2026, m: (supplier[0].m % 12) + 1, d: intBetween(rng, 13, 28) };

  /** `p` holds a formula (with `word`) that gives the same as `reference`, also after the `probe` change. */
  const formulaCheck = (p: Pos, word: string, reference: string, probe: [Pos, string]) => (s: Sheet) => {
    const f = s.cells[p.r][p.c];
    if (s.editing || !isFormula(f) || !f.toUpperCase().includes(word)) return false;
    return (
      sameResult(cellsForCompute(s), p, reference) && sameResult(cellsForCompute(setCells(s, [probe])), p, reference)
    );
  };

  const tasks: ExcelTask[] = [
    {
      id: 'typeDate',
      text: t(
        `Sa ${cellName(blank)}, i-type ang Date ng invoice na ito: ${longDate(target)}. Gamitin ang mm/dd/yyyy.`,
        `In ${cellName(blank)}, type the Date of this invoice: ${longDate(target)}. Use mm/dd/yyyy.`,
      ),
      tip: t(`${mmddyyyy(target)}, tapos Enter`, `${mmddyyyy(target)}, then Enter`),
      hint: t(
        `Buwan muna, tapos araw, tapos taon: ${mmddyyyy(target)}. Kapag tama, mapupunta ito sa kanan ng cell: totoong petsa.`,
        `Month first, then day, then year: ${mmddyyyy(target)}. When it is right, it goes to the right of the cell: a real date.`,
      ),
      solution: [key(mmddyyyy(target)[0]), { type: mmddyyyy(target) }, key('Enter')],
      start: blank,
      prepare: (s) => setCells(s, [[blank, '']]),
      check: (s) => {
        const d = parseTyped(s.cells[blank.r][blank.c]);
        return !s.editing && d !== null && d.y === target.y && d.m === target.m && d.d === target.d;
      },
      maxKeys: 1,
    },
    {
      id: 'today',
      text: t(
        `Sa ${cellName(today)}, ilagay ang petsa ngayon gamit ang formula, para kusang magbago bukas.`,
        `In ${cellName(today)}, put today's date with a formula, so it changes by itself tomorrow.`,
      ),
      tip: t('=TODAY(), tapos Enter', '=TODAY(), then Enter'),
      hint: t(
        'Ang =TODAY() ay laging ang petsa ngayon. (Petsa rin ang Ctrl + ;, pero hindi na ito nagbabago.)',
        "=TODAY() is always today's date. (Ctrl + ; gives a date too, but it never changes.)",
      ),
      solution: typeFormula('=TODAY()'),
      start: today,
      prepare: (s) => setCells(s, [[today, '']]),
      check: (s) =>
        !s.editing &&
        isFormula(s.cells[today.r][today.c]) &&
        s.cells[today.r][today.c].toUpperCase().includes('TODAY') &&
        sameResult(cellsForCompute(s), today, '=TODAY()'),
      maxKeys: 1,
    },
    {
      id: 'dueDate',
      text: t(
        `Sa ${cellName(c2)}, kuwentahin ang Due Date: ${TERMS} araw pagkatapos ng Date (B2).`,
        `In ${cellName(c2)}, work out the Due Date: ${TERMS} days after the Date (B2).`,
      ),
      tip: t(`=B2+${TERMS}, tapos Enter`, `=B2+${TERMS}, then Enter`),
      hint: t(
        `Numero ang petsa, kaya puwedeng dagdagan: =B2+${TERMS} ay ${TERMS} araw pagkatapos ng B2.`,
        `A date is a number, so you can add to it: =B2+${TERMS} is ${TERMS} days after B2.`,
      ),
      solution: typeFormula(`=B2+${TERMS}`),
      start: c2,
      prepare: (s) => setCells(s, [[c2, '']]),
      check: formulaCheck(c2, 'B2', `=B2+${TERMS}`, [b2, mmddyyyy(other)]),
      maxKeys: 1,
    },
    {
      id: 'age',
      text: t(
        `Sa ${cellName(d2)}, ilang araw na mula sa Date (B2) hanggang ngayon?`,
        `In ${cellName(d2)}, how many days is it from the Date (B2) until today?`,
      ),
      tip: t('=TODAY()-B2, tapos Enter', '=TODAY()-B2, then Enter'),
      hint: t(
        'Ang bawas ng dalawang petsa ay bilang ng araw: =TODAY()-B2.',
        'One date minus another is a number of days: =TODAY()-B2.',
      ),
      solution: typeFormula('=TODAY()-B2'),
      start: d2,
      prepare: (s) => setCells(s, [[d2, '']]),
      check: formulaCheck(d2, 'TODAY', '=TODAY()-B2', [b2, mmddyyyy(other)]),
      maxKeys: 1,
    },
    {
      id: 'textMonth',
      text: t(
        `Sa ${cellName(e2)}, isulat ang pangalan ng buwan ng Date (B2), halimbawa ${MONTHS[dates[0].m - 1]}.`,
        `In ${cellName(e2)}, write the month name of the Date (B2), for example ${MONTHS[dates[0].m - 1]}.`,
      ),
      tip: t('=TEXT(B2,"mmmm"), tapos Enter', '=TEXT(B2,"mmmm"), then Enter'),
      hint: t(
        'Ang =TEXT(petsa, "anyo") ay nagpapakita ng petsa sa ibang anyo. Ang "mmmm" ay buong pangalan ng buwan.',
        '=TEXT(date, "format") shows a date in another format. "mmmm" is the full month name.',
      ),
      solution: typeFormula('=TEXT(B2,"mmmm")'),
      start: e2,
      prepare: (s) => setCells(s, [[e2, '']]),
      check: formulaCheck(e2, 'TEXT', '=TEXT(B2,"mmmm")', [b2, mmddyyyy(other)]),
      maxKeys: 1,
    },
    {
      id: 'fixDate',
      text: t(
        `Ang Supplier Date (F2) ay dd/mm/yyyy at text. Sa ${cellName(g2)}, gawin itong totoong petsa.`,
        `The Supplier Date (F2) is dd/mm/yyyy and text. In ${cellName(g2)}, make it a real date.`,
      ),
      tip: t(
        '=DATE(RIGHT(F2,4),MID(F2,4,2),LEFT(F2,2)), tapos Enter',
        '=DATE(RIGHT(F2,4),MID(F2,4,2),LEFT(F2,2)), then Enter',
      ),
      hint: t(
        'Ang =DATE(taon, buwan, araw) ay gumagawa ng petsa. Taon: RIGHT(F2,4). Buwan: MID(F2,4,2), 2 titik mula sa ika-4. Araw: LEFT(F2,2).',
        '=DATE(year, month, day) makes a date. Year: RIGHT(F2,4). Month: MID(F2,4,2), 2 characters from the 4th. Day: LEFT(F2,2).',
      ),
      solution: typeFormula('=DATE(RIGHT(F2,4),MID(F2,4,2),LEFT(F2,2))'),
      start: g2,
      prepare: (s) => setCells(s, [[g2, '']]),
      check: formulaCheck(g2, 'DATE', '=DATE(RIGHT(F2,4),MID(F2,4,2),LEFT(F2,2))', [f2, ddmmyyyy(otherSupplier)]),
      maxKeys: 1,
    },
  ];
  return Object.fromEntries(tasks.map((x) => [x.id, x]));
}

/** A new invoice list (Excel's number rules on) with one task of every Aralin 11 kind. */
export function makeTaskSet11(rng: Rng, lang: Lang = 'tl'): { sheet: Sheet; tasks: Record<string, ExcelTask> } {
  const t = makeTable11(rng);
  const n = t.table.length - 1;
  const table = [...t.table, Array(HEADERS_11.length).fill(''), ['Today', '', '', '', '', '', '']];
  // The Supplier Dates came from another system as TEXT (Excel keeps them as typed, on the left).
  const formats = Object.fromEntries(Array.from({ length: n }, (_, i) => [`${i + 1},${COL.supplier}`, { text: true }]));
  const sheet = makeSheet(table, table.length + EXTRA_ROWS, HEADERS_11.length, {
    formatting: true,
    formats,
    compute: computeSheet,
  });
  return { sheet, tasks: allTasks11(t, n, rng, translator(lang)) };
}

/** The Aralin 11 Pagsusulit: a new sheet and all 6 task kinds in random order. */
export function makeQuiz11(rng: Rng, lang: Lang = 'tl'): { sheet: Sheet; tasks: ExcelTask[] } {
  const set = makeTaskSet11(rng, lang);
  return { sheet: set.sheet, tasks: shuffle(rng, Object.values(set.tasks)) };
}
