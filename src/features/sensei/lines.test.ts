import { describe, expect, it } from 'vitest';
import type { Session } from '../../lib/storage';
import { CHEERS, TIPS, WELCOME, personalLines, placeFromPath, senseiLine } from './lines';

const typing = (ago = 0): Session => ({
  id: `t${ago}`,
  type: 'typing',
  startedAt: new Date(Date.now() - ago).toISOString(),
  durationSec: 60,
  metrics: { netWpm: 30, accuracy: 98 },
  mistakes: [],
});

/** rand that returns the given numbers in order (then repeats the last). */
const seq = (...values: number[]) => {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
};

describe('placeFromPath', () => {
  it('maps routes to places; anything else is home', () => {
    expect(placeFromPath('/typing')).toBe('typing');
    expect(placeFromPath('/encoding')).toBe('encoding');
    expect(placeFromPath('/')).toBe('home');
    expect(placeFromPath('/unknown')).toBe('home');
  });
});

describe('senseiLine', () => {
  it('welcomes a brand-new user on Home', () => {
    expect(senseiLine({ place: 'home', sessions: [] }, seq(0.9))).toBe(WELCOME);
  });

  it('gives a tip for the page you are on', () => {
    const line = senseiLine({ place: 'numpad', sessions: [] }, seq(0.1, 0));
    expect(TIPS.numpad).toContain(line);
  });

  it('sometimes a cheer instead', () => {
    const line = senseiLine({ place: 'numpad', sessions: [] }, seq(0.9, 0));
    expect(CHEERS).toContain(line);
  });

  it('after a practice with nothing saved: a cheer, not a tip', () => {
    expect(CHEERS).toContain(senseiLine({ place: 'typing', sessions: [], afterPractice: true }, seq(0.1, 0)));
  });

  it('after a practice: talks about your results', () => {
    const line = senseiLine({ place: 'typing', sessions: [typing()], afterPractice: true }, seq(0.1, 0));
    expect(line).toMatch(/^Susunod, subukan ang Numpad Practice/);
  });
});

describe('personalLines', () => {
  it('none for a new user', () => {
    expect(personalLines([])).toEqual([]);
  });

  it('mentions the streak from 2 days in a row', () => {
    const lines = personalLines([typing(0), typing(24 * 3600 * 1000)]);
    expect(lines.some((l) => /2 araw ka nang sunod-sunod/.test(l))).toBe(true);
  });
});
