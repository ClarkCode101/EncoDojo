import { useCallback, useRef, useState } from 'react';
import { Button, Card, PageHeader, SegmentedPicker, StatBadge } from '../../components/ui';
import { makeRng, randomSeed } from '../../lib/random';
import {
  display,
  entryAccuracyPct,
  isEntryCorrect,
  keystrokesForEntry,
  kph,
} from '../../lib/scoring';
import { errorBeep } from '../../lib/sound';
import { addSession, makeId, type Session } from '../../lib/storage';
import { updateAppData, useAppData } from '../../lib/useAppData';
import { formatClock, useCountdown } from '../../lib/useCountdown';
import { cleanNumpadInput, makeEntry } from './entries';
import NumpadResults from './NumpadResults';

const DURATIONS = [2, 5] as const;
type Minutes = (typeof DURATIONS)[number];

type Tally = {
  entries: number;
  correctEntries: number;
  keystrokes: number;
  wrong: Session['mistakes'];
};

const emptyTally: Tally = { entries: 0, correctEntries: 0, keystrokes: 0, wrong: [] };

export default function NumpadPage() {
  const data = useAppData();
  const { difficulty, showLiveStats, sound } = data.settings;

  const [minutes, setMinutes] = useState<Minutes>(2);
  // One random generator per drill, kept in a ref so it survives re-renders.
  const rngRef = useRef(makeRng(randomSeed()));
  const [current, setCurrent] = useState(() => makeEntry(rngRef.current, difficulty));
  const [input, setInput] = useState('');
  const [tally, setTally] = useState<Tally>(emptyTally);
  const [lastWasCorrect, setLastWasCorrect] = useState<boolean | null>(null);
  const [result, setResult] = useState<Session | null>(null);

  const tallyRef = useRef(tally);
  tallyRef.current = tally;
  const savedRef = useRef(false);

  const finish = useCallback(
    (elapsedSec: number) => {
      if (savedRef.current) return;
      savedRef.current = true;

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
          minutes,
          difficulty,
        },
        mistakes: t.wrong,
      };
      updateAppData((d) => addSession(d, session));
      setResult(session);
    },
    [minutes, difficulty],
  );

  const timer = useCountdown(minutes * 60, () => finish(minutes * 60));

  function restart() {
    timer.reset();
    savedRef.current = false;
    rngRef.current = makeRng(randomSeed());
    setCurrent(makeEntry(rngRef.current, difficulty));
    setInput('');
    setTally(emptyTally);
    setLastWasCorrect(null);
    setResult(null);
  }

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

  if (result) {
    return <NumpadResults session={result} onRetry={restart} />;
  }

  const elapsed = Math.max(timer.elapsedSec, 1);

  return (
    <div>
      <PageHeader
        title="Numpad Drill"
        description="Type each number with the numeric keypad and press Enter. Commas are optional."
      />

      <div className="mb-4 flex flex-wrap items-end gap-6">
        <SegmentedPicker
          label="Duration"
          options={DURATIONS}
          value={minutes}
          format={(m) => `${m} min`}
          onChange={(m) => {
            if (!timer.started) setMinutes(m);
          }}
        />
        <span className="text-sm text-slate-600">Difficulty {difficulty} (change in Settings)</span>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatBadge label="Time left" value={formatClock(timer.remainingSec)} />
        <StatBadge label="Entries done" value={tally.entries} />
        {showLiveStats && (
          <>
            <StatBadge label="KPH" value={timer.started ? display(kph(tally.keystrokes, elapsed)).toLocaleString() : '–'} />
            <StatBadge
              label="Entry accuracy"
              value={`${display(entryAccuracyPct(tally.correctEntries, tally.entries))}%`}
            />
          </>
        )}
      </div>

      <Card>
        <div className="py-6 text-center">
          <div className="text-sm font-medium uppercase tracking-wide text-slate-600">Type this</div>
          <div
            className="mt-2 select-none font-mono text-5xl font-bold tabular-nums text-slate-900"
            aria-live="polite"
          >
            {current}
          </div>
        </div>

        <form
          className="mx-auto max-w-md"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <label htmlFor="numpad-input" className="mb-1 block text-sm font-medium text-slate-700">
            Your entry (press Enter to submit)
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
              if (!timer.started && next.length > 0) timer.start();
              setInput(next);
            }}
            onPaste={(e) => e.preventDefault()}
            onDrop={(e) => e.preventDefault()}
            className="w-full rounded-md border border-slate-300 p-3 text-center font-mono text-3xl tabular-nums focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </form>

        <div className="mt-3 flex min-h-10 items-center justify-between">
          <span role="status" className="text-sm font-medium">
            {lastWasCorrect === true && <span className="text-green-800">✓ Correct</span>}
            {lastWasCorrect === false && <span className="text-red-700">✗ Wrong</span>}
          </span>
          {timer.started && (
            <Button variant="secondary" onClick={() => finish(timer.stop())}>
              Finish now
            </Button>
          )}
        </div>
      </Card>

      <p className="mt-4 text-sm text-slate-600">
        Tip: turn on Num Lock and keep your fingers on 4-5-6 (home row). Use the keypad Enter key.
      </p>
    </div>
  );
}
