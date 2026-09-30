/**
 * One typing run: passage, input box, timer, and live stats.
 * Used by both the Typing Test (training) and the Assessment.
 *
 * It does NOT save anything. When time is up (or "Finish" is pressed) it
 * builds a Session and hands it to `onFinish`. To start over, the parent
 * gives it a new `key` so React creates a fresh one.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, EnTl, KeyTips, LiveStatsBar } from '../../components/ui';
import { accuracyPct, display, netWpm, wrongKeystrokes } from '../../lib/scoring';
import { useT } from '../../lib/i18n';
import { errorBeep } from '../../lib/sound';
import { makeId, type Session } from '../../lib/storage';
import { useCountdown } from '../../lib/useCountdown';
import PassageView from './PassageView';
import { BAND, alignTyping } from '../../lib/alignTyping';
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
  const t = useT();
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
      <LiveStatsBar
        seconds={timer.remainingSec}
        started={timer.started}
        stats={
          showLiveStats
            ? [
                {
                  label: t('Bilis (Net WPM)', 'Speed (Net WPM)'),
                  value: timer.started ? display(netWpm(typed.length, alignment.errors, elapsed)) : '–',
                },
                {
                  label: t('Accuracy (tama)', 'Accuracy'),
                  value: `${display(accuracyPct(alignment.correctChars, alignment.correctChars + alignment.errors))}%`,
                },
              ]
            : []
        }
      />

      {/* No box around the drill: the passage is already a sheet of paper on the page. */}
      <div className="flex min-h-0 flex-col">
        <PassageView passage={passage} alignment={alignment} />
        <ColorLegend />

        <label htmlFor="typing-input" className="mb-2 mt-4 block text-lg font-bold text-stone-900">
          {t('Dito ka mag-type', 'Type here')}
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
          placeholder={t('I-click dito at magsimulang mag-type…', 'Click here and start typing…')}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          rows={2}
          className="w-full rounded-lg border-[1.5px] border-stone-500 bg-white p-4 font-mono text-xl placeholder:text-stone-500 focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-200"
        />
        <div className="mt-3 flex min-h-11 flex-wrap items-center justify-between gap-3">
          <KeyTips tips={[{ key: 'Backspace', text: t('para magbura', 'to erase') }]} />
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

/** Explains the colors used in the passage. */
function ColorLegend() {
  const t = useT();
  return (
    <ul
      className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-stone-700"
      aria-label={t('Kahulugan ng mga kulay', 'What the colors mean')}
    >
      <li>
        <span className="rounded bg-yellow-200 px-1 font-mono underline decoration-2">a</span> ={' '}
        {t('susunod na letra', 'next letter')}
      </li>
      <li>
        <span className="font-mono text-stone-900">a</span> = {t('tama', 'correct')}
      </li>
      <li>
        <span className="rounded bg-red-200 px-1 font-mono text-red-800">a</span> = {t('mali', 'wrong')}
      </li>
      <li>
        <span className="rounded bg-red-100 px-1 font-mono text-red-700 line-through">a</span> ={' '}
        {t('nalaktawan', 'skipped')}
      </li>
      <li>
        <span className="mx-px inline-block h-4 w-1 rounded-sm bg-red-600 align-middle" /> ={' '}
        {t('sobrang letra', 'extra letter')}
      </li>
    </ul>
  );
}
