import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Button,
  Card,
  PageHeader,
  SegmentedPicker,
  StatBadge,
} from '../../components/ui';
import { makeRng, randomSeed } from '../../lib/random';
import { accuracyPct, display, grossWpm, netWpm, wrongKeystrokes } from '../../lib/scoring';
import { errorBeep } from '../../lib/sound';
import { addSession, makeId, type Session } from '../../lib/storage';
import { updateAppData, useAppData } from '../../lib/useAppData';
import { formatClock, useCountdown } from '../../lib/useCountdown';
import { buildPassage, charsNeeded, levelForDifficulty } from './buildPassage';
import { compareWithHistory, type TypingComparison } from './compare';
import PassageView from './PassageView';
import TypingResults from './TypingResults';
import { BAND, alignTyping } from './alignTyping';

/** 30 sec = practice (not saved), 60 sec = recorded test. */
const DURATIONS = [30, 60] as const;
type Seconds = (typeof DURATIONS)[number];
const PRACTICE_SECONDS: Seconds = 30;

const durationLabel = (s: Seconds) => (s === PRACTICE_SECONDS ? '30 sec (practice)' : '1 min');

/** Store at most this many mistakes per session (keeps localStorage small). */
const MAX_SAVED_MISTAKES = 200;

type Result = {
  session: Session;
  comparison: TypingComparison;
};

export default function TypingPage() {
  const data = useAppData();
  const { difficulty, showLiveStats, sound } = data.settings;

  const [seconds, setSeconds] = useState<Seconds>(60);
  const [seed, setSeed] = useState(randomSeed);
  const [typed, setTyped] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  // Is the finished (1 min) result currently saved to progress?
  const [isSaved, setIsSaved] = useState(false);

  const isPractice = seconds === PRACTICE_SECONDS;

  const passage = useMemo(
    () => buildPassage(makeRng(seed), levelForDifficulty(difficulty), charsNeeded(seconds / 60)),
    [seed, difficulty, seconds],
  );

  // Line up the typed text with the passage (see alignTyping.ts).
  const alignment = useMemo(() => alignTyping(passage, typed), [passage, typed]);

  // Refs hold the latest values for the timer callback.
  const typedRef = useRef(typed);
  typedRef.current = typed;
  const sessionsRef = useRef(data.sessions);
  sessionsRef.current = data.sessions;
  const finishedRef = useRef(false);
  // Every key that added text, and how many of those added a mistake
  // (for keystroke accuracy). A ref, because it never changes the screen.
  const keysRef = useRef({ total: 0, wrong: 0 });

  const finish = useCallback(
    (elapsedSec: number) => {
      if (finishedRef.current) return; // never finish the same test twice
      finishedRef.current = true;

      const text = typedRef.current;
      const a = alignTyping(passage, text);
      const keys = keysRef.current;
      const session: Session = {
        id: makeId(),
        type: 'typing',
        startedAt: new Date(Date.now() - elapsedSec * 1000).toISOString(),
        durationSec: elapsedSec,
        metrics: {
          grossWpm: grossWpm(text.length, elapsedSec),
          netWpm: netWpm(text.length, a.errors, elapsedSec),
          accuracy: accuracyPct(a.correctChars, a.correctChars + a.errors),
          keystrokeAccuracy: accuracyPct(keys.total - keys.wrong, keys.total),
          typedChars: text.length,
          errors: a.errors,
          seconds,
          difficulty,
        },
        mistakes: a.mistakes.slice(0, MAX_SAVED_MISTAKES),
      };
      // Compare with earlier tests BEFORE saving this one.
      const comparison = compareWithHistory(sessionsRef.current);

      // Practice runs show results but are not saved to progress.
      const record = seconds !== PRACTICE_SECONDS;
      if (record) updateAppData((d) => addSession(d, session));
      setIsSaved(record);
      setResult({ session, comparison });
    },
    [passage, seconds, difficulty],
  );

  const timer = useCountdown(seconds, () => finish(seconds));

  /** "Don't save this result" / "Save it again" on the results screen. */
  function toggleSaved() {
    if (!result) return;
    const { session } = result;
    if (isSaved) {
      updateAppData((d) => ({ ...d, sessions: d.sessions.filter((s) => s.id !== session.id) }));
    } else {
      updateAppData((d) => addSession(d, session));
    }
    setIsSaved(!isSaved);
  }

  function restart(newPassage: boolean) {
    timer.reset();
    finishedRef.current = false;
    keysRef.current = { total: 0, wrong: 0 };
    setTyped('');
    setResult(null);
    setIsSaved(false);
    if (newPassage) setSeed(randomSeed());
  }

  function handleChange(value: string) {
    if (timer.finished) return;
    // Allow a little extra length for extra keys near the end.
    const next = value.replace(/\n/g, '').slice(0, passage.length + BAND);
    if (!timer.started && next.length > 0) timer.start();

    const nextAlignment = alignTyping(passage, next);

    // Count keystrokes for keystroke accuracy.
    const added = next.length - typed.length;
    const wrong = wrongKeystrokes(added, alignment.errors, nextAlignment.errors);
    if (added > 0) {
      keysRef.current = { total: keysRef.current.total + added, wrong: keysRef.current.wrong + wrong };
    }

    // Beep when a new key (not a backspace) added a mistake.
    if (sound && wrong > 0) errorBeep();

    setTyped(next);
    if (nextAlignment.cursor >= passage.length) finish(timer.stop());
  }

  if (result) {
    return (
      <TypingResults
        session={result.session}
        comparison={result.comparison}
        practice={isPractice}
        saved={isSaved}
        onToggleSaved={toggleSaved}
        onRetrySame={() => restart(false)}
        onNewPassage={() => restart(true)}
      />
    );
  }

  // Live numbers (rounded for display only).
  const live = alignment;
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
          : 'Recorded test: your result will be saved to your progress (you can choose not to keep it).'}
      </p>

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
              value={`${display(accuracyPct(live.correctChars, live.correctChars + live.errors))}%`}
            />
          </>
        )}
      </div>

      <Card>
        <PassageView passage={passage} alignment={alignment} />

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
          <span>
            Backspace is allowed. Pasting is disabled. Each wrong, extra, or skipped key counts as 1
            mistake.
          </span>
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
