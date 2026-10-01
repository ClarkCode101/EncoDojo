/**
 * The tasks of Excel Aralin 10, "Pag-check ng trabaho": Conditional Formatting
 * (color the duplicate Ref Nos. and the blank cells), COUNTBLANK, COUNTIFS and
 * SUMIFS (two conditions), and a dropdown with Data Validation (make it, then
 * use it: a value that is not in the list is refused).
 *
 * The sheet is a collection log (Ref No., Customer, Branch, Amount, Status)
 * with two Ref Nos. encoded twice and a few blank cells, like real work, and a
 * small Check block (G:H). Each task's `prepare` puts the table back and sets
 * up what it needs, so the tasks work in any order (tested). Formula checks
 * compare with the lesson's own formula, on the sheet and on a changed copy.
 */
import { translator, type Lang, type T } from '../../lib/i18n';
import { intBetween, pick, shuffle, type Rng } from '../../lib/random';
import * as ph from '../../data/ph';
import { digits } from '../typing/generatePassage';
import { computeSheet, sameResult } from './formulaEngine';
import { cellName, isFormula, makeSheet, type CondRule, type Pos, type Sheet } from './sheet';
import { QUIZ_TASKS, type ExcelTask, type SolutionStep } from './tasks';

export const HEADERS_10 = ['Ref No.', 'Customer', 'Branch', 'Amount', 'Status', '', 'Check', 'Value'];
const COL = { ref: 0, customer: 1, branch: 2, amount: 3, status: 4, label: 6, value: 7 } as const;
const EXTRA_ROWS = 5;
export const STATUS = ['Paid', 'Unpaid'];

/** Short branch names (the city without " City", at most 8 letters) so the columns fit. */
const BRANCHES = ph.cities.map(([c]) => c.replace(' City', '')).filter((c) => c.length <= 8);

export type Table10 = {
  table: string[][];
  /** Rows (0-based sheet rows) whose Ref No. repeats an earlier row. */
  duplicateRows: number[];
  /** The branch counted by COUNTIFS (Unpaid) and the one added by SUMIFS (Paid). */
  counted: string;
  summed: string;
};

/**
 * The log: 10 to 13 records in 3 branches. Two later rows reuse an earlier
 * Ref No.; four cells are blank (a Customer, an Amount, two Statuses), never
 * on the first record, never in the Ref No. column.
 */
export function makeTable10(rng: Rng): Table10 {
  const n = intBetween(rng, 10, 13);
  const branches = shuffle(rng, BRANCHES).slice(0, 3);
  const rows: string[][] = [HEADERS_10];
  const refs = new Set<string>();
  for (let r = 1; r <= n; r++) {
    let ref = `CR-${digits(rng, 5)}`;
    while (refs.has(ref)) ref = `CR-${digits(rng, 5)}`;
    refs.add(ref);
    let customer = '';
    do
      customer = `${pick(rng, [...ph.femaleFirstNames, ...ph.maleFirstNames]).split(' ')[0]} ${pick(rng, ph.surnames)}`;
    while (customer.length > 16);
    const amount = `${intBetween(rng, 500, 25000)}${pick(rng, ['', '.5'])}`;
    rows.push([ref, customer, pick(rng, branches), amount, pick(rng, STATUS), '', '', '']);
  }
  // Two Ref Nos. encoded twice (rows 3 and lower copy an earlier row's Ref No.).
  const later = shuffle(
    rng,
    Array.from({ length: n - 2 }, (_, i) => i + 3),
  );
  const duplicateRows = later.slice(0, 2).sort((a, b) => a - b);
  for (const r of duplicateRows) rows[r][COL.ref] = rows[intBetween(rng, 1, r - 1)][COL.ref];
  // Four blank cells in four different rows (row 2 and lower).
  const blankRows = shuffle(
    rng,
    Array.from({ length: n - 1 }, (_, i) => i + 2),
  ).slice(0, 4);
  [COL.customer, COL.amount, COL.status, COL.status].forEach((c, i) => (rows[blankRows[i]][c] = ''));
  // COUNTIFS counts a branch that has an Unpaid record; SUMIFS adds a branch that has a Paid amount.
  const withStatus = (status: string) =>
    branches.filter((b) =>
      rows.some((row, r) => r > 0 && row[COL.branch] === b && row[COL.status] === status && row[COL.amount] !== ''),
    );
  const counted = withStatus('Unpaid')[0] ?? branches[0];
  const summed = withStatus('Paid').find((b) => b !== counted) ?? withStatus('Paid')[0] ?? branches[1];
  rows[1][COL.label] = 'Blank cells';
  rows[2][COL.label] = `Unpaid: ${counted}`;
  rows[3][COL.label] = `Paid: ${summed}`;
  return { table: rows, duplicateRows, counted, summed };
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

function allTasks10({ table, counted, summed }: Table10, t: T): Record<string, ExcelTask> {
  const n = table.length - 1; // records are rows 1..n
  const rows = Array.from({ length: n }, (_, i) => i + 1);
  const last = n + 1; // Excel row number of the last record
  const at = (r: number, c: number): Pos => ({ r, c });
  /** The table as it was made (every task starts from it). */
  const original = rows.flatMap((r) => [0, 1, 2, 3, 4].map((c) => [at(r, c), table[r][c]] as [Pos, string]));
  const reset = (s: Sheet) => setCells(s, original);
  const statusRange = { top: 1, left: COL.status, bottom: n, right: COL.status };
  const blankStatusRow = rows.find((r) => table[r][COL.status] === '')!;
  const firstBlank = original.find(([, v]) => v === '')![0];
  const h2 = at(1, COL.value);
  const h3 = at(2, COL.value);
  const h4 = at(3, COL.value);
  const hasRule = (s: Sheet, kind: CondRule['kind'], ok: (g: CondRule['range']) => boolean) =>
    s.condRules.some((rule) => rule.kind === kind && ok(rule.range));

  /**
   * A formula task: `p` holds a formula with `word` and gives the same result as `reference`,
   * on the sheet and on a copy with `probe` changes (so it really looks at the table).
   */
  const formulaCheck = (p: Pos, word: string, reference: string, probe: [Pos, string][]) => (s: Sheet) => {
    const f = s.cells[p.r][p.c];
    if (s.editing || !isFormula(f) || !f.toUpperCase().includes(word)) return false;
    return sameResult(s.cells, p, reference) && sameResult(setCells(s, probe).cells, p, reference);
  };
  const allStatus = (v: string) => rows.map((r) => [at(r, COL.status), v] as [Pos, string]);

  const tasks: ExcelTask[] = [
    {
      id: 'cfDuplicates',
      text: t(
        `Kulayan ang mga dobleng Ref No.: piliin ang A2 hanggang A${last}, tapos Conditional Formatting > Duplicate Values.`,
        `Color the duplicate Ref Nos.: select A2 to A${last}, then Conditional Formatting > Duplicate Values.`,
      ),
      tip: 'Ctrl + Shift + ↓, Conditional Formatting, Duplicate Values',
      hint: t(
        `Nasa A2 ka. Ctrl + Shift + ↓ para mapili hanggang A${last}. Sa toolbar: Conditional Formatting, piliin ang Duplicate Values, OK.`,
        `You are in A2. Ctrl + Shift + ↓ selects down to A${last}. On the toolbar: Conditional Formatting, choose Duplicate Values, OK.`,
      ),
      solution: [
        key('ArrowDown', { ctrl: true, shift: true }),
        { command: { kind: 'condFormat', rule: 'duplicates' } },
      ],
      start: at(1, COL.ref),
      prepare: (s) => ({ ...reset(s), condRules: [] }),
      check: (s) => hasRule(s, 'duplicates', (g) => g.left === 0 && g.right === 0 && g.top <= 1 && g.bottom >= n),
      maxKeys: 3,
    },
    {
      id: 'cfBlanks',
      text: t(
        `Kulayan ang mga blangkong cell ng table: piliin ang A2 hanggang E${last}, tapos Conditional Formatting > Blanks.`,
        `Color the blank cells of the table: select A2 to E${last}, then Conditional Formatting > Blanks.`,
      ),
      tip: t(
        'Ctrl + Shift + ↓, Shift + → (4 beses), Conditional Formatting, Blanks',
        'Ctrl + Shift + ↓, Shift + → (4 times), Conditional Formatting, Blanks',
      ),
      hint: t(
        `Walang blangko ang Ref No., kaya Ctrl + Shift + ↓ muna (hanggang A${last}), tapos Shift + → hanggang E. Conditional Formatting, piliin ang Blanks, OK.`,
        `The Ref No. has no blanks, so Ctrl + Shift + ↓ first (down to A${last}), then Shift + → to E. Conditional Formatting, choose Blanks, OK.`,
      ),
      solution: [
        key('ArrowDown', { ctrl: true, shift: true }),
        ...Array.from({ length: 4 }, () => key('ArrowRight', { shift: true })),
        { command: { kind: 'condFormat', rule: 'blanks' } },
      ],
      start: at(1, COL.ref),
      prepare: (s) => ({ ...reset(s), condRules: [] }),
      // Exactly the table: more rows or columns would color empty cells that are not missing data.
      check: (s) => hasRule(s, 'blanks', (g) => g.left === 0 && g.right === COL.status && g.top <= 1 && g.bottom === n),
      maxKeys: 7,
    },
    {
      id: 'countBlank',
      text: t(
        `Sa ${cellName(h2)}, bilangin kung ilan ang blangkong cell sa table (A2 hanggang E${last}).`,
        `In ${cellName(h2)}, count how many blank cells the table has (A2 to E${last}).`,
      ),
      tip: t(`=COUNTBLANK(A2:E${last}), tapos Enter`, `=COUNTBLANK(A2:E${last}), then Enter`),
      hint: t(
        `Ang =COUNTBLANK(saan) ay bumibilang ng walang laman. Ang buong table: A2:E${last}.`,
        `=COUNTBLANK(where) counts the empty cells. The whole table: A2:E${last}.`,
      ),
      solution: typeFormula(`=COUNTBLANK(A2:E${last})`),
      start: h2,
      prepare: (s) => setCells(reset(s), [[h2, '']]),
      check: formulaCheck(h2, 'COUNTBLANK', `=COUNTBLANK(A2:E${last})`, [[firstBlank, 'x']]),
      maxKeys: 1,
    },
    {
      id: 'countifs',
      text: t(
        `Sa ${cellName(h3)}, bilangin kung ilan ang Unpaid sa ${counted}.`,
        `In ${cellName(h3)}, count how many are Unpaid in ${counted}.`,
      ),
      tip: t(
        `=COUNTIFS(C2:C${last},"${counted}",E2:E${last},"Unpaid"), tapos Enter`,
        `=COUNTIFS(C2:C${last},"${counted}",E2:E${last},"Unpaid"), then Enter`,
      ),
      hint: t(
        `Gaya ng COUNTIF, pero pares-pares: (saan, ano, saan, ano). Branch (C) = "${counted}", Status (E) = "Unpaid".`,
        `Like COUNTIF, but in pairs: (where, what, where, what). Branch (C) = "${counted}", Status (E) = "Unpaid".`,
      ),
      solution: typeFormula(`=COUNTIFS(C2:C${last},"${counted}",E2:E${last},"Unpaid")`),
      start: h3,
      prepare: (s) => setCells(reset(s), [[h3, '']]),
      check: formulaCheck(
        h3,
        'COUNTIFS',
        `=COUNTIFS(C2:C${last},"${counted}",E2:E${last},"Unpaid")`,
        allStatus('Unpaid'),
      ),
      maxKeys: 1,
    },
    {
      id: 'sumifs',
      text: t(
        `Sa ${cellName(h4)}, kuwentahin ang kabuuang Amount ng Paid sa ${summed}.`,
        `In ${cellName(h4)}, work out the total Amount of Paid in ${summed}.`,
      ),
      tip: t(
        `=SUMIFS(D2:D${last},C2:C${last},"${summed}",E2:E${last},"Paid"), tapos Enter`,
        `=SUMIFS(D2:D${last},C2:C${last},"${summed}",E2:E${last},"Paid"), then Enter`,
      ),
      hint: t(
        `Sa SUMIFS, UNA ang idadagdag (Amount, D), tapos ang mga pares: Branch (C) = "${summed}", Status (E) = "Paid".`,
        `In SUMIFS, what to add up comes FIRST (Amount, D), then the pairs: Branch (C) = "${summed}", Status (E) = "Paid".`,
      ),
      solution: typeFormula(`=SUMIFS(D2:D${last},C2:C${last},"${summed}",E2:E${last},"Paid")`),
      start: h4,
      prepare: (s) => setCells(reset(s), [[h4, '']]),
      check: formulaCheck(
        h4,
        'SUMIFS',
        `=SUMIFS(D2:D${last},C2:C${last},"${summed}",E2:E${last},"Paid")`,
        allStatus('Paid'),
      ),
      maxKeys: 1,
    },
    {
      id: 'dropdown',
      text: t(
        `Gawing dropdown ang Status (E2 hanggang E${last}): Data Validation, Source: Paid,Unpaid.`,
        `Make the Status (E2 to E${last}) a dropdown: Data Validation, Source: Paid,Unpaid.`,
      ),
      tip: t(
        `Shift + ↓ hanggang E${last}, Data Validation, Paid,Unpaid`,
        `Shift + ↓ to E${last}, Data Validation, Paid,Unpaid`,
      ),
      hint: t(
        `May blangko ang Status, kaya Shift + ↓ hanggang E${last} (o i-click ang E2 at Shift + click ang E${last}). Data Validation, sa Source isulat ang Paid,Unpaid, OK.`,
        `The Status has blanks, so Shift + ↓ to E${last} (or click E2 and Shift + click E${last}). Data Validation, in Source write Paid,Unpaid, OK.`,
      ),
      solution: [
        ...Array.from({ length: n - 1 }, () => key('ArrowDown', { shift: true })),
        { command: { kind: 'validation', list: STATUS } },
      ],
      start: at(1, COL.status),
      prepare: (s) => ({ ...reset(s), lists: [] }),
      check: (s) =>
        s.lists.some(
          (l) =>
            l.range.left === COL.status &&
            l.range.right === COL.status &&
            l.range.top <= 1 &&
            l.range.bottom >= n &&
            [...l.list]
              .map((v) => v.toLowerCase())
              .sort()
              .join(',') === 'paid,unpaid',
        ),
      maxKeys: n + 2,
    },
    {
      id: 'useDropdown',
      text: t(
        `Walang Status ang E${blankStatusRow + 1}. Piliin ang Paid sa dropdown.`,
        `E${blankStatusRow + 1} has no Status. Choose Paid from the dropdown.`,
      ),
      tip: t('Alt + ↓, tapos Paid at Enter', 'Alt + ↓, then Paid and Enter'),
      hint: t(
        'Alt + ↓ (o ang ▼ sa gilid ng cell) para lumabas ang listahan. Subukan ding mag-type ng "Bayad": hindi ito tatanggapin.',
        'Alt + ↓ (or the ▼ beside the cell) shows the list. Also try typing "Bayad": it will be refused.',
      ),
      solution: [{ command: { kind: 'pick', value: 'Paid' } }],
      start: at(blankStatusRow, COL.status),
      prepare: (s) => ({ ...reset(s), lists: [{ range: statusRange, list: STATUS }] }),
      check: (s) => !s.editing && s.cells[blankStatusRow][COL.status] === 'Paid',
      maxKeys: 2,
    },
  ];
  return Object.fromEntries(tasks.map((x) => [x.id, x]));
}

/** A new collection log (Excel's number rules on) with one task of every Aralin 10 kind. */
export function makeTaskSet10(rng: Rng, lang: Lang = 'tl'): { sheet: Sheet; tasks: Record<string, ExcelTask> } {
  const t = makeTable10(rng);
  const rowsN = t.table.length + EXTRA_ROWS;
  // Amounts look like money: 1,250.50 (the numbers themselves are unchanged).
  const formats = Object.fromEntries(
    Array.from({ length: rowsN - 1 }, (_, i) => [`${i + 1},${COL.amount}`, { number2: true }]).concat([
      [`3,${COL.value}`, { number2: true }],
    ]),
  );
  const sheet = makeSheet(t.table, rowsN, HEADERS_10.length, { formatting: true, formats, compute: computeSheet });
  return { sheet, tasks: allTasks10(t, translator(lang)) };
}

/** The Aralin 10 Pagsusulit: a new sheet and 6 of the 7 task kinds in random order. */
export function makeQuiz10(rng: Rng, lang: Lang = 'tl'): { sheet: Sheet; tasks: ExcelTask[] } {
  const set = makeTaskSet10(rng, lang);
  return { sheet: set.sheet, tasks: shuffle(rng, Object.values(set.tasks)).slice(0, QUIZ_TASKS) };
}
