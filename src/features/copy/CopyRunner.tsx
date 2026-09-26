/**
 * One Copy Test run: a record card (the "source document") and a form to copy
 * it into. Used by both Copy Test practice and the Assessment.
 *
 * Keyboard: Tab / Shift+Tab move between fields (the standard in real forms
 * and data entry software, so that is what we teach). For beginners, Enter in
 * a field also moves to the next one; Enter on the last field submits the
 * record and shows a new one.
 *
 * It does NOT save anything. When time is up (or "Finish" is pressed) it
 * builds a Session and hands it to `onFinish`. To start over, the parent gives
 * it a new `key` so React creates a fresh one.
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

export default function CopyRunner({
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
  // One random generator per run, kept in a ref so it survives re-renders.
  const rngRef = useRef(makeRng(randomSeed()));
  const [current, setCurrent] = useState(() => makeRecord(rngRef.current));
  const [values, setValues] = useState<CopyRecord>(emptyRecord);
  const [submitted, setSubmitted] = useState<SubmittedRecord[]>([]);
  const [lastWrongFields, setLastWrongFields] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Refs hold the latest values for the timer callback.
  const submittedRef = useRef(submitted);
  submittedRef.current = submitted;
  const valuesRef = useRef(values);
  valuesRef.current = values;
  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    onFinishRef.current = onFinish;
  });
  const finishedRef = useRef(false);

  const finish = useCallback(
    (elapsedSec: number, finishedEarly: boolean) => {
      if (finishedRef.current) return; // never finish the same run twice
      finishedRef.current = true;

      const session = buildCopySession(submittedRef.current, valuesRef.current, elapsedSec, seconds, 'form');
      onFinishRef.current(session, finishedEarly);
    },
    [seconds],
  );

  const timer = useCountdown(seconds, () => finish(seconds, false));

  function change(key: FieldKey, value: string) {
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
    if (FIELDS.every((f) => typed[f.key].trim() === '')) return; // nothing typed yet

    const wrong = FIELDS.filter((f) => !isFieldCorrect(current[f.key], typed[f.key])).length;
    if (wrong > 0 && sound) errorBeep();

    setSubmitted((list) => [...list, { expected: current, typed }]);
    setLastWrongFields(wrong);
    setCurrent(makeRecord(rngRef.current));
    setValues(emptyRecord());
    inputRefs.current[0]?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, index: number) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (index < FIELDS.length - 1) inputRefs.current[index + 1]?.focus();
    else submit();
  }

  // Live numbers (rounded for display only).
  const live = scoreCopy(submitted, values, Math.max(timer.elapsedSec, 1)).metrics;

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <TimeLeft seconds={timer.remainingSec} started={timer.started} waitingText="naghihintay sa unang letra" />
        <StatBadge label="Natapos na record" value={submitted.length} />
        {showLiveStats && (
          <>
            <StatBadge label="Bilis (KPH)" value={timer.started ? display(live.kph).toLocaleString() : '–'} />
            <StatBadge label="Tamang field" value={`${display(live.fieldAccuracy)}%`} />
          </>
        )}
      </div>

      <Card>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* The source document: looks like a record card on paper. */}
          <section aria-labelledby="record-title" className="rounded-md border border-stone-200 bg-white shadow-paper">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-dashed border-stone-200 px-5 py-2 text-sm">
              <span id="record-title" className="font-semibold text-brand-800">
                📄 Record #{submitted.length + 1}
              </span>
              <span className="text-stone-600">Kopyahin nang eksakto</span>
            </div>
            <dl className="space-y-4 px-5 py-5">
              {FIELDS.map((f) => (
                <div key={f.key}>
                  <dt className="text-sm font-medium text-stone-600">
                    <EnTl en={f.label} tl={f.tl} />
                  </dt>
                  <dd className="select-none font-mono text-lg text-stone-900">{current[f.key]}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* The form to fill in. */}
          <form
            aria-label="Form na pupunan"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <h3 className="mb-1 text-lg font-bold text-stone-900">Dito ka mag-type 👇</h3>
            {!timer.started && (
              <p className="mb-3 rounded-lg bg-brand-50 px-4 py-2 text-brand-950">
                Kopyahin ang bawat field. Pindutin ang <Kbd>Tab</Kbd> para lumipat sa susunod na field — ganito sa
                totoong form at software. Sa huling field, pindutin ang <Kbd>Enter</Kbd> para ipasa ang record.
                Magsisimula ang oras sa unang letra.
              </p>
            )}
            <div className="space-y-3">
              {FIELDS.map((f, i) => (
                <div key={f.key}>
                  <label htmlFor={`copy-${f.key}`} className="mb-1 block text-base font-semibold text-stone-800">
                    <EnTl en={f.label} tl={f.tl} />
                    {f.hint && <span className="ml-2 text-sm font-normal text-stone-600">— {f.hint}</span>}
                  </label>
                  <input
                    id={`copy-${f.key}`}
                    ref={(el) => {
                      inputRefs.current[i] = el;
                    }}
                    autoFocus={i === 0}
                    type="text"
                    autoComplete="off"
                    spellCheck={false}
                    autoCorrect="off"
                    autoCapitalize="off"
                    value={values[f.key]}
                    onChange={(e) => change(f.key, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, i)}
                    onPaste={(e) => e.preventDefault()}
                    onDrop={(e) => e.preventDefault()}
                    className="w-full rounded-lg border-2 border-stone-400 bg-white px-3 py-2 font-mono text-lg focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-200"
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <Button type="submit">
                <EnTl en="Submit" tl="Ipasa" />
              </Button>
              <span role="status" className="text-lg font-bold">
                {lastWrongFields === 0 && <span className="text-green-800">✓ Lahat tama!</span>}
                {lastWrongFields !== null && lastWrongFields > 0 && (
                  <span className="text-red-700">
                    ✗ {lastWrongFields} field ang mali sa huling record
                  </span>
                )}
              </span>
            </div>
          </form>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-4 text-stone-700">
          <span>
            Kahit isang letra, tuldok, o space lang ang mali, mali na ang buong field. Walang copy-paste.
          </span>
          {allowFinishEarly && timer.started && (
            <Button variant="secondary" onClick={() => finish(timer.stop(), true)}>
              <EnTl en="Finish" tl="Tapusin na" />
            </Button>
          )}
        </div>
      </Card>
    </>
  );
}
