import { describe, expect, it } from 'vitest';
import { alignTyping } from './alignTyping';

describe('alignTyping', () => {
  it('handles nothing typed yet', () => {
    const a = alignTyping('the cat', '');
    expect(a).toMatchObject({ cursor: 0, errors: 0, correctChars: 0, mistakes: [] });
  });

  it('counts a perfect match', () => {
    const a = alignTyping('the cat sat', 'the cat');
    expect(a).toMatchObject({ cursor: 7, errors: 0, correctChars: 7 });
    expect(a.statuses.every((s) => s === 'correct')).toBe(true);
  });

  it('counts a wrong key as 1 mistake', () => {
    const a = alignTyping('the cat', 'the cot');
    expect(a.errors).toBe(1);
    expect(a.statuses[5]).toBe('wrong');
    expect(a.mistakes).toEqual([{ expected: 'a', typed: 'o', index: 5 }]);
  });

  it('counts a double space as 1 extra key, the rest stays correct', () => {
    const a = alignTyping('the cat sat', 'the  cat sat');
    expect(a).toMatchObject({ cursor: 11, errors: 1, correctChars: 11 });
    // Either space could be "the extra one"; the first is picked.
    expect(a.mistakes).toEqual([{ expected: '', typed: ' ', index: 3 }]);
    expect(a.extrasBefore[3]).toBe(1);
  });

  it('counts a space inside a word as 1 extra key', () => {
    const a = alignTyping('with the dog', 'wi th the dog');
    expect(a).toMatchObject({ cursor: 12, errors: 1, correctChars: 12 });
    expect(a.mistakes).toEqual([{ expected: '', typed: ' ', index: 2 }]);
  });

  it('counts a skipped letter as 1 mistake', () => {
    const a = alignTyping('with the', 'wth the');
    expect(a).toMatchObject({ cursor: 8, errors: 1, correctChars: 7 });
    expect(a.statuses[1]).toBe('skipped');
    expect(a.mistakes).toEqual([{ expected: 'i', typed: '', index: 1 }]);
  });

  it('counts an extra letter as 1 mistake', () => {
    const a = alignTyping('with the', 'withh the');
    expect(a).toMatchObject({ cursor: 8, errors: 1, correctChars: 8 });
  });

  it('does not punish a word that is still being typed', () => {
    const a = alignTyping('with the', 'wi');
    expect(a).toMatchObject({ cursor: 2, errors: 0 });
  });

  it('counts every character when all are wrong', () => {
    const a = alignTyping('abc', 'xyz');
    expect(a).toMatchObject({ errors: 3, correctChars: 0, cursor: 3 });
  });

  it('keeps one early slip from spoiling a long passage', () => {
    const passage = 'Please check every record before the end of the shift. '.repeat(10);
    const typed = 'Plase' + passage.slice(6, 400); // skipped the first "e"
    const a = alignTyping(passage, typed);
    expect(a.errors).toBe(1);
    expect(a.cursor).toBe(400);
  });

  it('lists mistakes in passage order', () => {
    const a = alignTyping('the cat sat', 'thx  cat sat');
    expect(a.errors).toBe(2);
    const positions = a.mistakes.map((m) => m.index);
    expect(positions).toEqual([...positions].sort((x, y) => x - y));
  });
});
