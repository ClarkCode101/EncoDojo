/**
 * Fake documents for Document Encoding, plus the correct encoded values.
 *
 * Three kinds (owner's choice): Sales Invoice, Delivery Receipt, Application
 * Form. Only KEY FIELDS are encoded (5 per document), like an invoice log.
 *
 * Everything is fake: made-up companies, people, and a made-up "Ref. No."
 * instead of any real tax/government number. Money is handled in centavos
 * so totals always add up.
 */
import * as ph from '../../data/ph';
import type { FieldSpec, Values } from '../../lib/fieldScoring';
import { intBetween, pick, shuffle, type Rng } from '../../lib/random';
import { contactNumber } from '../copy/records';
import { address, digits, fullName, nameParts, upperLetter } from '../typing/generatePassage';
import { docDate, encodeAmount, type DocDate } from './rules';

export type DocType = 'invoice' | 'delivery' | 'application';
export const DOC_TYPES: DocType[] = ['invoice', 'delivery', 'application'];

/** Name of each document and the fields to encode from it (English label + Taglish meaning). */
export const DOC_INFO: Record<DocType, { label: string; tl: string; fields: FieldSpec[] }> = {
  invoice: {
    label: 'Sales Invoice',
    tl: 'resibo ng benta',
    fields: [
      { key: 'invoiceNo', label: 'Invoice No.', tl: 'Numero ng invoice' },
      { key: 'date', label: 'Date', tl: 'Petsa', hint: 'mm/dd/yyyy' },
      { key: 'customer', label: 'Customer', tl: 'Bumili' },
      { key: 'terms', label: 'Terms', tl: 'Kondisyon ng bayad' },
      { key: 'total', label: 'Total Amount', tl: 'Kabuuang halaga', hint: 'walang ₱ at comma' },
    ],
  },
  delivery: {
    label: 'Delivery Receipt',
    tl: 'resibo ng delivery',
    fields: [
      { key: 'drNo', label: 'DR No.', tl: 'Numero ng DR' },
      { key: 'date', label: 'Date', tl: 'Petsa', hint: 'mm/dd/yyyy' },
      { key: 'deliverTo', label: 'Deliver To', tl: 'Padadalhan' },
      { key: 'address', label: 'Address', tl: 'Tirahan' },
      { key: 'totalQty', label: 'Total Qty', tl: 'Kabuuang dami' },
    ],
  },
  application: {
    label: 'Application Form',
    tl: 'form ng aplikasyon',
    fields: [
      { key: 'lastName', label: 'Last Name', tl: 'Apelyido' },
      { key: 'firstName', label: 'First Name', tl: 'Pangalan' },
      { key: 'birthDate', label: 'Birth Date', tl: 'Kapanganakan', hint: 'mm/dd/yyyy' },
      { key: 'address', label: 'Address', tl: 'Tirahan' },
      { key: 'contactNo', label: 'Contact No.', tl: 'Numero ng telepono' },
    ],
  },
};

/** Every field key -> its label, for mistake lists (same key = same label in every document). */
export const ENCODING_FIELD_LABEL: Record<string, string> = Object.fromEntries(
  DOC_TYPES.flatMap((t) => DOC_INFO[t].fields.map((f) => [f.key, `${f.label} (${f.tl})`])),
);

// ---------- document data (what is printed on the paper) ----------

export type Seller = { name: string; address: string; refNo: string };

export type InvoiceLine = { qty: number; unit: string; description: string; unitPrice: number; amount: number };

export type InvoiceDoc = {
  type: 'invoice';
  seller: Seller;
  invoiceNo: string;
  date: DocDate;
  soldTo: string;
  soldToAddress: string;
  terms: string;
  lines: InvoiceLine[];
  /** centavos */
  total: number;
};

export type DeliveryLine = { qty: number; unit: string; description: string };

export type DeliveryDoc = {
  type: 'delivery';
  seller: Seller;
  drNo: string;
  date: DocDate;
  deliverTo: string;
  address: string;
  lines: DeliveryLine[];
  totalQty: number;
  deliveredBy: string;
};

export type ApplicationDoc = {
  type: 'application';
  organization: string;
  applicationNo: string;
  surname: string;
  givenName: string;
  middleName: string;
  birthDate: DocDate;
  civilStatus: string;
  occupation: string;
  address: string;
  contactNo: string;
  dateFiled: DocDate;
};

export type EncodingDoc = InvoiceDoc | DeliveryDoc | ApplicationDoc;

// ---------- generators ----------

const year = (rng: Rng) => intBetween(rng, 2024, 2026);
const month = (rng: Rng) => intBetween(rng, 1, 12);
const day = (rng: Rng) => intBetween(rng, 1, 28);

/** Made-up reference number (NOT shaped like a TIN or any real government ID). */
function refNo(rng: Rng): string {
  return `REF-${upperLetter(rng)}${upperLetter(rng)}-${digits(rng, 5)}`;
}

function seller(rng: Rng): Seller {
  return { name: pick(rng, ph.companies), address: address(rng), refNo: refNo(rng) };
}

/** The buyer / receiver: another company (never the seller itself) or a person. */
function customer(rng: Rng, sellerName: string, companyShare: number): string {
  if (rng() >= companyShare) return fullName(rng);
  return pick(rng, ph.companies.filter((c) => c !== sellerName));
}

function makeInvoice(rng: Rng): InvoiceDoc {
  const y = year(rng);
  const items = shuffle(rng, ph.officeItems).slice(0, intBetween(rng, 2, 4));
  const lines = items.map(([description, unit, min, max]) => {
    const qty = intBetween(rng, 1, 40);
    const unitPrice = intBetween(rng, min * 100, max * 100);
    return { qty, unit, description, unitPrice, amount: qty * unitPrice };
  });
  const from = seller(rng);
  return {
    type: 'invoice',
    seller: from,
    invoiceNo: `SI-${y}-${digits(rng, 6)}`,
    date: docDate(rng, y, month(rng), day(rng)),
    soldTo: customer(rng, from.name, 0.6),
    soldToAddress: address(rng),
    terms: pick(rng, ph.paymentTerms),
    lines,
    total: lines.reduce((sum, l) => sum + l.amount, 0),
  };
}

function makeDelivery(rng: Rng): DeliveryDoc {
  const y = year(rng);
  const items = shuffle(rng, ph.officeItems).slice(0, intBetween(rng, 2, 5));
  const lines = items.map(([description, unit]) => ({ qty: intBetween(rng, 1, 60), unit, description }));
  const from = seller(rng);
  return {
    type: 'delivery',
    seller: from,
    drNo: `DR-${y}-${digits(rng, 6)}`,
    date: docDate(rng, y, month(rng), day(rng)),
    deliverTo: customer(rng, from.name, 0.5),
    address: address(rng),
    lines,
    totalQty: lines.reduce((sum, l) => sum + l.qty, 0),
    deliveredBy: fullName(rng),
  };
}

function makeApplication(rng: Rng): ApplicationDoc {
  const name = nameParts(rng);
  return {
    type: 'application',
    organization: pick(rng, ph.organizations),
    applicationNo: `APP-${digits(rng, 6)}`,
    surname: name.surname,
    givenName: name.given,
    middleName: name.middle,
    birthDate: docDate(rng, intBetween(rng, 1965, 2005), month(rng), day(rng)),
    civilStatus: pick(rng, ph.civilStatuses),
    occupation: pick(rng, ph.occupations),
    address: address(rng),
    contactNo: contactNumber(rng),
    dateFiled: docDate(rng, year(rng), month(rng), day(rng)),
  };
}

export function makeDocument(rng: Rng, type: DocType): EncodingDoc {
  if (type === 'invoice') return makeInvoice(rng);
  if (type === 'delivery') return makeDelivery(rng);
  return makeApplication(rng);
}

/** The correct encoded value for each field of the document (after the encoding rules). */
export function expectedValues(doc: EncodingDoc): Values {
  switch (doc.type) {
    case 'invoice':
      return {
        invoiceNo: doc.invoiceNo,
        date: doc.date.encoded,
        customer: doc.soldTo,
        terms: doc.terms,
        total: encodeAmount(doc.total),
      };
    case 'delivery':
      return {
        drNo: doc.drNo,
        date: doc.date.encoded,
        deliverTo: doc.deliverTo,
        address: doc.address,
        totalQty: String(doc.totalQty),
      };
    case 'application':
      return {
        lastName: doc.surname,
        firstName: doc.givenName,
        birthDate: doc.birthDate.encoded,
        address: doc.address,
        contactNo: doc.contactNo,
      };
  }
}

/** The Assessment always uses this order (a fixed mix), repeated. */
export const ASSESSMENT_DOC_ORDER: DocType[] = ['invoice', 'delivery', 'application'];
