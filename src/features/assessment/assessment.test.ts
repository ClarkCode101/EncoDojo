import { describe, expect, it } from 'vitest';
import type { Session, SessionMistake } from '../../lib/storage';
import { assessmentComments } from './comments';
import { assessmentChecks, buildAssessmentSession, previousAssessment } from './evaluate';

function typingSession(metrics: Partial<Record<string, number>>, mistakes: SessionMistake[] = []): Session {
  return {
    id: 't1',
    type: 'typing',
    startedAt: '2026-09-26T08:00:00.000Z',
    durationSec: 60,
    metrics: { netWpm: 45, grossWpm: 47, accuracy: 97, keystrokeAccuracy: 95, errors: 3, typedChars: 235, ...metrics } as Record<string, number>,
    mistakes,
  };
}

function numpadSession(metrics: Partial<Record<string, number>>, mistakes: SessionMistake[] = []): Session {
  return {
    id: 'n1',
    type: 'numpad',
    startedAt: '2026-09-26T08:02:00.000Z',
    durationSec: 60,
    metrics: { kph: 9000, entryAccuracy: 100, entries: 20, correctEntries: 20, ...metrics } as Record<string, number>,
    mistakes,
  };
}

describe('buildAssessmentSession', () => {
  it('combines both parts and marks job-ready when all targets pass', () => {
    const a = buildAssessmentSession(typingSession({}), numpadSession({}));
    expect(a.type).toBe('assessment');
    expect(a.durationSec).toBe(120);
    expect(a.metrics).toMatchObject({ typingNetWpm: 45, numpadKph: 9000, targetsMet: 4, targetsTotal: 4, jobReady: 1 });
  });

  it('is not job-ready when any target fails', () => {
    const a = buildAssessmentSession(typingSession({ accuracy: 90 }), numpadSession({}));
    expect(a.metrics).toMatchObject({ targetsMet: 3, jobReady: 0 });
  });

  it('tags each mistake with its part', () => {
    const a = buildAssessmentSession(
      typingSession({}, [{ expected: 'a', typed: 's', index: 3 }]),
      numpadSession({}, [{ expected: '123', typed: '124', index: 1 }]),
    );
    expect(a.mistakes.map((m) => m.section)).toEqual(['typing', 'numpad']);
  });
});

describe('assessmentChecks', () => {
  it('compares the rounded value (39.6 WPM counts as 40)', () => {
    const checks = assessmentChecks({ typingNetWpm: 39.6, typingAccuracy: 95, numpadKph: 8000, numpadEntryAccuracy: 95 });
    expect(checks.every((c) => c.pass)).toBe(true);
  });
});

describe('previousAssessment', () => {
  it('finds the one right before, ignoring other types', () => {
    const mk = (id: string, startedAt: string, type: Session['type'] = 'assessment'): Session => ({
      id, type, startedAt, durationSec: 0, metrics: {}, mistakes: [],
    });
    const a1 = mk('a1', '2026-09-01');
    const a2 = mk('a2', '2026-09-05');
    const t = mk('t', '2026-09-06', 'typing');
    const a3 = mk('a3', '2026-09-10');
    expect(previousAssessment([a1, a2, t, a3], a3)?.id).toBe('a2');
    expect(previousAssessment([a1, a2, t, a3], a1)).toBeNull();
  });
});

describe('assessmentComments', () => {
  it('congratulates when everything passes', () => {
    const c = assessmentComments(buildAssessmentSession(typingSession({}), numpadSession({})));
    expect(c[0]).toMatch(/pasado ka sa lahat ng 4/);
    expect(c.join(' ')).toMatch(/Typing: pasado ka sa bilis at accuracy/);
    expect(c.join(' ')).toMatch(/Numpad: pasado ka sa bilis at accuracy/);
  });

  it('tells a fast but careless typist to slow down', () => {
    const c = assessmentComments(buildAssessmentSession(typingSession({ netWpm: 55, accuracy: 88 }), numpadSession({})));
    expect(c.join(' ')).toMatch(/sapat na ang bilis mo.*88% lang ang tama/);
  });

  it('notices heavy Backspace use', () => {
    const c = assessmentComments(buildAssessmentSession(typingSession({ accuracy: 98, keystrokeAccuracy: 90 }), numpadSession({})));
    expect(c.join(' ')).toMatch(/Backspace/);
  });

  it('spots a pattern of number mistakes', () => {
    const mistakes = ['1', '5', '0', '7'].map((d, i) => ({ expected: d, typed: 'x', index: i }));
    const c = assessmentComments(buildAssessmentSession(typingSession({}, mistakes), numpadSession({})));
    expect(c.join(' ')).toMatch(/magkamali sa mga numero/);
  });

  it('does not call 1 or 2 mistakes a pattern', () => {
    const mistakes = [{ expected: '1', typed: 'x', index: 0 }];
    const c = assessmentComments(buildAssessmentSession(typingSession({}, mistakes), numpadSession({})));
    expect(c.join(' ')).not.toMatch(/magkamali sa mga numero/);
  });

  it('spots centavo mistakes and missing digits on the numpad', () => {
    const mistakes = [
      { expected: '1,234.56', typed: '1234.65', index: 1 },
      { expected: '88.10', typed: '88.01', index: 2 },
      { expected: '2026004517', typed: '202600451', index: 3 },
      { expected: '2025001111', typed: '20250011', index: 4 },
    ];
    const c = assessmentComments(
      buildAssessmentSession(typingSession({}), numpadSession({ entryAccuracy: 80, correctEntries: 16 }, mistakes)),
    ).join(' ');
    expect(c).toMatch(/sentimo/);
    expect(c).toMatch(/kulang ang digit/);
  });

  it('handles a numpad part with no entries', () => {
    const c = assessmentComments(
      buildAssessmentSession(typingSession({}), numpadSession({ kph: 0, entryAccuracy: 100, entries: 0, correctEntries: 0 })),
    );
    expect(c.join(' ')).toMatch(/walang numerong naipasa/);
  });
});
