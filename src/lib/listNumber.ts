/** "01", "02": list numbers written like on paper ("Dojo notebook" look). */
export function listNumber(n: number): string {
  return String(n).padStart(2, '0');
}
