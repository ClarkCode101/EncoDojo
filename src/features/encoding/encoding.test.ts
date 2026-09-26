import { describe, expect, it } from 'vitest';
import { makeRng } from '../../lib/random';
import { display } from '../../lib/scoring';
import {
  ASSESSMENT_DOC_ORDER,
  DOC_INFO,
  DOC_TYPES,
  expectedValues,
  makeDocument,
  type DeliveryDoc,
  type InvoiceDoc,
} from './documents';
import { DATE_STYLES, encodeAmount, formatDateShown, formatPeso } from './rules';
import { buildEncodingSession, docTypeFromCode, scoreEncoding } from './scoreEncoding';

/** "12,450.75" or "₱12,450.75" -> 1245075 centavos */
const cents = (text: string) => Math.round(Number(text.replace(/[₱,]/g, '')) * 100);

function many(type: (typeof DOC_TYPES)[number], count = 100, seed = 7) {
  const rng = makeRng(seed);
  return Array.from({ length: count }, () => makeDocument(rng, type));
}

describe('encoding rules', () => {
  it('prints dates in several paper styles', () => {
    expect(formatDateShown(2026, 9, 14, 'long')).toBe('September 14, 2026');
    expect(formatDateShown(2026, 9, 14, 'short')).toBe('Sept. 14, 2026');
    expect(formatDateShown(2026, 9, 4, 'numeric')).toBe('09/04/2026');
    expect(formatDateShown(2026, 9, 4, 'dayFirst')).toBe('04-Sep-2026');
    expect(formatDateShown(2026, 5, 1, 'short')).toBe('May 1, 2026'); // May has no period
  });

  it('prints amounts with ₱ and commas, encodes them without', () => {
    expect(formatPeso(511525)).toBe('₱5,115.25');
    expect(encodeAmount(511525)).toBe('5115.25');
    expect(encodeAmount(1234500)).toBe('12345.00');
  });
});

describe('makeDocument', () => {
  it('is the same for the same seed', () => {
    for (const type of DOC_TYPES) {
      expect(makeDocument(makeRng(3), type)).toEqual(makeDocument(makeRng(3), type));
    }
  });

  it('every document has exactly its 5 fields, all typeable, no ₱ or outer spaces', () => {
    for (const type of DOC_TYPES) {
      for (const doc of many(type, 50)) {
        const expected = expectedValues(doc);
        expect(Object.keys(expected).sort()).toEqual(DOC_INFO[type].fields.map((f) => f.key).sort());
        for (const value of Object.values(expected)) {
          expect(value).toMatch(/^[\x20-\x7E]+$/);
          expect(value).toBe(value.trim());
        }
      }
    }
  });

  it('encoded dates are always mm/dd/yyyy, whatever the paper shows', () => {
    for (const type of DOC_TYPES) {
      for (const doc of many(type, 50)) {
        const e = expectedValues(doc);
        for (const key of ['date', 'birthDate']) {
          if (e[key]) expect(e[key]).toMatch(/^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d)\/(19|20)\d{2}$/);
        }
      }
    }
  });

  it('uses every date style on paper', () => {
    const shown = many('invoice', 200).map((d) => (d as InvoiceDoc).date.shown);
    expect(shown.some((s) => /^[A-Z][a-z]+ \d+, \d{4}$/.test(s))).toBe(true); // long
    expect(shown.some((s) => /\. \d+, \d{4}$/.test(s))).toBe(true); // short
    expect(shown.some((s) => /^\d{2}\/\d{2}\/\d{4}$/.test(s))).toBe(true); // numeric
    expect(shown.some((s) => /^\d{2}-[A-Z][a-z]{2}-\d{4}$/.test(s))).toBe(true); // day first
    expect(DATE_STYLES).toHaveLength(4);
  });

  it('invoice math adds up, and the encoded total has no ₱ or commas', () => {
    for (const doc of many('invoice', 100) as InvoiceDoc[]) {
      for (const line of doc.lines) expect(line.qty * line.unitPrice).toBe(line.amount);
      expect(doc.lines.reduce((s, l) => s + l.amount, 0)).toBe(doc.total);
      const encoded = expectedValues(doc).total;
      expect(encoded).toMatch(/^\d+\.\d{2}$/);
      expect(cents(encoded)).toBe(cents(formatPeso(doc.total)));
    }
  });

  it('delivery receipt total quantity adds up', () => {
    for (const doc of many('delivery', 100) as DeliveryDoc[]) {
      expect(doc.lines.reduce((s, l) => s + l.qty, 0)).toBe(doc.totalQty);
      expect(expectedValues(doc).totalQty).toBe(String(doc.totalQty));
    }
  });

  it('uses only made-up reference patterns (no TIN-like numbers)', () => {
    for (const type of ['invoice', 'delivery'] as const) {
      for (const doc of many(type, 50)) {
        const refNo = (doc as InvoiceDoc | DeliveryDoc).seller.refNo;
        expect(refNo).toMatch(/^REF-[A-Z]{2}-\d{5}$/);
      }
    }
  });

  it('a company never sells or delivers to itself', () => {
    for (const doc of many('invoice', 200) as InvoiceDoc[]) expect(doc.soldTo).not.toBe(doc.seller.name);
    for (const doc of many('delivery', 200) as DeliveryDoc[]) expect(doc.deliverTo).not.toBe(doc.seller.name);
  });

  it('application form: middle name differs from surname', () => {
    for (const doc of many('application', 100)) {
      if (doc.type === 'application') expect(doc.middleName).not.toBe(doc.surname);
    }
  });

  it('the assessment mix covers all three documents', () => {
    expect([...ASSESSMENT_DOC_ORDER].sort()).toEqual([...DOC_TYPES].sort());
  });
});

describe('scoreEncoding', () => {
  const invoice = makeDocument(makeRng(11), 'invoice');
  const delivery = makeDocument(makeRng(12), 'delivery');

  it('all fields right in two different documents', () => {
    const { metrics, mistakes } = scoreEncoding(
      [
        { doc: invoice, typed: expectedValues(invoice) },
        { doc: delivery, typed: expectedValues(delivery) },
      ],
      null,
      60,
    );
    expect(metrics).toMatchObject({ records: 2, totalFields: 10, correctFields: 10, fieldAccuracy: 100 });
    expect(mistakes).toEqual([]);
  });

  it('typing the date as printed (not converted) is a mistake', () => {
    // Find an invoice whose paper date is NOT already mm/dd/yyyy.
    const doc = many('invoice', 50).find(
      (d) => (d as InvoiceDoc).date.shown !== expectedValues(d).date,
    ) as InvoiceDoc;
    const typed = { ...expectedValues(doc), date: doc.date.shown };
    const { metrics, mistakes } = scoreEncoding([{ doc, typed }], null, 60);
    expect(display(metrics.fieldAccuracy)).toBe(80);
    expect(mistakes.map((m) => m.field)).toEqual(['date']);
  });

  it('typing the total with ₱ or commas is a mistake', () => {
    const typed = { ...expectedValues(invoice), total: formatPeso((invoice as InvoiceDoc).total) };
    const { mistakes } = scoreEncoding([{ doc: invoice, typed }], null, 60);
    expect(mistakes.map((m) => m.field)).toEqual(['total']);
  });

  it('buildEncodingSession saves documents, layout, and document type', () => {
    const s = buildEncodingSession([{ doc: invoice, typed: expectedValues(invoice) }], null, 60, 180, 'sheet', 'invoice');
    expect(s.type).toBe('encoding');
    expect(s.metrics).toMatchObject({ documents: 1, sheet: 1, docType: 1, seconds: 180 });
    expect(docTypeFromCode(s.metrics.docType)).toBe('invoice');
    const mix = buildEncodingSession([], null, 60, 180, 'form', 'mix');
    expect(docTypeFromCode(mix.metrics.docType)).toBeNull();
  });
});
