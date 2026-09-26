/**
 * SPREADSHEET layout (like Excel / Google Sheets): one ROW per item, one
 * COLUMN per field. Used by the Copy Test and Document Encoding practice.
 * All items must have the same fields (they become the columns).
 *
 * Keyboard (like Excel):
 * - Tab / Shift+Tab: next / previous cell.
 * - Enter: done with this row -> first cell of the next row. On the last row,
 *   Enter adds the next item (a new row).
 * Earlier rows can still be fixed, like in a real sheet; the FINAL contents
 * are checked when time is up. The last row counts as finished only after
 * Enter (before that it only counts toward speed).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { isFieldCorrect, scoreRecords, type FilledRecord, type Values } from '../../lib/fieldScoring';
import { display } from '../../lib/scoring';
import { errorBeep } from '../../lib/sound';
import { useCountdown } from '../../lib/useCountdown';
import { Button, Card, EnTl, Kbd, StatBadge, TimeLeft } from '../ui';
import { emptyValues, type EntryItem, type EntryRunnerProps } from './types';

/** Excel-style column letters: A, B, C, ... */
const columnLetter = (i: number) => String.fromCharCode(65 + i);

/** Excel numbers rows from 1, and row 1 holds the headers, so item #1 is on row 2. */
const excelRow = (i: number) => i + 2;

/** Pair each finished row with its item; the last row is still being typed. */
function splitRows(items: EntryItem[], rows: Values[]) {
  const submitted: FilledRecord[] = items
    .slice(0, -1)
    .map((item, i) => ({ fields: item.fields, expected: item.expected, typed: rows[i] }));
  const last = items[items.length - 1];
  return { submitted, unfinished: { fields: last.fields, typed: rows[rows.length - 1] } };
}

export default function EntrySheetRunner({
  seconds,
  showLiveStats,
  allowFinishEarly,
  sound,
  nextItem,
  unit,
  onStart,
  onFinish,
  columnWidths = {},
  scrollSource = false,
}: EntryRunnerProps & {
  /** Tailwind width per column key, e.g. { address: 'w-[31%]' }. */
  columnWidths?: Record<string, string>;
  /** Tall sources (documents) scroll inside a box so the sheet stays in view. */
  scrollSource?: boolean;
}) {
  // items[i] is the source for rows[i]. The LAST one is the row being typed.
  const [items, setItems] = useState<EntryItem[]>(() => [nextItem()]);
  const [rows, setRows] = useState<Values[]>(() => [emptyValues(items[0].fields)]);
  const [message, setMessage] = useState<{ row: number; wrong: number } | null>(null);
  const cellRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const focusCell = (row: number, col: number) => {
    // Wait for React to draw a newly added row before focusing it.
    requestAnimationFrame(() => cellRefs.current[`${row}-${col}`]?.focus());
  };
  const fields = items[0].fields;

  // Refs hold the latest values for the timer callback.
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const rowsRef = useRef(rows);
  rowsRef.current = rows;
  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    onFinishRef.current = onFinish;
  });
  const finishedRef = useRef(false);

  const finish = useCallback((elapsedSec: number, finishedEarly: boolean) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const { submitted, unfinished } = splitRows(itemsRef.current, rowsRef.current);
    onFinishRef.current({ submitted, unfinished, elapsedSec }, finishedEarly);
  }, []);

  const timer = useCountdown(seconds, () => finish(seconds, false));

  function change(row: number, key: string, value: string) {
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
    if (fields.every((f) => (typed[f.key] ?? '').trim() === '')) return; // empty row: nothing to do

    const expected = itemsRef.current[row].expected;
    const wrong = fields.filter((f) => !isFieldCorrect(expected[f.key], typed[f.key] ?? '')).length;
    if (wrong > 0 && sound) errorBeep();
    setMessage({ row, wrong });

    const isLastRow = row === rowsRef.current.length - 1;
    if (isLastRow) {
      setItems((all) => [...all, nextItem()]);
      setRows((all) => [...all, emptyValues(fields)]);
    }
    focusCell(row + 1, 0);
  }

  const { submitted, unfinished } = splitRows(items, rows);
  const live = scoreRecords(submitted, unfinished, Math.max(timer.elapsedSec, 1)).metrics;
  const current = items[items.length - 1];

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
        {/* The source to read from right now. */}
        <section aria-label={current.title}>
          <div className="mb-2 text-sm font-semibold text-brand-800">
            📄 {current.title} #{items.length} → i-type sa row {excelRow(items.length - 1)}
          </div>
          <div className={scrollSource ? 'max-h-[28rem] overflow-y-auto rounded-sm' : ''}>{current.source}</div>
        </section>

        {!timer.started && (
          <p className="mt-5 rounded-lg bg-brand-50 px-4 py-2 text-brand-950">
            I-type ang {unit} sa row na may <strong>dilaw na numero</strong>. Pindutin ang <Kbd>Tab</Kbd> para sa
            susunod na cell (pakanan). Sa dulo ng row, pindutin ang <Kbd>Enter</Kbd> para bumaba sa susunod na row —
            ganito sa Excel. Magsisimula ang oras sa unang letra.
          </p>
        )}

        {/* The spreadsheet. */}
        <div className="mt-5 overflow-x-auto rounded-md border border-stone-300">
          <table className="w-full min-w-[52rem] table-fixed border-collapse text-left font-mono text-[0.95rem]">
            <caption className="sr-only">Spreadsheet: isang row bawat {unit}</caption>
            <thead>
              {/* Column letters, like Excel */}
              <tr className="bg-stone-100 text-center text-xs font-semibold text-stone-500">
                <th scope="col" className="w-12 border border-stone-300 py-1">
                  <span className="sr-only">Row</span>
                </th>
                {fields.map((f, c) => (
                  <th key={f.key} scope="col" className={`${columnWidths[f.key] ?? ''} border border-stone-300 py-1`}>
                    <span aria-hidden="true">{columnLetter(c)}</span>
                  </th>
                ))}
              </tr>
              {/* Row 1: the headers */}
              <tr>
                <th scope="row" className="border border-stone-300 bg-stone-100 text-center text-xs font-semibold text-stone-500">
                  1
                </th>
                {fields.map((f) => (
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
                    {fields.map((f, c) => (
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
                          value={row[f.key] ?? ''}
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
