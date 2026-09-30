/**
 * One QC run (practice and the Assessment): the ORIGINAL record and the
 * ENCODED one side by side, one row per field. Click a row (or press its
 * number, 1-5) to mark "may mali", then Enter / "Submit" to pass the record.
 * Nothing marked = "walang mali".
 *
 * It does NOT save anything. When time is up (or "Finish" is pressed) it
 * builds a Session and hands it to `onFinish`. A new `key` starts a new run.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckIcon, XIcon } from '../../components/icons';
import { Button, EnTl, Kbd, KeyTips, LiveStatsBar } from '../../components/ui';
import { useT } from '../../lib/i18n';
import { makeRng, randomSeed } from '../../lib/random';
import { display } from '../../lib/scoring';
import { correctTick, errorBeep } from '../../lib/sound';
import type { Session } from '../../lib/storage';
import { useAppData } from '../../lib/useAppData';
import { useCountdown } from '../../lib/useCountdown';
import type { FieldKey } from '../copy/records';
import { QC_FIELDS, makeQcItem } from './qcItems';
import { buildQcSession, scoreQc, type CheckedItem } from './scoreQc';

/** The result of the record just passed, shown in the toolbar. */
type LastResult = { n: number; missed: number; falseAlarms: number };

export default function QcRunner({
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
  const t = useT();
  const rngRef = useRef(makeRng(randomSeed()));
  const [item, setItem] = useState(() => makeQcItem(rngRef.current));
  const [flagged, setFlagged] = useState<FieldKey[]>([]);
  const [checked, setChecked] = useState<CheckedItem[]>([]);
  const [last, setLast] = useState<LastResult | null>(null);

  // Refs hold the latest values for the timer callback.
  const checkedRef = useRef(checked);
  checkedRef.current = checked;
  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    onFinishRef.current = onFinish;
  });
  const finishedRef = useRef(false);

  const finish = useCallback(
    (elapsedSec: number, finishedEarly: boolean) => {
      if (finishedRef.current) return; // never finish the same run twice
      finishedRef.current = true;
      onFinishRef.current(buildQcSession(checkedRef.current, elapsedSec, seconds), finishedEarly);
    },
    [seconds],
  );

  // Settings -> "Tunog kapag tama": a soft sound for each record checked right.
  const soundCorrect = useAppData().settings.soundCorrect === true;

  const timer = useCountdown(seconds, () => finish(seconds, false));

  /** The clock starts at the first click or key (like the other drills). */
  const startIfNeeded = useCallback(() => {
    if (!timer.started) {
      timer.start();
      onStart?.();
    }
  }, [timer, onStart]);

  const toggle = useCallback(
    (key: FieldKey) => {
      if (timer.finished) return;
      startIfNeeded();
      setFlagged((f) => (f.includes(key) ? f.filter((k) => k !== key) : [...f, key]));
    },
    [timer.finished, startIfNeeded],
  );

  const submit = useCallback(() => {
    if (timer.finished) return;
    startIfNeeded();
    const missed = item.errors.filter((k) => !flagged.includes(k)).length;
    const falseAlarms = flagged.filter((k) => !item.errors.includes(k)).length;
    const right = missed === 0 && falseAlarms === 0;
    if (!right && sound) errorBeep();
    if (right && soundCorrect) correctTick();
    setChecked((c) => [...c, { item, flagged }]);
    setLast({ n: checked.length + 1, missed, falseAlarms });
    setItem(makeQcItem(rngRef.current));
    setFlagged([]);
  }, [timer.finished, startIfNeeded, item, flagged, sound, soundCorrect, checked.length]);

  // Keyboard: 1-5 mark a field, Enter passes the record.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= QC_FIELDS.length) {
        e.preventDefault();
        toggle(QC_FIELDS[n - 1].key);
      } else if (e.key === 'Enter' && !(target instanceof HTMLButtonElement && target.dataset.qcOwn !== 'submit')) {
        // Enter on a row button would also "click" it, so only the Submit button and the page handle Enter.
        e.preventDefault();
        submit();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle, submit]);

  const elapsed = Math.max(timer.elapsedSec, 1);
  const live = scoreQc(checked, elapsed).metrics;

  return (
    <>
      <LiveStatsBar
        seconds={timer.remainingSec}
        started={timer.started}
        stats={[
          { label: t('Na-check', 'Checked'), value: checked.length },
          ...(showLiveStats
            ? [
                {
                  label: t('Tamang check', 'Correct checks'),
                  value: checked.length ? `${display(live.decisionAccuracy)}%` : '–',
                },
                {
                  label: t('Bilis (bawat minuto)', 'Speed (per minute)'),
                  value: timer.started ? display(live.perMinute) : '–',
                },
              ]
            : []),
        ]}
      />

      <div className="flex min-h-0 flex-col">
        {/* Toolbar: which record, the last result, key tips, Finish. */}
        <div className="mb-2 flex min-h-11 shrink-0 flex-wrap items-center justify-between gap-x-5 gap-y-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="font-display text-lg font-bold text-stone-900">Record #{checked.length + 1}</span>
            <span role="status" className="font-bold">
              {last && last.missed === 0 && last.falseAlarms === 0 && (
                <span className="text-green-800">
                  ✓ #{last.n}: {t('tama ang check mo', 'you checked it right')}
                </span>
              )}
              {last && (last.missed > 0 || last.falseAlarms > 0) && (
                <span className="text-red-700">
                  ✗ #{last.n}:{' '}
                  {[
                    last.missed > 0 && t(`${last.missed} mali ang hindi napansin`, `${last.missed} missed`),
                    last.falseAlarms > 0 &&
                      t(`${last.falseAlarms} tama ang minarkahang mali`, `${last.falseAlarms} correct marked wrong`),
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              )}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <KeyTips
              tips={[
                { key: '1–5', text: t('markahan ang field', 'mark the field') },
                { key: 'Enter', text: t('ipasa', 'submit') },
              ]}
            />
            {allowFinishEarly && timer.started && (
              <Button variant="secondary" onClick={() => finish(timer.stop(), true)}>
                <EnTl en="Finish" tl="Tapusin na" />
              </Button>
            )}
          </div>
        </div>

        {/* The two versions, one row per field. The whole row is the button that marks it. */}
        <div className="min-h-0 overflow-y-auto rounded-md border border-stone-300 bg-white shadow-paper">
          <table className="w-full table-fixed border-collapse text-left">
            <caption className="sr-only">
              {t(
                'Ihambing ang Original at ang Encoded. Markahan ang mga field na magkaiba.',
                'Compare the Original and the Encoded. Mark the fields that differ.',
              )}
            </caption>
            <thead className="bg-stone-100 text-sm text-stone-700">
              <tr>
                <th scope="col" className="w-12 px-3 py-2 text-center font-semibold">
                  #
                </th>
                <th scope="col" className="w-40 px-3 py-2 font-semibold">
                  Field
                </th>
                <th scope="col" className="px-3 py-2 font-semibold">
                  <EnTl en="Original" tl="Orihinal" />
                </th>
                <th scope="col" className="px-3 py-2 font-semibold">
                  <EnTl en="Encoded" tl="Na-encode" />
                </th>
                <th scope="col" className="w-36 px-3 py-2 font-semibold">
                  <EnTl en="Error?" tl="May mali?" />
                </th>
              </tr>
            </thead>
            <tbody>
              {QC_FIELDS.map((f, i) => {
                const marked = flagged.includes(f.key);
                return (
                  <tr
                    key={f.key}
                    onClick={() => toggle(f.key)}
                    className={
                      'cursor-pointer border-t border-stone-200 align-top transition-colors ' +
                      (marked ? 'bg-red-50' : 'hover:bg-stone-50')
                    }
                  >
                    <td className="px-3 py-2.5 text-center">
                      <Kbd>{i + 1}</Kbd>
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-stone-800">{f.label}</td>
                    <td className="break-words px-3 py-2.5 font-mono text-lg text-stone-900">{item.original[f.key]}</td>
                    <td className="break-words px-3 py-2.5 font-mono text-lg text-stone-900">{item.encoded[f.key]}</td>
                    <td className="px-3 py-1.5">
                      <button
                        type="button"
                        aria-pressed={marked}
                        aria-label={`${f.label}: ${
                          marked
                            ? t('may mali (pindutin para alisin)', 'has an error (press to remove)')
                            : t('markahan na may mali', 'mark as an error')
                        }`}
                        // A mouse click must not move the focus here, so Enter still means "ipasa".
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={(e) => {
                          e.stopPropagation(); // the row would toggle it back
                          toggle(f.key);
                        }}
                        className={
                          'inline-flex min-h-[2.5rem] w-full items-center justify-center gap-1.5 rounded-lg border-[1.5px] px-2 text-sm font-semibold ' +
                          'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-brand-600 ' +
                          (marked
                            ? 'border-red-700 bg-red-700 text-white'
                            : 'border-stone-400 bg-white text-stone-700 hover:border-stone-600')
                        }
                      >
                        {marked ? <XIcon className="h-4 w-4" /> : <CheckIcon className="h-4 w-4" />}
                        {marked ? t('May mali', 'Error') : t('Tama', 'Correct')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex shrink-0 flex-wrap items-center gap-x-5 gap-y-2">
          <Button size="lg" onClick={submit} data-qc-own="submit" autoFocus>
            <EnTl en="Submit" tl="Ipasa" />
          </Button>
          <span className="text-stone-600">
            {flagged.length === 0
              ? t('Walang minarkahan = walang mali ang record na ito.', 'Nothing marked = this record has no mistakes.')
              : t(
                  `${flagged.length} field ang minarkahan mong may mali.`,
                  `You marked ${flagged.length} field${flagged.length === 1 ? '' : 's'} as wrong.`,
                )}
          </span>
        </div>
      </div>
    </>
  );
}
