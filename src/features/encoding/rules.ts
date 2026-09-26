/**
 * Encoding rules for Document Encoding.
 *
 * On paper, dates and amounts can look different from document to document
 * (like in real life). The encoder must type them in ONE standard format:
 *   - Dates:   mm/dd/yyyy          ("Sept. 14, 2026" -> "09/14/2026")
 *   - Amounts: digits + decimal point only, no peso sign or commas
 *                                  ("₱5,115.25" -> "5115.25")
 *   - Text:    exact copy (capitals, "Ma.", "Jr.", punctuation)
 */
import { formatAmount, formatDate } from '../../lib/format';
import { pick, type Rng } from '../../lib/random';

/** The rules, as shown to the user above the document (Taglish). */
export const ENCODING_RULES: { what: string; rule: string; example: string }[] = [
  { what: 'Petsa', rule: 'Laging mm/dd/yyyy', example: 'Sept. 14, 2026 → 09/14/2026' },
  { what: 'Halaga', rule: 'Numero lang — walang ₱ at walang comma', example: '₱5,115.25 → 5115.25' },
  { what: 'Pangalan at iba pa', rule: 'Eksaktong kopya', example: 'Ma. Luisa Dela Cruz → Ma. Luisa Dela Cruz' },
];

const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
/** Common short forms in PH documents ("Sept." is more common here than "Sep."). */
const MONTHS_SHORT = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];
const MONTHS_3 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** How a date may look on paper. */
export type DateStyle = 'long' | 'short' | 'numeric' | 'dayFirst';
export const DATE_STYLES: DateStyle[] = ['long', 'short', 'numeric', 'dayFirst'];

/** A date as printed on a document, e.g. "September 14, 2026" or "14-Sep-2026". Month is 1-12. */
export function formatDateShown(year: number, month: number, day: number, style: DateStyle): string {
  switch (style) {
    case 'long':
      return `${MONTHS_LONG[month - 1]} ${day}, ${year}`;
    case 'short':
      return `${MONTHS_SHORT[month - 1]} ${day}, ${year}`;
    case 'numeric':
      return formatDate(year, month, day);
    case 'dayFirst':
      return `${String(day).padStart(2, '0')}-${MONTHS_3[month - 1]}-${year}`;
  }
}

export type DocDate = { shown: string; encoded: string };

/** A date in a random paper style, plus how it must be encoded (mm/dd/yyyy). */
export function docDate(rng: Rng, year: number, month: number, day: number): DocDate {
  return { shown: formatDateShown(year, month, day, pick(rng, DATE_STYLES)), encoded: formatDate(year, month, day) };
}

/** "₱5,115.25" — how an amount is printed on paper. */
export function formatPeso(centavos: number): string {
  return `₱${formatAmount(centavos / 100)}`;
}

/** "5115.25" — how an amount must be encoded (no peso sign, no commas). */
export function encodeAmount(centavos: number): string {
  return (centavos / 100).toFixed(2);
}
