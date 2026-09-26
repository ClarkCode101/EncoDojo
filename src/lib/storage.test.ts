import { beforeEach, describe, expect, it } from 'vitest';
import {
  MAX_SESSIONS,
  STORAGE_KEY,
  addSession,
  defaultData,
  exportFileName,
  exportJson,
  isAppData,
  loadData,
  migrate,
  parseImport,
  saveData,
  type Session,
} from './storage';

function sampleSession(id = 's1'): Session {
  return {
    id,
    type: 'typing',
    startedAt: '2026-09-26T08:00:00.000Z',
    durationSec: 60,
    metrics: { grossWpm: 45.2, netWpm: 41.8, accuracy: 96.3 },
    mistakes: [{ expected: 'a', typed: 's', index: 12 }],
  };
}

beforeEach(() => {
  localStorage.clear();
});

describe('loadData', () => {
  it('returns defaults when nothing is saved', () => {
    const data = loadData();
    expect(data.version).toBe(1);
    expect(data.sessions).toEqual([]);
    expect(data.settings).toEqual({ difficulty: 1, sound: false, showLiveStats: true });
  });

  it('returns defaults when saved text is not JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{not json');
    expect(loadData().sessions).toEqual([]);
  });

  it('returns defaults when saved JSON has the wrong shape', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, sessions: 'oops' }));
    expect(isAppData(loadData())).toBe(true);
    expect(loadData().sessions).toEqual([]);
  });

  it('returns defaults for an unknown version', () => {
    const future = { ...defaultData(), version: 99 };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(future));
    expect(loadData().version).toBe(1);
  });
});

describe('saveData', () => {
  it('saves and loads the same data', () => {
    const data = addSession(defaultData(), sampleSession());
    expect(saveData(data)).toBe(true);
    expect(loadData()).toEqual(data);
  });
});

describe('addSession', () => {
  it('does not change the original object', () => {
    const data = defaultData();
    addSession(data, sampleSession());
    expect(data.sessions).toHaveLength(0);
  });

  it(`keeps only the latest ${MAX_SESSIONS} sessions`, () => {
    let data = defaultData();
    for (let i = 0; i < MAX_SESSIONS + 5; i++) {
      data = addSession(data, sampleSession(`s${i}`));
    }
    expect(data.sessions).toHaveLength(MAX_SESSIONS);
    expect(data.sessions[0].id).toBe('s5');
    expect(data.sessions.at(-1)?.id).toBe(`s${MAX_SESSIONS + 4}`);
  });
});

describe('migrate', () => {
  it('accepts current-version data', () => {
    const data = defaultData();
    expect(migrate(data)).toEqual(data);
  });

  it('rejects non-objects', () => {
    expect(migrate(null)).toBeNull();
    expect(migrate('hello')).toBeNull();
    expect(migrate([])).toBeNull();
  });

  it('accepts assessment sessions', () => {
    const data = addSession(defaultData(), { ...sampleSession(), type: 'assessment' });
    expect(migrate(JSON.parse(exportJson(data)))).toEqual(data);
  });

  it('rejects an unknown session type', () => {
    const data = addSession(defaultData(), sampleSession());
    const text = exportJson(data).replace('"typing"', '"karaoke"');
    expect(parseImport(text).ok).toBe(false);
  });

  it('rejects an invalid difficulty', () => {
    const bad = defaultData();
    (bad.settings as { difficulty: number }).difficulty = 9;
    expect(migrate(bad)).toBeNull();
  });
});

describe('export / import', () => {
  it('round-trips exactly', () => {
    const data = addSession(defaultData(), sampleSession());
    data.profile.displayName = 'Juan';
    const result = parseImport(exportJson(data));
    expect(result).toEqual({ ok: true, data });
  });

  it('rejects text that is not JSON', () => {
    const result = parseImport('hello');
    expect(result.ok).toBe(false);
  });

  it('rejects JSON that is not our export', () => {
    const result = parseImport(JSON.stringify({ foo: 1 }));
    expect(result.ok).toBe(false);
  });

  it('rejects a session with a bad metric', () => {
    const data = addSession(defaultData(), sampleSession());
    const text = exportJson(data).replace('45.2', '"fast"');
    expect(parseImport(text).ok).toBe(false);
  });

  it('names the file with the local date', () => {
    expect(exportFileName(new Date(2026, 8, 6))).toBe('encodojo-progress-2026-09-06.json');
  });
});
