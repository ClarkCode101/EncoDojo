/**
 * What a cell IS and how it LOOKS, like Excel: numbers vs text (the apostrophe, '00457), dates
 * (mm/dd/yyyy on the right, dd/mm text on the left), number formats (1,250.50), what the
 * formula bar shows, and the order used for sorting.
 */

import { formatKey, formatOf, isFormula, isNumberText, type Pos, type Sheet } from './core';

/**
 * A computed formula value that is TEXT looking like a number: formulaEngine.ts marks it
 * with an apostrophe ("'00457"). Returns the text without the mark, or null for anything else.
 */
export function computedText(v: string): string | null {
  return v.startsWith("'") && isNumberText(v.slice(1)) ? v.slice(1) : null;
}

/** A number the sheet treats as a number (not text) in this cell. */
function isNumberCell(s: Sheet, p: Pos): boolean {
  return s.formatting && !formatOf(s, p).text && isNumberText(s.cells[p.r][p.c]);
}

/**
 * A real date the way this app types dates (Aralin 11): mm/dd/yyyy (m/d/yyyy also works),
 * with a month 1-12 and a day that exists in it. "25/08/2026" (dd/mm) is NOT a date: it
 * stays text, like in an Excel set to mm/dd/yyyy.
 */
export function isDateText(v: string): boolean {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(v);
  if (!m) return false;
  const [month, day, year] = [Number(m[1]), Number(m[2]), Number(m[3])];
  return month >= 1 && month <= 12 && day >= 1 && day <= new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** The days since 01/01/1900 of an mm/dd/yyyy date (to sort dates as dates). */
function dateNumber(v: string): number {
  const [m, d, y] = v.split('/').map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
}

/**
 * The cells as the formula engine should read them: a cell formatted as TEXT gets Excel's
 * apostrophe ('05/08/2026, '00457), so it is not read as a date or a number.
 */
export function cellsForCompute(s: Sheet): string[][] {
  if (!s.formatting) return s.cells;
  return s.cells.map((row, r) =>
    row.map((v, c) => (v !== '' && !isFormula(v) && s.formats[formatKey({ r, c })]?.text ? `'${v}` : v)),
  );
}

/** What the cell shows, e.g. 1500 with Ctrl+Shift+1 -> "1,500.00". */
export function displayValue(s: Sheet, p: Pos): string {
  const v = s.cells[p.r][p.c];
  if (isNumberCell(s, p) && formatOf(s, p).number2) {
    return Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return v;
}

/** Numbers and dates sit on the right of the cell, text on the left (like Excel). */
export function alignsRight(s: Sheet, p: Pos): boolean {
  return isNumberCell(s, p) || (s.formatting && !formatOf(s, p).text && isDateText(s.cells[p.r][p.c]));
}

/** What the formula bar (and F2) shows: text that looks like a number or a date keeps its apostrophe. */
export function formulaBarValue(s: Sheet, p: Pos): string {
  const v = s.cells[p.r][p.c];
  return s.formatting && formatOf(s, p).text && (isNumberText(v) || isDateText(v)) ? `'${v}` : v;
}

/**
 * What a typed entry becomes, the way Excel stores it:
 * 'text -> text (apostrophe removed), 00457 -> 457 (a number), anything else as typed.
 */
export function excelValue(raw: string): { value: string; text: boolean } {
  if (raw.startsWith("'")) return { value: raw.slice(1), text: true };
  if (isFormula(raw)) {
    // Like Excel: names and cell references in capitals (=sum(b2:b9) -> =SUM(B2:B9), so copying
    // moves them), but text in quotes kept as typed; missing closing parentheses are added.
    const upper = raw
      .split(/("[^"]*")/)
      .map((part, i) => (i % 2 === 1 ? part : part.toUpperCase()))
      .join('');
    const missing = (upper.match(/\(/g)?.length ?? 0) - (upper.match(/\)/g)?.length ?? 0);
    return { value: missing > 0 ? upper + ')'.repeat(missing) : upper, text: false };
  }
  if (isNumberText(raw)) return { value: String(Number(raw)), text: false };
  return { value: raw, text: false };
}

/** Compare two cell values like Excel: numbers as numbers, text A-Z (ignoring case). Empty cells last. */
export function compareValues(a: string, b: string): number {
  if (a === '' || b === '') return a === b ? 0 : a === '' ? 1 : -1;
  if (isNumberText(a) && isNumberText(b)) return Number(a) - Number(b);
  if (isDateText(a) && isDateText(b)) return dateNumber(a) - dateNumber(b);
  return a.localeCompare(b, undefined, { sensitivity: 'base' });
}
