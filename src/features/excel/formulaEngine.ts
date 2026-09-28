/**
 * Computes the formulas of a sheet with HyperFormula (GPL-3.0, owner approved
 * 2026-09-28), the same way Excel does: =SUM(D2:D9), =B2*C2, #DIV/0!, ...
 *
 * This is the ONLY file that imports HyperFormula. It is reached only through
 * the formula lessons' content (loaded with `import()` when such a lesson
 * opens), so the rest of the app never downloads it.
 */
import { DetailedCellError, HyperFormula } from 'hyperformula';

/** What a computed value looks like in a cell (General format), e.g. 2.5, TRUE, #DIV/0!. */
function show(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') return String(Number(v.toPrecision(12))); // no 0.30000000000000004
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (v instanceof DetailedCellError) return v.value;
  return String(v);
}

/** The value of every cell as shown (formulas computed; other cells as they are). */
export function computeSheet(cells: string[][]): string[][] {
  const hf = HyperFormula.buildFromArray(
    cells.map((row) => row.map((v) => (v === '' ? null : v))),
    { licenseKey: 'gpl-v3' },
  );
  try {
    const values = hf.getSheetValues(hf.getSheetId(hf.getSheetNames()[0])!);
    return cells.map((row, r) => row.map((raw, c) => (raw.startsWith('=') ? show(values[r]?.[c]) : raw)));
  } finally {
    hf.destroy();
  }
}
