import { describe, expect, it } from 'vitest';
import type { Session } from '../../lib/storage';
import { MIXED_DIFFICULTY, NUMPAD_MODES } from '../numpad/entries';
import { nextFocus } from './coach';

let id = 0;
function s(type: Session['type'], metrics: Record<string, number>, startedAt = '2026-09-27T02:00:00.000Z'): Session {
  id += 1;
  return { id: `s${id}`, type, startedAt, durationSec: 60, metrics, mistakes: [] };
}

const goodTyping = () => s('typing', { netWpm: 45, accuracy: 97 });
const goodNumpad = () => s('numpad', { kph: 9000, entryAccuracy: 98, difficulty: MIXED_DIFFICULTY });
const goodCopy = () => s('copy', { kph: 9000, fieldAccuracy: 100, records: 4 });
const goodEncoding = () => s('encoding', { kph: 7000, fieldAccuracy: 100, documents: 3 });
const goodQc = () => s('qc', { perMinute: 4, decisionAccuracy: 100, records: 8 });
const goodExcel = () => s('excel', { taskAccuracy: 100, shortcutRate: 100, tasksDone: 8 });

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
    const f = nextFocus([goodTyping(), goodNumpad(), weakCopy, goodEncoding(), goodQc(), goodExcel()]);
    expect(f).toMatchObject({ skill: 'copy', reason: '70% pa lang ang tamang field (target: 95%).' });
  });

  it('speed reason when speed is the weaker part', () => {
    const slowTyping = s('typing', { netWpm: 30, accuracy: 98 });
    const f = nextFocus([slowTyping, goodNumpad(), goodCopy(), goodEncoding(), goodQc(), goodExcel()]);
    expect(f).toMatchObject({ skill: 'typing', reason: '30 WPM pa lang (target: 40).' });
  });

  it('uses the LATEST result of each practice', () => {
    const oldBad = s('typing', { netWpm: 20, accuracy: 80 }, '2026-09-20T02:00:00.000Z');
    const f = nextFocus([oldBad, goodTyping(), goodNumpad(), goodCopy(), goodEncoding(), goodQc(), goodExcel()]);
    expect(f.skill).toBe('assessment');
  });

  it('QC comes last in the order, with its own reason', () => {
    expect(nextFocus([goodTyping(), goodNumpad(), goodCopy(), goodEncoding()]).skill).toBe('qc');
    const slowQc = s('qc', { perMinute: 1.4, decisionAccuracy: 100, records: 3 });
    expect(nextFocus([goodTyping(), goodNumpad(), goodCopy(), goodEncoding(), slowQc, goodExcel()])).toMatchObject({
      skill: 'qc',
      reason: '1 record bawat minuto pa lang (target: 3).',
    });
  });

  it('Excel is a learning track: never suggested, and a weak Excel round does not change the advice', () => {
    const noShortcuts = s('excel', { taskAccuracy: 100, shortcutRate: 50, tasksDone: 8 });
    expect(nextFocus([goodTyping(), goodNumpad(), goodCopy(), goodEncoding(), goodQc()]).skill).toBe('assessment');
    expect(nextFocus([goodTyping(), goodNumpad(), goodCopy(), goodEncoding(), goodQc(), noShortcuts]).skill).toBe('assessment');
  });

  it('everything at target: the Assessment', () => {
    expect(nextFocus([goodTyping(), goodNumpad(), goodCopy(), goodEncoding(), goodQc(), goodExcel()])).toMatchObject({ skill: 'assessment', to: '/assessment' });
  });
});
