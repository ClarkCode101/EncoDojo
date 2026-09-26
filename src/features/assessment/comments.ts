/**
 * Written feedback for an Assessment, made from simple rules (no AI, no
 * internet). Each rule looks at the scores or at the KIND of mistakes and
 * gives one concrete tip.
 */
import { display, normalizeEntry } from '../../lib/scoring';
import type { Session, SessionMistake } from '../../lib/storage';
import { JOB_READY_NUMPAD, JOB_READY_TYPING } from '../../lib/targets';
import { mistakeKind } from '../typing/alignTyping';
import { assessmentChecks } from './evaluate';

/** A tip only counts as a "pattern" when it happens at least this often... */
const MIN_PATTERN_COUNT = 3;
/** ...and makes up at least this share of the mistakes. */
const MIN_PATTERN_SHARE = 0.4;

function isPattern(count: number, total: number): boolean {
  return count >= MIN_PATTERN_COUNT && count / total >= MIN_PATTERN_SHARE;
}

function overallComment(m: Record<string, number>): string {
  const checks = assessmentChecks(m);
  const met = checks.filter((c) => c.pass).length;
  if (met === checks.length) {
    return `Overall: you met all ${checks.length} job-ready targets. Retake the assessment on different days to make sure it's consistent.`;
  }
  return `Overall: you met ${met} of ${checks.length} job-ready targets. Train the weaker parts below, then retake the assessment.`;
}

function typingComments(m: Record<string, number>, mistakes: SessionMistake[]): string[] {
  const t = JOB_READY_TYPING;
  const net = display(m.typingNetWpm);
  const acc = display(m.typingAccuracy);
  const speedOk = net >= t.netWpm;
  const accOk = acc >= t.accuracy;
  const out: string[] = [];

  if (speedOk && accOk) {
    out.push(`Typing: you met both targets (${net} Net WPM, ${acc}% accuracy). Nice work!`);
  } else if (speedOk) {
    out.push(
      `Typing: your speed is enough (${net} Net WPM), but accuracy is ${acc}% (target ${t.accuracy}%). ` +
        'Slow down a little — in encoding, one wrong character can make a whole record wrong.',
    );
  } else if (accOk) {
    out.push(
      `Typing: your accuracy is good (${acc}%). Now build speed — you need ${t.netWpm - net} more Net WPM. ` +
        'Do a few 1-minute Typing Test trainings every day.',
    );
  } else {
    out.push(
      `Typing: work on accuracy first (${acc}%, target ${t.accuracy}%), then speed (${net} Net WPM, target ${t.netWpm}). ` +
        'Speed comes naturally once you stop making mistakes.',
    );
  }

  const keystrokeAcc = display(m.typingKeystrokeAccuracy);
  if (acc - keystrokeAcc >= 5) {
    out.push(
      `You fixed a lot of mistakes with Backspace (keystroke accuracy ${keystrokeAcc}%). ` +
        'Every correction costs time — try to get it right the first time.',
    );
  }

  if (mistakes.length > 0) {
    const slips = mistakes.filter((x) => mistakeKind(x) !== 'Wrong key').length;
    if (isPattern(slips, mistakes.length)) {
      out.push(
        'Many typing mistakes were skipped or extra keys. Keep your eyes on the source text and don\'t rush ahead.',
      );
    }

    // Which kind of character went wrong most often?
    const charOf = (x: SessionMistake) => x.expected || x.typed;
    const categories = [
      {
        count: mistakes.filter((x) => /[0-9]/.test(charOf(x))).length,
        tip: 'Many typing mistakes were in numbers (amounts, dates, codes). Train the Typing Test at Difficulty 5-6.',
      },
      {
        count: mistakes.filter((x) => /[A-Z]/.test(charOf(x))).length,
        tip: 'Many typing mistakes were capital letters. Practice holding Shift with the opposite hand.',
      },
      {
        count: mistakes.filter((x) => /[^A-Za-z0-9 ]/.test(charOf(x))).length,
        tip: 'Many typing mistakes were punctuation (periods, commas, dashes, slashes). Slow down on names, addresses, and codes — Difficulty 3-4 is good training.',
      },
    ];
    const top = categories.reduce((a, b) => (b.count > a.count ? b : a));
    if (isPattern(top.count, mistakes.length)) out.push(top.tip);
  }

  return out;
}

function numpadComments(m: Record<string, number>, mistakes: SessionMistake[]): string[] {
  const t = JOB_READY_NUMPAD;
  const kphNow = display(m.numpadKph);
  const acc = display(m.numpadEntryAccuracy);
  const entries = m.numpadEntries;
  const wrong = entries - m.numpadCorrectEntries;
  const out: string[] = [];

  if (entries === 0) {
    return ['Numpad: no entries were submitted. Remember to press Enter after each number.'];
  }

  const speedOk = kphNow >= t.kph;
  const accOk = acc >= t.entryAccuracy;
  const kphText = kphNow.toLocaleString('en-US');
  if (speedOk && accOk) {
    out.push(`Numpad: you met both targets (${kphText} KPH, ${acc}% of entries correct). Nice work!`);
  } else if (speedOk) {
    out.push(`Numpad: you're fast (${kphText} KPH), but ${wrong} of ${entries} entries were wrong. Check each number before pressing Enter.`);
  } else if (accOk) {
    out.push(
      `Numpad: your entries are accurate, but speed is ${kphText} KPH (target ${t.kph.toLocaleString('en-US')}). ` +
        'Turn on Num Lock, keep your fingers on 4-5-6, and try not to look at the keypad.',
    );
  } else {
    out.push(`Numpad: build accuracy first (${acc}% of entries correct), then speed (${kphText} KPH).`);
  }

  // Wrong only after the decimal point, e.g. 1,234.56 typed as 1234.65
  const centavoSlips = mistakes.filter((x) => {
    const [wantWhole, wantCents] = normalizeEntry(x.expected).split('.');
    const [gotWhole, gotCents] = normalizeEntry(x.typed).split('.');
    return wantCents !== undefined && wantWhole === gotWhole && wantCents !== gotCents;
  }).length;
  if (centavoSlips >= 2) {
    out.push('Several numpad mistakes were in the centavos (after the decimal point). Double-check the last two digits.');
  }

  const missingDigits = mistakes.filter(
    (x) => normalizeEntry(x.typed).length < normalizeEntry(x.expected).length,
  ).length;
  if (missingDigits >= 2) {
    out.push('Some numpad entries were missing digits. Be extra careful with long numbers like reference numbers.');
  }

  return out;
}

/** All feedback for one saved assessment, most important first. */
export function assessmentComments(assessment: Session): string[] {
  const m = assessment.metrics;
  const typingMistakes = assessment.mistakes.filter((x) => x.section === 'typing');
  const numpadMistakes = assessment.mistakes.filter((x) => x.section === 'numpad');
  return [overallComment(m), ...typingComments(m, typingMistakes), ...numpadComments(m, numpadMistakes)];
}
