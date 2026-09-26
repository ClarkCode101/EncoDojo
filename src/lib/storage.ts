/**
 * Everything the app saves lives under ONE localStorage key.
 *
 * Rules:
 * - Never crash. If data is missing or broken, fall back to defaults.
 * - Every read goes through `migrate()` so older saved data can be upgraded.
 * - Export/Import use the same JSON shape that is stored.
 */

export const STORAGE_KEY = 'encodojo:v1';
export const CURRENT_VERSION = 1;
export const MAX_SESSIONS = 500;

export type Difficulty = 1 | 2 | 3 | 4 | 5 | 6;
export const SESSION_TYPES = ['typing', 'numpad', 'assessment'] as const;
export type SessionType = (typeof SESSION_TYPES)[number];

export type SessionMistake = {
  expected: string;
  typed: string;
  index: number;
  /** Only in assessments: which part the mistake came from. */
  section?: 'typing' | 'numpad';
};

export type Session = {
  id: string;
  type: SessionType;
  startedAt: string; // ISO date string
  durationSec: number;
  metrics: Record<string, number>;
  mistakes: SessionMistake[];
};

export type AppData = {
  version: 1;
  profile: { displayName: string; createdAt: string };
  settings: { difficulty: Difficulty; sound: boolean; showLiveStats: boolean };
  sessions: Session[];
};

export function defaultData(now: Date = new Date()): AppData {
  return {
    version: 1,
    profile: { displayName: '', createdAt: now.toISOString() },
    settings: { difficulty: 1, sound: false, showLiveStats: true },
    sessions: [],
  };
}

// ---------- validation helpers ----------

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isDifficulty(value: unknown): value is Difficulty {
  return typeof value === 'number' && [1, 2, 3, 4, 5, 6].includes(value);
}

function isSession(value: unknown): value is Session {
  if (!isObject(value)) return false;
  return (
    typeof value.id === 'string' &&
    SESSION_TYPES.includes(value.type as SessionType) &&
    typeof value.startedAt === 'string' &&
    typeof value.durationSec === 'number' &&
    isObject(value.metrics) &&
    Object.values(value.metrics).every((n) => typeof n === 'number') &&
    Array.isArray(value.mistakes)
  );
}

/** True when `value` has exactly the shape of the current AppData. */
export function isAppData(value: unknown): value is AppData {
  if (!isObject(value)) return false;
  const { profile, settings, sessions } = value;
  return (
    value.version === CURRENT_VERSION &&
    isObject(profile) &&
    typeof profile.displayName === 'string' &&
    typeof profile.createdAt === 'string' &&
    isObject(settings) &&
    isDifficulty(settings.difficulty) &&
    typeof settings.sound === 'boolean' &&
    typeof settings.showLiveStats === 'boolean' &&
    Array.isArray(sessions) &&
    sessions.every(isSession)
  );
}

/**
 * Upgrade saved data to the current version.
 * Returns null when the data cannot be understood.
 *
 * When we add version 2 later, add a step here like:
 *   if (raw.version === 1) raw = upgradeV1toV2(raw);
 */
export function migrate(raw: unknown): AppData | null {
  if (!isObject(raw)) return null;
  // (no older versions exist yet)
  return isAppData(raw) ? raw : null;
}

/** Keep only the newest sessions so we stay far below the ~5 MB limit. */
function capSessions(sessions: Session[]): Session[] {
  if (sessions.length <= MAX_SESSIONS) return sessions;
  return sessions.slice(sessions.length - MAX_SESSIONS);
}

// ---------- read / write ----------

/** Load saved data. Missing or corrupt data gives defaults, never an error. */
export function loadData(): AppData {
  try {
    const text = localStorage.getItem(STORAGE_KEY);
    if (!text) return defaultData();
    return migrate(JSON.parse(text)) ?? defaultData();
  } catch {
    return defaultData();
  }
}

/** Save data. Returns false if the browser refused (full, private mode, etc). */
export function saveData(data: AppData): boolean {
  try {
    const safe = { ...data, sessions: capSessions(data.sessions) };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
    return true;
  } catch {
    return false;
  }
}

/** Return a copy of `data` with the session added (oldest dropped past the cap). */
export function addSession(data: AppData, session: Session): AppData {
  return { ...data, sessions: capSessions([...data.sessions, session]) };
}

/** Simple unique id, good enough for local-only data. */
export function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ---------- export / import ----------

export function exportJson(data: AppData): string {
  return JSON.stringify(data, null, 2);
}

/** e.g. encodojo-progress-2026-09-26.json (uses the local date). */
export function exportFileName(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `encodojo-progress-${y}-${m}-${d}.json`;
}

export type ImportResult = { ok: true; data: AppData } | { ok: false; error: string };

/** Check an imported file BEFORE replacing anything. */
export function parseImport(text: string): ImportResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'This file is not valid JSON.' };
  }
  const data = migrate(raw);
  if (!data) {
    return { ok: false, error: 'This file is not an EncoDojo progress export.' };
  }
  return { ok: true, data: { ...data, sessions: capSessions(data.sessions) } };
}
