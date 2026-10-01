/**
 * The tasks of Excel Aralin 2, "Pag-encode ng data": entering data the fast
 * way (Tab + Enter, Enter down a column, Ctrl+D, Ctrl+Enter, Ctrl+;).
 *
 * The sheet is the sales log of Aralin 1 plus a "Status" column (F) with
 * blank stretches to fill. Each task has its own stretch of rows, so the
 * tasks never get in each other's way, in any order (tested).
 */
import { translator, type Lang, type T } from '../../lib/i18n';
import { intBetween, pick, shuffle, type Rng } from '../../lib/random';
import * as ph from '../../data/ph';
import { digits, nameParts } from '../typing/generatePassage';
import { cellName, makeSheet, todayText, type Pos, type Sheet } from './sheet';
import type { ExcelTask } from './tasks';
import { amount, date, key, typeValue } from './taskHelpers';

export const HEADERS_2 = ['Ref No.', 'Customer', 'Branch', 'Date', 'Amount', 'Status'];
const COL = { ref: 0, customer: 1, branch: 2, date: 3, amount: 4, status: 5 } as const;
const STATUSES = ['Paid', 'Unpaid', 'For delivery'];
const EXTRA_ROWS = 8;
const SHEET_COLS = 8;

/** Short names of the task kinds, for the results table. */
export const taskLabels2 = (lang: Lang = 'tl'): Record<string, string> => {
  const t = translator(lang);
  return {
    newRow: t('I-encode ang isang buong record', 'Encode a whole record'),
    enterDown: t('Mag-type pababa sa isang column', 'Type down a column'),
    fillDown: t('Kopyahin ang nasa itaas (isang cell)', 'Copy what is above (one cell)'),
    fillRange: t('Kopyahin pababa sa maraming cell', 'Copy down into many cells'),
    fillSame: t('Parehong laman sa maraming cell', 'The same content in many cells'),
    today: t('Ilagay ang petsa ngayon', "Put in today's date"),
  };
};

/**
 * Status column (F), by data row (1 = first record):
 *   1-3 filled | 4 blank (fillDown) | 5 filled, 6-8 blank (fillRange) | 9 filled |
 *   10-12 blank (fillSame) | 13 filled | 14-16 blank (enterDown) | 17+ filled
 */
const BLANK_STATUS_ROWS = new Set([4, 6, 7, 8, 10, 11, 12, 14, 15, 16]);

function record(rng: Rng): string[] {
  const n = nameParts(rng);
  return [`SL-2026-${digits(rng, 5)}`, `${n.given} ${n.surname}`, pick(rng, ph.cities)[0], date(rng), amount(rng)];
}

/** The sales log with a Status column: a header row and 18 to 22 records. */
export function makeTable2(rng: Rng): string[][] {
  const count = intBetween(rng, 18, 22);
  const rows = [HEADERS_2];
  for (let i = 1; i <= count; i++) {
    rows.push([...record(rng), BLANK_STATUS_ROWS.has(i) ? '' : pick(rng, STATUSES)]);
  }
  return rows;
}

const same = (s: Sheet, rows: number[], c: number, value: string) => rows.every((r) => s.cells[r][c] === value);

function allTasks2(rng: Rng, table: string[][], t: T): Record<string, ExcelTask> {
  const last = table.length - 1;
  const newRowAt = last + 1;
  const newValues = record(rng);
  const downValues = [pick(rng, STATUSES), pick(rng, STATUSES), pick(rng, STATUSES)];
  const sameValue = pick(rng, STATUSES);
  // A record whose date is not today, for Ctrl+;
  const todayRow = pick(
    rng,
    Array.from({ length: last }, (_, i) => i + 1).filter((r) => table[r][COL.date] !== todayText()),
  );
  const F = COL.status;
  const at = (r: number, c: number): Pos => ({ r, c });

  const tasks: ExcelTask[] = [
    {
      id: 'newRow',
      text: t(
        `I-encode ang bagong record na ito sa row ${newRowAt + 1}.`,
        `Encode this new record in row ${newRowAt + 1}.`,
      ),
      record: newValues.map((value, c) => ({ label: HEADERS_2[c], value })),
      tip: t('Tab sa bawat cell, Enter sa dulo', 'Tab after each cell, Enter at the end'),
      hint: t(
        'I-type ang una, Tab para sa susunod na cell. Sa huli, Enter: babalik ka sa column A ng susunod na row.',
        'Type the first one, Tab for the next cell. At the end, Enter: you go back to column A of the next row.',
      ),
      solution: newValues.flatMap((v, i) => [...typeValue(v), key(i < newValues.length - 1 ? 'Tab' : 'Enter')]),
      start: at(newRowAt, 0),
      check: (s) =>
        !s.editing &&
        newValues.every((v, c) => s.cells[newRowAt][c] === v) &&
        s.active.r === newRowAt + 1 &&
        s.active.c === 0,
      maxKeys: newValues.length,
    },
    {
      id: 'enterDown',
      text: t(
        `I-type ang Status ng tatlong record, pababa: ${cellName(at(14, F))} "${downValues[0]}", ${cellName(at(15, F))} "${downValues[1]}", ${cellName(at(16, F))} "${downValues[2]}".`,
        `Type the Status of three records, going down: ${cellName(at(14, F))} "${downValues[0]}", ${cellName(at(15, F))} "${downValues[1]}", ${cellName(at(16, F))} "${downValues[2]}".`,
      ),
      tip: t('I-type, Enter, i-type, Enter', 'Type, Enter, type, Enter'),
      hint: t(
        'Pagkatapos i-type ang isa, Enter: bababa ka sa susunod na cell. Hindi na kailangan ng arrow.',
        'After typing one, Enter: you go down to the next cell. No arrow needed.',
      ),
      solution: downValues.flatMap((v) => [...typeValue(v), key('Enter')]),
      start: at(14, F),
      check: (s) =>
        !s.editing && downValues.every((v, i) => s.cells[14 + i][F] === v) && s.active.r === 17 && s.active.c === F,
      maxKeys: 3,
    },
    {
      id: 'fillDown',
      text: t(
        `Ilagay sa ${cellName(at(4, F))} ang parehong Status ng nasa itaas nito.`,
        `Put the same Status as the cell above into ${cellName(at(4, F))}.`,
      ),
      tip: 'Ctrl + D',
      hint: t(
        'Ctrl + D ("Down"): kinokopya ang laman ng cell sa itaas, papunta sa cell mo.',
        'Ctrl + D ("Down"): copies the content of the cell above into your cell.',
      ),
      solution: [key('d', { ctrl: true })],
      start: at(4, F),
      check: (s) => !s.editing && s.cells[4][F] !== '' && s.cells[4][F] === s.cells[3][F],
      maxKeys: 1,
    },
    {
      id: 'fillRange',
      text: t(
        `Kopyahin ang Status ng ${cellName(at(5, F))} pababa hanggang ${cellName(at(8, F))}.`,
        `Copy the Status in ${cellName(at(5, F))} down to ${cellName(at(8, F))}.`,
      ),
      tip: t('Shift + ↓ (3 beses), tapos Ctrl + D', 'Shift + ↓ (3 times), then Ctrl + D'),
      hint: t(
        'Piliin muna mula sa cell na may laman pababa (Shift + ↓), tapos Ctrl + D para mapuno lahat.',
        'First select from the filled cell down (Shift + ↓), then Ctrl + D to fill them all.',
      ),
      solution: [
        key('ArrowDown', { shift: true }),
        key('ArrowDown', { shift: true }),
        key('ArrowDown', { shift: true }),
        key('d', { ctrl: true }),
      ],
      start: at(5, F),
      check: (s) => !s.editing && s.cells[5][F] !== '' && same(s, [6, 7, 8], F, s.cells[5][F]),
      maxKeys: 4,
    },
    {
      id: 'fillSame',
      text: t(
        `Ilagay ang "${sameValue}" sa ${cellName(at(10, F))} hanggang ${cellName(at(12, F))} nang sabay-sabay.`,
        `Put "${sameValue}" into ${cellName(at(10, F))} to ${cellName(at(12, F))} all at once.`,
      ),
      tip: t('Shift + ↓, i-type, Ctrl + Enter', 'Shift + ↓, type, Ctrl + Enter'),
      hint: t(
        'Piliin ang tatlong cell (Shift + ↓), i-type ang salita, tapos Ctrl + Enter: mapupunta ito sa lahat ng napili.',
        'Select the three cells (Shift + ↓), type the word, then Ctrl + Enter: it goes into every selected cell.',
      ),
      solution: [
        key('ArrowDown', { shift: true }),
        key('ArrowDown', { shift: true }),
        ...typeValue(sameValue),
        key('Enter', { ctrl: true }),
      ],
      start: at(10, F),
      check: (s) => !s.editing && same(s, [10, 11, 12], F, sameValue),
      maxKeys: 3,
    },
    {
      id: 'today',
      text: t(
        `Palitan ang Date sa ${cellName(at(todayRow, COL.date))} ng petsa ngayon.`,
        `Change the Date in ${cellName(at(todayRow, COL.date))} to today's date.`,
      ),
      tip: t('Ctrl + ;, tapos Enter', 'Ctrl + ;, then Enter'),
      hint: t(
        'Ctrl + ; (semicolon) ang naglalagay ng petsa ngayon, hindi na kailangang i-type. Tapos Enter.',
        "Ctrl + ; (semicolon) puts in today's date, no need to type it. Then Enter.",
      ),
      solution: [key(';', { ctrl: true }), key('Enter')],
      start: at(todayRow, COL.date),
      check: (s) => !s.editing && s.cells[todayRow][COL.date] === todayText(),
      maxKeys: 2,
    },
  ];
  return Object.fromEntries(tasks.map((x) => [x.id, x]));
}

/** A new sheet with one task of every Aralin 2 kind on it. */
export function makeTaskSet2(rng: Rng, lang: Lang = 'tl'): { sheet: Sheet; tasks: Record<string, ExcelTask> } {
  const table = makeTable2(rng);
  const sheet = makeSheet(table, table.length + EXTRA_ROWS, SHEET_COLS);
  return { sheet, tasks: allTasks2(rng, table, translator(lang)) };
}

/** The Aralin 2 Pagsusulit: a new sheet and all 6 task kinds in random order. */
export function makeQuiz2(rng: Rng, lang: Lang = 'tl'): { sheet: Sheet; tasks: ExcelTask[] } {
  const set = makeTaskSet2(rng, lang);
  return { sheet: set.sheet, tasks: shuffle(rng, Object.values(set.tasks)) };
}
