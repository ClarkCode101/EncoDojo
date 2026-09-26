/**
 * Copy Test in SPREADSHEET layout: like encoding into Excel / Google Sheets.
 * One ROW per record, one COLUMN per field.
 *
 * Keyboard (like Excel):
 * - Tab / Shift+Tab: next / previous cell.
 * - Enter: done with this row -> first cell of the next row. On the last row,
 *   Enter adds the next record (a new row).
 * Earlier rows can still be fixed, like in a real sheet; the FINAL contents
 * are checked when time is up. The last row counts as finished only after
 * Enter (before that it only counts toward speed).
 *
 * It does NOT save anything; it hands a Session to `onFinish`.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Card, EnTl, Kbd, StatBadge, TimeLeft } from '../../components/ui';
import { makeRng, randomSeed } from '../../lib/random';
import { display } from '../../lib/scoring';
import { errorBeep } from '../../lib/sound';
import type { Session } from '../../lib/storage';
import { useCountdown } from '../../lib/useCountdown';
import { FIELDS, emptyRecord, makeRecord, type CopyRecord, type FieldKey } from './records';
import { buildCopySession, isFieldCorrect, scoreCopy, type SubmittedRecord } from './scoreCopy';

/** Column letters over the fields, like Excel (A = Name, B = Date of Birth, ...). */
const COLUMN_LETTERS = ['A', 'B', 'C', 'D', 'E'];

/** Column widths: Address is the longest, so it gets the most room. */
const COLUMN_WIDTHS: Record<FieldKey, string> = {
  // Wide enough that Contact No. and ID No. are fully visible.
  name: 'w-[21%]',
  birthDate: 'w-[12%]',
  address: 'w-[31%]',
  contactNo: 'w-[18%]',
  idNo: 'w-[18%]',
};

/** Pair each finished row with its record; the last row is still being typed. */
function splitRows(records: CopyRecord[], rows: CopyRecord[]) {
  const submitted: SubmittedRecord[] = records.slice(0, -1).map((expected, i) => ({ expected, typed: rows[i] }));
  return { submitted, unfinished: rows[rows.length - 1] ?? null };
}

export default function CopySheetRunner({
  seconds,
  showLiveStats,
  allowFinishEarly,
  sound,
  onStart,
  onFinish,
}: {
  seconds: number;
  showLiveStats: boolean;
  allowFinishEarly: boolean;
  sound: boolean;
  onStart?: () => void;
  onFinish: (session: Session, finishedEarly: boolean) => void;
}) {
  const rngRef = useRef(makeRng(randomSeed()));
  // records[i] is the source for rows[i]. The LAST one is the row being typed.
  const [records, setRecords] = useState<CopyRecord[]>(() => [makeRecord(rngRef.current)]);
  const [rows, setRows] = useState<CopyRecord[]>(() => [emptyRecord()]);
  const [message, setMessage] = useState<{ row: number; wrong: number } | null>(null);
  const cellRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const focusCell = (row: number, col: number) => {
    // Wait for React to draw a newly added row before focusing it.
    requestAnimationFrame(() => cellRefs.current[`${row}-${col}`]?.focus());
  };

  // Refs hold the latest values for the timer callback.
  const recordsRef = useRef(records);
  recordsRef.current = records;
  const rowsRef = useRef(rows);
  rowsRef.current = rows;
  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    onFinishRef.current = onFinish;
  });
  const finishedRef = useRef(false);

  const finish = useCallback(
    (elapsedSec: number, finishedEarly: boolean) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      const { submitted, unfinished } = splitRows(recordsRef.current, rowsRef.current);
      onFinishRef.current(buildCopySession(submitted, unfinished, elapsedSec, seconds, 'sheet'), finishedEarly);
    },
    [seconds],
  );

  const timer = useCountdown(seconds, () => finish(seconds, false));

  function change(row: number, key: FieldKey, value: string) {
    if (timer.finished) return;
    if (!timer.started && value.length > 0) {
      timer.start();
      onStart?.();
    }
    setRows((all) => all.map((r, i) => (i === row ? { ...r, [key]: value } : r)));
  }

  /** Enter in a row: check it, then go to the first cell of the next row. */
  function enterRow(row: number) {
    if (timer.finished) return;
    const typed = rowsRef.current[row];
    if (FIELDS.every((f) => typed[f.key].trim() === '')) return; // empty row: nothing to do

    const expected = recordsRef.current[row];
    const wrong = FIELDS.filter((f) => !isFieldCorrect(expected[f.key], typed[f.key])).length;
    if (wrong > 0 && sound) errorBeep();
    setMessage({ row, wrong });

    const isLastRow = row === rowsRef.current.length - 1;
    if (isLastRow) {
      setRecords((all) => [...all, makeRecord(rngRef.current)]);
      setRows((all) => [...all, emptyRecord()]);
    }
    focusCell(row + 1, 0);
  }

  const { submitted, unfinished } = splitRows(records, rows);
  const live = scoreCopy(submitted, unfinished, Math.max(timer.elapsedSec, 1)).metrics;
  const current = records[records.length - 1];
  // Excel numbers rows from 1, and row 1 holds the headers, so record #1 is on row 2.
  const excelRow = (i: number) => i + 2;

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <TimeLeft seconds={timer.remainingSec} started={timer.started} waitingText="naghihintay sa unang letra" />
        <StatBadge label="Natapos na row" value={submitted.length} />
        {showLiveStats && (
          <>
            <StatBadge label="Bilis (KPH)" value={timer.started ? display(live.kph).toLocaleString() : '–'} />
            <StatBadge label="Tamang field" value={`${display(live.fieldAccuracy)}%`} />
          </>
        )}
      </div>

      <Card>
        {/* The source document: the record to copy right now. */}
        <section aria-labelledby="sheet-record-title" className="rounded-md border border-stone-200 bg-white shadow-paper">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-dashed border-stone-200 px-5 py-2 text-sm">
            <span id="sheet-record-title" className="font-semibold text-brand-800">
              📄 Record #{records.length} → i-type sa row {excelRow(records.length - 1)}
            </span>
            <span className="text-stone-600">Kopyahin nang eksakto</span>
          </div>
          <dl className="grid gap-x-6 gap-y-3 px-5 py-4 sm:grid-cols-2 lg:grid-cols-5">
            {FIELDS.map((f) => (
              <div key={f.key} className={f.key === 'address' ? 'lg:col-span-2' : ''}>
                <dt className="text-sm font-medium text-stone-600">
                  <EnTl en={f.label} tl={f.tl} />
                </dt>
                <dd className="select-none font-mono text-lg text-stone-900">{current[f.key]}</dd>
              </div>
            ))}
          </dl>
        </section>

        {!timer.started && (
          <p className="mt-5 rounded-lg bg-brand-50 px-4 py-2 text-brand-950">
            I-type ang record sa row na may <strong>dilaw na numero</strong>. Pindutin ang <Kbd>Tab</Kbd> para sa
            susunod na cell (pakanan). Sa dulo ng row, pindutin ang <Kbd>Enter</Kbd> para bumaba sa susunod na row —
            ganito sa Excel. Magsisimula ang oras sa unang letra.
          </p>
        )}

        {/* The spreadsheet. */}
        <div className="mt-5 overflow-x-auto rounded-md border border-stone-300">
          <table className="w-full min-w-[52rem] table-fixed border-collapse text-left font-mono text-[0.95rem]">
            <caption className="sr-only">Spreadsheet: isang row bawat record</caption>
            <thead>
              {/* Column letters, like Excel */}
              <tr className="bg-stone-100 text-center text-xs font-semibold text-stone-500">
                <th scope="col" className="w-12 border border-stone-300 py-1">
                  <span className="sr-only">Row</span>
                </th>
                {FIELDS.map((f, c) => (
                  <th key={f.key} scope="col" className={`${COLUMN_WIDTHS[f.key]} border border-stone-300 py-1`}>
                    <span aria-hidden="true">{COLUMN_LETTERS[c]}</span>
                  </th>
                ))}
              </tr>
              {/* Row 1: the headers */}
              <tr>
                <th scope="row" className="border border-stone-300 bg-stone-100 text-center text-xs font-semibold text-stone-500">
                  1
                </th>
                {FIELDS.map((f) => (
                  <th key={f.key} scope="col" className="border border-stone-300 bg-white px-2 py-1.5 font-sans text-sm font-bold text-stone-900">
                    <EnTl en={f.label} tl={f.tl} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, r) => {
                const isCurrent = r === rows.length - 1;
                return (
                  <tr key={r}>
                    <th
                      scope="row"
                      className={
                        'border border-stone-300 text-center text-xs font-semibold ' +
                        (isCurrent ? 'bg-belt-300 text-brand-950' : 'bg-stone-100 text-stone-500')
                      }
                    >
                      {excelRow(r)}
                    </th>
                    {FIELDS.map((f, c) => (
                      <td key={f.key} className="border border-stone-300 p-0">
                        <input
                          ref={(el) => {
                            cellRefs.current[`${r}-${c}`] = el;
                          }}
                          autoFocus={r === 0 && c === 0}
                          aria-label={`Row ${excelRow(r)}, ${f.label}`}
                          type="text"
                          autoComplete="off"
                          spellCheck={false}
                          autoCorrect="off"
                          autoCapitalize="off"
                          value={row[f.key]}
                          onChange={(e) => change(r, f.key, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              enterRow(r);
                            }
                          }}
                          onPaste={(e) => e.preventDefault()}
                          onDrop={(e) => e.preventDefault()}
                          className="block w-full bg-transparent px-2 py-2 outline-none focus:bg-green-50 focus:ring-2 focus:ring-inset focus:ring-green-700"
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex min-h-12 flex-wrap items-center justify-between gap-3">
          <span role="status" className="text-lg font-bold">
            {message?.wrong === 0 && <span className="text-green-800">✓ Row {excelRow(message.row)}: lahat tama!</span>}
            {message && message.wrong > 0 && (
              <span className="text-red-700">
                ✗ Row {excelRow(message.row)}: {message.wrong} cell ang mali
              </span>
            )}
          </span>
          {allowFinishEarly && timer.started && (
            <Button variant="secondary" onClick={() => finish(timer.stop(), true)}>
              <EnTl en="Finish" tl="Tapusin na" />
            </Button>
          )}
        </div>
        <p className="mt-2 text-stone-700">
          Puwede mong balikan at ayusin ang mga naunang row. Ang huling laman ng sheet ang iche-check. Walang
          copy-paste.
        </p>
      </Card>
    </>
  );
}
