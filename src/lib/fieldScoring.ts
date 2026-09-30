/**
 * Field-by-field scoring, shared by the Copy Test and Document Encoding.
 *
 * - A field is CORRECT only when it matches the expected value exactly (same
 *   letters, capitals, punctuation, and spaces). Spaces at the very start or
 *   end are ignored because they can't be seen. This is how encoding QC
 *   works: one wrong character makes the whole field wrong.
 * - Field accuracy = correct fields / submitted fields.
 * - Speed is shown two ways:
 *   - Net KPH (like alphanumeric hiring tests): characters typed minus
 *     character mistakes, per hour. This is the speed target.
 *   - Net WPM, the same formula as the Typing Test (extra info).
 *   Characters typed in the record that was still unfinished when time ran
 *   out count toward speed, but only SUBMITTED records count toward mistakes
 *   and accuracy.
 */
import { alignTyping } from './alignTyping';
import type { Lang } from './i18n';
import { accuracyPct, grossWpm, kph, netWpm } from './scoring';
import type { SessionMistake } from './storage';

/**
 * One form field / spreadsheet column. `label` is English, `tl` its Taglish meaning.
 * `hint` is the format (e.g. mm/dd/yyyy); `hintEn` only when the hint has words to translate.
 */
export type FieldSpec = { key: string; label: string; tl: string; hint?: string; hintEn?: string };

/** The format hint in a language. */
export const hintOf = (f: FieldSpec, lang: Lang) => (lang === 'en' ? (f.hintEn ?? f.hint) : f.hint);

/**
 * Field key -> name for mistake lists: "Date (Petsa)" in Taglish, "Date" in English.
 * Same key = same label in every document.
 */
export function fieldLabels(fields: readonly FieldSpec[], lang: Lang = 'tl'): Record<string, string> {
  return Object.fromEntries(fields.map((f) => [f.key, lang === 'en' ? f.label : `${f.label} (${f.tl})`]));
}

export type Values = Record<string, string>;

/** A record the user submitted: which fields it has, the right values, and what was typed. */
export type FilledRecord = { fields: readonly FieldSpec[]; expected: Values; typed: Values };

/** Leading/trailing spaces are invisible, so they don't count as mistakes. */
export function cleanField(value: string): string {
  return value.trim();
}

export function isFieldCorrect(expected: string, typed: string): boolean {
  return cleanField(typed) === expected;
}

/**
 * How many single-character mistakes separate `typed` from `expected`
 * (wrong, extra, or missing characters — missing ones at the end count too).
 */
export function fieldErrors(expected: string, typed: string): number {
  const a = alignTyping(expected, cleanField(typed));
  return a.errors + (expected.length - a.cursor);
}

/** Total characters typed in a record's fields (for speed). */
export function typedLength(fields: readonly FieldSpec[], values: Values): number {
  return fields.reduce((sum, f) => sum + cleanField(values[f.key] ?? '').length, 0);
}

/**
 * Score submitted records (plus the unfinished one, for speed only).
 * Mistakes are numbered by record (1 = first record) and name the field.
 */
export function scoreRecords(
  submitted: FilledRecord[],
  unfinished: { fields: readonly FieldSpec[]; typed: Values } | null,
  elapsedSec: number,
) {
  let correctFields = 0;
  let totalFields = 0;
  let errors = 0;
  const mistakes: SessionMistake[] = [];

  submitted.forEach(({ fields, expected, typed }, i) => {
    for (const { key } of fields) {
      totalFields++;
      const typedValue = typed[key] ?? '';
      if (isFieldCorrect(expected[key], typedValue)) {
        correctFields++;
      } else {
        errors += fieldErrors(expected[key], typedValue);
        mistakes.push({ expected: expected[key], typed: cleanField(typedValue), index: i + 1, field: key });
      }
    }
  });

  const typedChars =
    submitted.reduce((sum, r) => sum + typedLength(r.fields, r.typed), 0) +
    (unfinished ? typedLength(unfinished.fields, unfinished.typed) : 0);

  return {
    metrics: {
      kph: kph(Math.max(0, typedChars - errors), elapsedSec),
      grossWpm: grossWpm(typedChars, elapsedSec),
      netWpm: netWpm(typedChars, errors, elapsedSec),
      fieldAccuracy: accuracyPct(correctFields, totalFields),
      records: submitted.length,
      correctFields,
      totalFields,
      errors,
      typedChars,
    },
    mistakes,
  };
}
