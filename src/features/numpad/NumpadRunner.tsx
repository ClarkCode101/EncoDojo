/**
 * One numpad run: the number to type, the input box, timer, and live stats.
 * Used by both the Numpad Drill (training) and the Assessment.
 *
 * It does NOT save anything. When time is up (or "Finish" is pressed) it
 * builds a Session and hands it to `onFinish`. To start over, the parent
 * gives it a new `key` so React creates a fresh one.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, EnTl, KeyTips, LiveStatsBar } from '../../components/ui';
import { makeRng, randomSeed } from '../../lib/random';
import { display, entryAccuracyPct, isEntryCorrect, keystrokesForEntry, kph } from '../../lib/scoring';
import { errorBeep } from '../../lib/sound';
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
  onStart,
  onFinish,
}: {
  seconds: number;
  difficulty: Difficulty;
  showLiveStats: boolean;
  allowFinishEarly: boolean;
  sound: boolean;
  onStart?: () => void;
  onFinish: (session: Session, finishedEarly: boolean) => void;
}) {
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

      const t = tallyRef.current;
      const session: Session = {
        id: makeId(),
        type: 'numpad',
        startedAt: new Date(Date.now() - elapsedSec * 1000).toISOString(),
        durationSec: elapsedSec,
        metrics: {
          kph: kph(t.keystrokes, elapsedSec),
          entryAccuracy: entryAccuracyPct(t.correctEntries, t.entries),
          entries: t.entries,
          correctEntries: t.correctEntries,
          keystrokes: t.keystrokes,
          seconds,
          difficulty,
        },
        mistakes: t.wrong,
      };
      onFinishRef.current(session, finishedEarly);
    },
    [seconds, difficulty],
  );

  const timer = useCountdown(seconds, () => finish(seconds, false));

  function submit() {
    if (timer.finished || input === '') return;
    const correct = isEntryCorrect(current, input);
    if (!correct && sound) errorBeep();

    setTally((t) => ({
      entries: t.entries + 1,
      correctEntries: t.correctEntries + (correct ? 1 : 0),
      keystrokes: t.keystrokes + keystrokesForEntry(current, input),
      wrong: correct ? t.wrong : [...t.wrong, { expected: current, typed: input, index: t.entries + 1 }],
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
          { label: 'Natapos', value: tally.entries },
          ...(showLiveStats
            ? [
                {
                  label: 'Bilis (KPH)',
                  value: timer.started ? display(kph(tally.keystrokes, elapsed)).toLocaleString() : '–',
                },
                { label: 'Tamang numero', value: `${display(entryAccuracyPct(tally.correctEntries, tally.entries))}%` },
              ]
            : []),
        ]}
      />

      {/* No box around the drill: the number is shown on a small sheet of paper. */}
      <div>
        <div className="rounded-md border border-stone-200 bg-white py-5 text-center shadow-paper">
          <div className="text-lg font-semibold text-stone-700">I-type ang numerong ito:</div>
          <div
            className="mt-2 select-none font-mono text-6xl font-bold tabular-nums tracking-wide text-stone-900"
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
            Dito ka mag-type
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
            placeholder="I-type dito…"
            className="w-full rounded-lg border-[1.5px] border-stone-500 bg-white p-3 text-center font-mono text-4xl tabular-nums placeholder:text-2xl placeholder:text-stone-400 focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-200"
          />
          <div className="mt-3 flex justify-center">
            <KeyTips tips={[{ key: 'Enter', text: 'pagkatapos ng bawat numero' }, { text: 'Walang comma (,)' }]} />
          </div>
        </form>

        <div className="mt-2 flex min-h-11 flex-wrap items-center justify-between gap-3">
          <span role="status" className="text-lg font-bold">
            {lastWasCorrect === true && <span className="text-green-800">✓ Tama!</span>}
            {lastWasCorrect === false && <span className="text-red-700">✗ Mali ang huli</span>}
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
