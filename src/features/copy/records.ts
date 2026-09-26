/**
 * The fake records shown in the Copy Test. All values are random combinations
 * of common names and places (see data/ph), never real people.
 *
 * The ID number follows a MADE-UP pattern ("ED-2026-04517-K") that is not
 * shaped like any real government ID (SSS, TIN, PhilHealth, etc.).
 */
import { intBetween, type Rng } from '../../lib/random';
import { address, birthDate, digits, fullName, upperLetter } from '../typing/generatePassage';

export type CopyRecord = {
  name: string;
  birthDate: string;
  address: string;
  idNo: string;
};

export type FieldKey = keyof CopyRecord;

/** The form fields, in the order they are typed. */
export const FIELDS: { key: FieldKey; label: string; hint?: string }[] = [
  { key: 'name', label: 'Pangalan' },
  { key: 'birthDate', label: 'Petsa ng kapanganakan', hint: 'mm/dd/yyyy' },
  { key: 'address', label: 'Address' },
  { key: 'idNo', label: 'ID No.' },
];

export const FIELD_LABEL: Record<FieldKey, string> = Object.fromEntries(
  FIELDS.map((f) => [f.key, f.label]),
) as Record<FieldKey, string>;

/** Made-up ID pattern, e.g. ED-2026-04517-K */
export function idNumber(rng: Rng): string {
  return `ED-${intBetween(rng, 2019, 2026)}-${digits(rng, 5)}-${upperLetter(rng)}`;
}

export function makeRecord(rng: Rng): CopyRecord {
  return { name: fullName(rng), birthDate: birthDate(rng), address: address(rng), idNo: idNumber(rng) };
}

export function emptyRecord(): CopyRecord {
  return { name: '', birthDate: '', address: '', idNo: '' };
}
