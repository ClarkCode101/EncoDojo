/**
 * One numpad run: the number to type, the input box, timer, and live stats.
 * Used by both the Numpad Drill (training) and the Assessment.
 *
 * It does NOT save anything. When time is up (or "Finish" is pressed) it
 * builds a Session and hands it to `onFinish`. To start over, the parent
 * gives it a new `key` so React creates a fresh one.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { NumpadGuide } from '../../components/KeyGuide';
import { Button, EnTl, KeyTips, LiveStatsBar } from '../../components/ui';
import { nextNumpadKey } from '../../lib/keyGuide';
import { makeRng, randomSeed } from '../../lib/random';
import { display, entryAccuracyPct, isEntryCorrect, keystrokesForEntry, kph } from '../../lib/scoring';
import { useT } from '../../lib/i18n';
import { correctTick, errorBeep } from '../../lib/sound';
import { useAppData } from '../../lib/useAppData';
import { makeId, type Difficulty, type Session } from '../../lib/storage';
import { useCountdown } from '../../lib/useCountdown';
import { cleanNumpadInput, makeEntry } from './entries';

type Tally = {
  entries: number;
  correctEntries: number;
  keystrokes: number;
  wrong: Session['mistakes'];
};

const emptyTally: Tally = { entries: 0, correctEntries: 0, keystrokes: 0, wrong: [] };

export default function NumpadRunner({
  seconds,
  difficulty,
  showLiveStats,
  allowFinishEarly,
  sound,
  keyGuide = false,
  onStart,
  onFinish,
}: {
  seconds: number;
  difficulty: Difficulty;
  showLiveStats: boolean;
  allowFinishEarly: boolean;
  sound: boolean;
  /** Settings -> "Gabay sa keyboard": the numpad with the next key lit. Practice only. */
  keyGuide?: boolean;
  onStart?: () => void;
  onFinish: (session: Session, finishedEarly: boolean) => void;
}) {
  const t = useT();
  // One random generator per run, kept in a ref so it survives re-renders.
  const rngRef = useRef(makeRng(randomSeed()));
  const [current, setCurrent] = useState(() => makeEntry(rngRef.current, difficulty));
  const [input, setInput] = useState('');
  const [tally, setTally] = useState<Tally>(emptyTally);
  const [lastWasCorrect, setLastWasCorrect] = useState<boolean | null>(null);

  // Refs hold the latest values for the timer callback.
  const tallyRef = useRef(tally);
  tallyRef.current = tally;
  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    onFinishRef.current = onFinish;
  });
  const finishedRef = useRef(false);

  const finish = useCallback(
    (elapsedSec: number, finishedEarly: boolean) => {
      if (finishedRef.current) return; // never finish the same run twice
      finishedRef.current = true;

      const done = tallyRef.current;
      const session: Session = {
        id: makeId(),
        type: 'numpad',
        startedAt: new Date(Date.now() - elapsedSec * 1000).toISOString(),
        durationSec: elapsedSec,
        metrics: {
          kph: kph(done.keystrokes, elapsedSec),
          entryAccuracy: entryAccuracyPct(done.correctEntries, done.entries),
          entries: done.entries,
          correctEntries: done.correctEntries,
          keystrokes: done.keystrokes,
          seconds,
          difficulty,
        },
        mistakes: done.wrong,
      };
      onFinishRef.current(session, finishedEarly);
    },
    [seconds, difficulty],
  );

  // Settings -> "Tunog kapag tama": a soft sound for each correct entry.
  const soundCorrect = useAppData().settings.soundCorrect === true;

  const timer = useCountdown(seconds, () => finish(seconds, false));

  function submit() {
    if (timer.finished || input === '') return;
    const correct = isEntryCorrect(current, input);
    if (!correct && sound) errorBeep();
    if (correct && soundCorrect) correctTick();

    setTally((prev) => ({
      entries: prev.entries + 1,
      correctEntries: prev.correctEntries + (correct ? 1 : 0),
      keystrokes: prev.keystrokes + keystrokesForEntry(current, input),
      wrong: correct ? prev.wrong : [...prev.wrong, { expected: current, typed: input, index: prev.entries + 1 }],
    }));
    setLastWasCorrect(correct);
    setCurrent(makeEntry(rngRef.current, difficulty));
    setInput('');
  }

  const elapsed = Math.max(timer.elapsedSec, 1);

  return (
    <>
      <LiveStatsBar
        seconds={timer.remainingSec}
        started={timer.started}
        stats={[
          { label: t('Natapos', 'Done'), value: tally.entries },
          ...(showLiveStats
            ? [
                {
                  label: t('Bilis (KPH)', 'Speed (KPH)'),
                  value: timer.started ? display(kph(tally.keystrokes, elapsed)).toLocaleString() : '–',
                },
                {
                  label: t('Tamang numero', 'Correct numbers'),
                  value: `${display(entryAccuracyPct(tally.correctEntries, tally.entries))}%`,
                },
              ]
            : []),
        ]}
      />

      {/* No box around the drill: the number is shown on a small sheet of paper. */}
      <div>
        <div className="rounded-md border border-stone-200 bg-white py-5 text-center shadow-paper">
          <div className="text-lg font-semibold text-stone-700">
            {t('I-type ang numerong ito:', 'Type this number:')}
          </div>
          <div
            className="numpad-number mt-2 select-none font-mono text-6xl font-bold tabular-nums tracking-wide text-stone-900"
            aria-live="polite"
          >
            {current}
          </div>
        </div>

        <form
          className="mx-auto mt-4 max-w-md"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <label htmlFor="numpad-input" className="mb-2 block text-lg font-bold text-stone-900">
            {t('Dito ka mag-type', 'Type here')}
          </label>
          <input
            id="numpad-input"
            autoFocus
            inputMode="decimal"
            autoComplete="off"
            value={input}
            onChange={(e) => {
              if (timer.finished) return;
              const next = cleanNumpadInput(e.target.value);
              if (!timer.started && next.length > 0) {
                timer.start();
                onStart?.();
              }
              setInput(next);
            }}
            onPaste={(e) => e.preventDefault()}
            onDrop={(e) => e.preventDefault()}
            placeholder={t('I-type dito…', 'Type here…')}
            className="w-full rounded-lg border-[1.5px] border-stone-500 bg-white p-3 text-center font-mono text-4xl tabular-nums placeholder:text-2xl placeholder:text-stone-400 focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-200"
          />
          <div className="mt-3 flex justify-center">
            <KeyTips
              tips={[
                { key: 'Enter', text: t('pagkatapos ng bawat numero', 'after each number') },
                { text: t('Walang comma (,)', 'No commas (,)') },
              ]}
            />
          </div>
        </form>

        {keyGuide && (
          <div className="mt-4">
            <NumpadGuide next={nextNumpadKey(current, input)} />
          </div>
        )}

        <div className="mt-2 flex min-h-11 flex-wrap items-center justify-between gap-3">
          <span role="status" className="text-lg font-bold">
            {lastWasCorrect === true && <span className="text-green-800">✓ {t('Tama!', 'Correct!')}</span>}
            {lastWasCorrect === false && (
              <span className="text-red-700">✗ {t('Mali ang huli', 'The last one was wrong')}</span>
            )}
          </span>
          {allowFinishEarly && timer.started && (
            <Button variant="secondary" onClick={() => finish(timer.stop(), true)}>
              <EnTl en="Finish" tl="Tapusin na" />
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
