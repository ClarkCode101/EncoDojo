import { describe, expect, it } from 'vitest';
import type { Session, SessionMistake } from '../../lib/storage';
import { assessmentComments } from './comments';
import { assessmentChecks, buildAssessmentSession, hasCopyPart, hasEncodingPart, previousAssessment } from './evaluate';

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

function copySession(metrics: Partial<Record<string, number>>, mistakes: SessionMistake[] = []): Session {
  return {
    id: 'c1',
    type: 'copy',
    startedAt: '2026-09-26T08:04:00.000Z',
    durationSec: 120,
    metrics: { kph: 9000, netWpm: 35, grossWpm: 36, fieldAccuracy: 100, records: 4, correctFields: 20, totalFields: 20, ...metrics } as Record<string, number>,
    mistakes,
  };
}

function encodingSession(metrics: Partial<Record<string, number>>, mistakes: SessionMistake[] = []): Session {
  return {
    id: 'e1',
    type: 'encoding',
    startedAt: '2026-09-26T08:07:00.000Z',
    durationSec: 180,
    metrics: { kph: 7000, fieldAccuracy: 100, documents: 3, correctFields: 15, totalFields: 15, ...metrics } as Record<string, number>,
    mistakes,
  };
}

/** All four parts; the copy and encoding parts default to passing ones. */
function build(
  typing: Session,
  numpad: Session,
  copy: Session = copySession({}),
  encoding: Session = encodingSession({}),
) {
  return buildAssessmentSession(typing, numpad, copy, encoding);
}

describe('buildAssessmentSession', () => {
  it('combines all four parts and marks job-ready when all targets pass', () => {
    const a = build(typingSession({}), numpadSession({}));
    expect(a.type).toBe('assessment');
    expect(a.durationSec).toBe(420);
    expect(a.metrics).toMatchObject({
      typingNetWpm: 45,
      numpadKph: 9000,
      copyFieldAccuracy: 100,
      copyKph: 9000,
      copyNetWpm: 35,
      encodingFieldAccuracy: 100,
      encodingKph: 7000,
      encodingDocuments: 3,
      targetsMet: 8,
      targetsTotal: 8,
      jobReady: 1,
    });
  });

  it('an encoding part with no documents counts as 0%', () => {
    const a = build(typingSession({}), numpadSession({}), copySession({}), encodingSession({ documents: 0, totalFields: 0, correctFields: 0, kph: 0 }));
    expect(a.metrics.encodingFieldAccuracy).toBe(0);
    expect(a.metrics.jobReady).toBe(0);
  });

  it('encoding below 6,000 KPH fails only that target', () => {
    const a = build(typingSession({}), numpadSession({}), copySession({}), encodingSession({ kph: 5400 }));
    expect(a.metrics).toMatchObject({ targetsMet: 7, targetsTotal: 8, jobReady: 0 });
  });

  it('a copy part with no records counts as 0% (not "100% of nothing")', () => {
    const a = build(typingSession({}), numpadSession({}), copySession({ records: 0, totalFields: 0, correctFields: 0, netWpm: 0, kph: 0 }));
    expect(a.metrics.copyFieldAccuracy).toBe(0);
    expect(a.metrics.jobReady).toBe(0);
  });

  it('is not job-ready when any target fails', () => {
    const a = build(typingSession({ accuracy: 90 }), numpadSession({}));
    expect(a.metrics).toMatchObject({ targetsMet: 7, jobReady: 0 });
  });

  it('tags each mistake with its part', () => {
    const a = build(
      typingSession({}, [{ expected: 'a', typed: 's', index: 3 }]),
      numpadSession({}, [{ expected: '123', typed: '124', index: 1 }]),
      copySession({}, [{ expected: 'Dela Cruz', typed: 'De la Cruz', index: 1, field: 'name' }]),
      encodingSession({}, [{ expected: '09/14/2026', typed: 'Sept. 14, 2026', index: 1, field: 'date' }]),
    );
    expect(a.mistakes.map((m) => m.section)).toEqual(['typing', 'numpad', 'copy', 'encoding']);
  });
});

describe('assessmentChecks', () => {
  it('old assessments (typing + numpad only) still get their 4 checks', () => {
    const old = { typingNetWpm: 45, typingAccuracy: 97, numpadKph: 9000, numpadEntryAccuracy: 100 };
    expect(hasCopyPart(old)).toBe(false);
    expect(assessmentChecks(old).map((c) => c.section)).toEqual(['typing', 'typing', 'numpad', 'numpad']);
  });

  it('assessments from before Document Encoding keep their 6 checks', () => {
    const three = { typingNetWpm: 45, typingAccuracy: 97, numpadKph: 9000, numpadEntryAccuracy: 100, copyFieldAccuracy: 100, copyKph: 9000 };
    expect(hasCopyPart(three)).toBe(true);
    expect(hasEncodingPart(three)).toBe(false);
    expect(assessmentChecks(three)).toHaveLength(6);
  });

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
    const c = assessmentComments(build(typingSession({}), numpadSession({})));
    expect(c[0]).toMatch(/pasado ka sa lahat ng 8/);
    expect(c.join(' ')).toMatch(/Document Encoding: pasado ka/);
    expect(c.join(' ')).toMatch(/Copy Test: pasado ka/);
    expect(c.join(' ')).toMatch(/Typing: pasado ka sa bilis at accuracy/);
    expect(c.join(' ')).toMatch(/Numpad: pasado ka sa bilis at accuracy/);
  });

  it('tells a fast but careless typist to slow down', () => {
    const c = assessmentComments(build(typingSession({ netWpm: 55, accuracy: 88 }), numpadSession({})));
    expect(c.join(' ')).toMatch(/sapat na ang bilis mo.*88% lang ang tama/);
  });

  it('notices heavy Backspace use', () => {
    const c = assessmentComments(build(typingSession({ accuracy: 98, keystrokeAccuracy: 90 }), numpadSession({})));
    expect(c.join(' ')).toMatch(/Backspace/);
  });

  it('spots a pattern of number mistakes', () => {
    const mistakes = ['1', '5', '0', '7'].map((d, i) => ({ expected: d, typed: 'x', index: i }));
    const c = assessmentComments(build(typingSession({}, mistakes), numpadSession({})));
    expect(c.join(' ')).toMatch(/magkamali sa mga numero/);
  });

  it('does not call 1 or 2 mistakes a pattern', () => {
    const mistakes = [{ expected: '1', typed: 'x', index: 0 }];
    const c = assessmentComments(build(typingSession({}, mistakes), numpadSession({})));
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
      build(typingSession({}), numpadSession({ entryAccuracy: 80, correctEntries: 16 }, mistakes)),
    ).join(' ');
    expect(c).toMatch(/sentimo/);
    expect(c).toMatch(/kulang ang digit/);
  });

  it('handles a numpad part with no entries', () => {
    const c = assessmentComments(
      build(typingSession({}), numpadSession({ kph: 0, entryAccuracy: 100, entries: 0, correctEntries: 0 })),
    );
    expect(c.join(' ')).toMatch(/walang numerong naipasa/);
  });

  it('points out the Copy Test field that is wrong most often', () => {
    const mistakes = [1, 2, 3].map((i) => ({ expected: 'Brgy. San Roque', typed: 'Brgy San Roque', index: i, field: 'address' }));
    const c = assessmentComments(
      build(typingSession({}), numpadSession({}), copySession({ fieldAccuracy: 81, correctFields: 13 }, mistakes)),
    ).join(' ');
    expect(c).toMatch(/Madalas mali ang Address/);
  });

  it('reminds to press Enter when no Copy Test record was submitted', () => {
    const c = assessmentComments(
      build(typingSession({}), numpadSession({}), copySession({ records: 0, totalFields: 0, correctFields: 0, netWpm: 0 })),
    ).join(' ');
    expect(c).toMatch(/walang naipasang record/);
  });

  it('points out an unconverted date in Document Encoding', () => {
    const mistakes = [1, 2, 3].map((i) => ({ expected: '09/14/2026', typed: 'Sept. 14, 2026', index: i, field: 'date' }));
    const c = assessmentComments(
      build(typingSession({}), numpadSession({}), copySession({}), encodingSession({ fieldAccuracy: 80, correctFields: 12 }, mistakes)),
    ).join(' ');
    expect(c).toMatch(/Madalas mali ang Date.*mm\/dd\/yyyy/);
  });

  it('reminds to press Enter when no document was finished', () => {
    const c = assessmentComments(
      build(typingSession({}), numpadSession({}), copySession({}), encodingSession({ documents: 0, totalFields: 0, correctFields: 0, kph: 0 })),
    ).join(' ');
    expect(c).toMatch(/walang natapos na dokumento/);
  });

  it('old assessments get no Copy Test comments', () => {
    const old: Session = {
      id: 'old', type: 'assessment', startedAt: '2026-09-01T00:00:00.000Z', durationSec: 120, mistakes: [],
      metrics: { typingNetWpm: 45, typingAccuracy: 97, typingKeystrokeAccuracy: 95, numpadKph: 9000, numpadEntryAccuracy: 100, numpadEntries: 20, numpadCorrectEntries: 20 },
    };
    expect(assessmentComments(old).join(' ')).not.toMatch(/Copy Test|Document Encoding/);
  });
});
