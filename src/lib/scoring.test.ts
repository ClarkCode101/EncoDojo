import { describe, expect, it } from 'vitest';
import {
  accuracyPct,
  display,
  entryAccuracyPct,
  grossWpm,
  isEntryCorrect,
  keystrokesForEntry,
  kph,
  netWpm,
  normalizeEntry,
} from './scoring';

describe('display', () => {
  it('rounds to a whole number', () => {
    expect(display(41.4)).toBe(41);
    expect(display(41.5)).toBe(42);
  });

  it('turns NaN and Infinity into 0', () => {
    expect(display(NaN)).toBe(0);
    expect(display(Infinity)).toBe(0);
  });
});

describe('grossWpm', () => {
  it('uses 5 characters per word', () => {
    // 250 chars = 50 words, in 1 minute = 50 WPM
    expect(grossWpm(250, 60)).toBe(50);
    // same chars in 2 minutes = 25 WPM
    expect(grossWpm(250, 120)).toBe(25);
  });

  it('returns 0 when no time has passed', () => {
    expect(grossWpm(100, 0)).toBe(0);
  });

  it('returns 0 when nothing was typed', () => {
    expect(grossWpm(0, 60)).toBe(0);
  });
});

describe('netWpm', () => {
  it('subtracts uncorrected errors per minute', () => {
    // 50 gross - (10 errors / 1 min) = 40
    expect(netWpm(250, 10, 60)).toBe(40);
  });

  it('never goes below 0', () => {
    expect(netWpm(50, 100, 60)).toBe(0);
  });

  it('returns 0 when no time has passed', () => {
    expect(netWpm(100, 0, 0)).toBe(0);
  });

  it('returns 0 when everything typed is wrong', () => {
    // 50 chars all wrong: gross 10, penalty 50 -> clamped to 0
    expect(netWpm(50, 50, 60)).toBe(0);
  });

  it('equals gross WPM when there are no errors', () => {
    expect(netWpm(300, 0, 60)).toBe(grossWpm(300, 60));
  });
});

describe('accuracyPct', () => {
  it('is correct / total * 100', () => {
    expect(accuracyPct(90, 100)).toBe(90);
  });

  it('is 100 when nothing has been typed yet', () => {
    expect(accuracyPct(0, 0)).toBe(100);
  });

  it('is 0 when every character is wrong', () => {
    expect(accuracyPct(0, 40)).toBe(0);
  });

  it('is clamped to 0..100', () => {
    expect(accuracyPct(120, 100)).toBe(100);
    expect(accuracyPct(-5, 100)).toBe(0);
  });
});

describe('kph', () => {
  it('scales keystrokes to one hour', () => {
    // 100 keystrokes in 60 seconds = 6,000 per hour
    expect(kph(100, 60)).toBe(6000);
  });

  it('returns 0 when no time has passed', () => {
    expect(kph(100, 0)).toBe(0);
  });

  it('returns 0 when there are no correct keystrokes', () => {
    expect(kph(0, 120)).toBe(0);
  });
});

describe('entryAccuracyPct', () => {
  it('is correct entries / total entries * 100', () => {
    expect(entryAccuracyPct(9, 10)).toBe(90);
  });

  it('is 100 when there are no entries yet', () => {
    expect(entryAccuracyPct(0, 0)).toBe(100);
  });

  it('is 0 when every entry is wrong', () => {
    expect(entryAccuracyPct(0, 8)).toBe(0);
  });
});

describe('numpad entries', () => {
  it('normalizeEntry removes commas and spaces around', () => {
    expect(normalizeEntry(' 12,450.75 ')).toBe('12450.75');
  });

  it('isEntryCorrect ignores commas', () => {
    expect(isEntryCorrect('12,450.75', '12450.75')).toBe(true);
    expect(isEntryCorrect('12,450.75', '12,450.57')).toBe(false);
  });

  it('keystrokesForEntry counts matching characters plus Enter when fully correct', () => {
    // "12450.75" = 8 characters + Enter
    expect(keystrokesForEntry('12,450.75', '12450.75')).toBe(9);
  });

  it('keystrokesForEntry gives no Enter credit for a wrong entry', () => {
    // 4 of 5 characters match, no Enter
    expect(keystrokesForEntry('12345', '12305')).toBe(4);
  });

  it('keystrokesForEntry returns 0 for an empty entry', () => {
    expect(keystrokesForEntry('123', '')).toBe(0);
  });
});
