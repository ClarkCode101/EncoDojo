/**
 * Rows and columns (Aralin 12): insert and delete whole rows / columns (formulas, formats,
 * widths and hidden columns move along) and hide / show columns.
 */

import { cols, isFormula, selectionRange, withCells, withRules, type CellFormat, type Sheet } from './core';
import { adjustRefs } from './formulas';

const DEFAULT_WIDTH = 'w-24 min-w-[6rem]';

const NEED_WHOLE = {
  tl: 'Piliin muna ang buong row (Shift + Space) o ang buong column (Ctrl + Space).',
  en: 'First select the whole row (Shift + Space) or the whole column (Ctrl + Space).',
};

/** Formats by "row,col" after rows/columns moved: `map` gives the new index, or null (deleted). */
function moveFormats(s: Sheet, axis: 'row' | 'col', map: (i: number) => number | null): Record<string, CellFormat> {
  const out: Record<string, CellFormat> = {};
  for (const [k, f] of Object.entries(s.formats)) {
    const [r, c] = k.split(',').map(Number);
    const i = map(axis === 'row' ? r : c);
    if (i !== null) out[axis === 'row' ? `${i},${c}` : `${r},${i}`] = f;
  }
  return out;
}

const adjustAll = (cells: string[][], axis: 'row' | 'col', at: number, delta: number) =>
  cells.map((row) => row.map((v) => (isFormula(v) ? adjustRefs(v, axis, at, delta) : v)));

/** Ctrl + + on whole rows / columns: insert as many empty ones before the selection. */
export function insertCells(s: Sheet): Sheet {
  if (!s.whole) return { ...s, alert: NEED_WHOLE };
  const { top, left, bottom, right } = selectionRange(s);
  if (s.whole === 'rows') {
    const k = bottom - top + 1;
    const empty = () => Array.from({ length: cols(s) }, () => '');
    const cells = adjustAll(
      [...s.cells.slice(0, top), ...Array.from({ length: k }, empty), ...s.cells.slice(top)],
      'row',
      top,
      k,
    );
    const formats = moveFormats(s, 'row', (r) => (r >= top ? r + k : r));
    return {
      ...withCells(s, cells, formats),
      freeze: { ...s.freeze, rows: s.freeze.rows > top ? s.freeze.rows + k : s.freeze.rows },
    };
  }
  const k = right - left + 1;
  const cells = adjustAll(
    s.cells.map((row) => [...row.slice(0, left), ...Array.from({ length: k }, () => ''), ...row.slice(left)]),
    'col',
    left,
    k,
  );
  const widths = s.colWidths && [
    ...s.colWidths.slice(0, left),
    ...Array.from({ length: k }, () => s.colWidths![left] ?? DEFAULT_WIDTH),
    ...s.colWidths.slice(left),
  ];
  return {
    ...withCells(
      s,
      cells,
      moveFormats(s, 'col', (c) => (c >= left ? c + k : c)),
    ),
    colWidths: widths,
    hiddenCols: s.hiddenCols.map((c) => (c >= left ? c + k : c)),
    freeze: { ...s.freeze, cols: s.freeze.cols > left ? s.freeze.cols + k : s.freeze.cols },
  };
}

/** Ctrl + - on whole rows / columns: delete them; the ones after move up / left (the sheet keeps its size). */
export function deleteCells(s: Sheet): Sheet {
  if (!s.whole) return { ...s, alert: NEED_WHOLE };
  const { top, left, bottom, right } = selectionRange(s);
  if (s.whole === 'rows') {
    const k = bottom - top + 1;
    const empty = () => Array.from({ length: cols(s) }, () => '');
    const kept = [...s.cells.slice(0, top), ...s.cells.slice(bottom + 1), ...Array.from({ length: k }, empty)];
    const formats = moveFormats(s, 'row', (r) => (r < top ? r : r > bottom ? r - k : null));
    return withCells(s, adjustAll(kept, 'row', top, -k), formats);
  }
  const k = right - left + 1;
  const kept = s.cells.map((row) => [
    ...row.slice(0, left),
    ...row.slice(right + 1),
    ...Array.from({ length: k }, () => ''),
  ]);
  const widths = s.colWidths && [
    ...s.colWidths.slice(0, left),
    ...s.colWidths.slice(right + 1),
    ...Array.from({ length: k }, () => DEFAULT_WIDTH),
  ];
  return {
    ...withCells(
      s,
      adjustAll(kept, 'col', left, -k),
      moveFormats(s, 'col', (c) => (c < left ? c : c > right ? c - k : null)),
    ),
    colWidths: widths,
    hiddenCols: s.hiddenCols.filter((c) => c < left || c > right).map((c) => (c > right ? c - k : c)),
  };
}

/** Ctrl+0 hides the selected columns; Ctrl+Shift+0 shows the hidden ones in the selection again. */
export function hideColumns(s: Sheet, hide: boolean): Sheet {
  const { left, right } = selectionRange(s);
  const inSel = (c: number) => c >= left && c <= right;
  if (!hide) {
    if (!s.hiddenCols.some(inSel)) return s;
    return withRules(s, { hiddenCols: s.hiddenCols.filter((c) => !inSel(c)) });
  }
  const hidden = [...new Set([...s.hiddenCols, ...Array.from({ length: right - left + 1 }, (_, i) => left + i)])].sort(
    (a, b) => a - b,
  );
  if (hidden.length >= cols(s)) return s; // never hide every column
  // The cursor moves to the next column that is still shown (right first, like Excel).
  const shown = (c: number) => c >= 0 && c < cols(s) && !hidden.includes(c);
  let c = right + 1;
  while (c < cols(s) && !shown(c)) c++;
  if (!shown(c)) for (c = left - 1; c >= 0 && !shown(c); c--);
  const p = { r: s.active.r, c };
  return { ...withRules(s, { hiddenCols: hidden }), active: p, anchor: p, whole: null };
}

/** True when a column is hidden (Ctrl+0). */
export const isColHidden = (s: Sheet, c: number) => s.hiddenCols.includes(c);
