/**
 * Computes the formulas of a sheet with HyperFormula (GPL-3.0, owner approved
 * 2026-09-28), the same way Excel does: =SUM(D2:D9), =B2*C2, #DIV/0!, ...
 *
 * This is the ONLY file that imports HyperFormula. It is reached only through
 * the formula lessons' content (loaded with `import()` when such a lesson
 * opens), so the rest of the app never downloads it.
 */
import { DetailedCellError, HyperFormula } from 'hyperformula';
import { isNumberText } from './sheet';

/**
 * What a computed value looks like in a cell (General format), e.g. 2.5, TRUE, #DIV/0!.
 * TEXT that looks like a number (=RIGHT("TN-00457",5) -> 00457) gets an apostrophe in
 * front, like a number typed as text in Excel, so the view keeps it on the left with
 * its zeros (see `computedText` in sheet.ts).
 */
function show(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') return String(Number(v.toPrecision(12))); // no 0.30000000000000004
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (v instanceof DetailedCellError) return v.value;
  const text = String(v);
  return isNumberText(text) ? `'${text}` : text;
}

/**
 * In Excel, TRUE and FALSE can be typed bare (=VLOOKUP(B2,F2:H9,2,FALSE)). HyperFormula
 * only knows TRUE() and FALSE() and shows #NAME? otherwise, so we name them.
 */
const EXCEL_NAMES = [
  { name: 'TRUE', expression: '=TRUE()' },
  { name: 'FALSE', expression: '=FALSE()' },
];

/**
 * True when the cell at `p` shows the same value as the lesson's own `reference` formula would
 * there. The reference is put in an extra column on the same row (these formulas only point at
 * other cells, so its place does not matter), so one computation gives both answers.
 */
export function sameResult(cells: string[][], p: { r: number; c: number }, reference: string): boolean {
  const width = cells[0].length;
  const values = computeSheet(cells.map((row, r) => [...row, r === p.r ? reference : '']));
  return values[p.r][p.c] === values[p.r][width];
}

/** The value of every cell as shown (formulas computed; other cells as they are). */
export function computeSheet(cells: string[][]): string[][] {
  const hf = HyperFormula.buildFromArray(
    cells.map((row) => row.map((v) => (v === '' ? null : v))),
    { licenseKey: 'gpl-v3' },
    EXCEL_NAMES,
  );
  try {
    const values = hf.getSheetValues(hf.getSheetId(hf.getSheetNames()[0])!);
    return cells.map((row, r) => row.map((raw, c) => (raw.startsWith('=') ? show(values[r]?.[c]) : raw)));
  } finally {
    hf.destroy();
  }
}
