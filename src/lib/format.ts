/**
 * Formatting helpers shared by drills (Philippine office conventions).
 */

/** 1234567.5 -> "1,234,567.50" (always 2 decimals, commas every 3 digits). */
export function formatAmount(value: number): string {
  const [whole, cents] = value.toFixed(2).split('.');
  const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${withCommas}.${cents}`;
}

/** Same as formatAmount, but from whole centavos (avoids rounding errors). */
export function formatCentavos(centavos: number): string {
  return formatAmount(centavos / 100);
}

/** Dates as mm/dd/yyyy, e.g. 09/05/2026. Month is 1-12. */
export function formatDate(year: number, month: number, day: number): string {
  return `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}/${year}`;
}
