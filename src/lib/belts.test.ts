import { describe, expect, it } from 'vitest';
import { beltStatus } from './belts';
import type { Session } from './storage';

let n = 0;
function assessment(met: number, total = 8, startedAt = '2026-09-26T08:00:00.000Z'): Session {
  n += 1;
  return {
    id: `a${n}`,
    type: 'assessment',
    startedAt,
    durationSec: 420,
    metrics: { targetsMet: met, targetsTotal: total, jobReady: met === total ? 1 : 0 },
    mistakes: [],
  };
}

describe('beltStatus', () => {
  it('no assessment yet: White Belt, next is Yellow', () => {
    const s = beltStatus([]);
    expect(s.belt.rank).toBe('white');
    expect(s.next?.rank).toBe('yellow');
    expect(s.best).toBeNull();
    expect(s.progress).toBe(0);
    expect(s.nextHint).toMatch(/Gawin ang Assessment at pumasa sa 2 sa 8/);
  });

  it('ignores practice sessions', () => {
    const typing: Session = { ...assessment(8), type: 'typing' };
    expect(beltStatus([typing]).belt.rank).toBe('white');
  });

  it.each([
    [1, 'white'],
    [2, 'yellow'],
    [3, 'yellow'],
    [4, 'orange'],
    [6, 'green'],
    [7, 'green'],
    [8, 'blue'],
  ])('%i of 8 targets -> %s', (met, rank) => {
    expect(beltStatus([assessment(met)]).belt.rank).toBe(rank);
  });

  it('uses the BEST assessment, so a worse one later never takes the belt away', () => {
    const s = beltStatus([assessment(6), assessment(1)]);
    expect(s.belt.rank).toBe('green');
    expect(s.best).toEqual({ met: 6, total: 8 });
  });

  it('works with older assessments that had 4 or 6 targets (percentages)', () => {
    expect(beltStatus([assessment(3, 6)]).belt.rank).toBe('orange'); // 50%
    expect(beltStatus([assessment(3, 4)]).belt.rank).toBe('green'); // 75%
  });

  it('progress and hint toward the next belt', () => {
    const s = beltStatus([assessment(3)]); // Yellow, next Orange needs 4 of 8
    expect(s.next?.rank).toBe('orange');
    expect(s.progress).toBeCloseTo(0.75);
    expect(s.nextHint).toMatch(/Pumasa sa 4 sa 8 target/);
  });

  it('Black Belt needs Job-ready on 3 DIFFERENT days', () => {
    const sameDay = [assessment(8), assessment(8, 8, '2026-09-26T09:00:00.000Z'), assessment(8, 8, '2026-09-26T10:00:00.000Z')];
    const s1 = beltStatus(sameDay);
    expect(s1.belt.rank).toBe('blue');
    expect(s1.jobReadyDays).toBe(1);
    expect(s1.nextHint).toMatch(/2 pang ibang araw/);

    const threeDays = [
      assessment(8, 8, '2026-09-20T08:00:00.000Z'),
      assessment(8, 8, '2026-09-23T08:00:00.000Z'),
      assessment(8, 8, '2026-09-26T08:00:00.000Z'),
    ];
    const s2 = beltStatus(threeDays);
    expect(s2.belt.rank).toBe('black');
    expect(s2.next).toBeNull();
    expect(s2.progress).toBe(1);
  });
});
