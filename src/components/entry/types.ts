/**
 * Shared types for the "entry runners" (form and spreadsheet), used by the
 * Copy Test and Document Encoding.
 */
import type { ReactNode } from 'react';
import type { FieldSpec, FilledRecord, Values } from '../../lib/fieldScoring';

/** One thing to encode: what to show (the source), its fields, and the right values. */
export type EntryItem = {
  /** e.g. "Record" or "Sales Invoice" — shown above the source (the runner adds the number). */
  title: string;
  /** The source document / record card to read from. */
  source: ReactNode;
  fields: readonly FieldSpec[];
  expected: Values;
};

/** What a finished run hands back; the page turns it into a Session. */
export type EntryResult = {
  submitted: FilledRecord[];
  /** The record still being typed when time ran out (counts for speed only). */
  unfinished: { fields: readonly FieldSpec[]; typed: Values } | null;
  elapsedSec: number;
};

/** Everything both runners need from the page. */
export type EntryRunnerProps = {
  seconds: number;
  showLiveStats: boolean;
  allowFinishEarly: boolean;
  sound: boolean;
  /** Makes the next item to encode (called once at the start, then after each submit). */
  nextItem: () => EntryItem;
  /** Word for one item in messages, e.g. "record" or "dokumento". */
  unit: string;
  onStart?: () => void;
  onFinish: (result: EntryResult, finishedEarly: boolean) => void;
};

export function emptyValues(fields: readonly FieldSpec[]): Values {
  return Object.fromEntries(fields.map((f) => [f.key, '']));
}
