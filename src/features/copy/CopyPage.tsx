/**
 * Copy Test — PRACTICE mode. Copy fake records (name, birth date, address,
 * contact no., ID) exactly as written, into either:
 * - a FORM (like a hiring test or company software) — CopyRunner, or
 * - a SPREADSHEET (like Excel: one row per record) — CopySheetRunner.
 * Results are saved by default (optional). The Assessment always uses the
 * form, like real alphanumeric data entry tests.
 */
import { useState } from 'react';
import { CopyIcon } from '../../components/icons';
import { Card, Checkbox, Kbd, PageHeader, SegmentedPicker, Step } from '../../components/ui';
import type { CopyMode, Session } from '../../lib/storage';
import { removeSession, saveSession, updateSettings, useAppData } from '../../lib/useAppData';
import CopyResults from './CopyResults';
import CopyRunner from './CopyRunner';
import CopySheetRunner from './CopySheetRunner';

/** A record takes about 20-40 seconds, so 30 seconds would be too short. */
const DURATIONS = [60, 120] as const;
type Seconds = (typeof DURATIONS)[number];

const durationLabel = (s: Seconds) => (s === 60 ? '1 minuto' : '2 minuto');

const MODES: CopyMode[] = ['form', 'sheet'];
const MODE_INFO: Record<CopyMode, { label: string; description: string }> = {
  form: {
    label: 'Form (gaya ng hiring test)',
    description: 'Isang record bawat form, gaya ng hiring test at ng software ng maraming kumpanya.',
  },
  sheet: {
    label: 'Spreadsheet (gaya ng Excel)',
    description: 'Isang row bawat record sa isang table, gaya ng pag-encode sa Excel o Google Sheets.',
  },
};

type Result = { session: Session; finishedEarly: boolean };

export default function CopyPage() {
  const data = useAppData();
  const { showLiveStats, sound } = data.settings;
  const mode: CopyMode = data.settings.copyMode ?? 'form';

  const [seconds, setSeconds] = useState<Seconds>(60);
  const [attempt, setAttempt] = useState(0); // changes to start a fresh run
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [saved, setSaved] = useState(false);

  function handleFinish(session: Session, finishedEarly: boolean) {
    // Finished early = unrealistic speed, so don't save unless asked.
    const save = !finishedEarly;
    if (save) saveSession(session);
    setSaved(save);
    setRunning(false);
    setResult({ session, finishedEarly });
  }

  function toggleSaved() {
    if (!result) return;
    if (saved) removeSession(result.session.id);
    else saveSession(result.session);
    setSaved(!saved);
  }

  function restart() {
    setResult(null);
    setSaved(false);
    setRunning(false);
    setAttempt((n) => n + 1);
  }

  if (result) {
    return (
      <CopyResults
        session={result.session}
        saved={saved}
        finishedEarly={result.finishedEarly}
        onToggleSaved={toggleSaved}
        onRetry={restart}
      />
    );
  }

  return (
    <div>
      <PageHeader
        icon={<CopyIcon className="h-8 w-8" />}
        title="Copy Test"
        description="Kopyahin ang mga record (pangalan, petsa, address, contact no., ID) sa form — gaya ng alphanumeric data entry test. Practice lang ito."
      />

      <Card className="mb-6">
        <div className="space-y-6">
          <Step number={1} title="Pumili kung saan mag-e-encode at gaano katagal">
            <div className="flex flex-wrap items-end gap-6">
              <SegmentedPicker
                label="Saan ka mag-e-encode?"
                options={MODES}
                value={mode}
                format={(m) => MODE_INFO[m].label}
                disabled={running}
                onChange={(m) => updateSettings({ copyMode: m })}
              />
              <SegmentedPicker
                label="Gaano katagal?"
                options={DURATIONS}
                value={seconds}
                format={durationLabel}
                disabled={running}
                onChange={setSeconds}
              />
            </div>
            <p className="mt-3 rounded-lg bg-stone-100 px-4 py-2 text-stone-800">{MODE_INFO[mode].description}</p>
            <div className="mt-4">
              <Checkbox
                label="Ipakita ang score habang nagta-type"
                description="Makikita mo ang bilis at tamang field habang tumatakbo ang oras."
                checked={showLiveStats}
                onChange={(v) => updateSettings({ showLiveStats: v })}
              />
            </div>
          </Step>
          <Step
            number={2}
            title={mode === 'form' ? 'Kopyahin ang bawat record sa form' : 'Kopyahin ang bawat record sa spreadsheet'}
          >
            <p className="text-stone-700">
              Eksakto dapat: parehong malaking titik, tuldok, comma, at space. <Kbd>Tab</Kbd> para sa susunod na{' '}
              {mode === 'form' ? 'field' : 'cell'},{' '}
              {mode === 'form' ? (
                <>
                  <Kbd>Enter</Kbd> sa huling field para ipasa ang record.
                </>
              ) : (
                <>
                  <Kbd>Enter</Kbd> sa dulo ng row para bumaba sa susunod na row.
                </>
              )}
            </p>
          </Step>
        </div>
      </Card>

      {mode === 'form' ? (
        <CopyRunner
          key={`form-${seconds}-${attempt}`}
          seconds={seconds}
          showLiveStats={showLiveStats}
          allowFinishEarly
          sound={sound}
          onStart={() => setRunning(true)}
          onFinish={handleFinish}
        />
      ) : (
        <CopySheetRunner
          key={`sheet-${seconds}-${attempt}`}
          seconds={seconds}
          showLiveStats={showLiveStats}
          allowFinishEarly
          sound={sound}
          onStart={() => setRunning(true)}
          onFinish={handleFinish}
        />
      )}
    </div>
  );
}
