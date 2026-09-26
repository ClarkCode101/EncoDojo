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
import { intBetween, pick, type Rng } from '../../lib/random';
import { address, birthDate, digits, fullName, upperLetter } from '../typing/generatePassage';

export type CopyRecord = {
  name: string;
  birthDate: string;
  address: string;
  contactNo: string;
  idNo: string;
};

export type FieldKey = keyof CopyRecord;

/** The form fields, in the order they are typed. */
export const FIELDS: { key: FieldKey; label: string; hint?: string }[] = [
  { key: 'name', label: 'Pangalan' },
  { key: 'birthDate', label: 'Petsa ng kapanganakan', hint: 'mm/dd/yyyy' },
  { key: 'address', label: 'Address' },
  { key: 'contactNo', label: 'Contact No.' },
  { key: 'idNo', label: 'ID No.' },
];

export const FIELD_LABEL: Record<FieldKey, string> = Object.fromEntries(
  FIELDS.map((f) => [f.key, f.label]),
) as Record<FieldKey, string>;

/** Made-up ID pattern, e.g. ED-2026-04517-K */
export function idNumber(rng: Rng): string {
  return `ED-${intBetween(rng, 2019, 2026)}-${digits(rng, 5)}-${upperLetter(rng)}`;
}

/** Common 3-digit provincial area codes (only the format matters here). */
const AREA_CODES = ['032', '033', '034', '036', '038', '042', '043', '044', '045', '046', '047', '049', '052', '054', '074', '082', '088'];

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
