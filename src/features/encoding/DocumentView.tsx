/**
 * Paper-like views of the fake documents (the "source document" the encoder
 * reads from). Plain HTML, not images, so text stays sharp at any size.
 *
 * Styling notes:
 * - Document numbers are red, like pre-printed invoice / DR booklets.
 * - On the application form, the filled-in answers are in blue "ink" so it
 *   looks filled in by hand (but stays easy to read).
 */
import type { ReactNode } from 'react';
import { formatAmount } from '../../lib/format';
import type { ApplicationDoc, DeliveryDoc, EncodingDoc, InvoiceDoc, Seller } from './documents';
import { formatPeso } from './rules';

/** The sheet of paper every document sits on. */
function Paper({ children, label }: { children: ReactNode; label: string }) {
  return (
    <article
      aria-label={label}
      className="mx-auto w-full max-w-3xl rounded-sm border border-stone-300 bg-white px-6 py-6 font-sans text-[0.95rem] text-stone-900 shadow-paper sm:px-8"
    >
      {children}
    </article>
  );
}

function SellerHeader({ seller }: { seller: Seller }) {
  return (
    <div>
      <div className="text-xl font-extrabold uppercase tracking-wide">{seller.name}</div>
      <div className="text-sm text-stone-700">{seller.address}</div>
      <div className="text-sm text-stone-700">Ref. No.: {seller.refNo}</div>
    </div>
  );
}

/** "SALES INVOICE  No. SI-2026-018734" box at the top right. */
function TitleBox({ title, number }: { title: string; number: string }) {
  return (
    <div className="shrink-0 text-right">
      <div className="inline-block border-2 border-stone-900 px-3 py-1 text-lg font-black tracking-widest">{title}</div>
      <div className="mt-1 font-mono text-lg font-bold text-red-700">No. {number}</div>
    </div>
  );
}

/** "Label: value" on an underline, like a printed form line. */
function Line({ label, value, className = '' }: { label: string; value: ReactNode; className?: string }) {
  return (
    <div className={`flex items-baseline gap-2 ${className}`}>
      <span className="shrink-0 text-sm font-semibold text-stone-700">{label}</span>
      <span className="min-w-0 flex-1 border-b border-stone-400 pb-0.5">{value}</span>
    </div>
  );
}

function Signature({ label, name }: { label: string; name?: string }) {
  return (
    <div className="text-center">
      <div className="h-6 border-b border-stone-500 text-sm italic text-stone-700">{name}</div>
      <div className="mt-1 text-xs text-stone-600">{label}</div>
    </div>
  );
}

const th = 'border border-stone-400 bg-stone-100 px-2 py-1 text-left text-xs font-bold uppercase tracking-wide';
const td = 'border border-stone-300 px-2 py-1';

function InvoiceView({ doc }: { doc: InvoiceDoc }) {
  return (
    <Paper label={`Sales Invoice ${doc.invoiceNo}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SellerHeader seller={doc.seller} />
        <TitleBox title="SALES INVOICE" number={doc.invoiceNo} />
      </div>

      <div className="mt-5 grid gap-x-8 gap-y-2 sm:grid-cols-[2fr_1fr]">
        <Line label="Sold to:" value={doc.soldTo} />
        <Line label="Date:" value={doc.date.shown} />
        <Line label="Address:" value={doc.soldToAddress} />
        <Line label="Terms:" value={doc.terms} />
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[32rem] border-collapse">
          <thead>
            <tr>
              <th className={`${th} w-16 text-right`}>Qty</th>
              <th className={`${th} w-20`}>Unit</th>
              <th className={th}>Articles / Description</th>
              <th className={`${th} w-28 text-right`}>Unit Price</th>
              <th className={`${th} w-32 text-right`}>Amount</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {doc.lines.map((line, i) => (
              <tr key={i}>
                <td className={`${td} text-right`}>{line.qty}</td>
                <td className={td}>{line.unit}</td>
                <td className={td}>{line.description}</td>
                <td className={`${td} text-right`}>{formatAmount(line.unitPrice / 100)}</td>
                <td className={`${td} text-right`}>{formatAmount(line.amount / 100)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} className={`${td} text-right text-sm font-bold uppercase`}>
                Total Amount Due
              </td>
              <td className={`${td} text-right text-lg font-extrabold tabular-nums`}>{formatPeso(doc.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="mt-4 text-xs italic text-stone-600">Received the above goods in good order and condition.</p>
      <div className="mt-6 grid grid-cols-2 gap-8">
        <Signature label="Customer's Signature" />
        <Signature label="Authorized Signature" />
      </div>
    </Paper>
  );
}

function DeliveryView({ doc }: { doc: DeliveryDoc }) {
  return (
    <Paper label={`Delivery Receipt ${doc.drNo}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SellerHeader seller={doc.seller} />
        <TitleBox title="DELIVERY RECEIPT" number={doc.drNo} />
      </div>

      <div className="mt-5 grid gap-x-8 gap-y-2 sm:grid-cols-[2fr_1fr]">
        <Line label="Deliver to:" value={doc.deliverTo} />
        <Line label="Date:" value={doc.date.shown} />
        <Line label="Address:" value={doc.address} className="sm:col-span-2" />
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[26rem] border-collapse">
          <thead>
            <tr>
              <th className={`${th} w-20 text-right`}>Qty</th>
              <th className={`${th} w-24`}>Unit</th>
              <th className={th}>Description</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {doc.lines.map((line, i) => (
              <tr key={i}>
                <td className={`${td} text-right`}>{line.qty}</td>
                <td className={td}>{line.unit}</td>
                <td className={td}>{line.description}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className={`${td} text-right text-lg font-extrabold tabular-nums`}>{doc.totalQty}</td>
              <td colSpan={2} className={`${td} text-sm font-bold uppercase`}>
                Total Qty
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-8">
        <Signature label="Delivered by" name={doc.deliveredBy} />
        <Signature label="Received by (Signature over Printed Name)" />
      </div>
    </Paper>
  );
}

/** A labeled box of a paper form, with the answer in blue "ink". */
function FormBox({ label, value, className = '' }: { label: string; value: string; className?: string }) {
  return (
    <div className={`border border-stone-400 px-2 pb-1.5 pt-1 ${className}`}>
      <div className="text-[0.7rem] font-semibold uppercase tracking-wide text-stone-600">{label}</div>
      <div className="min-h-6 text-lg text-blue-900">{value}</div>
    </div>
  );
}

function ApplicationView({ doc }: { doc: ApplicationDoc }) {
  return (
    <Paper label={`Application Form ${doc.applicationNo}`}>
      <div className="text-center">
        <div className="text-lg font-extrabold uppercase tracking-wide">{doc.organization}</div>
        <div className="mt-1 text-xl font-black tracking-widest">MEMBERSHIP APPLICATION FORM</div>
      </div>
      <div className="mt-3 flex flex-wrap justify-between gap-2 text-sm">
        <span>
          Application No.: <span className="font-mono font-bold text-red-700">{doc.applicationNo}</span>
        </span>
        <span>
          Date filed: <span className="text-blue-900">{doc.dateFiled.shown}</span>
        </span>
      </div>

      <div className="mt-4 bg-stone-800 px-2 py-1 text-xs font-bold uppercase tracking-widest text-white">
        I. Personal Information
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3">
        <FormBox label="Surname" value={doc.surname} />
        <FormBox label="Given Name" value={doc.givenName} />
        <FormBox label="Middle Name" value={doc.middleName} />
        <FormBox label="Date of Birth" value={doc.birthDate.shown} />
        <FormBox label="Civil Status" value={doc.civilStatus} />
        <FormBox label="Occupation" value={doc.occupation} />
        <FormBox label="Home Address" value={doc.address} className="sm:col-span-2" />
        <FormBox label="Contact No." value={doc.contactNo} />
      </div>

      <p className="mt-4 text-xs italic text-stone-600">
        I hereby certify that the above information is true and correct.
      </p>
      <div className="mt-6 ml-auto w-64">
        <Signature label="Signature of Applicant" />
      </div>
    </Paper>
  );
}

export default function DocumentView({ doc }: { doc: EncodingDoc }) {
  if (doc.type === 'invoice') return <InvoiceView doc={doc} />;
  if (doc.type === 'delivery') return <DeliveryView doc={doc} />;
  return <ApplicationView doc={doc} />;
}
