/**
 * Written feedback for an Assessment, made from simple rules (no AI, no
 * internet). Each rule looks at the scores or at the KIND of mistakes and
 * gives one concrete tip.
 */
import { display, normalizeEntry } from '../../lib/scoring';
import type { Session, SessionMistake } from '../../lib/storage';
import { JOB_READY_COPY, JOB_READY_ENCODING, JOB_READY_NUMPAD, JOB_READY_QC, JOB_READY_TYPING } from '../../lib/targets';
import { mistakeKind } from '../../lib/alignTyping';
import { isFalseAlarm } from '../qc/scoreQc';
import { assessmentChecks, assessmentCopyKph, hasCopyPart, hasEncodingPart, hasQcPart } from './evaluate';

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
        'Bagalan nang kaunti. Sa encoding, isang maling letra lang ay puwedeng mali na ang buong record.',
    );
  } else if (accOk) {
    out.push(
      `Typing: maganda ang accuracy mo (${acc}%). Bilis naman ang kailangan: ${t.netWpm - net} WPM pa. ` +
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
        'Nakakaubos ng oras ang bawat pagbura. Subukang tama na agad sa unang pindot.',
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
      `Copy Test: tama ang pagkopya mo (${acc}%). Bilisan pa nang kaunti: ${(t.kph - speed).toLocaleString('en-US')} KPH pa para sa target.`,
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

/** A tip for each Document Encoding field, used when that field is wrong most often. */
const ENCODING_FIELD_TIPS: Record<string, string> = {
  date: 'Madalas mali ang Date. Kahit "Sept. 14, 2026" o "14-Sep-2026" ang nasa papel, i-type ito bilang mm/dd/yyyy (09/14/2026).',
  birthDate: 'Madalas mali ang Birth Date. Laging mm/dd/yyyy, kahit iba ang itsura ng petsa sa form.',
  total: 'Madalas mali ang Total Amount. Numero at tuldok lang, walang ₱ at walang comma (₱5,115.25 → 5115.25).',
  totalQty: 'Madalas mali ang Total Qty. Kunin ang TOTAL QTY sa ibaba ng delivery receipt, hindi ang isang linya lang.',
  customer: 'Madalas mali ang Customer. Ito ang nasa "Sold to:", hindi ang kumpanyang nasa itaas ng invoice.',
  deliverTo: 'Madalas mali ang Deliver To. Ingat sa pangalan ng kumpanya o tao at sa bawat tuldok.',
  address: 'Madalas mali ang Address. Ingat sa "Brgy.", "Blk", "Lot", mga comma, at pangalan ng lugar.',
  lastName: 'Madalas mali ang Last Name. Ito ang nasa "Surname" na kahon ng form.',
  firstName: 'Madalas mali ang First Name. Ito ang nasa "Given Name" na kahon, hindi kasama ang middle name.',
  contactNo: 'Madalas mali ang Contact No. Tingnan ang panaklong ( ), space, gitling (-), at bawat digit.',
  invoiceNo: 'Madalas mali ang Invoice No. Tingnan ang bawat digit at gitling (-) ng pulang numero.',
  drNo: 'Madalas mali ang DR No. Tingnan ang bawat digit at gitling (-) ng pulang numero.',
  terms: 'Madalas mali ang Terms. Kopyahin nang eksakto, hal. "30 days" o "COD".',
};

function encodingComments(m: Record<string, number>, mistakes: SessionMistake[]): string[] {
  const t = JOB_READY_ENCODING;
  if (m.encodingDocuments === 0) {
    return ['Document Encoding: walang natapos na dokumento. Tandaan: pindutin ang Enter sa huling field para maipasa.'];
  }
  const speed = display(m.encodingKph);
  const speedText = `${speed.toLocaleString('en-US')} KPH`;
  const acc = display(m.encodingFieldAccuracy);
  const speedOk = speed >= t.kph;
  const accOk = acc >= t.fieldAccuracy;
  const out: string[] = [];

  if (speedOk && accOk) {
    out.push(`Document Encoding: pasado ka sa tamang field at bilis (${acc}% tama, ${speedText}). Ang galing!`);
  } else if (speedOk) {
    out.push(
      `Document Encoding: sapat ang bilis mo (${speedText}), pero ${acc}% lang ng field ang tama (target: ${t.fieldAccuracy}%). ` +
        'Sundin ang mga patakaran: petsa → mm/dd/yyyy, halaga → walang ₱ at comma.',
    );
  } else if (accOk) {
    out.push(
      `Document Encoding: tama ang pag-encode mo (${acc}%). Bilisan pa ang paghahanap sa dokumento: ` +
        `${(t.kph - speed).toLocaleString('en-US')} KPH pa para sa target.`,
    );
  } else {
    out.push(
      `Document Encoding: unahin muna ang tamang pag-encode (${acc}% tama, target: ${t.fieldAccuracy}%), saka ang bilis (${speedText}).`,
    );
  }

  const counts = new Map<string, number>();
  for (const x of mistakes) if (x.field) counts.set(x.field, (counts.get(x.field) ?? 0) + 1);
  const [topField, topCount] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] ?? ['', 0];
  if (topCount >= 2 && topCount / mistakes.length >= MIN_PATTERN_SHARE && ENCODING_FIELD_TIPS[topField]) {
    out.push(ENCODING_FIELD_TIPS[topField]);
  }
  return out;
}

/** Where QC mistakes hide most, in plain words (the field of the missed mistake). */
const QC_FIELD_TIPS: Record<string, string> = {
  name: 'Madalas mong hindi napapansin ang mali sa Name. Tingnan ang bawat letra, pati tuldok ng "Ma." at "Jr."',
  birthDate: 'Madalas mong hindi napapansin ang mali sa petsa. Ihambing ang bawat digit, lalo na ang baligtad (06 at 60).',
  address: 'Madalas mong hindi napapansin ang mali sa Address. Mahaba ito, kaya basahin nang dahan-dahan, pati "Brgy." at "St."',
  contactNo: 'Madalas mong hindi napapansin ang mali sa Contact No. Ihambing ang huling 4 na digit, doon madalas ang baligtad.',
  idNo: 'Madalas mong hindi napapansin ang mali sa ID No. Ihambing ang taon at ang 5 digit nang paisa-isa.',
};

function qcComments(m: Record<string, number>, mistakes: SessionMistake[]): string[] {
  const t = JOB_READY_QC;
  if (m.qcRecords === 0) {
    return ['QC Check: walang na-check na record. Tandaan: pindutin ang Enter o "Submit" pagkatapos mag-check.'];
  }
  const acc = display(m.qcDecisionAccuracy);
  const speed = display(m.qcPerMinute);
  const accOk = acc >= t.decisionAccuracy;
  const speedOk = speed >= t.perMinute;
  const out: string[] = [];

  if (accOk && speedOk) {
    out.push(`QC Check: pasado ka sa tamang check at bilis (${acc}%, ${speed} record bawat minuto). Ang galing!`);
  } else if (!accOk && m.qcMissed >= m.qcFalseAlarms) {
    out.push(
      `QC Check: ${acc}% ang tamang check mo (target: ${t.decisionAccuracy}%). May ${m.qcMissed} mali na hindi mo napansin. ` +
        'Ihambing ang bawat field letra por letra bago pindutin ang Enter.',
    );
  } else if (!accOk) {
    out.push(
      `QC Check: ${acc}% ang tamang check mo (target: ${t.decisionAccuracy}%). May ${m.qcFalseAlarms} field na tama pero minarkahan mong mali. ` +
        'Markahan lang kapag sigurado kang magkaiba talaga.',
    );
  } else {
    out.push(
      `QC Check: tama ang check mo (${acc}%). Bilisan pa nang kaunti: ${speed} record bawat minuto, target ${t.perMinute}.`,
    );
  }

  const missed = mistakes.filter((x) => !isFalseAlarm(x));
  const counts = new Map<string, number>();
  for (const x of missed) if (x.field) counts.set(x.field, (counts.get(x.field) ?? 0) + 1);
  const [topField, topCount] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] ?? ['', 0];
  if (topCount >= 2 && topCount / missed.length >= MIN_PATTERN_SHARE && QC_FIELD_TIPS[topField]) {
    out.push(QC_FIELD_TIPS[topField]);
  }
  return out;
}

export type CommentsBySection = {
  overall: string;
  typing: string[];
  numpad: string[];
  /** Empty for older assessments without that part. */
  copy: string[];
  encoding: string[];
  qc: string[];
};

/** The feedback grouped by part (the report shows only the parts that need work). */
export function assessmentCommentsBySection(assessment: Session): CommentsBySection {
  const m = assessment.metrics;
  const of = (section: string) => assessment.mistakes.filter((x) => x.section === section);
  return {
    overall: overallComment(m),
    typing: typingComments(m, of('typing')),
    numpad: numpadComments(m, of('numpad')),
    copy: hasCopyPart(m) ? copyComments(m, of('copy')) : [],
    encoding: hasEncodingPart(m) ? encodingComments(m, of('encoding')) : [],
    qc: hasQcPart(m) ? qcComments(m, of('qc')) : [],
  };
}

/** All feedback for one saved assessment, most important first. */
export function assessmentComments(assessment: Session): string[] {
  const c = assessmentCommentsBySection(assessment);
  return [c.overall, ...c.typing, ...c.numpad, ...c.copy, ...c.encoding, ...c.qc];
}
