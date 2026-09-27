import { describe, expect, it } from 'vitest';
import {
  cellName,
  colLetter,
  ctrlJump,
  lastUsed,
  makeSheet,
  pressKey,
  selectionName,
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
