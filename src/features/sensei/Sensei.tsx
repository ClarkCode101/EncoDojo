/**
 * Sensei: a small pixel-art guide in the lower-right corner (owner's idea,
 * 2026-09-27). A speech bubble pops up about 1 second after a page opens and
 * hides by itself after ~7 seconds; clicking Sensei gives a new line.
 *
 * So he never gets in the way (owner's feedback 2026-09-30, the bubble covered
 * rows and buttons): the bubble sits ABOVE him, narrow, and it goes away as soon
 * as the user scrolls, types, or clicks anywhere else on the page.
 *
 * - Quiet (hidden) while practicing or taking the Assessment (see quiet.ts);
 *   right after a practice he talks about the results.
 * - "Itago si Sensei" makes him small; Settings: Ipakita / Maliit lang / Wala
 *   (`settings.sensei`, missing = 'on').
 * - The lines are rule-based (lines.ts), never AI.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { langOf, translator } from '../../lib/i18n';
import { updateSettings, useAppData } from '../../lib/useAppData';
import { placeFromPath, senseiLine } from './lines';
import { useIsSenseiQuiet } from './quiet';
import SenseiArt from './SenseiArt';

/** Wait a moment after a page opens, so the page is seen first. */
const SPEAK_DELAY_MS = 900;
/** How long a bubble stays (if the user does nothing). */
const BUBBLE_MS = 7000;

const focusRing =
  'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-brand-600';

export default function Sensei() {
  const { settings, sessions } = useAppData();
  const mode = settings.sensei ?? 'on';
  const quiet = useIsSenseiQuiet();
  const { pathname } = useLocation();
  const lang = langOf(settings);
  const t = translator(lang);

  // The bubble text and the page it belongs to (so an old line never shows on a new page).
  const [line, setLine] = useState<{ text: string; path: string; id: number } | null>(null);
  const sessionsRef = useRef(sessions);
  sessionsRef.current = sessions;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const say = useCallback(
    (afterPractice: boolean) => {
      const { lastBackupAt } = settingsRef.current;
      const text = senseiLine({
        place: placeFromPath(pathname),
        sessions: sessionsRef.current,
        afterPractice,
        settings: { lastBackupAt },
        lang: langOf(settingsRef.current),
      });
      setLine((old) => ({ text, path: pathname, id: (old?.id ?? 0) + 1 }));
    },
    [pathname],
  );

  // Remember that a practice screen was open, so the next line can be about the results.
  const wasQuiet = useRef(false);
  useEffect(() => {
    if (!quiet) return;
    wasQuiet.current = true;
    // Drop the old bubble, so it doesn't come back after the practice.
    const t = window.setTimeout(() => setLine(null), 0);
    return () => window.clearTimeout(t);
  }, [quiet]);

  // Speak when a page opens (and when coming back from a practice screen).
  useEffect(() => {
    // "Bawasan ang galaw" (settings.reduceMotion): no bubble popping up by itself; clicking him still works.
    if (mode !== 'on' || quiet || settings.reduceMotion) return;
    const afterPractice = wasQuiet.current;
    wasQuiet.current = false;
    const t = window.setTimeout(() => say(afterPractice), SPEAK_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [pathname, quiet, mode, say, settings.reduceMotion]);

  // Hide the bubble by itself after a while, or as soon as the user gets to work:
  // a scroll, a key, or a click anywhere else on the page.
  const boxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!line) return;
    const t = window.setTimeout(() => setLine(null), BUBBLE_MS);
    const hide = () => setLine(null);
    const outside = (e: PointerEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) hide();
    };
    window.addEventListener('scroll', hide, { capture: true, passive: true });
    window.addEventListener('keydown', hide);
    window.addEventListener('pointerdown', outside);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('scroll', hide, { capture: true });
      window.removeEventListener('keydown', hide);
      window.removeEventListener('pointerdown', outside);
    };
  }, [line]);

  if (mode === 'off' || quiet) return null;

  if (mode === 'small') {
    return (
      <button
        type="button"
        onClick={() => updateSettings({ sensei: 'on' })}
        aria-label={t('Ipakita si Sensei', 'Show Sensei')}
        title={t('Ipakita si Sensei', 'Show Sensei')}
        className={`fixed bottom-4 right-4 z-40 rounded-full border-2 border-brand-800 bg-white p-1.5 shadow-md transition-transform hover:scale-105 motion-reduce:transition-none ${focusRing}`}
      >
        <SenseiArt className="h-[34px] w-[30px]" />
      </button>
    );
  }

  const bubble = line && line.path === pathname ? line : null;
  return (
    // The bubble stands ABOVE Sensei (not beside him), so it only covers a narrow strip at the right edge.
    // Clicks go THROUGH the bubble (except its two buttons): a toggle under it still works, and the
    // click hides the bubble.
    <div ref={boxRef} className="pointer-events-none fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
      {bubble && (
        <div
          key={bubble.id}
          role="status"
          className="pointer-events-none relative mr-2 max-w-[min(16rem,70vw)] rounded-2xl border-2 border-brand-800 bg-white px-3.5 py-2.5 text-[0.95rem] text-stone-900 shadow-lg motion-safe:animate-sensei-pop"
        >
          <div className="mb-1 flex items-center justify-between gap-3">
            <span className="text-sm font-bold text-brand-800">Sensei</span>
            <button
              type="button"
              onClick={() => setLine(null)}
              aria-label={t('Isara ang sinabi ni Sensei', "Close Sensei's message")}
              className={`pointer-events-auto -mr-1 rounded px-1 text-stone-500 hover:text-stone-900 ${focusRing}`}
            >
              ✕
            </button>
          </div>
          <p className="leading-snug">{bubble.text}</p>
          <button
            type="button"
            onClick={() => updateSettings({ sensei: 'small' })}
            className={`pointer-events-auto mt-2 rounded text-sm text-brand-700 underline decoration-dotted underline-offset-2 hover:text-brand-900 ${focusRing}`}
          >
            {t('Itago si Sensei', 'Hide Sensei')}
          </button>
          {/* The bubble's little tail, pointing down at Sensei. */}
          <span
            aria-hidden="true"
            className="absolute -bottom-[9px] right-7 h-4 w-4 rotate-45 border-b-2 border-r-2 border-brand-800 bg-white"
          />
        </div>
      )}
      <button
        type="button"
        onClick={() => say(false)}
        aria-label={t('Si Sensei: pindutin para sa bagong tip', 'Sensei: press for a new tip')}
        title={t('Pindutin para sa bagong tip', 'Press for a new tip')}
        className={`pointer-events-auto shrink-0 rounded-2xl p-1 transition-transform hover:-translate-y-0.5 motion-reduce:transition-none ${focusRing}`}
      >
        <SenseiArt className="h-[64px] w-[57px] drop-shadow-md sm:h-[80px] sm:w-[71px]" />
      </button>
    </div>
  );
}
