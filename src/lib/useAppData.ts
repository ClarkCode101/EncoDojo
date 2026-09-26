/**
 * A tiny shared store around storage.ts so every screen sees the same data
 * and re-renders when it changes.
 *
 * Usage:
 *   const data = useAppData();
 *   updateAppData((d) => ({ ...d, settings: { ...d.settings, sound: true } }));
 */
import { useSyncExternalStore } from 'react';
import { STORAGE_KEY, addSession, loadData, saveData, type AppData, type Session } from './storage';

let current: AppData = loadData();
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Change the data, save it, and refresh every screen using it. */
export function updateAppData(change: (data: AppData) => AppData): boolean {
  current = change(current);
  const saved = saveData(current);
  notify();
  return saved;
}

/** Replace everything (used by Import and Reset). */
export function replaceAppData(data: AppData): boolean {
  return updateAppData(() => data);
}

/** Add a finished session to progress. */
export function saveSession(session: Session): boolean {
  return updateAppData((d) => addSession(d, session));
}

/** Remove a session from progress (e.g. "Don't save this result"). */
export function removeSession(id: string): boolean {
  return updateAppData((d) => ({ ...d, sessions: d.sessions.filter((s) => s.id !== id) }));
}

export function useAppData(): AppData {
  return useSyncExternalStore(subscribe, () => current);
}

// If the app is open in two tabs, keep them in sync.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) {
      current = loadData();
      notify();
    }
  });
}
