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
import { correctTick, errorBeep } from '../../lib/sound';
import { useAppData } from '../../lib/useAppData';
import { useCountdown } from '../../lib/useCountdown';
import { Button, EnTl, KeyTips, LiveStatsBar } from '../ui';
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
  const [items, setItems] = useState<EntryItem[]>(() => [nextItem(0)]);
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

  // Settings -> "Tunog kapag tama": a soft sound for each correct entry.
  const soundCorrect = useAppData().settings.soundCorrect === true;

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
    if (wrong === 0 && soundCorrect) correctTick();
    setMessage({ row, wrong });

    const isLastRow = row === rowsRef.current.length - 1;
    if (isLastRow) {
      setItems((all) => [...all, nextItem(all.length)]);
      setRows((all) => [...all, emptyValues(fields)]);
    }
    focusCell(row + 1, 0);
  }

  const { submitted, unfinished } = splitRows(items, rows);
  const live = scoreRecords(submitted, unfinished, Math.max(timer.elapsedSec, 1)).metrics;
  const current = items[items.length - 1];

  return (
    <>
      <LiveStatsBar
        seconds={timer.remainingSec}
        started={timer.started}
        stats={[
          { label: 'Natapos', value: submitted.length },
          ...(showLiveStats
            ? [
                { label: 'Bilis (KPH)', value: timer.started ? display(live.kph).toLocaleString() : '–' },
                { label: 'Tamang field', value: `${display(live.fieldAccuracy)}%` },
              ]
            : []),
        ]}
      />

      {/* In a PracticeFrame the source shrinks (and scrolls inside) so the sheet stays in view. */}
      {/* No box around the drill: the source is a sheet of paper and the spreadsheet has its own grid. */}
      <div className="flex min-h-0 flex-col">
        {/* The source to read from right now. */}
        <section aria-label={current.title} className="flex min-h-0 flex-col">
          {/* One toolbar line: which row to type in, the last row's result, key tips, Finish. */}
          <div className="mb-2 flex min-h-11 flex-wrap items-center justify-between gap-x-5 gap-y-2">
            <span>
              <span className="font-display text-lg font-bold text-stone-900">
                {current.title} #{items.length}
              </span>
              <span className="ml-2 text-stone-700">i-type sa row {excelRow(items.length - 1)}</span>
            </span>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <span role="status" className="font-bold">
                {message?.wrong === 0 && (
                  <span className="text-green-800">✓ Row {excelRow(message.row)}: lahat tama!</span>
                )}
                {message && message.wrong > 0 && (
                  <span className="text-red-700">
                    ✗ Row {excelRow(message.row)}: {message.wrong} cell ang mali
                  </span>
                )}
              </span>
              <KeyTips
                tips={[
                  { key: 'Tab', text: 'susunod na cell' },
                  { key: 'Enter', text: 'susunod na row' },
                ]}
              />
              {allowFinishEarly && timer.started && (
                <Button variant="secondary" onClick={() => finish(timer.stop(), true)}>
                  <EnTl en="Finish" tl="Tapusin na" />
                </Button>
              )}
            </div>
          </div>
          <div className={`source-zoom min-h-[6rem] shrink overflow-y-auto rounded-sm ${scrollSource ? 'max-h-[28rem]' : ''}`}>
            {current.source}
          </div>
        </section>

        {/* The spreadsheet. */}
        {/* Like Excel: the header rows stay put and the rows scroll inside the sheet. */}
        <div className="mt-3 max-h-[16rem] shrink-0 overflow-auto rounded-md border border-stone-300">
          <table className="w-full min-w-[52rem] table-fixed border-collapse text-left font-mono text-[0.95rem]">
            <caption className="sr-only">Spreadsheet: isang row bawat {unit}</caption>
            <thead className="sticky top-0 z-[1]">
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
                <th
                  scope="row"
                  className="border border-stone-300 bg-stone-100 text-center text-xs font-semibold text-stone-500"
                >
                  1
                </th>
                {fields.map((f) => (
                  <th
                    key={f.key}
                    scope="col"
                    className="border border-stone-300 bg-white px-2 py-1.5 font-sans text-sm font-bold text-stone-900"
                  >
                    {/* English only, like a real sheet (owner's choice: shorter headers). */}
                    {f.label}
                    {/* The format to use, like in the form (e.g. mm/dd/yyyy). */}
                    {f.hint && (
                      <div className="mt-1 inline-block rounded bg-belt-100 px-1.5 text-xs font-semibold text-stone-900">
                        {f.hint}
                      </div>
                    )}
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
      </div>
    </>
  );
}
