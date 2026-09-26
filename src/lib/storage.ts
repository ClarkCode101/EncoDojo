/**
 * Everything the app saves lives under ONE localStorage key.
 *
 * Rules:
 * - Never crash. If data is missing or broken, fall back to defaults.
 * - Every read goes through `migrate()` so older saved data can be upgraded.
 * - Export/Import use the same JSON shape that is stored.
 */

/**
 * The key name never changes (it would lose everyone's data). The schema
 * version lives INSIDE the data (`version`) and is upgraded by migrate().
 */
export const STORAGE_KEY = 'encodojo:v1';
export const CURRENT_VERSION = 2;
export const MAX_SESSIONS = 500;

/** Numpad Drill difficulty (see features/numpad/entries.ts). */
export type Difficulty = 1 | 2 | 3 | 4 | 5 | 6;
/** Typing Test passage level: 1 plain text, 2 names & addresses, 3 numbers & codes. */
export type TypingLevel = 1 | 2 | 3;
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

export type Settings = {
  /**
   * Not used right now: the Typing Test is plain text only for the time
   * being. Kept so a level picker can come back without another migration.
   */
  typingLevel: TypingLevel;
  numpadDifficulty: Difficulty;
  sound: boolean;
  showLiveStats: boolean;
};

export type AppData = {
  version: 2;
  profile: { displayName: string; createdAt: string };
  settings: Settings;
  sessions: Session[];
};

export function defaultData(now: Date = new Date()): AppData {
  return {
    version: 2,
    profile: { displayName: '', createdAt: now.toISOString() },
    settings: { typingLevel: 1, numpadDifficulty: 1, sound: false, showLiveStats: true },
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

function isTypingLevel(value: unknown): value is TypingLevel {
  return typeof value === 'number' && [1, 2, 3].includes(value);
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

/** Profile, sessions, sound, and live stats: the same in every version so far. */
function hasValidCommonParts(value: Record<string, unknown>): boolean {
  const { profile, settings, sessions } = value;
  return (
    isObject(profile) &&
    typeof profile.displayName === 'string' &&
    typeof profile.createdAt === 'string' &&
    isObject(settings) &&
    typeof settings.sound === 'boolean' &&
    typeof settings.showLiveStats === 'boolean' &&
    Array.isArray(sessions) &&
    sessions.every(isSession)
  );
}

/** True when `value` has exactly the shape of the current AppData. */
export function isAppData(value: unknown): value is AppData {
  if (!isObject(value) || value.version !== CURRENT_VERSION || !hasValidCommonParts(value)) return false;
  const settings = value.settings as Record<string, unknown>;
  return isTypingLevel(settings.typingLevel) && isDifficulty(settings.numpadDifficulty);
}

/**
 * Version 1 had ONE difficulty (1-6) in Settings for both drills.
 * Version 2 gives each drill its own: typingLevel (1-3) and numpadDifficulty (1-6).
 */
function upgradeV1toV2(raw: Record<string, unknown>): Record<string, unknown> | null {
  if (!hasValidCommonParts(raw)) return null;
  const { difficulty, ...rest } = raw.settings as Record<string, unknown>;
  if (!isDifficulty(difficulty)) return null;
  return {
    ...raw,
    version: 2,
    settings: {
      ...rest,
      typingLevel: Math.ceil(difficulty / 2), // old 1-2 -> 1, 3-4 -> 2, 5-6 -> 3
      numpadDifficulty: difficulty,
    },
  };
}

/**
 * Upgrade saved data to the current version, one step at a time.
 * Returns null when the data cannot be understood.
 */
export function migrate(raw: unknown): AppData | null {
  if (!isObject(raw)) return null;
  let data: Record<string, unknown> | null = raw;
  if (data.version === 1) data = upgradeV1toV2(data);
  return isAppData(data) ? data : null;
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
