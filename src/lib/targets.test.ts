import { describe, expect, it } from 'vitest';
import { JOB_READY_NUMPAD, KPH_LEVELS, kphLevel } from './targets';

describe('KPH_LEVELS', () => {
  it('starts at the job-ready minimum and goes up', () => {
    expect(KPH_LEVELS[0].min).toBe(JOB_READY_NUMPAD.kph);
    const mins = KPH_LEVELS.map((l) => l.min);
    expect(mins).toEqual([...mins].sort((a, b) => a - b));
  });
});

describe('kphLevel', () => {
  it('below the minimum: no level yet, next is "Pasado"', () => {
    const { reached, next } = kphLevel(7400);
    expect(reached).toBeNull();
    expect(next?.min).toBe(8000);
  });

  it('exactly at a level counts as reaching it', () => {
    expect(kphLevel(8000).reached?.min).toBe(8000);
    expect(kphLevel(10000).reached?.min).toBe(10000);
  });

  it('uses the rounded score, like the screen (7,999.6 shows as 8,000)', () => {
    expect(kphLevel(7999.6).reached?.min).toBe(8000);
  });

  it('between levels: reached the lower one, next is the higher one', () => {
    const { reached, next } = kphLevel(10500);
    expect(reached?.min).toBe(10000);
    expect(next?.min).toBe(12000);
  });

  it('top level: nothing next', () => {
    const { reached, next } = kphLevel(15000);
    expect(reached?.min).toBe(12000);
    expect(next).toBeNull();
  });
});
