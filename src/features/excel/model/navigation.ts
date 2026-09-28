/**
 * Moving around (Aralin 1-2): Ctrl+Arrow to the edge of the data, the last used cell, Enter and
 * Tab (back to the column where the Tabs started), and today's date for Ctrl+;.
 */

import { clampPos, filled, inside, type Pos, type Sheet } from './core';

/**
 * Where Ctrl+Arrow lands from `from` (Excel's rule):
 * - on data, with data next to it: the last filled cell of that run;
 * - otherwise: the next filled cell in that direction, or the sheet's edge.
 */
export function ctrlJump(s: Sheet, from: Pos, dr: number, dc: number): Pos {
  let next = { r: from.r + dr, c: from.c + dc };
  if (!inside(s, next)) return from;
  if (filled(s, from) && filled(s, next)) {
    while (inside(s, { r: next.r + dr, c: next.c + dc }) && filled(s, { r: next.r + dr, c: next.c + dc })) {
      next = { r: next.r + dr, c: next.c + dc };
    }
    return next;
  }
  while (!filled(s, next) && inside(s, { r: next.r + dr, c: next.c + dc })) {
    next = { r: next.r + dr, c: next.c + dc };
  }
  return next;
}

/** The last used cell (Ctrl+End): the last row and the last column that have any data. */
export function lastUsed(s: Sheet): Pos {
  let r = 0;
  let c = 0;
  s.cells.forEach((row, ri) =>
    row.forEach((v, ci) => {
      if (v !== '') {
        r = Math.max(r, ri);
        c = Math.max(c, ci);
      }
    }),
  );
  return { r, c };
}

export const ARROWS: Record<string, [number, number]> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
};

/** Move the active cell; with `extend` the anchor stays (the selection grows). */
export function moveTo(s: Sheet, p: Pos, extend = false): Sheet {
  const active = clampPos(s, p);
  return { ...s, active, anchor: extend ? s.anchor : active, tabStartCol: null, whole: null };
}

/** Tab / Shift+Tab: move sideways and remember where the row of Tabs started. */
export function tab(s: Sheet, back: boolean): Sheet {
  const start = s.tabStartCol ?? s.active.c;
  return { ...moveTo(s, { r: s.active.r, c: s.active.c + (back ? -1 : 1) }), tabStartCol: start };
}

/** Enter / Shift+Enter: down (or up); after Tabs, back to the column where they started. */
export function enter(s: Sheet, up: boolean): Sheet {
  return moveTo(s, { r: s.active.r + (up ? -1 : 1), c: s.tabStartCol ?? s.active.c });
}

/** Today as mm/dd/yyyy (Ctrl+;), the date format used everywhere in EncoDojo. */
export function todayText(now: Date = new Date()): string {
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${mm}/${dd}/${now.getFullYear()}`;
}
