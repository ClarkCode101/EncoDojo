import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Button,
  Card,
  PageHeader,
  SegmentedPicker,
  StatBadge,
} from '../../components/ui';
import { makeRng, randomSeed } from '../../lib/random';
import { accuracyPct, display, grossWpm, netWpm } from '../../lib/scoring';
import { errorBeep } from '../../lib/sound';
import { addSession, makeId, type Session } from '../../lib/storage';
import { updateAppData, useAppData } from '../../lib/useAppData';
import { formatClock, useCountdown } from '../../lib/useCountdown';
import { buildPassage, charsNeeded, levelForDifficulty } from './buildPassage';
import PassageView from './PassageView';
import TypingResults from './TypingResults';
import { isExtraSpace, typingStats } from './typingInput';

/** 30 sec = practice (not saved), 60 sec = recorded test. */
const DURATIONS = [30, 60] as const;
type Seconds = (typeof DURATIONS)[number];
const PRACTICE_SECONDS: Seconds = 30;

const durationLabel = (s: Seconds) => (s === PRACTICE_SECONDS ? '30 sec (practice)' : '1 min');

/** Store at most this many mistakes per session (keeps localStorage small). */
const MAX_SAVED_MISTAKES = 200;

export default function TypingPage() {
  const data = useAppData();
  const { difficulty, showLiveStats, sound } = data.settings;

  const [seconds, setSeconds] = useState<Seconds>(60);
  const [seed, setSeed] = useState(randomSeed);
  const [typed, setTyped] = useState('');
  // Positions where an extra space was typed (counted as mistakes, not shown).
  const [extraSpaces, setExtraSpaces] = useState<number[]>([]);
  const [result, setResult] = useState<Session | null>(null);

  const isPractice = seconds === PRACTICE_SECONDS;

  const passage = useMemo(
    () => buildPassage(makeRng(seed), levelForDifficulty(difficulty), charsNeeded(seconds / 60)),
    [seed, difficulty, seconds],
  );

  // Refs hold the latest values for the timer callback.
  const typedRef = useRef(typed);
  typedRef.current = typed;
  const extraSpacesRef = useRef(extraSpaces);
  extraSpacesRef.current = extraSpaces;
  const savedRef = useRef(false);

  const finish = useCallback(
    (elapsedSec: number) => {
      if (savedRef.current) return; // never finish the same test twice
      savedRef.current = true;

      const stats = typingStats(passage, typedRef.current, extraSpacesRef.current);
      const session: Session = {
        id: makeId(),
        type: 'typing',
        startedAt: new Date(Date.now() - elapsedSec * 1000).toISOString(),
        durationSec: elapsedSec,
        metrics: {
          grossWpm: grossWpm(stats.typedChars, elapsedSec),
          netWpm: netWpm(stats.typedChars, stats.errors, elapsedSec),
          accuracy: accuracyPct(stats.correctChars, stats.typedChars),
          typedChars: stats.typedChars,
          errors: stats.errors,
          seconds,
          difficulty,
        },
        mistakes: stats.mistakes.slice(0, MAX_SAVED_MISTAKES),
      };
      // Practice runs show results but are not saved to progress.
      if (seconds !== PRACTICE_SECONDS) {
        updateAppData((d) => addSession(d, session));
      }
      setResult(session);
    },
    [passage, seconds, difficulty],
  );

  const timer = useCountdown(seconds, () => finish(seconds));

  function restart(newPassage: boolean) {
    timer.reset();
    savedRef.current = false;
    setTyped('');
    setExtraSpaces([]);
    setResult(null);
    if (newPassage) setSeed(randomSeed());
  }

  function handleChange(value: string) {
    if (timer.finished) return;
    const next = value.replace(/\n/g, '').slice(0, passage.length);
    if (!timer.started && next.length > 0) timer.start();

    // Extra space: count it as a mistake but don't add it to the text,
    // so the next letter still lines up with the passage.
    if (isExtraSpace(passage, typed, next)) {
      if (sound) errorBeep();
      setExtraSpaces((list) => [...list, typed.length]);
      return;
    }

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
        practice={isPractice}
        onRetrySame={() => restart(false)}
        onNewPassage={() => restart(true)}
      />
    );
  }

  // Live numbers (rounded for display only).
  const live = typingStats(passage, typed, extraSpaces);
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
          value={seconds}
          format={durationLabel}
          onChange={(s) => {
            if (timer.started) return;
            setSeconds(s);
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

      <p className="mb-4 text-sm text-slate-700">
        {isPractice
          ? 'Practice mode: your result will be shown but NOT saved to your progress.'
          : 'Recorded test: your result will be saved to your progress.'}
      </p>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <StatBadge label="Time left" value={formatClock(timer.remainingSec)} />
        {showLiveStats && (
          <>
            <StatBadge
              label="Net WPM"
              value={timer.started ? display(netWpm(live.typedChars, live.errors, elapsed)) : '–'}
            />
            <StatBadge
              label="Accuracy"
              value={`${display(accuracyPct(live.correctChars, live.typedChars))}%`}
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
          <span>Backspace is allowed. Pasting is disabled. An extra space counts as 1 mistake.</span>
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
