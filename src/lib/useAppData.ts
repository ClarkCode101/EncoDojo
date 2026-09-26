/**
 * A tiny shared store around storage.ts so every screen sees the same data
 * and re-renders when it changes.
 *
 * Usage:
 *   const data = useAppData();
 *   updateAppData((d) => ({ ...d, settings: { ...d.settings, sound: true } }));
 */
import { useSyncExternalStore } from 'react';
import { STORAGE_KEY, loadData, saveData, type AppData } from './storage';

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
