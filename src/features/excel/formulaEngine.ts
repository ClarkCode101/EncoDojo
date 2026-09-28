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

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]; // prettier-ignore
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Excel's date codes for TEXT (Aralin 11): =TEXT(B2,"mmmm") -> August, "mmm d, yyyy" -> Aug 5, 2026,
 * "dddd" -> Wednesday. HyperFormula does not know month and day names, so it asks us (its
 * `stringifyDateTime` option). A format without date codes (like "#,##0.00") returns undefined,
 * and HyperFormula formats it as a number itself.
 */
export function excelDateText(
  dt: { year: number; month: number; day: number; hours?: number; minutes?: number; seconds?: number },
  format: string,
): string | undefined {
  // Number codes ("0.00", "#,##0.00", "000"): HyperFormula hands us the number as a date, so turn it back.
  const num = /^([#0,]*0)(?:\.(0+))?$/.exec(format) ?? /^(#,##)(?:\.(0+))?$/.exec(format);
  if (num && dt.year >= 1900) {
    const days = (Date.UTC(dt.year, dt.month - 1, dt.day) - Date.UTC(1899, 11, 30)) / 86_400_000;
    const time = ((dt.hours ?? 0) * 3600 + (dt.minutes ?? 0) * 60 + (dt.seconds ?? 0)) / 86_400;
    const serial = Math.round((days + time) * 1e6) / 1e6; // 2.3449999 -> 2.345
    const decimals = num[2]?.length ?? 0;
    return serial.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      minimumIntegerDigits: Math.max(1, (num[1].match(/0/g) ?? []).length),
      useGrouping: num[1].includes(','),
    });
  }
  if (!/[dmy]/i.test(format.replace(/"[^"]*"/g, ''))) return undefined;
  const weekday = new Date(Date.UTC(dt.year, dt.month - 1, dt.day)).getUTCDay();
  const codes: Record<string, string> = {
    yyyy: String(dt.year),
    yy: pad(dt.year % 100),
    mmmm: MONTHS[dt.month - 1],
    mmm: MONTHS[dt.month - 1].slice(0, 3),
    mm: pad(dt.month),
    m: String(dt.month),
    dddd: DAYS[weekday],
    ddd: DAYS[weekday].slice(0, 3),
    dd: pad(dt.day),
    d: String(dt.day),
  };
  return format.replace(/"([^"]*)"|yyyy|yy|mmmm|mmm|mm|m|dddd|ddd|dd|d/gi, (code, quoted?: string) =>
    quoted !== undefined ? quoted : codes[code.toLowerCase()],
  );
}

const CONFIG = {
  licenseKey: 'gpl-v3',
  // Dates are mm/dd/yyyy in this app (like a Philippine office Excel set to US dates).
  dateFormats: ['MM/DD/YYYY', 'MM/DD/YY'],
  stringifyDateTime: excelDateText,
};

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

/**
 * The value of every cell as shown: formulas computed (a date result, like =TODAY() or =B2+30,
 * as mm/dd/yyyy), other cells as they are. A cell may start with Excel's apostrophe for text
 * (sheet.ts `cellsForCompute`); it is shown without it.
 */
export function computeSheet(cells: string[][]): string[][] {
  const hf = HyperFormula.buildFromArray(
    cells.map((row) => row.map((v) => (v === '' ? null : v))),
    CONFIG,
    EXCEL_NAMES,
  );
  try {
    const sheet = hf.getSheetId(hf.getSheetNames()[0])!;
    const values = hf.getSheetValues(sheet);
    return cells.map((row, r) =>
      row.map((raw, c) => {
        if (!raw.startsWith('=')) return raw.startsWith("'") ? raw.slice(1) : raw;
        const v = values[r]?.[c];
        const type = hf.getCellValueDetailedType({ sheet, row: r, col: c });
        if (typeof v === 'number' && (type === 'NUMBER_DATE' || type === 'NUMBER_DATETIME')) {
          const d = hf.numberToDate(v) as { year: number; month: number; day: number };
          return `${pad(d.month)}/${pad(d.day)}/${d.year}`;
        }
        return show(v);
      }),
    );
  } finally {
    hf.destroy();
  }
}
