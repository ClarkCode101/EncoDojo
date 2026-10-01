/**
 * The tasks of Excel Aralin 6, "IF, COUNTIF at SUMIF": a formula that decides
 * (=IF(C2>=20000,"Met","Below")), copying it down, counting with a condition
 * (COUNTIF, text and ">=20000"), and adding with a condition (SUMIF, with the
 * condition typed in or taken from a cell).
 *
 * The sheet is a fake sales list per agent (Agent, Branch, Sales, Result) with
 * a Summary block (F:G). Like Aralin 5, the checks compute the formulas with
 * HyperFormula (formulaEngine.ts) and require a formula. Some checks also
 * "probe" the formula: they change a number (or the F5 branch) on a copy of
 * the sheet and see that the answer changes the right way, so a formula that
 * is only right by luck does not pass. Each task's `prepare` sets up exactly
 * what it needs, so the tasks work in any order (tested).
 */
import { translator, type Lang, type T } from '../../lib/i18n';
import { intBetween, shuffle, type Rng } from '../../lib/random';
import * as ph from '../../data/ph';
import { nameParts } from '../typing/generatePassage';
import { computeSheet } from './formulaEngine';
import { cellName, isFormula, makeSheet, type Pos, type Sheet } from './sheet';
import type { ExcelTask, SolutionStep } from './tasks';

export const HEADERS_6 = ['Agent', 'Branch', 'Sales', 'Result', '', 'Summary', 'Value'];
const COL = { agent: 0, branch: 1, sales: 2, result: 3, label: 5, value: 6 } as const;
const EXTRA_ROWS = 6;
/** The monthly quota: 20,000 or more = "Met". */
export const QUOTA = 20000;

/** The branches of one sheet: [counted, summed, in F5]. */
export type Branches6 = [string, string, string];

/** The sales list: 8 to 11 agents in 3 branches (at least 2 each), at least 2 below and 2 at/above the quota. */
export function makeTable6(rng: Rng): { table: string[][]; branches: Branches6 } {
  const count = intBetween(rng, 8, 11);
  const branches = shuffle(
    rng,
    ph.cities.map((c) => c[0]),
  ).slice(0, 3) as Branches6;
  const agents = Array.from({ length: count }, (_, i) => {
    const n = nameParts(rng);
    const branch = i < 6 ? branches[i % 3] : branches[intBetween(rng, 0, 2)];
    // Sales in hundreds; the first two reach the quota, the next two do not, the rest are random.
    const sales = i < 2 ? intBetween(rng, 200, 400) : i < 4 ? intBetween(rng, 80, 199) : intBetween(rng, 80, 400);
    return [`${n.given} ${n.surname}`, branch, String(sales * 100), '', '', '', ''];
  });
  const rows = [HEADERS_6, ...shuffle(rng, agents)];
  // Short labels, so the longest city still fits the Summary column.
  rows[1][COL.label] = `Count: ${branches[0]}`;
  rows[2][COL.label] = 'Quota met (20,000+)';
  rows[3][COL.label] = `Total: ${branches[1]}`;
  rows[4][COL.label] = branches[2];
  return { table: rows, branches };
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

/** The computed sheet after changing some cells on a copy (the real sheet is untouched). */
function probe(s: Sheet, changes: [Pos, string][]): string[][] {
  return computeSheet(setCells(s, changes).cells);
}

const near = (a: string, b: number) => a !== '' && Math.abs(Number(a) - b) < 0.005;
const same = (a: string, b: string) => a.trim().toLowerCase() === b.toLowerCase();

function allTasks6(table: string[][], branches: Branches6, t: T): Record<string, ExcelTask> {
  const n = table.length - 1; // agents are rows 1..n
  const rows = Array.from({ length: n }, (_, i) => i + 1);
  const last = n + 1; // Excel row number of the last agent
  const at = (r: number, c: number): Pos => ({ r, c });
  const sales = (r: number) => Number(table[r][COL.sales]);
  const branch = (r: number) => table[r][COL.branch];
  const result = (value: number) => (value >= QUOTA ? 'Met' : 'Below');
  const resultFormula = (r: number) => `=IF(C${r + 1}>=${QUOTA},"Met","Below")`;
  const salesOf = (b: string) => rows.filter((r) => branch(r) === b).reduce((sum, r) => sum + sales(r), 0);
  const formulaWith = (s: Sheet, p: Pos, word: string) =>
    isFormula(s.cells[p.r][p.c]) && s.cells[p.r][p.c].toUpperCase().includes(word);
  const [counted, summed, inF5] = branches;
  const d2 = at(1, COL.result);
  const f5 = at(4, COL.label);

  const tasks: ExcelTask[] = [
    {
      id: 'ifFirst',
      text: t(
        `Sa ${cellName(d2)}, isulat ang Result ng unang agent: "Met" kung ang Sales ay 20,000 o higit pa, "Below" kung hindi.`,
        `In ${cellName(d2)}, write the Result of the first agent: "Met" if the Sales is 20,000 or more, "Below" if not.`,
      ),
      tip: t('=IF(C2>=20000,"Met","Below"), tapos Enter', '=IF(C2>=20000,"Met","Below"), then Enter'),
      hint: t(
        'Ang anyo: =IF(tanong, kung oo, kung hindi). Ang tanong: C2>=20000. Ang text ay nasa loob ng " ".',
        'The form: =IF(question, if yes, if not). The question: C2>=20000. Text goes inside " ".',
      ),
      solution: typeFormula(resultFormula(1)),
      start: d2,
      prepare: (s) => setCells(s, [[d2, '']]),
      check: (s) => {
        if (s.editing || !formulaWith(s, d2, 'IF')) return false;
        const salesC2 = at(1, COL.sales);
        return (
          same(computeSheet(s.cells)[1][COL.result], result(sales(1))) &&
          // Exactly the quota is "Met"; just below it is "Below".
          same(probe(s, [[salesC2, String(QUOTA)]])[1][COL.result], 'Met') &&
          same(probe(s, [[salesC2, String(QUOTA - 1)]])[1][COL.result], 'Below')
        );
      },
      maxKeys: 1,
    },
    {
      id: 'ifFill',
      text: t(
        `Kopyahin ang formula ng D2 pababa hanggang D${last}, para may Result ang bawat agent.`,
        `Copy the formula in D2 down to D${last}, so every agent has a Result.`,
      ),
      tip: t(`Shift + ↓ hanggang D${last}, tapos Ctrl + D`, `Shift + ↓ to D${last}, then Ctrl + D`),
      hint: t(
        `Gaya ng Aralin 5: nasa D2 ka. Shift + ↓ hanggang D${last} para mapili, tapos Ctrl + D.`,
        `Like Lesson 5: you are in D2. Shift + ↓ to D${last} to select, then Ctrl + D.`,
      ),
      solution: [...Array.from({ length: n - 1 }, () => key('ArrowDown', { shift: true })), key('d', { ctrl: true })],
      start: d2,
      prepare: (s) =>
        setCells(s, [[d2, resultFormula(1)], ...rows.slice(1).map((r) => [at(r, COL.result), ''] as [Pos, string])]),
      check: (s) => {
        if (s.editing) return false;
        const values = computeSheet(s.cells);
        return rows.every((r) => isFormula(s.cells[r][COL.result]) && same(values[r][COL.result], result(sales(r))));
      },
      maxKeys: n + 1,
    },
    {
      id: 'countifText',
      text: t(
        `Sa ${cellName(at(1, COL.value))}, bilangin kung ilang agent ang nasa ${counted}.`,
        `In ${cellName(at(1, COL.value))}, count how many agents are in ${counted}.`,
      ),
      tip: t(`=COUNTIF(B2:B${last},"${counted}"), tapos Enter`, `=COUNTIF(B2:B${last},"${counted}"), then Enter`),
      hint: t(
        `Ang anyo: =COUNTIF(saan titingin, ano ang hahanapin). Ang Branch ay B2 hanggang B${last}; ang hahanapin ay "${counted}".`,
        `The form: =COUNTIF(where to look, what to look for). The Branch is B2 to B${last}; look for "${counted}".`,
      ),
      solution: typeFormula(`=COUNTIF(B2:B${last},"${counted}")`),
      start: at(1, COL.value),
      prepare: (s) => setCells(s, [[at(1, COL.value), '']]),
      check: (s) =>
        !s.editing &&
        formulaWith(s, at(1, COL.value), 'COUNTIF') &&
        near(computeSheet(s.cells)[1][COL.value], rows.filter((r) => branch(r) === counted).length),
      maxKeys: 1,
    },
    {
      id: 'countifMore',
      text: t(
        `Sa ${cellName(at(2, COL.value))}, bilangin kung ilang agent ang may Sales na 20,000 o higit pa.`,
        `In ${cellName(at(2, COL.value))}, count how many agents have Sales of 20,000 or more.`,
      ),
      tip: t(`=COUNTIF(C2:C${last},">=20000"), tapos Enter`, `=COUNTIF(C2:C${last},">=20000"), then Enter`),
      hint: t(
        `=COUNTIF(saan titingin, tanong). Ang Sales ay C2 hanggang C${last}. Ang tanong sa numero ay nasa loob din ng " ": ">=20000".`,
        `=COUNTIF(where to look, question). The Sales is C2 to C${last}. A question about a number also goes inside " ": ">=20000".`,
      ),
      solution: typeFormula(`=COUNTIF(C2:C${last},">=${QUOTA}")`),
      start: at(2, COL.value),
      prepare: (s) => setCells(s, [[at(2, COL.value), '']]),
      check: (s) =>
        !s.editing &&
        formulaWith(s, at(2, COL.value), 'COUNTIF') &&
        near(computeSheet(s.cells)[2][COL.value], rows.filter((r) => sales(r) >= QUOTA).length),
      maxKeys: 1,
    },
    {
      id: 'sumifText',
      text: t(
        `Sa ${cellName(at(3, COL.value))}, kuwentahin ang kabuuang Sales ng ${summed}.`,
        `In ${cellName(at(3, COL.value))}, work out the total Sales of ${summed}.`,
      ),
      tip: t(
        `=SUMIF(B2:B${last},"${summed}",C2:C${last}), tapos Enter`,
        `=SUMIF(B2:B${last},"${summed}",C2:C${last}), then Enter`,
      ),
      hint: t(
        `Ang anyo: =SUMIF(saan titingin, ano ang hahanapin, ano ang idadagdag). Titingin sa Branch (B), idadagdag ang Sales (C).`,
        `The form: =SUMIF(where to look, what to look for, what to add up). Look in Branch (B), add up Sales (C).`,
      ),
      solution: typeFormula(`=SUMIF(B2:B${last},"${summed}",C2:C${last})`),
      start: at(3, COL.value),
      prepare: (s) => setCells(s, [[at(3, COL.value), '']]),
      check: (s) =>
        !s.editing &&
        formulaWith(s, at(3, COL.value), 'SUMIF') &&
        near(computeSheet(s.cells)[3][COL.value], salesOf(summed)),
      maxKeys: 1,
    },
    {
      id: 'sumifCell',
      text: t(
        `Sa ${cellName(at(4, COL.value))}, kuwentahin ang kabuuang Sales ng branch na nakasulat sa F5. Gamitin ang F5 sa formula, hindi ang pangalan.`,
        `In ${cellName(at(4, COL.value))}, work out the total Sales of the branch written in F5. Use F5 in the formula, not the name.`,
      ),
      tip: t(`=SUMIF(B2:B${last},F5,C2:C${last}), tapos Enter`, `=SUMIF(B2:B${last},F5,C2:C${last}), then Enter`),
      hint: t(
        'Gaya ng SUMIF kanina, pero sa halip na "pangalan", ilagay ang F5 (walang " "). Kapag pinalitan ang F5, magbabago ang sagot.',
        'Like the SUMIF before, but instead of the "name", put F5 (no " "). When F5 changes, the answer changes.',
      ),
      solution: typeFormula(`=SUMIF(B2:B${last},F5,C2:C${last})`),
      start: at(4, COL.value),
      prepare: (s) =>
        setCells(s, [
          [at(4, COL.value), ''],
          [f5, inF5],
        ]),
      check: (s) => {
        const g5 = at(4, COL.value);
        if (s.editing || !formulaWith(s, g5, 'SUMIF') || s.cells[f5.r][f5.c] !== inF5) return false;
        return (
          near(computeSheet(s.cells)[4][COL.value], salesOf(inF5)) &&
          // It really uses F5: another branch in F5 gives that branch's total.
          near(probe(s, [[f5, counted]])[4][COL.value], salesOf(counted))
        );
      },
      maxKeys: 1,
    },
  ];
  return Object.fromEntries(tasks.map((x) => [x.id, x]));
}

/** A new sales list (Excel's number rules on) with one task of every Aralin 6 kind. */
export function makeTaskSet6(rng: Rng, lang: Lang = 'tl'): { sheet: Sheet; tasks: Record<string, ExcelTask> } {
  const { table, branches } = makeTable6(rng);
  // No extra empty column: all 7 columns fit a 1366px screen (sheetLayout.ts).
  const sheet = makeSheet(table, table.length + EXTRA_ROWS, HEADERS_6.length, { formatting: true });
  return { sheet, tasks: allTasks6(table, branches, translator(lang)) };
}

/** The Aralin 6 Pagsusulit: a new sheet and all 6 task kinds in random order. */
export function makeQuiz6(rng: Rng, lang: Lang = 'tl'): { sheet: Sheet; tasks: ExcelTask[] } {
  const set = makeTaskSet6(rng, lang);
  return { sheet: set.sheet, tasks: shuffle(rng, Object.values(set.tasks)) };
}
