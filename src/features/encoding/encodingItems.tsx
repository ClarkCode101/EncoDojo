/**
 * Makes the documents to encode, one after another, for the entry runners.
 * Used by Document Encoding practice (one document type) and the Assessment
 * (a fixed mix: invoice, delivery receipt, application form, repeated).
 */
import type { EntryItem } from '../../components/entry/types';
import { makeRng, randomSeed } from '../../lib/random';
import DocumentView from './DocumentView';
import { ASSESSMENT_DOC_ORDER, DOC_INFO, expectedValues, makeDocument, type DocType } from './documents';

/** A new random source of documents. Call it once per run. */
export function encodingItems(docType: DocType | 'mix'): (index: number) => EntryItem {
  const rng = makeRng(randomSeed());
  return (index) => {
    const type = docType === 'mix' ? ASSESSMENT_DOC_ORDER[index % ASSESSMENT_DOC_ORDER.length] : docType;
    const doc = makeDocument(rng, type);
    return {
      title: DOC_INFO[type].label,
      source: <DocumentView doc={doc} />,
      fields: DOC_INFO[type].fields,
      expected: expectedValues(doc),
    };
  };
}
