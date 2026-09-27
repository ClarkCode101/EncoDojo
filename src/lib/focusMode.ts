/**
 * "Exam mode" (owner's request, 2026-09-27): while the Assessment is running,
 * the sidebar is hidden so only the exam is on screen. A screen calls
 * `useFocusMode(true)`; the layout reads `useIsFocusMode()`.
 */
import { useEffect, useSyncExternalStore } from 'react';

let count = 0;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

/** Hide the sidebar while `active` is true (and this component is on screen). */
export function useFocusMode(active: boolean) {
  useEffect(() => {
    if (!active) return;
    count += 1;
    notify();
    return () => {
      count -= 1;
      notify();
    };
  }, [active]);
}

export function useIsFocusMode(): boolean {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => count > 0,
  );
}
