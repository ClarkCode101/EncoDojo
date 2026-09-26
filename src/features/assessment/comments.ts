/**
 * Written feedback for an Assessment, made from simple rules (no AI, no
 * internet). Each rule looks at the scores or at the KIND of mistakes and
 * gives one concrete tip.
 */
import { display, normalizeEntry } from '../../lib/scoring';
import type { Session, SessionMistake } from '../../lib/storage';
import { JOB_READY_COPY, JOB_READY_NUMPAD, JOB_READY_TYPING } from '../../lib/targets';
import { mistakeKind } from '../typing/alignTyping';
import { assessmentChecks, assessmentCopyKph, hasCopyPart } from './evaluate';

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
    return `Sa kabuuan: pasado ka sa lahat ng ${checks.length} target! Ulitin ang assessment sa ibang araw para siguradong tuloy-tuloy ang galing mo.`;
  }
  return `Sa kabuuan: ${met} sa ${checks.length} target ang pasado. I-practice ang mga bahaging nasa ibaba, tapos subukan ulit ang assessment.`;
}

function typingComments(m: Record<string, number>, mistakes: SessionMistake[]): string[] {
  const t = JOB_READY_TYPING;
  const net = display(m.typingNetWpm);
  const acc = display(m.typingAccuracy);
  const speedOk = net >= t.netWpm;
  const accOk = acc >= t.accuracy;
  const out: string[] = [];

  if (speedOk && accOk) {
    out.push(`Typing: pasado ka sa bilis at accuracy (${net} WPM, ${acc}% tama). Ang galing!`);
  } else if (speedOk) {
    out.push(
      `Typing: sapat na ang bilis mo (${net} WPM), pero ${acc}% lang ang tama (target: ${t.accuracy}%). ` +
        'Bagalan nang kaunti — sa encoding, isang maling letra lang ay puwedeng mali na ang buong record.',
    );
  } else if (accOk) {
    out.push(
      `Typing: maganda ang accuracy mo (${acc}%). Bilis naman ang kailangan — ${t.netWpm - net} WPM pa. ` +
        'Mag-Typing Practice nang ilang beses (1 minuto) araw-araw.',
    );
  } else {
    out.push(
      `Typing: unahin muna ang tamang pagta-type (${acc}%, target: ${t.accuracy}%), saka ang bilis (${net} WPM, target: ${t.netWpm}). ` +
        'Kusang bibilis ka kapag nabawasan na ang mali.',
    );
  }

  const keystrokeAcc = display(m.typingKeystrokeAccuracy);
  if (acc - keystrokeAcc >= 5) {
    out.push(
      `Madalas kang magbura gamit ang Backspace (keystroke accuracy: ${keystrokeAcc}%). ` +
        'Nakakaubos ng oras ang bawat pagbura — subukang tama na agad sa unang pindot.',
    );
  }

  if (mistakes.length > 0) {
    const slips = mistakes.filter((x) => mistakeKind(x) !== 'Wrong key').length;
    if (isPattern(slips, mistakes.length)) {
      out.push(
        'Maraming nalaktawan o sobrang letra. Tutok lang sa text na kinokopya at huwag magmadali.',
      );
    }

    // Which kind of character went wrong most often?
    const charOf = (x: SessionMistake) => x.expected || x.typed;
    const categories = [
      {
        count: mistakes.filter((x) => /[0-9]/.test(charOf(x))).length,
        tip: 'Madalas kang magkamali sa mga numero. Bagalan kapag may numero at tingnan ang bawat digit.',
      },
      {
        count: mistakes.filter((x) => /[A-Z]/.test(charOf(x))).length,
        tip: 'Madalas kang magkamali sa malalaking titik (capital letters). Sanayin ang pagpindot ng Shift gamit ang kabilang kamay.',
      },
      {
        count: mistakes.filter((x) => /[^A-Za-z0-9 ]/.test(charOf(x))).length,
        tip: 'Madalas kang magkamali sa tuldok, comma, at iba pang bantas. Bagalan sa dulo ng bawat pangungusap.',
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
    return ['Numpad: walang numerong naipasa. Tandaan: pindutin ang Enter pagkatapos ng bawat numero.'];
  }

  const speedOk = kphNow >= t.kph;
  const accOk = acc >= t.entryAccuracy;
  const kphText = kphNow.toLocaleString('en-US');
  if (speedOk && accOk) {
    out.push(`Numpad: pasado ka sa bilis at accuracy (${kphText} KPH, ${acc}% tama). Ang galing!`);
  } else if (speedOk) {
    out.push(`Numpad: mabilis ka (${kphText} KPH), pero ${wrong} sa ${entries} na numero ang mali. Tingnan muna ang numero bago pindutin ang Enter.`);
  } else if (accOk) {
    out.push(
      `Numpad: tama ang mga numero mo, pero ${kphText} KPH pa lang ang bilis (target: ${t.kph.toLocaleString('en-US')}). ` +
        'I-ON ang Num Lock, ilagay ang mga daliri sa 4-5-6, at subukang huwag tumingin sa keypad.',
    );
  } else {
    out.push(`Numpad: unahin muna ang tamang numero (${acc}% tama), saka ang bilis (${kphText} KPH).`);
  }

  // Wrong only after the decimal point, e.g. 1,234.56 typed as 1234.65
  const centavoSlips = mistakes.filter((x) => {
    const [wantWhole, wantCents] = normalizeEntry(x.expected).split('.');
    const [gotWhole, gotCents] = normalizeEntry(x.typed).split('.');
    return wantCents !== undefined && wantWhole === gotWhole && wantCents !== gotCents;
  }).length;
  if (centavoSlips >= 2) {
    out.push('Ilang mali ay nasa sentimo (pagkatapos ng tuldok). Tingnang mabuti ang huling dalawang digit.');
  }

  const missingDigits = mistakes.filter(
    (x) => normalizeEntry(x.typed).length < normalizeEntry(x.expected).length,
  ).length;
  if (missingDigits >= 2) {
    out.push('May mga numerong kulang ang digit. Mag-ingat lalo na sa mahahabang numero gaya ng reference number.');
  }

  return out;
}

/** A tip for each Copy Test field, used when that field is wrong most often. */
const FIELD_TIPS: Record<string, string> = {
  name: 'Madalas mali ang Name (Pangalan). Ingat sa "Ma.", "Jr.", "III", at sa "Dela Cruz" laban sa "De la Cruz".',
  birthDate: 'Madalas mali ang Date of Birth (petsa ng kapanganakan). Tingnan ang ayos na mm/dd/yyyy at ang bawat "/".',
  address: 'Madalas mali ang Address. Ingat sa "Brgy.", "Blk", "Lot", mga comma, at pangalan ng lugar.',
  contactNo: 'Madalas mali ang Contact No. Tingnan ang panaklong ( ), space, gitling (-), at bawat digit.',
  idNo: 'Madalas mali ang ID No. Tingnan ang bawat digit, gitling (-), at letra sa dulo.',
};

function copyComments(m: Record<string, number>, mistakes: SessionMistake[]): string[] {
  const t = JOB_READY_COPY;
  if (m.copyRecords === 0) {
    return ['Copy Test: walang naipasang record. Tandaan: pindutin ang Enter sa huling field (ID No.) para maipasa.'];
  }
  const speed = display(assessmentCopyKph(m));
  const speedText = `${speed.toLocaleString('en-US')} KPH`;
  const acc = display(m.copyFieldAccuracy);
  const speedOk = speed >= t.kph;
  const accOk = acc >= t.fieldAccuracy;
  const out: string[] = [];

  if (speedOk && accOk) {
    out.push(`Copy Test: pasado ka sa tamang field at bilis (${acc}% tama, ${speedText}). Ang galing!`);
  } else if (speedOk) {
    out.push(
      `Copy Test: sapat ang bilis mo (${speedText}), pero ${acc}% lang ng field ang eksaktong tama (target: ${t.fieldAccuracy}%). ` +
        'Tingnang mabuti ang malalaking titik, tuldok, at space bago ipasa ang record.',
    );
  } else if (accOk) {
    out.push(
      `Copy Test: tama ang pagkopya mo (${acc}%). Bilisan pa nang kaunti — ${(t.kph - speed).toLocaleString('en-US')} KPH pa para sa target.`,
    );
  } else {
    out.push(
      `Copy Test: unahin muna ang eksaktong pagkopya (${acc}% tama, target: ${t.fieldAccuracy}%), saka ang bilis (${speedText}).`,
    );
  }

  // Which field was wrong most often?
  const counts = new Map<string, number>();
  for (const x of mistakes) if (x.field) counts.set(x.field, (counts.get(x.field) ?? 0) + 1);
  const [topField, topCount] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] ?? ['', 0];
  if (topCount >= 2 && topCount / mistakes.length >= MIN_PATTERN_SHARE && FIELD_TIPS[topField]) {
    out.push(FIELD_TIPS[topField]);
  }
  return out;
}

/** All feedback for one saved assessment, most important first. */
export function assessmentComments(assessment: Session): string[] {
  const m = assessment.metrics;
  const typingMistakes = assessment.mistakes.filter((x) => x.section === 'typing');
  const numpadMistakes = assessment.mistakes.filter((x) => x.section === 'numpad');
  const copyMistakes = assessment.mistakes.filter((x) => x.section === 'copy');
  return [
    overallComment(m),
    ...typingComments(m, typingMistakes),
    ...numpadComments(m, numpadMistakes),
    ...(hasCopyPart(m) ? copyComments(m, copyMistakes) : []),
  ];
}
