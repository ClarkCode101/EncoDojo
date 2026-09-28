/**
 * `runCommand`: the data tools and dialogs of the view (sort, filter, find, Conditional
 * Formatting, Freeze Panes, tabs, PivotTable, ...) change the sheet through here.
 */

import { selectionRange, setCell, withRules, type Sheet, type SheetCommand } from './core';
import { moveTo } from './navigation';
import { listFor, overlaps } from './checks';
import { renameTab, switchTab } from './tabs';
import { commit } from './editing';
import {
  columnValues,
  findNext,
  isHidden,
  removeDuplicateRows,
  replaceAll,
  sortRows,
  textToColumns,
} from './dataTools';
import { createPivot, setPivot } from './pivot';

/** Run a data tool. Returns the same sheet when nothing changes. */
export function runCommand(s: Sheet, cmd: SheetCommand): Sheet {
  const base = s.editing ? commit(s) : s;
  switch (cmd.kind) {
    case 'sort':
      return sortRows(base, cmd.asc);
    case 'toggleFilter':
      return { ...base, filterOn: !base.filterOn, filter: null };
    case 'setFilter': {
      const all = cmd.values === null || cmd.values.length === columnValues(base, cmd.col).length;
      const next: Sheet = { ...base, filterOn: true, filter: all ? null : { col: cmd.col, values: cmd.values! } };
      // The active cell never stays on a hidden row.
      return isHidden(next, next.active.r) ? moveTo(next, { r: 0, c: next.active.c }) : next;
    }
    case 'find':
      return findNext(base, cmd.text);
    case 'replaceAll':
      return replaceAll(base, cmd.find, cmd.replace);
    case 'removeDuplicates':
      return removeDuplicateRows(base);
    case 'textToColumns':
      return textToColumns(base, cmd.delimiter, cmd.dest);
    case 'condFormat':
      return withRules(base, { condRules: [...base.condRules, { kind: cmd.rule, range: selectionRange(base) }] });
    case 'clearRules':
      return base.condRules.length === 0 ? base : withRules(base, { condRules: [] });
    case 'validation': {
      const range = selectionRange(base);
      const list = cmd.list.map((v) => v.trim()).filter((v) => v !== '');
      if (list.length === 0) return base;
      // A new list replaces the lists it overlaps (like Excel's "apply to the selected cells").
      return withRules(base, { lists: [...base.lists.filter((l) => !overlaps(l.range, range)), { range, list }] });
    }
    case 'createPivot':
      return createPivot(base, cmd.def);
    case 'pivot':
      return base.pivot ? setPivot(base, cmd.def) : base;
    case 'refreshPivot':
      return base.pivot ? setPivot(base, base.pivot) : base;
    case 'tab':
      return switchTab(base, cmd.index);
    case 'renameTab':
      return renameTab(base, cmd.index, cmd.name);
    case 'freeze':
      return { ...base, freeze: { rows: Math.max(0, cmd.rows), cols: Math.max(0, cmd.cols) } };
    case 'pick': {
      const list = listFor(base, base.active);
      return list && list.includes(cmd.value) ? setCell(base, base.active, cmd.value) : base;
    }
    case 'open':
      return base;
  }
}
