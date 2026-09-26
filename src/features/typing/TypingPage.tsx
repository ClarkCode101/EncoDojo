import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Button,
  Card,
  PageHeader,
  SegmentedPicker,
  StatBadge,
} from '../../components/ui';
import { makeRng, randomSeed } from '../../lib/random';
import { accuracyPct, compareTyping, display, grossWpm, netWpm } from '../../lib/scoring';
import { errorBeep } from '../../lib/sound';
import { addSession, makeId, type Session } from '../../lib/storage';
import { updateAppData, useAppData } from '../../lib/useAppData';
import { formatClock, useCountdown } from '../../lib/useCountdown';
import { buildPassage, charsNeeded, levelForDifficulty } from './buildPassage';
import PassageView from './PassageView';
import TypingResults from './TypingResults';

const DURATIONS = [1, 3, 5] as const;
type Minutes = (typeof DURATIONS)[number];

/** Store at most this many mistakes per session (keeps localStorage small). */
const MAX_SAVED_MISTAKES = 200;

export default function TypingPage() {
  const data = useAppData();
  const { difficulty, showLiveStats, sound } = data.settings;

  const [minutes, setMinutes] = useState<Minutes>(1);
  const [seed, setSeed] = useState(randomSeed);
  const [typed, setTyped] = useState('');
  const [result, setResult] = useState<Session | null>(null);

  const passage = useMemo(
    () => buildPassage(makeRng(seed), levelForDifficulty(difficulty), charsNeeded(minutes)),
    [seed, difficulty, minutes],
  );

  // Refs hold the latest values for the timer callback.
  const typedRef = useRef(typed);
  typedRef.current = typed;
  const savedRef = useRef(false);

  const finish = useCallback(
    (elapsedSec: number) => {
      if (savedRef.current) return; // never save the same test twice
      savedRef.current = true;

      const text = typedRef.current;
      const { correctChars, errors, mistakes } = compareTyping(passage, text);
      const session: Session = {
        id: makeId(),
        type: 'typing',
        startedAt: new Date(Date.now() - elapsedSec * 1000).toISOString(),
        durationSec: elapsedSec,
        metrics: {
          grossWpm: grossWpm(text.length, elapsedSec),
          netWpm: netWpm(text.length, errors, elapsedSec),
          accuracy: accuracyPct(correctChars, text.length),
          typedChars: text.length,
          errors,
          minutes,
          difficulty,
        },
        mistakes: mistakes.slice(0, MAX_SAVED_MISTAKES),
      };
      updateAppData((d) => addSession(d, session));
      setResult(session);
    },
    [passage, minutes, difficulty],
  );

  const timer = useCountdown(minutes * 60, () => finish(minutes * 60));

  function restart(newPassage: boolean) {
    timer.reset();
    savedRef.current = false;
    setTyped('');
    setResult(null);
    if (newPassage) setSeed(randomSeed());
  }

  function handleChange(value: string) {
    if (timer.finished) return;
    const next = value.replace(/\n/g, '').slice(0, passage.length);
    if (!timer.started && next.length > 0) timer.start();

    // Beep when a NEW character (not a backspace) is wrong.
    if (sound && next.length > typed.length) {
      const i = next.length - 1;
      if (next[i] !== passage[i]) errorBeep();
    }

    setTyped(next);
    if (next.length === passage.length) finish(timer.stop());
  }

  if (result) {
    return (
      <TypingResults
        session={result}
        onRetrySame={() => restart(false)}
        onNewPassage={() => restart(true)}
      />
    );
  }

  // Live numbers (rounded for display only).
  const live = compareTyping(passage, typed);
  const elapsed = Math.max(timer.elapsedSec, 1); // avoid giant numbers in the first second

  return (
    <div>
      <PageHeader
        title="Typing Test"
        description="Type the passage exactly as shown. The timer starts on your first keystroke."
      />

      <div className="mb-4 flex flex-wrap items-end gap-6">
        <SegmentedPicker
          label="Duration"
          options={DURATIONS}
          value={minutes}
          format={(m) => `${m} min`}
          onChange={(m) => {
            if (timer.started) return;
            setMinutes(m);
          }}
        />
        <Button variant="secondary" onClick={() => restart(true)}>
          New passage
        </Button>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={showLiveStats}
            onChange={(e) =>
              updateAppData((d) => ({
                ...d,
                settings: { ...d.settings, showLiveStats: e.target.checked },
              }))
            }
          />
          Show live stats
        </label>
        <span className="text-sm text-slate-600">Difficulty {difficulty} (change in Settings)</span>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <StatBadge label="Time left" value={formatClock(timer.remainingSec)} />
        {showLiveStats && (
          <>
            <StatBadge
              label="Net WPM"
              value={timer.started ? display(netWpm(typed.length, live.errors, elapsed)) : '–'}
            />
            <StatBadge
              label="Accuracy"
              value={`${display(accuracyPct(live.correctChars, typed.length))}%`}
            />
          </>
        )}
      </div>

      <Card>
        <PassageView passage={passage} typed={typed} />

        <label htmlFor="typing-input" className="mb-1 mt-4 block text-sm font-medium text-slate-700">
          Type here
        </label>
        <textarea
          id="typing-input"
          autoFocus
          value={typed}
          onChange={(e) => handleChange(e.target.value)}
          onPaste={(e) => e.preventDefault()}
          onDrop={(e) => e.preventDefault()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.preventDefault();
          }}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          rows={3}
          className="w-full rounded-md border border-slate-300 p-3 font-mono text-lg focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
        <div className="mt-3 flex justify-between text-sm text-slate-600">
          <span>Backspace is allowed. Pasting is disabled.</span>
          {timer.started && (
            <Button variant="secondary" onClick={() => finish(timer.stop())}>
              Finish now
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
