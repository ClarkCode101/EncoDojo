/**
 * Checks the WPM numbers against hand-calculated answers.
 *   Gross WPM = typed chars / 5 / minutes
 *   Net WPM   = Gross WPM - mistakes / minutes
 */
import { describe, expect, it } from 'vitest';
import { display } from '../../lib/scoring';
import { scoreTyping } from './scoreTyping';

const passage = 'Please check every record before the end of the shift. '.repeat(20);
const perfectKeys = (n: number) => ({ total: n, wrong: 0 });

/** Replace the characters at the given positions with '#'. */
function withWrongKeys(text: string, positions: number[]): string {
  const chars = [...text];
  for (const i of positions) chars[i] = '#';
  return chars.join('');
}

function rounded(typed: string, seconds: number, keys = perfectKeys(typed.length)) {
  const { metrics } = scoreTyping(passage, typed, seconds, keys);
  return { gross: display(metrics.grossWpm), net: display(metrics.netWpm), accuracy: display(metrics.accuracy) };
}

describe('scoreTyping (hand-checked WPM)', () => {
  it('300 perfect chars in 1 min = 60 / 60 / 100%', () => {
    expect(rounded(passage.slice(0, 300), 60)).toEqual({ gross: 60, net: 60, accuracy: 100 });
  });

  it('250 chars with 5 wrong keys in 1 min = 50 / 45 / 98%', () => {
    const typed = withWrongKeys(passage.slice(0, 250), [20, 60, 100, 150, 200]);
    expect(rounded(typed, 60)).toEqual({ gross: 50, net: 45, accuracy: 98 });
  });

  it('150 chars with 3 wrong keys in 30 sec = 60 / 54 / 98%', () => {
    // 150/5 = 30 words in 0.5 min = 60 gross; 3 errors / 0.5 min = 6 -> net 54
    const typed = withWrongKeys(passage.slice(0, 150), [10, 70, 130]);
    expect(rounded(typed, 30)).toEqual({ gross: 60, net: 54, accuracy: 98 });
  });

  it('a skipped letter and an extra space each cost 1 WPM over 1 minute', () => {
    const sp = passage.indexOf(' ', 120);
    const typed = (passage.slice(0, 50) + passage.slice(51, sp + 1) + ' ' + passage.slice(sp + 1)).slice(0, 250);
    expect(rounded(typed, 60)).toEqual({ gross: 50, net: 48, accuracy: 99 });
  });

  it('net WPM never goes below 0', () => {
    expect(rounded('#'.repeat(50), 60).net).toBe(0);
  });

  it('keystroke accuracy counts mistakes fixed with Backspace', () => {
    const { metrics } = scoreTyping(passage, passage.slice(0, 100), 60, { total: 104, wrong: 4 });
    expect(display(metrics.accuracy)).toBe(100);
    expect(display(metrics.keystrokeAccuracy)).toBe(96);
  });
});
