import { describe, expect, it } from 'vitest';
import { isExtraSpace, typingStats } from './typingInput';

const passage = 'the cat sat';

describe('isExtraSpace', () => {
  it('catches a second space where the passage has a letter', () => {
    // typed "the " and now pressed space again; passage expects "c"
    expect(isExtraSpace(passage, 'the ', 'the  ')).toBe(true);
  });

  it('allows a normal single space', () => {
    expect(isExtraSpace(passage, 'the', 'the ')).toBe(false);
  });

  it('allows a space when the passage really has a space there', () => {
    // passage "a  b" has two spaces, so the second one is correct
    expect(isExtraSpace('a  b', 'a ', 'a  ')).toBe(false);
  });

  it('ignores letters and backspaces', () => {
    expect(isExtraSpace(passage, 'the ', 'the c')).toBe(false);
    expect(isExtraSpace(passage, 'the ', 'the')).toBe(false);
  });

  it('only applies when the space is added at the end', () => {
    expect(isExtraSpace(passage, 'the c', 'the  c')).toBe(false);
  });
});

describe('typingStats', () => {
  it('counts an extra space as one mistake without shifting the next letters', () => {
    // user typed "the  cat" but the extra space was swallowed, so typed is "the cat"
    const stats = typingStats(passage, 'the cat', [4]);
    expect(stats.correctChars).toBe(7);
    expect(stats.errors).toBe(1);
    expect(stats.typedChars).toBe(8);
    expect(stats.mistakes).toEqual([{ expected: '', typed: ' ', index: 4 }]);
  });

  it('matches plain comparison when there are no extra spaces', () => {
    const stats = typingStats(passage, 'the cot', []);
    expect(stats.errors).toBe(1);
    expect(stats.typedChars).toBe(7);
    expect(stats.mistakes).toEqual([{ expected: 'a', typed: 'o', index: 5 }]);
  });

  it('lists mistakes in passage order', () => {
    const stats = typingStats(passage, 'thx cat', [4]);
    expect(stats.mistakes.map((m) => m.index)).toEqual([2, 4]);
  });
});
