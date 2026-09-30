/**
 * The fake records shown in the Copy Test. All values are random combinations
 * of common names and places (see data/ph), never real people.
 *
 * Made-up patterns, on purpose:
 * - ID number "ED-2026-04517-K": not shaped like any real government ID
 *   (SSS, TIN, PhilHealth, etc.).
 * - Contact number "(049) 000-1234": the local number starts with 0, which no
 *   real Philippine landline does, so it can never be someone's real number.
 */
import { fieldLabels } from '../../lib/fieldScoring';
import type { Lang, T } from '../../lib/i18n';
import { intBetween, pick, type Rng } from '../../lib/random';
import type { CopyMode } from '../../lib/storage';
import { address, birthDate, digits, fullName, upperLetter } from '../typing/generatePassage';

export type CopyRecord = {
  name: string;
  birthDate: string;
  address: string;
  contactNo: string;
  idNo: string;
};

export type FieldKey = keyof CopyRecord;

/**
 * The form fields, in the order they are typed.
 * `label` is in ENGLISH, like on real forms and hiring tests; `tl` is the
 * Taglish meaning shown smaller next to it, so users learn the English words.
 */
export const FIELDS: { key: FieldKey; label: string; tl: string; hint?: string }[] = [
  { key: 'name', label: 'Name', tl: 'Pangalan' },
  { key: 'birthDate', label: 'Date of Birth', tl: 'Petsa ng kapanganakan', hint: 'mm/dd/yyyy' },
  { key: 'address', label: 'Address', tl: 'Tirahan' },
  { key: 'contactNo', label: 'Contact No.', tl: 'Numero ng telepono' },
  { key: 'idNo', label: 'ID No.', tl: 'Numero ng ID' },
];

/** "Date of Birth (Petsa ng kapanganakan)" (English: "Date of Birth") — for tables and tips. */
export const copyFieldLabels = (lang: Lang = 'tl') => fieldLabels(FIELDS, lang) as Record<FieldKey, string>;

/** The Taglish labels. */
export const FIELD_LABEL = copyFieldLabels();

/** The two Copy Test layouts, as shown on the page and the results. */
export const copyModeLabel = (mode: CopyMode, t: T) =>
  mode === 'sheet'
    ? t('Spreadsheet (gaya ng Excel)', 'Spreadsheet (like Excel)')
    : t('Form (gaya ng hiring test)', 'Form (like a hiring test)');

/** Made-up ID pattern, e.g. ED-2026-04517-K */
export function idNumber(rng: Rng): string {
  return `ED-${intBetween(rng, 2019, 2026)}-${digits(rng, 5)}-${upperLetter(rng)}`;
}

/** Common 3-digit provincial area codes (only the format matters here). */
const AREA_CODES = [
  '032',
  '033',
  '034',
  '036',
  '038',
  '042',
  '043',
  '044',
  '045',
  '046',
  '047',
  '049',
  '052',
  '054',
  '074',
  '082',
  '088',
];

/** Fake landline that can't be real: the local part starts with "000". e.g. (049) 000-1234 */
export function contactNumber(rng: Rng): string {
  return `(${pick(rng, AREA_CODES)}) 000-${digits(rng, 4)}`;
}

export function makeRecord(rng: Rng): CopyRecord {
  return {
    name: fullName(rng),
    birthDate: birthDate(rng),
    address: address(rng),
    contactNo: contactNumber(rng),
    idNo: idNumber(rng),
  };
}

export function emptyRecord(): CopyRecord {
  return { name: '', birthDate: '', address: '', contactNo: '', idNo: '' };
}
