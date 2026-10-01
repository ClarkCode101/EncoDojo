/**
 * The tasks of Excel Aralin 3, "Formatting": numbers vs text (the apostrophe
 * that keeps leading zeros), the comma-and-2-decimals number format
 * (Ctrl+Shift+1), and bold (Ctrl+B).
 *
 * The sheet is a fake payroll list made with `formatting: true`, so it follows
 * Excel's rules (sheet.ts). Emp No. and Account No. are text (they keep their
 * zeros); Daily Rate is a plain number. Each task has its own row or column,
 * so the tasks never get in each other's way, in any order (tested).
 */
import { translator, type Lang, type T } from '../../lib/i18n';
import { intBetween, pick, shuffle, type Rng } from '../../lib/random';
import * as ph from '../../data/ph';
import { digits, nameParts } from '../typing/generatePassage';
import { cellName, formatKey, formatOf, makeSheet, pressKey, type CellFormat, type Pos, type Sheet } from './sheet';
import type { ExcelTask, SolutionStep } from './tasks';

export const HEADERS_3 = ['Emp No.', 'Name', 'Branch', 'Account No.', 'Daily Rate'];
const COL = { emp: 0, name: 1, branch: 2, account: 3, rate: 4 } as const;
const EXTRA_ROWS = 8;
const SHEET_COLS = 7;

/** Short names of the task kinds, for the results table. */
export const taskLabels3 = (lang: Lang = 'tl'): Record<string, string> => {
  const t = translator(lang);
  return {
    leadingZero: t('Mag-type ng numerong may zero sa unahan', 'Type a number with zeros in front'),
    fixZeros: t('Ibalik ang nawalang zero', 'Bring back the lost zeros'),
    numberFormat: t('Lagyan ng comma at 2 decimal ang halaga', 'Give the amounts a comma and 2 decimals'),
    typeFormatted: t('Mag-type sa cell na naka-format na', 'Type into a cell that is already formatted'),
    boldHeader: t('I-bold ang header', 'Make the header bold'),
    boldCell: t('I-bold ang isang cell', 'Make one cell bold'),
  };
};

const empNo = (rng: Rng) => `00${intBetween(rng, 100, 999)}`;
const accountNo = (rng: Rng) => `00${digits(rng, 8)}`;
/** A daily rate the way Excel stores it: 645.5, not 645.50. */
const rate = (rng: Rng) => `${intBetween(rng, 500, 900)}${pick(rng, ['', '', '.5', '.25', '.75'])}`;

/** The payroll list: a header row and 14 to 18 employees. */
export function makeTable3(rng: Rng): string[][] {
  const count = intBetween(rng, 14, 18);
  const rows = [HEADERS_3];
  for (let i = 0; i < count; i++) {
    const n = nameParts(rng);
    rows.push([empNo(rng), `${n.given} ${n.surname}`, pick(rng, ph.cities)[0], accountNo(rng), rate(rng)]);
  }
  return rows;
}

const key = (k: string, mods: { ctrl?: boolean; shift?: boolean } = {}): SolutionStep => ({
  press: { key: k, ...mods },
});
/** Type a value into the active cell: its first character starts the edit, then the rest. */
const typeValue = (value: string): SolutionStep[] => [key(value[0]), { type: value }];

/** Put a raw entry in a cell as if typed (Excel's rules apply, e.g. zeros are lost without an apostrophe). */
function typedEntry(s: Sheet, p: Pos, raw: string): Sheet {
  const done = pressKey({ ...s, active: p, anchor: p, editing: { value: raw, mode: 'enter' } }, { key: 'Enter' });
  return { ...done, active: p, anchor: p };
}

function allTasks3(rng: Rng, table: string[][], t: T): Record<string, ExcelTask> {
  const last = table.length - 1;
  const [r1, r2, r3] = shuffle(
    rng,
    Array.from({ length: last - 1 }, (_, i) => i + 2),
  );
  const newRow = last + 1;
  const used = new Set(table.map((row) => row[COL.emp]));
  let newEmp = empNo(rng);
  while (used.has(newEmp)) newEmp = empNo(rng);
  const account = table[r1][COL.account];
  const newRate = String(intBetween(rng, 1000, 1500));
  const at = (r: number, c: number): Pos => ({ r, c });
  const isText = (s: Sheet, p: Pos) => formatOf(s, p).text === true;

  const tasks: ExcelTask[] = [
    {
      id: 'leadingZero',
      text: t(
        `Ilagay ang Emp No. ng bagong empleyado sa ${cellName(at(newRow, COL.emp))}: ${newEmp}. Dapat manatili ang mga zero.`,
        `Put the new employee's Emp No. in ${cellName(at(newRow, COL.emp))}: ${newEmp}. The zeros must stay.`,
      ),
      tip: t("' (apostrophe) sa unahan, tapos Enter", "' (apostrophe) in front, then Enter"),
      hint: t(
        `Kapag ${newEmp} lang ang tinype, magiging ${Number(newEmp)} ito. I-type muna ang apostrophe ('), tapos ang numero.`,
        `If you type just ${newEmp}, it becomes ${Number(newEmp)}. Type the apostrophe (') first, then the number.`,
      ),
      solution: [...typeValue(`'${newEmp}`), key('Enter')],
      start: at(newRow, COL.emp),
      check: (s) => !s.editing && s.cells[newRow][COL.emp] === newEmp && isText(s, at(newRow, COL.emp)),
      maxKeys: 1,
    },
    {
      id: 'fixZeros',
      text: t(
        `Nawala ang mga zero sa Account No. ng ${cellName(at(r1, COL.account))}. Dapat "${account}". Ayusin ito.`,
        `The zeros of the Account No. in ${cellName(at(r1, COL.account))} were lost. It should be "${account}". Fix it.`,
      ),
      tip: t("' (apostrophe) sa unahan, tapos Enter", "' (apostrophe) in front, then Enter"),
      hint: t(
        "I-type ulit ang buong Account No., pero may apostrophe (') sa unahan para hindi mawala ang zero.",
        "Type the whole Account No. again, but with an apostrophe (') in front so the zeros stay.",
      ),
      solution: [...typeValue(`'${account}`), key('Enter')],
      start: at(r1, COL.account),
      prepare: (s) => typedEntry(s, at(r1, COL.account), account), // typed without the apostrophe: the zeros go
      check: (s) => !s.editing && s.cells[r1][COL.account] === account && isText(s, at(r1, COL.account)),
      // Also fine: F2, Home, type the apostrophe and zeros, Enter.
      maxKeys: 3,
    },
    {
      id: 'numberFormat',
      text: t(
        `Lagyan ng comma at 2 decimal ang lahat ng Daily Rate (E2 hanggang E${last + 1}).`,
        `Give every Daily Rate a comma and 2 decimals (E2 to E${last + 1}).`,
      ),
      tip: t('Ctrl + Shift + ↓, tapos Ctrl + Shift + 1', 'Ctrl + Shift + ↓, then Ctrl + Shift + 1'),
      hint: t(
        'Piliin muna ang buong column ng Daily Rate, tapos Ctrl + Shift + 1 para sa format na 1,500.00.',
        'First select the whole Daily Rate column, then Ctrl + Shift + 1 for the 1,500.00 format.',
      ),
      solution: [key('ArrowDown', { ctrl: true, shift: true }), key('!', { ctrl: true, shift: true })],
      start: at(1, COL.rate),
      check: (s) =>
        !s.editing && Array.from({ length: last }, (_, i) => i + 1).every((r) => formatOf(s, at(r, COL.rate)).number2),
      maxKeys: 2,
    },
    {
      id: 'typeFormatted',
      text: t(
        `Naka-format na ang ${cellName(at(r2, COL.rate))} (may comma at 2 decimal). Palitan ito ng ${Number(newRate).toLocaleString('en-US')}.00.`,
        `${cellName(at(r2, COL.rate))} is already formatted (comma and 2 decimals). Change it to ${Number(newRate).toLocaleString('en-US')}.00.`,
      ),
      tip: t('I-type ang numero lang, tapos Enter', 'Type just the number, then Enter'),
      hint: t(
        `I-type lang ang ${newRate}, walang comma at walang .00. Ang format na ang maglalagay ng mga iyon.`,
        `Just type ${newRate}, no comma and no .00. The format adds those.`,
      ),
      solution: [...typeValue(newRate), key('Enter')],
      start: at(r2, COL.rate),
      // The cell already has the number format (as if someone set it before).
      prepare: (s) => {
        const k = formatKey(at(r2, COL.rate));
        const f: CellFormat = { ...s.formats[k], number2: true };
        return { ...s, formats: { ...s.formats, [k]: f } };
      },
      check: (s) => !s.editing && s.cells[r2][COL.rate] === newRate && !isText(s, at(r2, COL.rate)),
      maxKeys: 1,
    },
    {
      id: 'boldHeader',
      text: t('Gawing bold ang buong header (A1 hanggang E1).', 'Make the whole header bold (A1 to E1).'),
      tip: t('Ctrl + Shift + →, tapos Ctrl + B', 'Ctrl + Shift + →, then Ctrl + B'),
      hint: t(
        'Piliin ang header mula A1 pakanan (Ctrl + Shift + →), tapos Ctrl + B para sa bold.',
        'Select the header from A1 to the right (Ctrl + Shift + →), then Ctrl + B for bold.',
      ),
      solution: [key('ArrowRight', { ctrl: true, shift: true }), key('b', { ctrl: true })],
      start: at(0, 0),
      check: (s) => !s.editing && HEADERS_3.every((_, c) => formatOf(s, at(0, c)).bold),
      maxKeys: 2,
    },
    {
      id: 'boldCell',
      text: t(
        `Gawing bold ang pangalan sa ${cellName(at(r3, COL.name))}.`,
        `Make the name in ${cellName(at(r3, COL.name))} bold.`,
      ),
      tip: 'Ctrl + B',
      hint: t(
        'Nasa tamang cell ka na. Ctrl + B lang (B para sa "Bold").',
        'You are already in the right cell. Just Ctrl + B (B for "Bold").',
      ),
      solution: [key('b', { ctrl: true })],
      start: at(r3, COL.name),
      check: (s) => !s.editing && formatOf(s, at(r3, COL.name)).bold === true,
      maxKeys: 1,
    },
  ];
  return Object.fromEntries(tasks.map((x) => [x.id, x]));
}

/** A new payroll sheet (Excel's formatting rules on) with one task of every Aralin 3 kind. */
export function makeTaskSet3(rng: Rng, lang: Lang = 'tl'): { sheet: Sheet; tasks: Record<string, ExcelTask> } {
  const table = makeTable3(rng);
  // Emp No. and Account No. were typed with an apostrophe: text that keeps its zeros.
  const formats: Record<string, CellFormat> = {};
  for (let r = 1; r < table.length; r++) {
    formats[formatKey({ r, c: COL.emp })] = { text: true };
    formats[formatKey({ r, c: COL.account })] = { text: true };
  }
  const sheet = makeSheet(table, table.length + EXTRA_ROWS, SHEET_COLS, { formatting: true, formats });
  return { sheet, tasks: allTasks3(rng, table, translator(lang)) };
}

/** The Aralin 3 Pagsusulit: a new sheet and all 6 task kinds in random order. */
export function makeQuiz3(rng: Rng, lang: Lang = 'tl'): { sheet: Sheet; tasks: ExcelTask[] } {
  const set = makeTaskSet3(rng, lang);
  return { sheet: set.sheet, tasks: shuffle(rng, Object.values(set.tasks)) };
}
