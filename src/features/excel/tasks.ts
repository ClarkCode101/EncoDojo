/**
 * Excel Practice, round 1: "Navigation at shortcuts" (owner's choice,
 * 2026-09-27: short timed tasks, checked right away).
 *
 * A round = a fake "sales log" sheet + 8 tasks picked from the pool below.
 * Each task says what to do and which shortcut does it. A task is DONE when
 * its `check` passes; it was done "with the shortcut" when it took at most
 * `maxKeys` command keys (arrows, Enter, Ctrl+..., not the letters typed).
 * Changes to the sheet stay for the next tasks, like real work.
 */
import { intBetween, pick, shuffle, type Rng } from '../../lib/random';
import * as ph from '../../data/ph';
import { addMistake } from '../qc/qcItems';
import { digits, nameParts } from '../typing/generatePassage';
import { cellName, makeSheet, pressKey, selectionName, type Pos, type Sheet } from './sheet';

export const HEADERS = ['Ref No.', 'Customer', 'Branch', 'Date', 'Amount'];
/** Columns of the table (0-based): A..E */
const COL = { ref: 0, customer: 1, branch: 2, date: 3, amount: 4 } as const;
/** The sheet is a little bigger than the table, so there is empty space to the right and below. */
const EXTRA_ROWS = 10;
const SHEET_COLS = 8;

export const TASKS_PER_ROUND = 8;

/** Short names of the task kinds, for the results table. */
export const TASK_LABEL: Record<string, string> = {
  lastRow: 'Pumunta sa huling record',
  home: 'Bumalik sa A1',
  lastCell: 'Pumunta sa huling cell na may data',
  rowEnd: 'Pumunta sa dulo ng row',
  rowStart: 'Bumalik sa simula ng row',
  selectColumn: 'Piliin ang buong column ng data',
  selectAll: 'Piliin ang buong table',
  edit: 'Palitan ang laman ng cell',
  fix: 'Ayusin ang mali sa cell',
  clear: 'Burahin ang laman ng cell',
  copy: 'Kopyahin sa cell sa ilalim',
  undo: 'Ibalik ang nabura',
};

export type ExcelTask = {
  id: string;
  /** What to do, in Taglish (cell names in English, like Excel). */
  text: string;
  /** The shortcut, e.g. "Ctrl + ↓". */
  tip: string;
  /** Where the cursor starts. */
  start: Pos;
  /** Optional change to the sheet before the task (e.g. put a typo in a cell). */
  prepare?: (s: Sheet) => Sheet;
  check: (s: Sheet) => boolean;
  /** At most this many command keys = "gamit ang shortcut". */
  maxKeys: number;
};

export type ExcelRound = { sheet: Sheet; tasks: ExcelTask[]; lastRow: number };

function amount(rng: Rng): string {
  return `${intBetween(rng, 150, 25000)}.${pick(rng, ['00', '50', '25', '75', digits(rng, 2)])}`;
}

function date(rng: Rng): string {
  return `${String(intBetween(rng, 1, 12)).padStart(2, '0')}/${String(intBetween(rng, 1, 28)).padStart(2, '0')}/2026`;
}

/** The fake sales log: a header row and 18 to 26 records (so Ctrl+↓ really saves time). */
export function makeTable(rng: Rng): string[][] {
  const count = intBetween(rng, 18, 26);
  const rows = [HEADERS];
  for (let i = 0; i < count; i++) {
    const n = nameParts(rng);
    rows.push([
      `SL-2026-${digits(rng, 5)}`,
      `${n.given} ${n.surname}`,
      pick(rng, ph.cities)[0],
      date(rng),
      amount(rng),
    ]);
  }
  return rows;
}

/** Put a value in a cell through the normal key handling (so Ctrl+Z can undo it). */
function setValue(s: Sheet, p: Pos, value: string): Sheet {
  const at: Sheet = { ...s, active: p, anchor: p, editing: null };
  const done =
    value === ''
      ? pressKey(at, { key: 'Delete' })
      : pressKey({ ...at, editing: { value, mode: 'enter' } }, { key: 'Enter' });
  return { ...done, active: p, anchor: p };
}

const activeIs = (p: Pos) => (s: Sheet) => !s.editing && s.active.r === p.r && s.active.c === p.c;
const cellIs = (p: Pos, value: string) => (s: Sheet) => !s.editing && s.cells[p.r][p.c] === value;

/** All the task kinds; `last` = the row of the last record (0-based), `row` = a random record row. */
function taskPool(rng: Rng, table: string[][]): ExcelTask[] {
  const last = table.length - 1;
  // Every task gets its OWN row, so one task never gets in the way of another
  // (e.g. a cleared cell would stop Ctrl+→ early, just like in Excel).
  const candidates = shuffle(
    rng,
    Array.from({ length: last - 3 }, (_, i) => i + 2),
  );
  const mid = candidates[0];
  const [r1, r2, r3, r4, r5] = candidates.filter((r) => r !== mid && r !== mid + 1);
  const newBranch = pick(rng, ph.cities.map((c) => c[0]).filter((c) => c !== table[r1][COL.branch]));
  const original = table[r3][COL.customer];
  const typo = addMistake(original, 'name', rng);
  const deleted = table[r5][COL.branch];

  return [
    {
      id: 'lastRow',
      text: 'Pumunta sa HULING record ng table (column A).',
      tip: 'Ctrl + ↓',
      start: { r: 0, c: 0 },
      check: activeIs({ r: last, c: 0 }),
      maxKeys: 2,
    },
    {
      id: 'home',
      text: 'Bumalik sa pinakaunang cell, A1.',
      tip: 'Ctrl + Home',
      start: { r: mid, c: 3 },
      check: activeIs({ r: 0, c: 0 }),
      maxKeys: 1,
    },
    {
      id: 'lastCell',
      text: 'Pumunta sa huling cell na may data (pinakababa at pinakakanan).',
      tip: 'Ctrl + End',
      start: { r: 0, c: 0 },
      check: activeIs({ r: last, c: COL.amount }),
      maxKeys: 1,
    },
    {
      id: 'rowEnd',
      text: `Pumunta sa dulo ng row ${mid + 1} (ang Amount).`,
      tip: 'Ctrl + →',
      start: { r: mid, c: 0 },
      check: activeIs({ r: mid, c: COL.amount }),
      maxKeys: 1,
    },
    {
      id: 'rowStart',
      text: `Bumalik sa simula ng row ${r2 + 1} (column A).`,
      tip: 'Home',
      start: { r: r2, c: COL.amount },
      check: activeIs({ r: r2, c: 0 }),
      maxKeys: 1,
    },
    {
      id: 'selectColumn',
      text: `Piliin ang lahat ng Amount, mula E2 hanggang E${last + 1}.`,
      tip: 'Ctrl + Shift + ↓',
      start: { r: 1, c: COL.amount },
      check: (s) => !s.editing && selectionName(s) === `E2:E${last + 1}`,
      maxKeys: 1,
    },
    {
      id: 'selectAll',
      text: 'Piliin ang buong table, kasama ang header.',
      tip: 'Ctrl + A',
      start: { r: mid, c: 1 },
      check: (s) => !s.editing && selectionName(s) === `A1:E${last + 1}`,
      maxKeys: 1,
    },
    {
      id: 'edit',
      text: `Palitan ang Branch sa ${cellName({ r: r1, c: COL.branch })}: gawing "${newBranch}".`,
      tip: 'I-type, tapos Enter',
      start: { r: r1, c: COL.branch },
      check: cellIs({ r: r1, c: COL.branch }, newBranch),
      maxKeys: 2,
    },
    {
      id: 'fix',
      text: `May mali sa ${cellName({ r: r3, c: COL.customer })}. Dapat "${original}". Ayusin ito.`,
      tip: 'F2 para i-edit, tapos Enter',
      start: { r: r3, c: COL.customer },
      prepare: (s) => setValue(s, { r: r3, c: COL.customer }, typo),
      check: cellIs({ r: r3, c: COL.customer }, original),
      // F2 + moving inside the text is fine; this only flags very long detours.
      maxKeys: 12,
    },
    {
      id: 'clear',
      text: `Burahin ang laman ng ${cellName({ r: r4, c: COL.date })}.`,
      tip: 'Delete',
      start: { r: r4, c: COL.date },
      check: cellIs({ r: r4, c: COL.date }, ''),
      maxKeys: 1,
    },
    {
      id: 'copy',
      text: `Kopyahin ang Branch ng ${cellName({ r: mid, c: COL.branch })} papunta sa cell sa ilalim nito.`,
      tip: 'Ctrl + C, ↓, Ctrl + V',
      start: { r: mid, c: COL.branch },
      // Make sure the cell below is different first, so the task is never "already done".
      prepare: (s) =>
        s.cells[mid + 1][COL.branch] === s.cells[mid][COL.branch]
          ? setValue(s, { r: mid + 1, c: COL.branch }, pick(rng, ph.cities.map((c) => c[0]).filter((c) => c !== s.cells[mid][COL.branch])))
          : s,
      check: (s) => !s.editing && s.cells[mid + 1][COL.branch] === s.cells[mid][COL.branch],
      maxKeys: 3,
    },
    {
      id: 'undo',
      text: `Aksidenteng nabura ang ${cellName({ r: r5, c: COL.branch })}. Ibalik ito.`,
      tip: 'Ctrl + Z',
      start: { r: r5, c: COL.branch },
      prepare: (s) => setValue(s, { r: r5, c: COL.branch }, ''),
      check: cellIs({ r: r5, c: COL.branch }, deleted),
      maxKeys: 1,
    },
  ];
}

/** A new round: the sheet and 8 tasks in random order (a task never starts already done). */
export function makeRound(rng: Rng): ExcelRound {
  const table = makeTable(rng);
  const sheet = makeSheet(table, table.length + EXTRA_ROWS, SHEET_COLS);
  const tasks = shuffle(rng, taskPool(rng, table)).slice(0, TASKS_PER_ROUND);
  return { sheet, tasks, lastRow: table.length - 1 };
}

/** Put the cursor where the task starts (and apply its preparation). */
export function startTask(s: Sheet, task: ExcelTask): Sheet {
  const prepared = task.prepare ? task.prepare(s) : s;
  return { ...prepared, active: task.start, anchor: task.start, editing: null };
}
