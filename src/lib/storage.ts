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
export const CURRENT_VERSION = 4;
export const MAX_SESSIONS = 500;

/** Number generator difficulty 1-6 (see features/numpad/entries.ts). */
export type Difficulty = 1 | 2 | 3 | 4 | 5 | 6;
/** Numpad Practice mode: "mixed" = same as the Assessment, "beginner" = short numbers only. */
export type NumpadMode = 'mixed' | 'beginner';
/** Copy Test layout: "form" = like a hiring test / company software, "sheet" = like Excel. */
export type CopyMode = 'form' | 'sheet';
export const SESSION_TYPES = ['typing', 'numpad', 'copy', 'encoding', 'qc', 'assessment'] as const;
export type SessionType = (typeof SESSION_TYPES)[number];
/** Every practice (training) type — everything except the Assessment. New features are included automatically. */
export const PRACTICE_TYPES: SessionType[] = SESSION_TYPES.filter((t) => t !== 'assessment');

export type SessionMistake = {
  expected: string;
  typed: string;
  index: number;
  /** Only in assessments: which part the mistake came from. */
  section?: 'typing' | 'numpad' | 'copy' | 'encoding' | 'qc';
  /** Only in the Copy Test: which form field (e.g. "address"). */
  field?: string;
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
  numpadMode: NumpadMode;
  /**
   * Optional (added without a schema version bump): missing means "sheet"
   * (the default layout in Copy Test practice).
   * Older data simply doesn't have it, so no migration is needed.
   */
  copyMode?: CopyMode;
  sound: boolean;
  /**
   * No longer used: practice always shows live stats and the Assessment always
   * hides them (owner's decision). Kept so old data stays valid without a
   * migration; remove it the next time the schema version changes.
   */
  showLiveStats: boolean;
  /** Bigger text and buttons everywhere (for people who find the normal size hard to read). */
  largeText: boolean;
  /**
   * Optional (added without a schema version bump): true = the sidebar is
   * collapsed to icons only (more room for the page). Missing = open.
   */
  sidebarCollapsed?: boolean;
  /**
   * Optional (added without a schema version bump): the Sensei guide in the
   * lower-right corner. 'on' (default when missing), 'small', or 'off'.
   */
  sensei?: 'on' | 'small' | 'off';
  /*
   * More optional settings (owner's request, 2026-09-27; no schema version bump,
   * missing = the old behavior):
   */
  /** When the last backup file was downloaded (ISO). Missing = never. Used for the backup reminder. */
  lastBackupAt?: string;
  /** true = hide the Taglish meanings beside English labels inside tests ("English lang"), like a real hiring test. */
  englishOnly?: boolean;
  /** Practices per day the user wants to do (3, 5 or 10). Missing or 0 = no daily goal. */
  dailyGoal?: number;
  /** true = bigger text in the passage, the number to type, and the documents (only what you read from). */
  bigSource?: boolean;
  /** true = no animations (stamp, Sensei popping up on his own). */
  reduceMotion?: boolean;
  /** true = a soft sound when an entry or record is correct. */
  soundCorrect?: boolean;
};

/** The daily goals the user can pick in Settings (0 = none). */
export const DAILY_GOALS = [0, 3, 5, 10] as const;

export type AppData = {
  version: 4;
  profile: { displayName: string; createdAt: string };
  settings: Settings;
  sessions: Session[];
};

export function defaultData(now: Date = new Date()): AppData {
  return {
    version: 4,
    profile: { displayName: '', createdAt: now.toISOString() },
    settings: { numpadMode: 'mixed', sound: false, showLiveStats: true, largeText: false },
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

function isTypingLevel(value: unknown): boolean {
  return typeof value === 'number' && [1, 2, 3].includes(value);
}

function isCopyModeOrMissing(value: unknown): boolean {
  return value === undefined || value === 'form' || value === 'sheet';
}

function isBooleanOrMissing(value: unknown): boolean {
  return value === undefined || typeof value === 'boolean';
}

/** The optional settings added on 2026-09-27 (each may be missing). */
function hasValidExtraSettings(settings: Record<string, unknown>): boolean {
  return (
    (settings.lastBackupAt === undefined ||
      (typeof settings.lastBackupAt === 'string' && !Number.isNaN(Date.parse(settings.lastBackupAt)))) &&
    isBooleanOrMissing(settings.englishOnly) &&
    (settings.dailyGoal === undefined || (DAILY_GOALS as readonly unknown[]).includes(settings.dailyGoal)) &&
    isBooleanOrMissing(settings.bigSource) &&
    isBooleanOrMissing(settings.reduceMotion) &&
    isBooleanOrMissing(settings.soundCorrect)
  );
}

function isNumpadMode(value: unknown): value is NumpadMode {
  return value === 'mixed' || value === 'beginner';
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
  return (
    isNumpadMode(settings.numpadMode) &&
    typeof settings.largeText === 'boolean' &&
    isCopyModeOrMissing(settings.copyMode) &&
    isBooleanOrMissing(settings.sidebarCollapsed) &&
    (settings.sensei === undefined || settings.sensei === 'on' || settings.sensei === 'small' || settings.sensei === 'off') &&
    hasValidExtraSettings(settings)
  );
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

/** Version 3 adds the "large text" setting (off by default). */
function upgradeV2toV3(raw: Record<string, unknown>): Record<string, unknown> | null {
  if (!isObject(raw.settings)) return null;
  return { ...raw, version: 3, settings: { ...raw.settings, largeText: false } };
}

/**
 * Version 4 replaces the numpad difficulty (1-6) with two simple modes and
 * removes the unused typing level. Everyone starts on "mixed" (the same mix
 * as the Assessment), which is the recommended mode.
 */
function upgradeV3toV4(raw: Record<string, unknown>): Record<string, unknown> | null {
  if (!hasValidCommonParts(raw)) return null;
  const { typingLevel, numpadDifficulty, ...rest } = raw.settings as Record<string, unknown>;
  if (!isTypingLevel(typingLevel) || !isDifficulty(numpadDifficulty)) return null;
  return { ...raw, version: 4, settings: { ...rest, numpadMode: 'mixed' } };
}

/**
 * Upgrade saved data to the current version, one step at a time.
 * Returns null when the data cannot be understood.
 */
export function migrate(raw: unknown): AppData | null {
  if (!isObject(raw)) return null;
  let data: Record<string, unknown> | null = raw;
  if (data?.version === 1) data = upgradeV1toV2(data);
  if (data?.version === 2) data = upgradeV2toV3(data);
  if (data?.version === 3) data = upgradeV3toV4(data);
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

/** Return a copy of `data` without the sessions for which `shouldRemove` is true. */
export function removeSessions(data: AppData, shouldRemove: (s: Session) => boolean): AppData {
  return { ...data, sessions: data.sessions.filter((s) => !shouldRemove(s)) };
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
    return { ok: false, error: 'Hindi mabasa ang file na ito. Siguraduhing backup file ito ng EncoDojo (.json).' };
  }
  const data = migrate(raw);
  if (!data) {
    return { ok: false, error: 'Hindi ito backup file ng EncoDojo. Pumili ng ibang file.' };
  }
  return { ok: true, data: { ...data, sessions: capSessions(data.sessions) } };
}
