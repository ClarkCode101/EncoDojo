import { describe, expect, it } from 'vitest';
import { makeRng } from '../../lib/random';
import type { Session, SessionMistake } from '../../lib/storage';
import {
  buildDrillPassage,
  collectMistakes,
  fieldCounts,
  kindCounts,
  topMissedChars,
  uniqueRecent,
  type DatedMistake,
} from './analyze';

function session(type: Session['type'], startedAt: string, mistakes: SessionMistake[]): Session {
  return { id: startedAt + type, type, startedAt, durationSec: 60, metrics: {}, mistakes };
}

describe('collectMistakes', () => {
  const sessions = [
    session('typing', '2026-09-20T08:00:00.000Z', [{ expected: 'a', typed: 's', index: 1 }]),
    session('numpad', '2026-09-24T08:00:00.000Z', [{ expected: '123', typed: '124', index: 1 }]),
    session('assessment', '2026-09-25T08:00:00.000Z', [
      { expected: 'e', typed: 'r', index: 4, section: 'typing' },
      { expected: 'Brgy.', typed: 'Brgy', index: 1, section: 'copy', field: 'address' },
    ]),
  ];

  it('groups mistakes by skill, including assessment parts, newest first', () => {
    const c = collectMistakes(sessions);
    expect(c.typing.map((m) => m.expected)).toEqual(['e', 'a']);
    expect(c.numpad.map((m) => m.expected)).toEqual(['123']);
    expect(c.copy.map((m) => m.field)).toEqual(['address']);
  });

  it('can keep only recent sessions', () => {
    const c = collectMistakes(sessions, new Date('2026-09-23T00:00:00.000Z'));
    expect(c.typing.map((m) => m.expected)).toEqual(['e']);
    expect(c.numpad).toHaveLength(1);
  });
});

describe('topMissedChars', () => {
  const m = (expected: string, typed: string): SessionMistake => ({ expected, typed, index: 0 });

  it('counts wrong and skipped characters, with what was usually typed instead', () => {
    const rows = topMissedChars([m(',', '.'), m(',', '.'), m(',', ''), m('b', 'v'), m('', 'x')]);
    expect(rows).toEqual([
      { char: ',', count: 3, usuallyTyped: '.' },
      { char: 'b', count: 1, usuallyTyped: 'v' },
    ]);
  });

  it('respects the limit', () => {
    const many = 'abcdefghij'.split('').map((c) => m(c, 'x'));
    expect(topMissedChars(many, 3)).toHaveLength(3);
  });
});

describe('kindCounts / fieldCounts', () => {
  it('counts each kind of typing mistake', () => {
    const list: SessionMistake[] = [
      { expected: 'a', typed: 's', index: 0 },
      { expected: '', typed: ' ', index: 1 },
      { expected: 'b', typed: '', index: 2 },
      { expected: 'c', typed: 'v', index: 3 },
    ];
    expect(kindCounts(list)).toEqual({ wrong: 2, extra: 1, skipped: 1 });
  });

  it('counts wrong Copy Test fields, most first', () => {
    const list: SessionMistake[] = ['address', 'name', 'address'].map((field, i) => ({ expected: 'x', typed: 'y', index: i, field }));
    expect(fieldCounts(list)).toEqual([
      { field: 'address', count: 2 },
      { field: 'name', count: 1 },
    ]);
  });
});

describe('uniqueRecent', () => {
  it('keeps each correct value once, newest first, up to the limit', () => {
    const d = (expected: string, at: string, field?: string): DatedMistake => ({ expected, typed: 'x', index: 0, at, field });
    const list = [d('111', '3'), d('222', '2'), d('111', '1'), d('333', '1')];
    expect(uniqueRecent(list).map((m) => m.expected)).toEqual(['111', '222', '333']);
    expect(uniqueRecent(list, 2)).toHaveLength(2);
  });

  it('treats the same text in different fields as different items', () => {
    const d = (field: string): DatedMistake => ({ expected: 'San Jose', typed: 'x', index: 0, at: '1', field });
    expect(uniqueRecent([d('name'), d('address')])).toHaveLength(2);
  });
});

describe('buildDrillPassage', () => {
  it('uses words that contain the problem characters', () => {
    const text = buildDrillPassage(makeRng(1), ['b', 'v'], 300);
    expect(text.length).toBeGreaterThanOrEqual(300);
    for (const word of text.split(' ')) expect(/[bv]/.test(word)).toBe(true);
  });

  it('uses plain office words only (no digits), like the Typing Practice', () => {
    expect(buildDrillPassage(makeRng(2), [',', 'e', 'a'], 600)).not.toMatch(/[0-9]/);
  });

  it('returns an empty drill when only spaces were missed', () => {
    expect(buildDrillPassage(makeRng(1), [' '], 300)).toBe('');
  });

  it('is the same for the same seed', () => {
    expect(buildDrillPassage(makeRng(5), [','], 200)).toBe(buildDrillPassage(makeRng(5), [','], 200));
  });
});
