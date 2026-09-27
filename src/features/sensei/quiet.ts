/**
 * Sensei stays out of the way while the user is working: practice screens
 * (PracticeFrame) and a running Assessment call `useSenseiQuiet(true)`, and
 * Sensei hides until none of them is on screen any more.
 */
import { useEffect, useSyncExternalStore } from 'react';

let quietCount = 0;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

/** Keep Sensei quiet while `active` is true (and this component is on screen). */
export function useSenseiQuiet(active: boolean) {
  useEffect(() => {
    if (!active) return;
    quietCount += 1;
    notify();
    return () => {
      quietCount -= 1;
      notify();
    };
  }, [active]);
}

/** True while some screen asked Sensei to be quiet. */
export function useIsSenseiQuiet(): boolean {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => quietCount > 0,
  );
}
