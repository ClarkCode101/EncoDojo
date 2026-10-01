import { describe, expect, it } from 'vitest';
import type { Session } from '../../lib/storage';
import {
  BACKUP_LINE,
  BACKUP_LINE_EN,
  CHEERS,
  CHEERS_EN,
  TIPS,
  TIPS_EN,
  WELCOME,
  WELCOME_EN,
  personalLines,
  placeFromPath,
  senseiLine,
} from './lines';

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

describe('reminders from Settings', () => {
  const five = [0, 1, 2, 3, 4].map((i) => typing(i * 1000));

  it('reminds about the backup on Home when there is none', () => {
    expect(senseiLine({ place: 'home', sessions: five }, seq(0.1))).toBe(BACKUP_LINE);
    // Not after a practice, and not on practice pages.
    expect(senseiLine({ place: 'typing', sessions: five }, seq(0.1))).not.toBe(BACKUP_LINE);
    // Not when the last backup is recent.
    const recent = { lastBackupAt: new Date().toISOString() };
    expect(senseiLine({ place: 'home', sessions: five, settings: recent }, seq(0.1))).not.toBe(BACKUP_LINE);
  });
});

describe('Sensei in English', () => {
  const five = [0, 1, 2, 3, 4].map((i) => typing(i * 1000));

  it('every page has as many English tips as Taglish ones', () => {
    for (const place of Object.keys(TIPS) as (keyof typeof TIPS)[]) {
      expect(TIPS_EN[place].length, place).toBe(TIPS[place].length);
    }
    expect(CHEERS_EN.length).toBe(CHEERS.length);
  });

  it('speaks English when English is chosen', () => {
    expect(senseiLine({ place: 'home', sessions: [], lang: 'en' }, seq(0.9))).toBe(WELCOME_EN);
    expect(TIPS_EN.numpad).toContain(senseiLine({ place: 'numpad', sessions: [], lang: 'en' }, seq(0.1, 0)));
    expect(CHEERS_EN).toContain(senseiLine({ place: 'numpad', sessions: [], lang: 'en' }, seq(0.9, 0)));
    expect(senseiLine({ place: 'home', sessions: five, lang: 'en' }, seq(0.1))).toBe(BACKUP_LINE_EN);
    expect(senseiLine({ place: 'typing', sessions: [typing()], afterPractice: true, lang: 'en' }, seq(0.1, 0))).toMatch(
      /^Next, try Numpad Practice/,
    );
  });

  it('the lines about your results are English too', () => {
    const lines = personalLines([typing(0), typing(24 * 3600 * 1000)], new Date(), 'en');
    expect(lines[0]).toMatch(/^Next, try Numpad Practice/);
    expect(lines.some((l) => /practiced 2 days in a row/.test(l))).toBe(true);
  });
});
