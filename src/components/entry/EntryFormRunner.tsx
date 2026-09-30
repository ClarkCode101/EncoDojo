/**
 * FORM layout: the source (document / record card) and a form with one input
 * per field. Used by the Copy Test and Document Encoding, in practice and in
 * the Assessment.
 *
 * Keyboard: Tab / Shift+Tab move between fields (like real forms). For
 * beginners, Enter also moves to the next field; Enter on the last field
 * submits and shows the next item.
 *
 * It does NOT save anything: when time is up (or "Finish" is pressed) it hands
 * the result to `onFinish`. To start over, the parent gives it a new `key`.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { hintOf, isFieldCorrect, scoreRecords, type FilledRecord, type Values } from '../../lib/fieldScoring';
import { display } from '../../lib/scoring';
import { useLang, useT } from '../../lib/i18n';
import { correctTick, errorBeep } from '../../lib/sound';
import { useAppData } from '../../lib/useAppData';
import { useCountdown } from '../../lib/useCountdown';
import { Button, EnTl, KeyTips, LiveStatsBar } from '../ui';
import { emptyValues, type EntryItem, type EntryRunnerProps } from './types';

export default function EntryFormRunner({
  seconds,
  showLiveStats,
  allowFinishEarly,
  sound,
  nextItem,
  onStart,
  onFinish,
  wideSource = false,
}: EntryRunnerProps & {
  /** Documents are wider than record cards, so they get more room. */
  wideSource?: boolean;
}) {
  const lang = useLang();
  const t = useT();
  const [item, setItem] = useState<EntryItem>(() => nextItem(0));
  const [values, setValues] = useState<Values>(() => emptyValues(item.fields));
  const [submitted, setSubmitted] = useState<FilledRecord[]>([]);
  const [lastWrongFields, setLastWrongFields] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Refs hold the latest values for the timer callback.
  const itemRef = useRef(item);
  itemRef.current = item;
  const valuesRef = useRef(values);
  valuesRef.current = values;
  const submittedRef = useRef(submitted);
  submittedRef.current = submitted;
  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    onFinishRef.current = onFinish;
  });
  const finishedRef = useRef(false);

  const finish = useCallback((elapsedSec: number, finishedEarly: boolean) => {
    if (finishedRef.current) return; // never finish the same run twice
    finishedRef.current = true;
    const unfinished = { fields: itemRef.current.fields, typed: valuesRef.current };
    onFinishRef.current({ submitted: submittedRef.current, unfinished, elapsedSec }, finishedEarly);
  }, []);

  // Settings -> "Tunog kapag tama": a soft sound for each correct entry.
  const soundCorrect = useAppData().settings.soundCorrect === true;

  const timer = useCountdown(seconds, () => finish(seconds, false));

  function change(key: string, value: string) {
    if (timer.finished) return;
    if (!timer.started && value.length > 0) {
      timer.start();
      onStart?.();
    }
    setValues((v) => ({ ...v, [key]: value }));
  }

  function submit() {
    if (timer.finished) return;
    const typed = valuesRef.current;
    if (item.fields.every((f) => (typed[f.key] ?? '').trim() === '')) return; // nothing typed yet

    const wrong = item.fields.filter((f) => !isFieldCorrect(item.expected[f.key], typed[f.key] ?? '')).length;
    if (wrong > 0 && sound) errorBeep();
    if (wrong === 0 && soundCorrect) correctTick();

    setSubmitted((list) => [...list, { fields: item.fields, expected: item.expected, typed }]);
    setLastWrongFields(wrong);
    const next = nextItem(submittedRef.current.length + 1);
    setItem(next);
    setValues(emptyValues(next.fields));
    // Wait for React to draw the next item (its fields may differ) before focusing.
    requestAnimationFrame(() => inputRefs.current[0]?.focus());
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, index: number) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (index < item.fields.length - 1) inputRefs.current[index + 1]?.focus();
    else submit();
  }

  // Live numbers (rounded for display only).
  const live = scoreRecords(submitted, { fields: item.fields, typed: values }, Math.max(timer.elapsedSec, 1)).metrics;

  return (
    <>
      <LiveStatsBar
        seconds={timer.remainingSec}
        started={timer.started}
        stats={[
          { label: t('Natapos', 'Done'), value: submitted.length },
          ...(showLiveStats
            ? [
                {
                  label: t('Bilis (KPH)', 'Speed (KPH)'),
                  value: timer.started ? display(live.kph).toLocaleString() : '–',
                },
                { label: t('Tamang field', 'Correct fields'), value: `${display(live.fieldAccuracy)}%` },
              ]
            : []),
        ]}
      />

      {/* No box around the drill: the source is already a sheet of paper, and the form has its own fields. */}
      <div className="flex min-h-0 flex-col">
        {/*
          One toolbar line above both columns (like the spreadsheet): which item, the last result, key tips,
          Finish. Above BOTH columns so the document and the form start and end at the same height.
        */}
        <div className="mb-1.5 flex min-h-9 shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="font-display text-lg font-bold text-stone-900">
              {item.title} #{submitted.length + 1}
            </span>
            <span role="status" className="font-bold">
              {/* "#1" = the number of the item just submitted (same as its title, e.g. "Sales Invoice #1"). */}
              {lastWrongFields === 0 && (
                <span className="text-green-800">
                  ✓ #{submitted.length}: {t('lahat tama!', 'all correct!')}
                </span>
              )}
              {lastWrongFields !== null && lastWrongFields > 0 && (
                <span className="text-red-700">
                  ✗ #{submitted.length}:{' '}
                  {t(
                    `${lastWrongFields} field ang mali`,
                    `${lastWrongFields} wrong field${lastWrongFields === 1 ? '' : 's'}`,
                  )}
                </span>
              )}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <KeyTips
              tips={[
                { key: 'Tab', text: t('susunod na field', 'next field') },
                { key: 'Enter', text: t('sa huling field = ipasa', 'on the last field = submit') },
              ]}
            />
            {allowFinishEarly && timer.started && (
              <Button variant="secondary" onClick={() => finish(timer.stop(), true)}>
                <EnTl en="Finish" tl="Tapusin na" />
              </Button>
            )}
          </div>
        </div>

        {/*
          Side by side (when there is room): the form column is always 20rem (same in Copy Test, Document
          Encoding and the Assessment) and the FORM sets the height; the source fills the same height and
          scrolls inside, so both columns end at the same line. Wide documents need a wider screen (and even
          wider with large text). grid-rows-[minmax(0,1fr)...]: in a PracticeFrame everything may shrink.
        */}
        <div
          className={`grid min-h-0 grid-rows-[minmax(8rem,1fr)_minmax(0,auto)] gap-5 ${
            wideSource
              ? 'xl:grid-cols-[minmax(0,1fr)_20rem] xl:grid-rows-[minmax(0,1fr)] large-text:xl:grid-cols-1 large-text:xl:grid-rows-[minmax(8rem,1fr)_minmax(0,auto)] large-text:2xl:grid-cols-[minmax(0,1fr)_20rem] large-text:2xl:grid-rows-[minmax(0,1fr)]'
              : 'lg:grid-cols-[minmax(0,1fr)_20rem] lg:grid-rows-[minmax(0,1fr)]'
          }`}
        >
          {/* The source to read from. Side by side it is taken out of the height calculation (absolute); bottom-1 = ends exactly with the Submit button. */}
          <section aria-label={item.title} className="relative min-h-0 min-w-0">
            <div
              // Stacked (form under the source): the source keeps at least 8rem and scrolls inside its own
              // box (h-full); the form fields scroll too, so the two never overlap. Side by side: absolute.
              className={`source-zoom h-full overflow-y-auto [&>*]:min-h-full ${
                wideSource
                  ? 'xl:absolute xl:inset-x-0 xl:top-0 xl:bottom-1 xl:h-auto large-text:xl:static large-text:xl:h-full large-text:2xl:absolute large-text:2xl:h-auto'
                  : 'lg:absolute lg:inset-x-0 lg:top-0 lg:bottom-1 lg:h-auto'
              }`}
            >
              {item.source}
            </div>
          </section>

          {/* The form to fill in. */}
          <form
            aria-label={t('Form na pupunan', 'Form to fill in')}
            className="flex min-h-0 min-w-0 flex-col"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            {/* Only the fields scroll (on small screens); Submit always stays right under them. */}
            <div className="min-h-0 space-y-1.5 overflow-y-auto px-1.5 pb-1 [scrollbar-gutter:stable]">
              {item.fields.map((f, i) => (
                <div key={f.key}>
                  <label htmlFor={`entry-${f.key}`} className="block text-base font-semibold text-stone-800">
                    <EnTl en={f.label} tl={f.tl} />
                  </label>
                  <input
                    id={`entry-${f.key}`}
                    ref={(el) => {
                      inputRefs.current[i] = el;
                    }}
                    autoFocus={i === 0}
                    type="text"
                    // The format (e.g. mm/dd/yyyy) shows inside the empty box, like in real data entry software.
                    placeholder={hintOf(f, lang)}
                    autoComplete="off"
                    spellCheck={false}
                    autoCorrect="off"
                    autoCapitalize="off"
                    value={values[f.key] ?? ''}
                    onChange={(e) => change(f.key, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, i)}
                    onPaste={(e) => e.preventDefault()}
                    onDrop={(e) => e.preventDefault()}
                    className="w-full rounded-lg border-[1.5px] border-stone-500 bg-white px-3 py-1 font-mono text-lg placeholder:font-sans placeholder:text-base placeholder:text-stone-400 focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-200"
                  />
                </div>
              ))}
            </div>
            {/* Same width as the inputs (the same scrollbar gutter keeps both edges lined up). */}
            <div className="mt-1 shrink-0 overflow-hidden px-1.5 py-1 [scrollbar-gutter:stable]">
              <Button type="submit" className="w-full">
                <EnTl en="Submit" tl="Ipasa" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
