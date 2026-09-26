/**
 * One typing run: passage, input box, timer, and live stats.
 * Used by both the Typing Test (training) and the Assessment.
 *
 * It does NOT save anything. When time is up (or "Finish now" is pressed) it
 * builds a Session and hands it to `onFinish`. To start over, the parent
 * gives it a new `key` so React creates a fresh one.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, StatBadge } from '../../components/ui';
import { accuracyPct, display, netWpm, wrongKeystrokes } from '../../lib/scoring';
import { errorBeep } from '../../lib/sound';
import { makeId, type Session } from '../../lib/storage';
import { formatClock, useCountdown } from '../../lib/useCountdown';
import PassageView from './PassageView';
import { BAND, alignTyping } from './alignTyping';
import { scoreTyping } from './scoreTyping';

/** Store at most this many mistakes per session (keeps localStorage small). */
const MAX_SAVED_MISTAKES = 200;

export default function TypingRunner({
  passage,
  seconds,
  level,
  showLiveStats,
  allowFinishEarly,
  sound,
  onStart,
  onFinish,
}: {
  passage: string;
  seconds: number;
  /** Passage level, saved with the result. 0 = mixed (assessment). */
  level: number;
  showLiveStats: boolean;
  allowFinishEarly: boolean;
  sound: boolean;
  onStart?: () => void;
  onFinish: (session: Session, finishedEarly: boolean) => void;
}) {
  const [typed, setTyped] = useState('');

  // Line up the typed text with the passage (see alignTyping.ts).
  const alignment = useMemo(() => alignTyping(passage, typed), [passage, typed]);

  // Refs hold the latest values for the timer callback.
  const typedRef = useRef(typed);
  typedRef.current = typed;
  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    onFinishRef.current = onFinish;
  });
  const finishedRef = useRef(false);
  // Every key that added text, and how many of those added a mistake
  // (for keystroke accuracy). A ref, because it never changes the screen.
  const keysRef = useRef({ total: 0, wrong: 0 });

  const finish = useCallback(
    (elapsedSec: number, finishedEarly: boolean) => {
      if (finishedRef.current) return; // never finish the same run twice
      finishedRef.current = true;

      const { alignment: a, metrics } = scoreTyping(passage, typedRef.current, elapsedSec, keysRef.current);
      const session: Session = {
        id: makeId(),
        type: 'typing',
        startedAt: new Date(Date.now() - elapsedSec * 1000).toISOString(),
        durationSec: elapsedSec,
        metrics: { ...metrics, seconds, level },
        mistakes: a.mistakes.slice(0, MAX_SAVED_MISTAKES),
      };
      onFinishRef.current(session, finishedEarly);
    },
    [passage, seconds, level],
  );

  const timer = useCountdown(seconds, () => finish(seconds, false));

  function handleChange(value: string) {
    if (timer.finished) return;
    // Allow a little extra length for extra keys near the end.
    const next = value.replace(/\n/g, '').slice(0, passage.length + BAND);
    if (!timer.started && next.length > 0) {
      timer.start();
      onStart?.();
    }

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
    // Typed the whole passage before time ran out: that's a real finish, not "early".
    if (nextAlignment.cursor >= passage.length) finish(timer.stop(), false);
  }

  const elapsed = Math.max(timer.elapsedSec, 1); // avoid giant numbers in the first second

  return (
    <>
      <div className="mb-4 grid grid-cols-3 gap-3">
        <StatBadge label="Time left" value={formatClock(timer.remainingSec)} />
        {showLiveStats && (
          <>
            <StatBadge
              label="Net WPM"
              value={timer.started ? display(netWpm(typed.length, alignment.errors, elapsed)) : '–'}
            />
            <StatBadge
              label="Accuracy"
              value={`${display(accuracyPct(alignment.correctChars, alignment.correctChars + alignment.errors))}%`}
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
        <div className="mt-3 flex min-h-10 items-center justify-between gap-3 text-sm text-slate-600">
          <span>
            Backspace is allowed. Pasting is disabled. Each wrong, extra, or skipped key counts as 1
            mistake.
          </span>
          {allowFinishEarly && timer.started && (
            <Button variant="secondary" onClick={() => finish(timer.stop(), true)}>
              Finish now
            </Button>
          )}
        </div>
      </Card>
    </>
  );
}
