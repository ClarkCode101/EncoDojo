/**
 * Several sheets (tabs) in one workbook (Aralin 13). The Sheet is the ACTIVE tab; the others are
 * stored whole in `tabs.stored` and swapped in by `switchTab`.
 */

import { isFormula, type Sheet, type TabCells } from './core';
import { cellsForCompute } from './values';

/** A workbook: these sheets as tabs, with tab `index` active. */
export function makeWorkbook(tabs: { name: string; sheet: Sheet }[], index = 0): Sheet {
  const stored = tabs.map((t, i) => (i === index ? null : t.sheet));
  return { ...tabs[index].sheet, tabs: { names: tabs.map((t) => t.name), index, stored } };
}

/**
 * Go to tab `i` (clamped): the active tab is stored as it is (its cells, cursor, undo), and tab
 * `i` comes back as it was left. The clipboard goes along (copy on one tab, paste on another).
 */
export function switchTab(s: Sheet, i: number): Sheet {
  if (!s.tabs) return s;
  const to = Math.max(0, Math.min(s.tabs.names.length - 1, i));
  if (to === s.tabs.index) return s;
  const stored = [...s.tabs.stored];
  // The stored tab keeps everything except `tabs` (only the active sheet carries the tab list).
  stored[s.tabs.index] = { ...s, tabs: undefined, editing: null, alert: null };
  const next = stored[to]!;
  stored[to] = null;
  return {
    ...next,
    clipboard: s.clipboard,
    clipboardFrom: s.clipboardFrom,
    clipboardValues: s.clipboardValues,
    tabs: { ...s.tabs, index: to, stored },
  };
}

/** Rename tab `i` (Excel's rules, simplified: not empty, at most 31 letters, no other tab with that name). */
export function renameTab(s: Sheet, i: number, name: string): Sheet {
  if (!s.tabs) return s;
  const clean = name.trim();
  const taken = s.tabs.names.some((n, j) => j !== i && n.toLowerCase() === clean.toLowerCase());
  if (!clean || clean.length > 31 || /[\\/?*[\]:']/.test(clean) || taken) {
    return {
      ...s,
      alert: {
        tl: `Hindi puwede ang pangalang "${name}". Iba sa ibang tab, hindi blangko, walang / \\ ? * [ ] : '.`,
        en: `The name "${name}" is not allowed. It must differ from the other tabs, not be blank, and have no / \\ ? * [ ] : '.`,
      },
    };
  }
  const names = s.tabs.names.map((n, j) => (j === i ? clean : n));
  return { ...s, tabs: { ...s.tabs, names } };
}

/** The tabs for the formula engine: the active tab's name and the other tabs' cells. */
export function tabCells(s: Sheet): TabCells | undefined {
  if (!s.tabs) return undefined;
  const { names, index, stored } = s.tabs;
  return {
    active: names[index],
    others: stored.flatMap((t, i) => (t ? [{ name: names[i], cells: cellsForCompute(t) }] : [])),
  };
}

/** A formula keeps the tabs' own spelling: =SUM(ORDERS!C2:C9) -> =SUM(Orders!C2:C9) (the rest is in capitals). */
export function tabNamesAsNamed(s: Sheet, value: string): string {
  if (!s.tabs || !isFormula(value)) return value;
  return s.tabs.names.reduce(
    (v, name) =>
      v.replace(new RegExp(`(^|[^A-Za-z0-9_])${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}!`, 'gi'), `$1${name}!`),
    value,
  );
}
