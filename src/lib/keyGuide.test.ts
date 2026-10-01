import { describe, expect, it } from 'vitest';
import { KEY_ROWS, NUMPAD_FINGER, fingerName, keyFor, nextNumpadKey } from './keyGuide';

describe('keyboard guide', () => {
  it('letters, digits and space: the key and the finger', () => {
    expect(keyFor('j')).toEqual({ key: 'J', shift: null, finger: 'rIndex' });
    expect(keyFor('a')).toEqual({ key: 'A', shift: null, finger: 'lPinky' });
    expect(keyFor('5')).toEqual({ key: '5', shift: null, finger: 'lIndex' });
    expect(keyFor(' ')).toEqual({ key: 'Space', shift: null, finger: 'thumb' });
  });

  it('capitals and symbols need the Shift of the other hand', () => {
    expect(keyFor('J')).toEqual({ key: 'J', shift: 'Shift', finger: 'rIndex' }); // right-hand key: left Shift
    expect(keyFor('A')).toEqual({ key: 'A', shift: 'Shift ', finger: 'lPinky' }); // left-hand key: right Shift
    expect(keyFor('?')).toEqual({ key: '/', shift: 'Shift', finger: 'rPinky' });
    expect(keyFor('#')?.key).toBe('3');
  });

  it('every character of an office text has a key that is on the keyboard', () => {
    const onBoard = new Set(KEY_ROWS.flat());
    for (const c of 'Please send the 3 invoices (PHP 1,250.75) to Ma. Cruz-Reyes, Brgy. San Jose; thanks! #45 "OK"') {
      const k = keyFor(c);
      expect(k, c).not.toBeNull();
      expect(onBoard.has(k!.key), c).toBe(true);
      if (k!.shift) expect(onBoard.has(k!.shift)).toBe(true);
    }
    expect(keyFor('₱')).toBeNull();
  });

  it('numpad: the next key of an entry typed without commas', () => {
    expect(nextNumpadKey('12,450.75', '')).toBe('1');
    expect(nextNumpadKey('12,450.75', '1245')).toBe('0');
    expect(nextNumpadKey('12,450.75', '12450.75')).toBe('Enter');
    expect(nextNumpadKey('12,450.75', '13')).toBe('Backspace');
    for (const k of ['0', '1', '5', '9', '.', 'Enter', 'Backspace']) expect(NUMPAD_FINGER[k]).toBeDefined();
  });

  it('finger names in both languages', () => {
    expect(fingerName('rIndex')).toBe('kanang hintuturo');
    expect(fingerName('rIndex', 'en')).toBe('right index finger');
  });
});
