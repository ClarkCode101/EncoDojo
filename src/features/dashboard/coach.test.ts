import { describe, expect, it } from 'vitest';
import type { Session } from '../../lib/storage';
import { MIXED_DIFFICULTY, NUMPAD_MODES } from '../numpad/entries';
import { nextFocus, practicedToday } from './coach';

let id = 0;
function s(type: Session['type'], metrics: Record<string, number>, startedAt = '2026-09-27T02:00:00.000Z'): Session {
  id += 1;
  return { id: `s${id}`, type, startedAt, durationSec: 60, metrics, mistakes: [] };
}

const goodTyping = () => s('typing', { netWpm: 45, accuracy: 97 });
const goodNumpad = () => s('numpad', { kph: 9000, entryAccuracy: 98, difficulty: MIXED_DIFFICULTY });
const goodCopy = () => s('copy', { kph: 9000, fieldAccuracy: 100, records: 4 });
const goodEncoding = () => s('encoding', { kph: 7000, fieldAccuracy: 100, documents: 3 });

describe('nextFocus', () => {
  it('no sessions yet: start with Typing Practice', () => {
    expect(nextFocus([])).toMatchObject({ skill: 'typing', to: '/typing', reason: 'Dito magsimula.' });
  });

  it('suggests the first practice not tried yet, in the Home order', () => {
    expect(nextFocus([goodTyping()])).toMatchObject({ skill: 'numpad', reason: 'Hindi mo pa ito nasusubukan.' });
    expect(nextFocus([goodTyping(), goodNumpad()]).skill).toBe('copy');
  });

  it('beginner-only numpad: suggests trying Halo-halo', () => {
    const beginner = s('numpad', { kph: 12000, entryAccuracy: 100, difficulty: NUMPAD_MODES.beginner.difficulty });
    expect(nextFocus([goodTyping(), beginner])).toMatchObject({ skill: 'numpad', reason: expect.stringMatching(/Halo-halo/) });
  });

  it('a Copy Test with nothing finished does not count as tried', () => {
    const empty = s('copy', { kph: 0, fieldAccuracy: 100, records: 0 });
    expect(nextFocus([goodTyping(), goodNumpad(), empty]).skill).toBe('copy');
  });

  it('all tried: the one furthest below its target, with the weaker number', () => {
    const weakCopy = s('copy', { kph: 8500, fieldAccuracy: 70, records: 3 });
    const f = nextFocus([goodTyping(), goodNumpad(), weakCopy, goodEncoding()]);
    expect(f).toMatchObject({ skill: 'copy', reason: '70% pa lang ang tamang field (target: 95%).' });
  });

  it('speed reason when speed is the weaker part', () => {
    const slowTyping = s('typing', { netWpm: 30, accuracy: 98 });
    const f = nextFocus([slowTyping, goodNumpad(), goodCopy(), goodEncoding()]);
    expect(f).toMatchObject({ skill: 'typing', reason: '30 WPM pa lang (target: 40).' });
  });

  it('uses the LATEST result of each practice', () => {
    const oldBad = s('typing', { netWpm: 20, accuracy: 80 }, '2026-09-20T02:00:00.000Z');
    const f = nextFocus([oldBad, goodTyping(), goodNumpad(), goodCopy(), goodEncoding()]);
    expect(f.skill).toBe('assessment');
  });

  it('everything at target: the Assessment', () => {
    expect(nextFocus([goodTyping(), goodNumpad(), goodCopy(), goodEncoding()])).toMatchObject({ skill: 'assessment', to: '/assessment' });
  });
});

describe('practicedToday', () => {
  it('only today (local day) and only practice, not the Assessment', () => {
    const today = new Date(2026, 8, 27, 15, 0);
    const done = practicedToday(
      [
        s('typing', {}, new Date(2026, 8, 27, 9, 0).toISOString()),
        s('copy', {}, new Date(2026, 8, 26, 23, 30).toISOString()), // yesterday
        s('assessment', {}, new Date(2026, 8, 27, 10, 0).toISOString()),
      ],
      today,
    );
    expect([...done]).toEqual(['typing']);
  });
});
