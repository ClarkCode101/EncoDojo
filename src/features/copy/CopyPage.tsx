/**
 * Copy Test — PRACTICE mode. Copy fake records (name, birth date, address,
 * ID) into a form, exactly as written. Results are saved by default
 * (optional). The Assessment uses the same CopyRunner with stricter rules.
 */
import { useState } from 'react';
import { CopyIcon } from '../../components/icons';
import { Card, Checkbox, PageHeader, SegmentedPicker, Step } from '../../components/ui';
import type { Session } from '../../lib/storage';
import { removeSession, saveSession, updateSettings, useAppData } from '../../lib/useAppData';
import CopyResults from './CopyResults';
import CopyRunner from './CopyRunner';

/** A record takes about 20-40 seconds, so 30 seconds would be too short. */
const DURATIONS = [60, 120] as const;
type Seconds = (typeof DURATIONS)[number];

const durationLabel = (s: Seconds) => (s === 60 ? '1 minuto' : '2 minuto');

type Result = { session: Session; finishedEarly: boolean };

export default function CopyPage() {
  const data = useAppData();
  const { showLiveStats, sound } = data.settings;

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
        description="Kopyahin ang mga record (pangalan, petsa, address, ID) sa form — gaya ng totoong encoding. Practice lang ito."
      />

      <Card className="mb-6">
        <div className="space-y-6">
          <Step number={1} title="Pumili ng tagal">
            <SegmentedPicker
              label="Gaano katagal?"
              options={DURATIONS}
              value={seconds}
              format={durationLabel}
              disabled={running}
              onChange={setSeconds}
            />
            <div className="mt-4">
              <Checkbox
                label="Ipakita ang score habang nagta-type"
                description="Makikita mo ang bilis at tamang field habang tumatakbo ang oras."
                checked={showLiveStats}
                onChange={(v) => updateSettings({ showLiveStats: v })}
              />
            </div>
          </Step>
          <Step number={2} title="Kopyahin ang bawat record sa form">
            <p className="text-stone-700">
              Eksakto dapat: parehong malaking titik, tuldok, comma, at space. Enter para sa susunod na field.
            </p>
          </Step>
        </div>
      </Card>

      <CopyRunner
        key={`${seconds}-${attempt}`}
        seconds={seconds}
        showLiveStats={showLiveStats}
        allowFinishEarly
        sound={sound}
        onStart={() => setRunning(true)}
        onFinish={handleFinish}
      />
    </div>
  );
}
