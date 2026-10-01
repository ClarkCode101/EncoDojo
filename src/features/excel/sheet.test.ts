import { describe, expect, it } from 'vitest';
import {
  alignsRight,
  columnValues,
  countDuplicates,
  countMatches,
  isHidden,
  runCommand,
  shiftFormula,
  cellName,
  adjustRefs,
  selectionRange,
  highlightedCells,
  listFor,
  parseCellName,
  clickCell,
  colLetter,
  ctrlJump,
  displayValue,
  formatOf,
  formulaBarValue,
  lastUsed,
  makeSheet,
  pressKey,
  selectionName,
  todayText,
  typeInCell,
  type KeyPress,
  type Sheet,
} from './sheet';

/**
 * A small sheet (10 rows x 5 cols):
 *      A      B      C
 *  1   Name   Amount Date
 *  2   Juan   100    x
 *  3   Maria  200    x
 *  4   Pedro  300    x
 *  5   (empty)
 *  6   Total  600
 */
const DATA = [
  ['Name', 'Amount', 'Date'],
  ['Juan', '100', 'x'],
  ['Maria', '200', 'x'],
  ['Pedro', '300', 'x'],
  [],
  ['Total', '600'],
];
const fresh = () => makeSheet(DATA, 10, 5);
const press = (s: Sheet, ...keys: (string | KeyPress)[]) =>
  keys.reduce<Sheet>((acc, k) => pressKey(acc, typeof k === 'string' ? { key: k } : k), s);
const ctrl = (key: string, shift = false): KeyPress => ({ key, ctrl: true, shift });
const shift = (key: string): KeyPress => ({ key, shift: true });
const at = (s: Sheet) => cellName(s.active);

describe('names', () => {
  it('column letters and cell names like Excel', () => {
    expect(colLetter(0)).toBe('A');
    expect(colLetter(25)).toBe('Z');
    expect(colLetter(26)).toBe('AA');
    expect(cellName({ r: 2, c: 1 })).toBe('B3');
  });
});

describe('moving', () => {
  it('arrows move one cell and stop at the sheet edge', () => {
    expect(at(press(fresh(), 'ArrowDown', 'ArrowRight'))).toBe('B2');
    expect(at(press(fresh(), 'ArrowUp', 'ArrowLeft'))).toBe('A1');
  });

  it('Ctrl+Down: to the end of the data, then to the next data, then to the edge', () => {
    let s = fresh();
    s = press(s, ctrl('ArrowDown'));
    expect(at(s)).toBe('A4'); // last filled cell of the first block
    s = press(s, ctrl('ArrowDown'));
    expect(at(s)).toBe('A6'); // jumps over the empty row to "Total"
    s = press(s, ctrl('ArrowDown'));
    expect(at(s)).toBe('A10'); // nothing below: the edge
  });

  it('Ctrl+Right stops at the last filled cell of the row', () => {
    expect(at(press(fresh(), ctrl('ArrowRight')))).toBe('C1');
  });

  it('Ctrl+Arrow from an empty cell goes to the next filled cell', () => {
    const s = press(fresh(), 'ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown'); // A5 (empty)
    expect(at(press(s, ctrl('ArrowUp')))).toBe('A4');
    expect(ctrlJump(s, s.active, 1, 0)).toEqual({ r: 5, c: 0 });
  });

  it('Home, Ctrl+Home, Ctrl+End', () => {
    let s = press(fresh(), 'ArrowDown', 'ArrowDown', 'ArrowRight', 'ArrowRight');
    expect(at(press(s, 'Home'))).toBe('A3');
    expect(at(press(s, ctrl('Home')))).toBe('A1');
    s = press(fresh(), ctrl('End'));
    expect(at(s)).toBe('C6'); // last used row (6) and last used column (C)
    expect(lastUsed(fresh())).toEqual({ r: 5, c: 2 });
  });

  it('Enter / Tab move down / right; Shift goes back', () => {
    expect(at(press(fresh(), 'Enter', 'Tab'))).toBe('B2');
    expect(at(press(fresh(), 'Enter', 'Tab', shift('Tab'), shift('Enter')))).toBe('A1');
  });
});

describe('selecting', () => {
  it('Shift+Arrow grows the selection; a plain arrow ends it', () => {
    let s = press(fresh(), shift('ArrowDown'), shift('ArrowDown'), shift('ArrowRight'));
    expect(selectionName(s)).toBe('A1:B3');
    s = press(s, 'ArrowDown');
    expect(selectionName(s)).toBe('B4');
  });

  it('Ctrl+Shift+Down selects to the end of the data', () => {
    const s = press(fresh(), 'ArrowRight', ctrl('ArrowDown', true));
    expect(selectionName(s)).toBe('B1:B4');
  });

  it('Ctrl+A selects all the data', () => {
    expect(selectionName(press(fresh(), ctrl('a')))).toBe('A1:C6');
  });
});

describe('editing', () => {
  it('typing replaces the value; Enter saves and moves down', () => {
    let s = press(fresh(), 'ArrowDown'); // A2 "Juan"
    s = press(s, 'J');
    expect(s.editing).toEqual({ value: 'J', mode: 'enter' });
    s = typeInCell(s, 'Jose');
    s = press(s, 'Enter');
    expect(s.cells[1][0]).toBe('Jose');
    expect(at(s)).toBe('A3');
  });

  it('in Enter mode an arrow saves and moves; Esc cancels', () => {
    let s = press(fresh(), 'X');
    s = press(typeInCell(s, 'Xyz'), 'ArrowRight');
    expect(s.cells[0][0]).toBe('Xyz');
    expect(at(s)).toBe('B1');
    s = press(s, 'Q', 'Escape');
    expect(s.cells[0][1]).toBe('Amount');
  });

  it('F2 edits the current value; arrows stay in the text', () => {
    let s = press(fresh(), 'F2');
    expect(s.editing).toEqual({ value: 'Name', mode: 'edit' });
    s = press(s, 'ArrowLeft');
    expect(at(s)).toBe('A1');
    s = press(typeInCell(s, 'Full Name'), 'Tab');
    expect(s.cells[0][0]).toBe('Full Name');
    expect(at(s)).toBe('B1');
  });

  it('Delete clears the whole selection; Backspace empties the cell and starts typing', () => {
    let s = press(fresh(), 'ArrowDown', shift('ArrowDown'), 'Delete');
    expect(s.cells[1][0]).toBe('');
    expect(s.cells[2][0]).toBe('');
    s = press(fresh(), 'ArrowRight', 'Backspace');
    expect(s.cells[0][1]).toBe('');
    expect(s.editing).toEqual({ value: '', mode: 'enter' });
  });

  it('Ctrl+C / Ctrl+V copy a block; the pasted block is selected', () => {
    let s = press(fresh(), 'ArrowDown', shift('ArrowRight'), ctrl('c'));
    s = press(s, 'ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'Home', ctrl('v'));
    expect(s.cells[6].slice(0, 2)).toEqual(['Juan', '100']);
    expect(selectionName(s)).toBe('A7:B7');
  });

  it('Ctrl+Z undoes the last change, one step at a time', () => {
    let s = press(fresh(), 'Delete'); // clears A1
    s = press(s, 'ArrowRight', 'Delete'); // clears B1
    expect(s.cells[0].slice(0, 2)).toEqual(['', '']);
    s = press(s, ctrl('z'));
    expect(s.cells[0].slice(0, 2)).toEqual(['', 'Amount']);
    s = press(s, ctrl('z'));
    expect(s.cells[0][0]).toBe('Name');
    expect(press(s, ctrl('z'))).toBe(s); // nothing left to undo
  });

  it('keys that do nothing return the same sheet', () => {
    const s = fresh();
    expect(pressKey(s, { key: 'Shift' })).toBe(s);
    expect(pressKey(s, { key: 'q', ctrl: true })).toBe(s);
  });
});

describe('data entry (Aralin 2)', () => {
  const blank = () =>
    makeSheet(
      [
        ['Name', 'Branch', 'Status'],
        ['Juan', 'Lipa', 'Paid'],
      ],
      8,
      4,
    );

  it('Tab, Tab, Enter: saves each cell and goes back to where the Tabs started (next row)', () => {
    let s = press(blank(), 'ArrowDown', 'ArrowDown'); // A3 (empty row)
    s = press(typeInCell(press(s, 'M'), 'Maria'), 'Tab');
    s = press(typeInCell(press(s, 'C'), 'Cebu'), 'Tab');
    s = press(typeInCell(press(s, 'U'), 'Unpaid'), 'Enter');
    expect(s.cells[2].slice(0, 3)).toEqual(['Maria', 'Cebu', 'Unpaid']);
    expect(at(s)).toBe('A4');
    // An arrow in between forgets the start column.
    s = press(s, 'Tab', 'ArrowRight', 'Enter');
    expect(at(s)).toBe('C5');
  });

  it('Ctrl+D on one cell copies the cell above', () => {
    const s = press(blank(), 'ArrowDown', 'ArrowDown', 'ArrowRight', ctrl('d'));
    expect(s.cells[2][1]).toBe('Lipa');
    expect(press(blank(), ctrl('d')).cells[0][0]).toBe('Name'); // row 1 has nothing above: no change
  });

  it('Ctrl+D on a selection copies its top row down', () => {
    const s = press(
      blank(),
      'ArrowDown',
      'ArrowRight',
      shift('ArrowDown'),
      shift('ArrowDown'),
      shift('ArrowRight'),
      ctrl('d'),
    );
    expect(s.cells.slice(1, 4).map((r) => r.slice(1, 3))).toEqual([
      ['Lipa', 'Paid'],
      ['Lipa', 'Paid'],
      ['Lipa', 'Paid'],
    ]);
    expect(press(s, ctrl('z')).cells[2][1]).toBe(''); // one undo step
  });

  it('typing keeps the selection; Ctrl+Enter puts the value in every selected cell', () => {
    let s = press(
      blank(),
      'ArrowDown',
      'ArrowDown',
      'ArrowRight',
      'ArrowRight',
      shift('ArrowDown'),
      shift('ArrowDown'),
    );
    s = typeInCell(press(s, 'P'), 'Paid');
    expect(selectionName(s)).toBe('C3:C5');
    s = press(s, ctrl('Enter'));
    expect(s.cells.slice(2, 5).map((r) => r[2])).toEqual(['Paid', 'Paid', 'Paid']);
    expect(s.editing).toBeNull();
    expect(selectionName(s)).toBe('C3:C5');
  });

  it("Ctrl+; types today's date (mm/dd/yyyy); Enter saves it", () => {
    let s = press(blank(), 'ArrowDown', 'ArrowDown', ctrl(';'));
    expect(s.editing?.value).toBe(todayText());
    s = press(s, 'Enter');
    expect(s.cells[2][0]).toBe(todayText());
    expect(todayText(new Date(2026, 8, 7))).toBe('09/07/2026');
  });

  it('clicking a cell ends the edit and forgets the Tab start', () => {
    let s = press(typeInCell(press(blank(), 'X'), 'Xyz'), 'Tab');
    s = clickCell(press(s, 'Q'), { r: 5, c: 3 });
    expect(s.cells[0].slice(0, 2)).toEqual(['Xyz', 'Q']);
    expect(at(press(s, 'Enter'))).toBe('D7');
  });
});

describe('formatting (Aralin 3)', () => {
  const fmt = () =>
    makeSheet(
      [
        ['Emp No.', 'Rate'],
        ['00457', '610'],
        ['00458', '645.5'],
      ],
      6,
      3,
      {
        formatting: true,
        formats: { '1,0': { text: true }, '2,0': { text: true } },
      },
    );

  it('digits typed without an apostrophe become a number (the zeros go), with one they stay text', () => {
    let s = press(fmt(), 'ArrowDown', 'ArrowDown', 'ArrowDown'); // A4
    s = press(typeInCell(press(s, '0'), '00459'), 'Enter');
    expect(s.cells[3][0]).toBe('459');
    expect(alignsRight(s, { r: 3, c: 0 })).toBe(true);
    s = press(typeInCell(press(s, "'"), "'00460"), 'Enter');
    expect(s.cells[4][0]).toBe('00460');
    expect(formatOf(s, { r: 4, c: 0 }).text).toBe(true);
    expect(alignsRight(s, { r: 4, c: 0 })).toBe(false);
    expect(formulaBarValue(s, { r: 4, c: 0 })).toBe("'00460");
  });

  it('F2 on a text number shows the apostrophe, so saving it keeps the zeros', () => {
    const s = press(fmt(), 'ArrowDown', 'F2');
    expect(s.editing?.value).toBe("'00457");
    expect(press(s, 'Enter').cells[1][0]).toBe('00457');
  });

  it('Ctrl+Shift+1 shows comma and 2 decimals; Ctrl+Shift+~ goes back to General', () => {
    let s = press(
      fmt(),
      'ArrowDown',
      'ArrowRight',
      { key: 'ArrowDown', ctrl: true, shift: true },
      { key: '!', ctrl: true, shift: true },
    );
    expect(displayValue(s, { r: 1, c: 1 })).toBe('610.00');
    expect(displayValue(s, { r: 2, c: 1 })).toBe('645.50');
    s = press(typeInCell(press(s, 'ArrowDown', '1'), '1500'), 'Enter');
    expect(displayValue(s, { r: 3, c: 1 })).toBe('1500'); // not formatted: outside the selection
    s = press(s, 'ArrowUp', 'ArrowUp', { key: '~', ctrl: true, shift: true });
    expect(displayValue(s, { r: 2, c: 1 })).toBe('645.5');
  });

  it('Ctrl+B bolds the selection, and again un-bolds it; Ctrl+Z undoes a format', () => {
    let s = press(fmt(), shift('ArrowRight'), ctrl('b'));
    expect(formatOf(s, { r: 0, c: 0 }).bold && formatOf(s, { r: 0, c: 1 }).bold).toBe(true);
    s = press(s, ctrl('b'));
    expect(formatOf(s, { r: 0, c: 1 }).bold).toBe(false);
    s = press(s, ctrl('z'));
    expect(formatOf(s, { r: 0, c: 1 }).bold).toBe(true);
  });

  it('sheets without formatting keep every typed value as it is (Aralin 1-2)', () => {
    const s = press(typeInCell(press(makeSheet([], 3, 2), '0'), '00457'), 'Enter');
    expect(s.cells[0][0]).toBe('00457');
    const up = press(s, 'ArrowUp');
    expect(press(up, ctrl('b'))).toBe(up); // Ctrl+B does nothing there
  });
});

describe('data tools (Aralin 4)', () => {
  const table = () =>
    makeSheet(
      [
        ['Name', 'Branch', 'Amount'],
        ['Maria', 'Lipa Cty', '900'],
        ['juan', 'Cebu City', '1200'],
        ['Pedro', 'Lipa Cty', '85'],
        ['juan', 'Cebu City', '1200'],
      ],
      8,
      3,
    );
  const col = (s: Sheet, c: number) => s.cells.slice(1, 5).map((r) => r[c]);

  it('sort A to Z by the active column (ignoring case), header stays; Z to A by numbers', () => {
    let s = runCommand(table(), { kind: 'sort', asc: true });
    expect(s.cells[0][0]).toBe('Name');
    expect(col(s, 0)).toEqual(['juan', 'juan', 'Maria', 'Pedro']);
    s = runCommand(press(s, 'ArrowRight', 'ArrowRight'), { kind: 'sort', asc: false });
    expect(col(s, 2)).toEqual(['1200', '1200', '900', '85']); // numbers, not text ("85" > "1200" as text)
    expect(col(press(s, ctrl('z')), 0)).toEqual(['juan', 'juan', 'Maria', 'Pedro']); // undo = back to the A-Z sort
  });

  it('filter: only the chosen values show; arrows skip hidden rows; Ctrl+Shift+L turns it off', () => {
    let s = runCommand(table(), { kind: 'setFilter', col: 1, values: ['Lipa Cty'] });
    expect([1, 2, 3, 4].map((r) => isHidden(s, r))).toEqual([false, true, false, true]);
    expect(columnValues(s, 1)).toEqual(['Cebu City', 'Lipa Cty']);
    s = press(s, 'ArrowDown', 'ArrowDown');
    expect(at(s)).toBe('A4'); // row 3 is hidden
    s = press(s, ctrl('l', true));
    expect(s.filter).toBeNull();
    expect(s.filterOn).toBe(false);
  });

  it('find goes to the next cell that contains the text (not case-sensitive), wrapping around', () => {
    let s = runCommand(table(), { kind: 'find', text: 'JUAN' });
    expect(at(s)).toBe('A3');
    s = runCommand(s, { kind: 'find', text: 'juan' });
    expect(at(s)).toBe('A5');
    expect(at(runCommand(s, { kind: 'find', text: 'juan' }))).toBe('A3');
    expect(runCommand(s, { kind: 'find', text: 'wala' })).toBe(s);
  });

  it('replace all changes every match (one undo step) and counts them', () => {
    const t = table();
    expect(countMatches(t, 'cty')).toBe(2);
    const s = runCommand(t, { kind: 'replaceAll', find: 'Cty', replace: 'City' });
    expect(col(s, 1)).toEqual(['Lipa City', 'Cebu City', 'Lipa City', 'Cebu City']);
    expect(col(press(s, ctrl('z')), 1)[0]).toBe('Lipa Cty');
  });

  it('remove duplicates keeps the first of each identical row; the rest move up', () => {
    const t = table();
    expect(countDuplicates(t)).toBe(1);
    const s = runCommand(t, { kind: 'removeDuplicates' });
    expect(col(s, 0)).toEqual(['Maria', 'juan', 'Pedro', '']);
    expect(runCommand(s, { kind: 'removeDuplicates' })).toBe(s); // nothing left to remove
  });
});

describe('formulas (Aralin 5)', () => {
  it('shiftFormula moves references like Excel; $ keeps a part; quotes and functions are left alone', () => {
    expect(shiftFormula('=B2*C2', 1, 0)).toBe('=B3*C3');
    expect(shiftFormula('=SUM(D2:D9)', 0, 1)).toBe('=SUM(E2:E9)');
    expect(shiftFormula('=B2*$C$1', 3, 0)).toBe('=B5*$C$1');
    expect(shiftFormula('=A$1+$A1', 2, 2)).toBe('=C$1+$A3');
    expect(shiftFormula('=IF(B2>5,"B2 ok","no")', 1, 0)).toBe('=IF(B3>5,"B2 ok","no")');
    expect(shiftFormula('=LOG10(A2)', 1, 0)).toBe('=LOG10(A3)');
    expect(shiftFormula('=A1', -1, 0)).toBe('=#REF!');
    expect(shiftFormula('plain text A1', 1, 0)).toBe('plain text A1');
  });

  const sheet = () =>
    makeSheet(
      [
        ['Qty', 'Price', 'Amount'],
        ['2', '10', '=A2*B2'],
        ['3', '20', ''],
        ['4', '30', ''],
      ],
      8,
      4,
      { formatting: true },
    );

  it('Ctrl+D copies a formula down with its references moved', () => {
    const s = press(
      sheet(),
      'ArrowDown',
      'ArrowRight',
      'ArrowRight',
      shift('ArrowDown'),
      shift('ArrowDown'),
      ctrl('d'),
    );
    expect(s.cells.slice(1, 4).map((r) => r[2])).toEqual(['=A2*B2', '=A3*B3', '=A4*B4']);
  });

  it('Ctrl+C / Ctrl+V moves the references by the distance of the paste', () => {
    const s = press(sheet(), 'ArrowDown', 'ArrowRight', 'ArrowRight', ctrl('c'), 'ArrowDown', 'ArrowDown', ctrl('v'));
    expect(s.cells[3][2]).toBe('=A4*B4');
  });

  it('Ctrl+Enter puts the formula in every selected cell, each relative to its row', () => {
    // Note: in this sheet the active cell is the MOVING end of the selection (C4 here); in Excel it stays at the
    // start. The formula is written for the active cell and moved for the others.
    let s = press(sheet(), 'ArrowDown', 'ArrowDown', 'ArrowRight', 'ArrowRight', shift('ArrowDown'));
    s = press(typeInCell(press(s, '='), '=A4*B4'), ctrl('Enter'));
    expect(s.cells.slice(2, 4).map((r) => r[2])).toEqual(['=A3*B3', '=A4*B4']);
  });

  it('Alt+= (AutoSum) writes =SUM of the numbers above, ready for Enter', () => {
    let s = press(sheet(), 'ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown', { key: '=', alt: true }); // A5
    expect(s.editing?.value).toBe('=SUM(A2:A4)');
    s = press(s, 'Enter');
    expect(s.cells[4][0]).toBe('=SUM(A2:A4)');
    // Formulas above count too (they are numbers once computed).
    const t = press(runCommand(sheet(), { kind: 'open' }), 'ArrowDown', 'ArrowDown', 'ArrowRight', 'ArrowRight', {
      key: '=',
      alt: true,
    });
    expect(t.editing?.value).toBe('=SUM(C2:C2)');
  });

  it('a typed formula is kept as text (the lesson computes it); F2 shows it', () => {
    let s = press(
      typeInCell(press(sheet(), 'ArrowDown', 'ArrowDown', 'ArrowRight', 'ArrowRight', '='), '=A3*B3'),
      'Enter',
    );
    expect(s.cells[2][2]).toBe('=A3*B3');
    s = press(s, 'ArrowUp', 'F2');
    expect(s.editing?.value).toBe('=A3*B3');
  });

  it('like Excel, a saved formula is in capitals (so copying moves it), except text in quotes', () => {
    let s = press(
      typeInCell(press(sheet(), 'ArrowDown', 'ArrowRight', 'ArrowRight', '='), '=if(a2>1,"Met","below")'),
      'Enter',
    );
    expect(s.cells[1][2]).toBe('=IF(A2>1,"Met","below")');
    s = press(s, 'ArrowUp', shift('ArrowDown'), ctrl('d'));
    expect(s.cells[2][2]).toBe('=IF(A3>1,"Met","below")');
  });
});

describe('Paste Values, Flash Fill, Text to Columns (Aralin 9)', () => {
  // A tiny "computer": =B2&" "&A2 style joins only, enough for these tests.
  const compute = (cells: string[][]) =>
    cells.map((row) =>
      row.map((v) => {
        const m = /^=([A-Z])(\d+)&" "&([A-Z])(\d+)$/.exec(v);
        if (!m) return v;
        const get = (col: string, r: string) => cells[Number(r) - 1][col.charCodeAt(0) - 65];
        return `${get(m[1], m[2])} ${get(m[3], m[4])}`;
      }),
    );
  const names = () =>
    makeSheet(
      [
        ['Full Name', 'Last', 'First', 'Tag'],
        ['Dela Cruz, Juan Paolo', '', '', ''],
        ['Santos, Maria', '', '', ''],
        ['Reyes, Ana Liza', '', '', ''],
      ],
      8,
      4,
      { formatting: true, compute },
    );

  it('Flash Fill (Ctrl+E) learns from one typed example and fills the rest of the column', () => {
    let s = press(names(), 'ArrowDown', 'ArrowRight', 'D');
    s = press(typeInCell(s, 'Dela Cruz'), 'Enter', ctrl('e'));
    expect(s.cells.slice(1, 4).map((r) => r[1])).toEqual(['Dela Cruz', 'Santos', 'Reyes']);
    s = press(s, 'ArrowUp', 'ArrowRight', 'J'); // from the row below the example, back up to row 2
    s = press(typeInCell(s, 'Juan Paolo'), 'Enter', ctrl('e'));
    expect(s.cells.slice(1, 4).map((r) => r[2])).toEqual(['Juan Paolo', 'Maria', 'Ana Liza']);
    // Reordered and in capitals: "JUAN PAOLO DELA CRUZ" from "Dela Cruz, Juan Paolo".
    s = press(s, 'ArrowUp', 'ArrowRight', 'J'); // from the row below the example, back up to row 2
    s = press(typeInCell(s, 'JUAN PAOLO DELA CRUZ'), 'Enter', ctrl('e'));
    expect(s.cells[2][3]).toBe('MARIA SANTOS');
    // Undo takes the whole fill back.
    expect(press(s, ctrl('z')).cells[2][3]).toBe('');
  });

  it('Flash Fill does nothing without an example, or when no rule gives the example', () => {
    const s = press(names(), 'ArrowDown', 'ArrowRight');
    expect(press(s, ctrl('e'))).toBe(s);
    const t = press(typeInCell(press(s, 'x'), 'xyz'), 'Enter');
    expect(press(t, ctrl('e'))).toBe(t);
  });

  it('Paste Values (Ctrl+Shift+V) pastes what the formulas SHOW, at the top of the selection', () => {
    let s = names();
    s = {
      ...s,
      cells: s.cells.map((row, r) => (r >= 1 && r <= 3 ? [row[0], 'L' + r, 'F' + r, `=C${r + 1}&" "&B${r + 1}`] : row)),
    };
    s = press(
      s,
      'ArrowDown',
      'ArrowRight',
      'ArrowRight',
      'ArrowRight',
      shift('ArrowDown'),
      shift('ArrowDown'),
      ctrl('c'),
    );
    s = press(s, ctrl('v', true));
    expect(s.cells.slice(1, 4).map((r) => r[3])).toEqual(['F1 L1', 'F2 L2', 'F3 L3']);
    // A normal paste on the same selection keeps the formulas (and starts at the top, D2).
    const t = press(s, ctrl('z'), ctrl('v'));
    expect(t.cells[1][3]).toBe('=C2&" "&B2');
  });

  it('Conditional Formatting colors duplicates (any capitals) and blanks in its range; Ctrl+Z takes it back', () => {
    const base = makeSheet(
      [
        ['Ref', 'Name'],
        ['CR-1', 'Ana'],
        ['cr-1', ''],
        ['CR-2', 'Ben'],
      ],
      6,
      2,
    );
    let s = press(base, 'ArrowDown', shift('ArrowDown'), shift('ArrowDown'));
    s = runCommand(s, { kind: 'condFormat', rule: 'duplicates' });
    expect([...highlightedCells(s)].sort()).toEqual(['1,0', '2,0']);
    s = runCommand(press(s, 'ArrowRight'), { kind: 'condFormat', rule: 'blanks' });
    expect(highlightedCells(s).has('2,1')).toBe(false); // only B4 was selected
    s = press(s, ctrl('z'));
    expect(s.condRules).toHaveLength(1);
    s = runCommand(s, { kind: 'clearRules' });
    expect(highlightedCells(s).size).toBe(0);
  });

  it('Data Validation: a dropdown list; other values are refused with a message, the list spelling is kept', () => {
    let s = press(names(), 'ArrowDown', 'ArrowRight', shift('ArrowDown'));
    s = runCommand(s, { kind: 'validation', list: [' Paid ', 'Unpaid', ''] });
    expect(listFor(s, { r: 1, c: 1 })).toEqual(['Paid', 'Unpaid']);
    expect(listFor(s, { r: 3, c: 1 })).toBeNull();
    let t = press(s, 'x');
    t = press(typeInCell(t, 'Bayad'), 'Enter');
    expect(t.editing?.value).toBe('Bayad');
    expect(t.alert?.tl).toMatch(/Hindi puwede/);
    t = press(t, 'Escape');
    expect(t.alert).toBeNull();
    t = press(typeInCell(press(t, 'u'), 'UNPAID'), 'Enter');
    expect(t.cells[2][1]).toBe('Unpaid');
    expect(runCommand(s, { kind: 'pick', value: 'Paid' }).cells[2][1]).toBe('Paid');
    expect(runCommand(s, { kind: 'pick', value: 'Maybe' })).toBe(s);
  });

  it('Text to Columns splits the selection at the delimiter into the Destination (spaces stay, like Excel)', () => {
    let s = press(names(), 'ArrowDown', shift('ArrowDown'), shift('ArrowDown'));
    s = runCommand(s, { kind: 'textToColumns', delimiter: ',', dest: { r: 1, c: 1 } });
    expect(s.cells.slice(1, 4).map((r) => [r[0], r[1], r[2]])).toEqual([
      ['Dela Cruz, Juan Paolo', 'Dela Cruz', ' Juan Paolo'],
      ['Santos, Maria', 'Santos', ' Maria'],
      ['Reyes, Ana Liza', 'Reyes', ' Ana Liza'],
    ]);
    // Excel's default Destination is the first selected cell: the original is replaced.
    const t = runCommand(press(names(), 'ArrowDown'), { kind: 'textToColumns', delimiter: ',', dest: { r: 1, c: 0 } });
    expect(t.cells[1].slice(0, 2)).toEqual(['Dela Cruz', ' Juan Paolo']);
    expect(parseCellName('=$B$2')).toEqual({ r: 1, c: 1 });
    expect(parseCellName('b12')).toEqual({ r: 11, c: 1 });
    expect(parseCellName('hello')).toBeNull();
  });
});

describe('rows and columns: insert, delete, hide, freeze (Aralin 12)', () => {
  it('adjustRefs moves references like Excel when rows or columns are inserted or deleted', () => {
    // Row 5 (index 4) inserted:
    expect(adjustRefs('=SUM(E2:E9)', 'row', 4, 1)).toBe('=SUM(E2:E10)');
    expect(adjustRefs('=E5+E4+$E$9', 'row', 4, 1)).toBe('=E6+E4+$E$10');
    expect(adjustRefs('=IF(E5>0,"E5","")', 'row', 4, 1)).toBe('=IF(E6>0,"E5","")');
    // Row 5 deleted:
    expect(adjustRefs('=SUM(E2:E9)', 'row', 4, -1)).toBe('=SUM(E2:E8)');
    expect(adjustRefs('=E5*2', 'row', 4, -1)).toBe('=#REF!*2');
    expect(adjustRefs('=SUM(E5:E6)', 'row', 4, -2)).toBe('=SUM(#REF!)');
    expect(adjustRefs('=SUM(E5:E9)', 'row', 4, -1)).toBe('=SUM(E5:E8)');
    // Columns: C (index 2) deleted; E (index 4) inserted.
    expect(adjustRefs('=SUM(E2:J2)', 'col', 2, -1)).toBe('=SUM(D2:I2)');
    expect(adjustRefs('=SUM(E2:J2)', 'col', 4, 1)).toBe('=SUM(F2:K2)');
    expect(adjustRefs('=C2&D2', 'col', 2, -1)).toBe('=#REF!&C2');
  });

  const table = () =>
    makeSheet(
      [
        ['Name', 'Code', 'Qty'],
        ['Ana', 'x', '2'],
        ['Ben', 'y', '3'],
        ['Total', '', '=SUM(C2:C3)'],
      ],
      6,
      3,
      { formatting: true, formats: { '2,2': { bold: true } }, colWidths: ['w-40', 'w-20', 'w-24'] },
    );

  it('Shift+Space then Ctrl + + inserts a row above; formulas and formats move; Ctrl+Z undoes', () => {
    let s = press(table(), 'ArrowDown', 'ArrowDown', shift(' '));
    expect(selectionRange(s)).toEqual({ top: 2, bottom: 2, left: 0, right: 2 });
    expect(at(s)).toBe('A3'); // the active cell stays
    s = press(s, { key: '+', ctrl: true, shift: true });
    expect(s.cells.map((r) => r[0])).toEqual(['Name', 'Ana', '', 'Ben', 'Total', '', '']);
    expect(s.cells[4][2]).toBe('=SUM(C2:C4)');
    expect(formatOf(s, { r: 3, c: 2 }).bold).toBe(true);
    expect(press(s, ctrl('z')).cells[3][2]).toBe('=SUM(C2:C3)');
  });

  it('Ctrl + - deletes the whole row; without a whole row or column it only reminds', () => {
    const s = press(table(), 'ArrowDown', shift(' '), ctrl('-'));
    expect(s.cells.map((r) => r[0]).slice(0, 3)).toEqual(['Name', 'Ben', 'Total']);
    expect(s.cells[2][2]).toBe('=SUM(C2:C2)');
    expect(s.cells).toHaveLength(6);
    const t = press(table(), 'ArrowDown', ctrl('-'));
    expect(t.cells).toEqual(table().cells);
    expect(t.alert?.en).toMatch(/Shift \+ Space/);
  });

  it('Ctrl+Space then Ctrl + + / Ctrl + - on columns; the widths move along', () => {
    let s = press(table(), 'ArrowRight', ctrl(' '), { key: '+', ctrl: true, shift: true });
    expect(s.cells[0]).toEqual(['Name', '', 'Code', 'Qty']);
    expect(s.cells[3][3]).toBe('=SUM(D2:D3)');
    expect(s.colWidths).toEqual(['w-40', 'w-20', 'w-20', 'w-24']);
    s = press(s, 'ArrowRight', ctrl(' '), ctrl('-')); // delete Code (now C)
    expect(s.cells[0]).toEqual(['Name', '', 'Qty', '']);
    expect(s.cells[3][2]).toBe('=SUM(C2:C3)');
  });

  it('Ctrl+0 hides a column (the cursor moves on, arrows skip it); Ctrl+Shift+0 shows it; Freeze Panes', () => {
    let s = press(table(), 'ArrowRight', ctrl('0'));
    expect(s.hiddenCols).toEqual([1]);
    expect(at(s)).toBe('C1');
    s = press(s, 'ArrowLeft');
    expect(at(s)).toBe('A1');
    expect(press(s, ctrl('z')).hiddenCols).toEqual([]);
    s = press(s, shift('ArrowRight'), shift('ArrowRight'), { key: ')', ctrl: true, shift: true });
    expect(s.hiddenCols).toEqual([]);
    expect(runCommand(s, { kind: 'freeze', rows: 1, cols: 1 }).freeze).toEqual({ rows: 1, cols: 1 });
    expect(table().freeze).toEqual({ rows: 1, cols: 0 }); // the header row, as before
  });
});
