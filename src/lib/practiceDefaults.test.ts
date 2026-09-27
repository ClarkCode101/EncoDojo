import { describe, expect, it } from 'vitest';
import { startingDuration } from './practiceDefaults';

describe('startingDuration', () => {
  const choices = [30, 60] as const;
  it('uses the page default when nothing is chosen', () => {
    expect(startingDuration(choices, 60, undefined)).toBe(60);
  });
  it('short = first choice, long = last choice', () => {
    expect(startingDuration(choices, 60, 'short')).toBe(30);
    expect(startingDuration([180, 300], 180, 'long')).toBe(300);
  });
});
