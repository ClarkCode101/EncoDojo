/**
 * Numpad Drill — TRAINING mode. Pick a duration, enter numbers, see results.
 * Results are saved by default (optional). The Assessment uses the same
 * NumpadRunner with stricter rules.
 */
import { useState } from 'react';
import { NumpadIcon } from '../../components/icons';
import { Card, PageHeader, SegmentedPicker, Step } from '../../components/ui';
import type { Difficulty, Session } from '../../lib/storage';
import { removeSession, saveSession, updateSettings, useAppData } from '../../lib/useAppData';
import NumpadResults from './NumpadResults';
import NumpadRunner from './NumpadRunner';
import { NUMPAD_DIFFICULTY_LABELS } from './entries';

const DURATIONS = [30, 60] as const;
type Seconds = (typeof DURATIONS)[number];

const durationLabel = (s: Seconds) => (s === 30 ? '30 segundo' : '1 minuto');

const DIFFICULTIES: Difficulty[] = [1, 2, 3, 4, 5, 6];

type Result = { session: Session; finishedEarly: boolean };

export default function NumpadPage() {
  const data = useAppData();
  const { numpadDifficulty: difficulty, showLiveStats, sound } = data.settings;

  const [seconds, setSeconds] = useState<Seconds>(60);
  const [attempt, setAttempt] = useState(0); // changes to start a fresh run
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [saved, setSaved] = useState(false);

  function handleFinish(session: Session, finishedEarly: boolean) {
    // Finished early = unrealistically high KPH, so don't save unless asked.
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
      <NumpadResults
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
        icon={<NumpadIcon className="h-8 w-8" />}
        title="Numpad Practice"
        description="Sanayin ang pag-type ng mga numero gamit ang numpad. Practice lang ito — puwede kang umulit hangga't gusto mo."
      />

      <Card className="mb-6">
        <div className="space-y-6">
          <Step number={1} title="Pumili ng hirap at tagal">
            <div className="flex flex-wrap items-end gap-6">
              <SegmentedPicker
                label="Gaano kahirap? (1 = pinakamadali)"
                options={DIFFICULTIES}
                value={difficulty}
                disabled={running}
                onChange={(d) => updateSettings({ numpadDifficulty: d })}
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
            <p className="mt-3 rounded-lg bg-slate-100 px-4 py-2 text-slate-800">
              <strong>Level {difficulty}:</strong> {NUMPAD_DIFFICULTY_LABELS[difficulty]}
            </p>
          </Step>
          <Step number={2} title="I-type ang bawat numero at pindutin ang Enter" />
        </div>
      </Card>

      <NumpadRunner
        key={`${seconds}-${difficulty}-${attempt}`}
        seconds={seconds}
        difficulty={difficulty}
        showLiveStats={showLiveStats}
        allowFinishEarly
        sound={sound}
        onStart={() => setRunning(true)}
        onFinish={handleFinish}
      />
    </div>
  );
}
