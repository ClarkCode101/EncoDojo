import { describe, expect, it } from 'vitest';
import type { Session } from '../../lib/storage';
import { resultCardData } from './resultCard';

function assessment(id: string, day: string, metrics: Record<string, number>): Session {
  return { id, type: 'assessment', startedAt: `2026-09-${day}T08:00:00.000Z`, durationSec: 420, metrics, mistakes: [] };
}

const fourParts = {
  typingNetWpm: 48, typingAccuracy: 98, numpadKph: 10200, numpadEntryAccuracy: 100,
  copyFieldAccuracy: 90, copyKph: 9000, encodingFieldAccuracy: 100, encodingKph: 7000,
  targetsMet: 7, targetsTotal: 8, jobReady: 0,
};

describe('resultCardData', () => {
  it('lists every part with its targets, values and ✓/✗', () => {
    const a = assessment('a', '27', fourParts);
    const d = resultCardData(a, [a]);
    expect(d).toMatchObject({ ready: false, met: 7, total: 8 });
    expect(d.parts.map((p) => p.title)).toEqual(['Typing', 'Numpad', 'Copy Test', 'Document Encoding']);
    const copy = d.parts[2];
    expect(copy.passed).toBe(false);
    expect(copy.checks[0]).toEqual({ label: 'Tamang field', value: '90%', target: '95%', pass: false });
    expect(d.parts[1].checks[0].value).toBe('10,200');
  });

  it('older assessments show only the parts they had', () => {
    const old = assessment('o', '10', { typingNetWpm: 45, typingAccuracy: 97, numpadKph: 9000, numpadEntryAccuracy: 100, targetsMet: 4, targetsTotal: 4, jobReady: 1 });
    expect(resultCardData(old, [old]).parts.map((p) => p.title)).toEqual(['Typing', 'Numpad']);
  });

  it('shows the belt earned up to THAT assessment, not a later one', () => {
    const early = assessment('e', '10', { ...fourParts, targetsMet: 2 }); // Yellow at the time
    const later = assessment('l', '20', { ...fourParts, targetsMet: 8, jobReady: 1 }); // Blue later
    expect(resultCardData(early, [early, later]).belt.label).toBe('Yellow Belt');
    expect(resultCardData(later, [early, later]).belt.label).toBe('Blue Belt');
  });
});
