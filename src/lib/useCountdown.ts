import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Countdown timer for timed drills.
 *
 * - Call `start()` on the first keystroke.
 * - `onFinish` runs once when time is up.
 * - Time is measured with Date.now(), so a slow browser tab does not make the
 *   timer drift (setInterval alone is not accurate).
 */
export function useCountdown(durationSec: number, onFinish: () => void) {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [finished, setFinished] = useState(false);

  // Keep the latest onFinish without restarting the interval.
  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    onFinishRef.current = onFinish;
  });

  const elapsedSec = startedAt === null ? 0 : Math.min(durationSec, (now - startedAt) / 1000);
  const remainingSec = Math.max(0, durationSec - elapsedSec);

  useEffect(() => {
    if (startedAt === null || finished) return;
    const id = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      if ((t - startedAt) / 1000 >= durationSec) {
        setFinished(true);
        onFinishRef.current();
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [startedAt, finished, durationSec]);

  const start = useCallback(() => {
    if (startedAt !== null) return;
    const t = Date.now();
    setStartedAt(t);
    setNow(t);
  }, [startedAt]);

  /** Stop early (e.g. passage finished). Returns elapsed seconds. */
  const stop = useCallback((): number => {
    setFinished(true);
    if (startedAt === null) return 0;
    return Math.min(durationSec, (Date.now() - startedAt) / 1000);
  }, [startedAt, durationSec]);

  const reset = useCallback(() => {
    setStartedAt(null);
    setFinished(false);
    setNow(Date.now());
  }, []);

  /** Exact elapsed seconds right now (more precise than the rendered value). */
  const readElapsed = useCallback((): number => {
    if (startedAt === null) return 0;
    return Math.min(durationSec, (Date.now() - startedAt) / 1000);
  }, [startedAt, durationSec]);

  return {
    started: startedAt !== null,
    startedAt,
    finished,
    elapsedSec,
    remainingSec,
    start,
    stop,
    reset,
    readElapsed,
  };
}

/** 125 -> "2:05" */
export function formatClock(totalSec: number): string {
  const s = Math.max(0, Math.ceil(totalSec));
  const minutes = Math.floor(s / 60);
  const seconds = s % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
