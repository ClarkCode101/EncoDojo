/**
 * Scoring for Document Encoding: the shared field-by-field scoring
 * (lib/fieldScoring.ts), where each document brings its own 5 fields and its
 * correct values come from the encoding rules (see documents.ts / rules.ts).
 */
import { scoreRecords, type Values } from '../../lib/fieldScoring';
import { makeId, type CopyMode, type Session } from '../../lib/storage';
import { DOC_INFO, expectedValues, type DocType, type EncodingDoc } from './documents';

/** A document the user finished (or is still working on), with what they typed. */
export type EncodedDoc = { doc: EncodingDoc; typed: Values };

/** Saved as a number in the session (metrics must be numbers). 0 = a mix of documents. */
export const DOC_TYPE_CODE: Record<DocType, number> = { invoice: 1, delivery: 2, application: 3 };

export function docTypeFromCode(code: number | undefined): DocType | null {
  const found = (Object.keys(DOC_TYPE_CODE) as DocType[]).find((t) => DOC_TYPE_CODE[t] === code);
  return found ?? null;
}

export function scoreEncoding(submitted: EncodedDoc[], unfinished: EncodedDoc | null, elapsedSec: number) {
  return scoreRecords(
    submitted.map(({ doc, typed }) => ({ fields: DOC_INFO[doc.type].fields, expected: expectedValues(doc), typed })),
    unfinished ? { fields: DOC_INFO[unfinished.doc.type].fields, typed: unfinished.typed } : null,
    elapsedSec,
  );
}

/** Keep saved sessions small. */
const MAX_SAVED_MISTAKES = 100;

/**
 * The finished run as a Session.
 * metrics.documents = finished documents, metrics.sheet = 1 for the
 * spreadsheet layout, metrics.docType = which document (0 = a mix).
 */
export function buildEncodingSession(
  submitted: EncodedDoc[],
  unfinished: EncodedDoc | null,
  elapsedSec: number,
  seconds: number,
  mode: CopyMode,
  docType: DocType | 'mix',
): Session {
  const { metrics, mistakes } = scoreEncoding(submitted, unfinished, elapsedSec);
  return {
    id: makeId(),
    type: 'encoding',
    startedAt: new Date(Date.now() - elapsedSec * 1000).toISOString(),
    durationSec: elapsedSec,
    metrics: {
      ...metrics,
      documents: metrics.records,
      seconds,
      sheet: mode === 'sheet' ? 1 : 0,
      docType: docType === 'mix' ? 0 : DOC_TYPE_CODE[docType],
    },
    mistakes: mistakes.slice(0, MAX_SAVED_MISTAKES),
  };
}
