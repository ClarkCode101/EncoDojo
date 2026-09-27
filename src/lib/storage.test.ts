import { beforeEach, describe, expect, it } from 'vitest';
import {
  MAX_SESSIONS,
  PRACTICE_TYPES,
  STORAGE_KEY,
  addSession,
  defaultData,
  exportFileName,
  exportJson,
  isAppData,
  loadData,
  migrate,
  parseImport,
  removeSessions,
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
    expect(data.version).toBe(4);
    expect(data.sessions).toEqual([]);
    expect(data.settings).toEqual({ numpadMode: 'mixed', sound: false, showLiveStats: true, largeText: false });
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
    const future = { ...defaultData(), version: 99, sessions: [sampleSession()] };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(future));
    expect(loadData().version).toBe(4);
    expect(loadData().sessions).toEqual([]);
  });
});

describe('optional settings', () => {
  it('sidebarCollapsed may be missing or a boolean, nothing else', () => {
    const base = defaultData();
    expect(isAppData(base)).toBe(true);
    expect(isAppData({ ...base, settings: { ...base.settings, sidebarCollapsed: true } })).toBe(true);
    expect(isAppData({ ...base, settings: { ...base.settings, sidebarCollapsed: 'yes' } })).toBe(false);
  });

  it('sensei may be missing, on, small or off', () => {
    const base = defaultData();
    for (const sensei of ['on', 'small', 'off']) {
      expect(isAppData({ ...base, settings: { ...base.settings, sensei } })).toBe(true);
    }
    expect(isAppData({ ...base, settings: { ...base.settings, sensei: 'loud' } })).toBe(false);
  });

  it('accepts the 2026-09-27 settings when valid, rejects wrong values', () => {
    const base = defaultData();
    const withSettings = (extra: Record<string, unknown>) => ({ ...base, settings: { ...base.settings, ...extra } });
    expect(
      isAppData(
        withSettings({
          lastBackupAt: '2026-09-27T08:00:00.000Z',
          englishOnly: true,
          dailyGoal: 5,
          bigSource: true,
          reduceMotion: false,
          soundCorrect: true,
        }),
      ),
    ).toBe(true);
    expect(isAppData(withSettings({ lastBackupAt: 'kahapon' }))).toBe(false);
    expect(isAppData(withSettings({ dailyGoal: 7 }))).toBe(false);
    expect(isAppData(withSettings({ englishOnly: 'yes' }))).toBe(false);
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

describe('removeSessions', () => {
  const data = [
    sampleSession('t1'),
    { ...sampleSession('n1'), type: 'numpad' as const },
    { ...sampleSession('a1'), type: 'assessment' as const },
  ].reduce(addSession, defaultData());

  it('removes one session by id', () => {
    expect(removeSessions(data, (s) => s.id === 'n1').sessions.map((s) => s.id)).toEqual(['t1', 'a1']);
  });

  it('clears training history but keeps assessments', () => {
    const left = removeSessions(data, (s) => s.type === 'typing' || s.type === 'numpad');
    expect(left.sessions.map((s) => s.id)).toEqual(['a1']);
  });

  it('PRACTICE_TYPES covers every practice feature (incl. encoding and qc) but not assessments', () => {
    expect(PRACTICE_TYPES).toEqual(['typing', 'numpad', 'copy', 'encoding', 'qc', 'excel']);
    const withEncoding = addSession(data, { ...sampleSession('e1'), type: 'encoding' });
    const left = removeSessions(withEncoding, (s) => PRACTICE_TYPES.includes(s.type));
    expect(left.sessions.map((s) => s.id)).toEqual(['a1']);
  });

  it('does not change the original object or other data', () => {
    const left = removeSessions(data, () => true);
    expect(left.sessions).toEqual([]);
    expect(left.settings).toBe(data.settings);
    expect(data.sessions).toHaveLength(3);
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

  it('accepts an optional copy mode, rejects an invalid one', () => {
    const sheet = defaultData();
    sheet.settings.copyMode = 'sheet';
    expect(migrate(sheet)).toEqual(sheet);

    const bad = defaultData();
    (bad.settings as { copyMode: string }).copyMode = 'word';
    expect(migrate(bad)).toBeNull();
  });

  it('rejects an invalid numpad mode', () => {
    const bad = defaultData();
    (bad.settings as { numpadMode: string }).numpadMode = 'turbo';
    expect(migrate(bad)).toBeNull();
  });
});

describe('migrate from older versions', () => {
  /** What version 1 data looked like (one shared difficulty). */
  function v1(difficulty: number) {
    return {
      version: 1,
      profile: { displayName: 'Ana', createdAt: '2026-09-01T00:00:00.000Z' },
      settings: { difficulty, sound: true, showLiveStats: false },
      sessions: [sampleSession()],
    };
  }

  it('version 1 -> 4: keeps profile, sessions, and other settings; numpad starts on "mixed"', () => {
    for (const difficulty of [1, 2, 3, 4, 5, 6]) {
      expect(migrate(v1(difficulty))).toEqual({
        version: 4,
        profile: { displayName: 'Ana', createdAt: '2026-09-01T00:00:00.000Z' },
        settings: { numpadMode: 'mixed', sound: true, showLiveStats: false, largeText: false },
        sessions: [sampleSession()],
      });
    }
  });

  it('upgrades version 1 data already in localStorage', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v1(3)));
    const data = loadData();
    expect(data.version).toBe(4);
    expect(data.sessions).toHaveLength(1);
  });

  it('can import an old version 1 export file', () => {
    const result = parseImport(JSON.stringify(v1(2)));
    expect(result.ok).toBe(true);
  });

  it('version 2 -> 4: adds largeText = false and numpadMode = "mixed"', () => {
    const v2 = {
      version: 2,
      profile: { displayName: 'Ana', createdAt: '2026-09-01T00:00:00.000Z' },
      settings: { typingLevel: 1, numpadDifficulty: 6, sound: false, showLiveStats: true },
      sessions: [sampleSession()],
    };
    expect(migrate(v2)).toEqual({
      ...v2,
      version: 4,
      settings: { numpadMode: 'mixed', sound: false, showLiveStats: true, largeText: false },
    });
  });

  it('version 3 -> 4: keeps largeText, drops the old difficulty fields', () => {
    const v3 = {
      version: 3,
      profile: { displayName: 'Ana', createdAt: '2026-09-01T00:00:00.000Z' },
      settings: { typingLevel: 1, numpadDifficulty: 2, sound: true, showLiveStats: true, largeText: true },
      sessions: [sampleSession()],
    };
    expect(migrate(v3)).toEqual({
      ...v3,
      version: 4,
      settings: { numpadMode: 'mixed', sound: true, showLiveStats: true, largeText: true },
    });
  });

  it('rejects broken version 3 data', () => {
    const broken = {
      version: 3,
      profile: { displayName: '', createdAt: '2026-09-01T00:00:00.000Z' },
      settings: { typingLevel: 1, numpadDifficulty: 9, sound: true, showLiveStats: true, largeText: true },
      sessions: [],
    };
    expect(migrate(broken)).toBeNull();
  });

  it('rejects broken version 1 data', () => {
    expect(migrate({ ...v1(1), settings: { difficulty: 8, sound: true, showLiveStats: true } })).toBeNull();
    expect(migrate({ ...v1(1), sessions: 'nope' })).toBeNull();
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
