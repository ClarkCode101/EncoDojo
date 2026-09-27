/**
 * The tasks of Excel Aralin 1, "Navigation at shortcuts".
 *
 * Every task works on a fake "sales log" sheet: it says what to do, which
 * shortcut does it (`tip`), a hint in plain words (`hint`), and HOW to do it
 * (`solution`, used by "Ipakita kung paano" and by the tests). A task is DONE
 * when its `check` passes; it was done "with the shortcut" when it took at
 * most `maxKeys` command keys (arrows, Enter, Ctrl+..., not the letters typed)
 * and no mouse. Changes to the sheet stay for the next tasks, like real work.
 *
 * Used by the lesson (Alamin + Subukan, every task kind once, in topic order)
 * and by the Pagsusulit (6 random task kinds, no hints). No timer: this is
 * a learning track (owner's decision, 2026-09-27).
 */
import { intBetween, pick, shuffle, type Rng } from '../../lib/random';
import * as ph from '../../data/ph';
import { addMistake } from '../qc/qcItems';
import { digits, nameParts } from '../typing/generatePassage';
import { cellName, makeSheet, pressKey, selectionName, typeInCell, type KeyPress, type Pos, type Sheet } from './sheet';

export const HEADERS = ['Ref No.', 'Customer', 'Branch', 'Date', 'Amount'];
/** Columns of the table (0-based): A..E */
const COL = { ref: 0, customer: 1, branch: 2, date: 3, amount: 4 } as const;
/** The sheet is a little bigger than the table, so there is empty space to the right and below. */
const EXTRA_ROWS = 10;
const SHEET_COLS = 8;

/** The Pagsusulit: this many tasks, and this many done to pass. */
export const QUIZ_TASKS = 6;
export const QUIZ_PASS = 5;

/** Short names of the task kinds, for the results table. */
export const TASK_LABEL: Record<string, string> = {
  goto: 'Pumunta sa isang cell',
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

export type TaskId = keyof typeof TASK_LABEL;

/** One step of a solution: press a key, or type text into the cell being edited. */
export type SolutionStep = { press: KeyPress } | { type: string };

export type ExcelTask = {
  /** The task kind (Aralin 1: a TaskId; other lessons have their own). */
  id: string;
  /** What to do, in Taglish (cell names in English, like Excel). */
  text: string;
  /** The shortcut, e.g. "Ctrl + ↓". */
  tip: string;
  /** A hint in plain words (the first hint in the lesson). */
  hint: string;
  /** How to do it (for "Ipakita kung paano" and the tests). */
  solution: SolutionStep[];
  /** Where the cursor starts. */
  start: Pos;
  /** Optional change to the sheet before the task (e.g. put a typo in a cell). */
  prepare?: (s: Sheet) => Sheet;
  check: (s: Sheet) => boolean;
  /** At most this many command keys = "gamit ang shortcut". */
  maxKeys: number;
  /** A record to type, shown as a small table under the task (e.g. a new row: Ref No., Customer, ...). */
  record?: { label: string; value: string }[];
};

/** A sheet and one task of every kind, all on that sheet. */
export type TaskSet = { sheet: Sheet; tasks: Record<TaskId, ExcelTask>; lastRow: number };

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
const key = (k: string, mods: { ctrl?: boolean; shift?: boolean } = {}): SolutionStep => ({
  press: { key: k, ...mods },
});

/** Every task kind on this table. Every task gets its OWN row, so one never gets in the way of another. */
function allTasks(rng: Rng, table: string[][]): Record<TaskId, ExcelTask> {
  const last = table.length - 1;
  // (e.g. a cleared cell would stop Ctrl+→ early, just like in Excel)
  const candidates = shuffle(
    rng,
    Array.from({ length: last - 3 }, (_, i) => i + 2),
  );
  const mid = candidates[0];
  const [r1, r2, r3, r4, r5] = candidates.filter((r) => r !== mid && r !== mid + 1);
  const newBranch = pick(
    rng,
    ph.cities.map((c) => c[0]).filter((c) => c !== table[r1][COL.branch]),
  );
  const original = table[r3][COL.customer];
  const typo = addMistake(original, 'name', rng);
  const deleted = table[r5][COL.branch];
  // "Go to" target: a nearby cell, reachable with a few arrows (rows 3-7, columns B-D).
  const target = { r: intBetween(rng, 2, 6), c: intBetween(rng, 1, 3) };

  const tasks: ExcelTask[] = [
    {
      id: 'goto',
      text: `Pumunta sa cell ${cellName(target)}.`,
      tip: '↓ at →',
      hint: `Ang ${cellName(target).replace(/\d+/, '')} ay ang column (letra sa itaas), ang ${target.r + 1} ay ang row (numero sa kaliwa).`,
      solution: [
        ...Array.from({ length: target.r }, () => key('ArrowDown')),
        ...Array.from({ length: target.c }, () => key('ArrowRight')),
      ],
      start: { r: 0, c: 0 },
      check: activeIs(target),
      maxKeys: target.r + target.c,
    },
    {
      id: 'lastRow',
      text: 'Pumunta sa HULING record ng table (column A).',
      tip: 'Ctrl + ↓',
      hint: 'Pindutin nang sabay ang Ctrl at ang arrow pababa. Tatalon ito sa dulo ng data.',
      solution: [key('ArrowDown', { ctrl: true })],
      start: { r: 0, c: 0 },
      check: activeIs({ r: last, c: 0 }),
      maxKeys: 2,
    },
    {
      id: 'home',
      text: 'Bumalik sa pinakaunang cell, A1.',
      tip: 'Ctrl + Home',
      hint: 'Ctrl at Home nang sabay: laging bumabalik sa A1, kahit nasaan ka.',
      solution: [key('Home', { ctrl: true })],
      start: { r: mid, c: 3 },
      check: activeIs({ r: 0, c: 0 }),
      maxKeys: 1,
    },
    {
      id: 'lastCell',
      text: 'Pumunta sa huling cell na may data (pinakababa at pinakakanan).',
      tip: 'Ctrl + End',
      hint: 'Ctrl at End nang sabay: pupunta sa pinakadulong cell ng data.',
      solution: [key('End', { ctrl: true })],
      start: { r: 0, c: 0 },
      check: activeIs({ r: last, c: COL.amount }),
      maxKeys: 1,
    },
    {
      id: 'rowEnd',
      text: `Pumunta sa dulo ng row ${mid + 1} (ang Amount).`,
      tip: 'Ctrl + →',
      hint: 'Katulad ng Ctrl + ↓, pero pakanan: Ctrl at arrow pakanan nang sabay.',
      solution: [key('ArrowRight', { ctrl: true })],
      start: { r: mid, c: 0 },
      check: activeIs({ r: mid, c: COL.amount }),
      maxKeys: 1,
    },
    {
      id: 'rowStart',
      text: `Bumalik sa simula ng row ${r2 + 1} (column A).`,
      tip: 'Home',
      hint: 'Ang Home key lang (walang Ctrl): babalik sa column A ng parehong row.',
      solution: [key('Home')],
      start: { r: r2, c: COL.amount },
      check: activeIs({ r: r2, c: 0 }),
      maxKeys: 1,
    },
    {
      id: 'selectColumn',
      text: `Piliin ang lahat ng Amount, mula E2 hanggang E${last + 1}.`,
      tip: 'Ctrl + Shift + ↓',
      hint: 'Idagdag ang Shift sa Ctrl + ↓: pipiliin ang lahat ng dadaanan.',
      solution: [key('ArrowDown', { ctrl: true, shift: true })],
      start: { r: 1, c: COL.amount },
      check: (s) => !s.editing && selectionName(s) === `E2:E${last + 1}`,
      maxKeys: 1,
    },
    {
      id: 'selectAll',
      text: 'Piliin ang buong table, kasama ang header.',
      tip: 'Ctrl + A',
      hint: 'Ctrl at A (para sa "All") nang sabay.',
      solution: [key('a', { ctrl: true })],
      start: { r: mid, c: 1 },
      check: (s) => !s.editing && selectionName(s) === `A1:E${last + 1}`,
      maxKeys: 1,
    },
    {
      id: 'edit',
      text: `Palitan ang Branch sa ${cellName({ r: r1, c: COL.branch })}: gawing "${newBranch}".`,
      tip: 'I-type, tapos Enter',
      hint: 'Nasa tamang cell ka na. I-type lang ang bago (papalitan nito ang luma), tapos Enter.',
      solution: [key(newBranch[0]), { type: newBranch }, key('Enter')],
      start: { r: r1, c: COL.branch },
      check: cellIs({ r: r1, c: COL.branch }, newBranch),
      maxKeys: 2,
    },
    {
      id: 'fix',
      text: `May mali sa ${cellName({ r: r3, c: COL.customer })}. Dapat "${original}". Ayusin ito.`,
      tip: 'F2 para i-edit, tapos Enter',
      hint: 'Pindutin ang F2 para ma-edit ang laman nang hindi binubura lahat. Ayusin ang mali, tapos Enter.',
      solution: [key('F2'), { type: original }, key('Enter')],
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
      hint: 'Ang Delete key ang bumubura sa laman ng napiling cell.',
      solution: [key('Delete')],
      start: { r: r4, c: COL.date },
      check: cellIs({ r: r4, c: COL.date }, ''),
      maxKeys: 1,
    },
    {
      id: 'copy',
      text: `Kopyahin ang Branch ng ${cellName({ r: mid, c: COL.branch })} papunta sa cell sa ilalim nito.`,
      tip: 'Ctrl + C, ↓, Ctrl + V',
      hint: 'Ctrl + C para kopyahin, bumaba ng isang cell, tapos Ctrl + V para i-paste.',
      solution: [key('c', { ctrl: true }), key('ArrowDown'), key('v', { ctrl: true })],
      start: { r: mid, c: COL.branch },
      // Make sure the cell below is different first, so the task is never "already done".
      prepare: (s) =>
        s.cells[mid + 1][COL.branch] === s.cells[mid][COL.branch]
          ? setValue(
              s,
              { r: mid + 1, c: COL.branch },
              pick(
                rng,
                ph.cities.map((c) => c[0]).filter((c) => c !== s.cells[mid][COL.branch]),
              ),
            )
          : s,
      check: (s) => !s.editing && s.cells[mid + 1][COL.branch] === s.cells[mid][COL.branch],
      maxKeys: 3,
    },
    {
      id: 'undo',
      text: `Aksidenteng nabura ang ${cellName({ r: r5, c: COL.branch })}. Ibalik ito.`,
      tip: 'Ctrl + Z',
      hint: 'Ctrl + Z ang "undo": ibinabalik ang huling binago mo.',
      solution: [key('z', { ctrl: true })],
      start: { r: r5, c: COL.branch },
      prepare: (s) => setValue(s, { r: r5, c: COL.branch }, ''),
      check: cellIs({ r: r5, c: COL.branch }, deleted),
      maxKeys: 1,
    },
  ];
  return Object.fromEntries(tasks.map((t) => [t.id, t])) as Record<TaskId, ExcelTask>;
}

/** A new sheet with one task of every kind on it. */
export function makeTaskSet(rng: Rng): TaskSet {
  const table = makeTable(rng);
  const sheet = makeSheet(table, table.length + EXTRA_ROWS, SHEET_COLS);
  return { sheet, tasks: allTasks(rng, table), lastRow: table.length - 1 };
}

/** The Pagsusulit: a new sheet and 6 random task kinds (not the easy "go to a cell"). */
export function makeQuiz(rng: Rng): { sheet: Sheet; tasks: ExcelTask[] } {
  const set = makeTaskSet(rng);
  const kinds = Object.values(set.tasks).filter((t) => t.id !== 'goto');
  return { sheet: set.sheet, tasks: shuffle(rng, kinds).slice(0, QUIZ_TASKS) };
}

/** Put the cursor where the task starts (and apply its preparation). */
export function startTask(s: Sheet, task: ExcelTask): Sheet {
  const prepared = task.prepare ? task.prepare(s) : s;
  return { ...prepared, active: task.start, anchor: task.start, editing: null };
}

/** Do the task the way the solution says (for "Ipakita kung paano"). Returns every in-between sheet, for showing it step by step. */
export function solutionFrames(s: Sheet, task: ExcelTask): Sheet[] {
  const frames: Sheet[] = [];
  let cur = s;
  for (const step of task.solution) {
    cur = 'press' in step ? pressKey(cur, step.press) : typeInCell(cur, step.type);
    frames.push(cur);
  }
  return frames;
}
