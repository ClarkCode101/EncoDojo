/**
 * Numpad Drill — TRAINING mode. Pick a duration, enter numbers, see results.
 * Results are saved by default (optional). The Assessment uses the same
 * NumpadRunner with stricter rules.
 */
import { useState } from 'react';
import { PageHeader, SegmentedPicker } from '../../components/ui';
import type { Difficulty, Session } from '../../lib/storage';
import { removeSession, saveSession, updateSettings, useAppData } from '../../lib/useAppData';
import NumpadResults from './NumpadResults';
import NumpadRunner from './NumpadRunner';
import { NUMPAD_DIFFICULTY_LABELS } from './entries';

const DURATIONS = [30, 60] as const;
type Seconds = (typeof DURATIONS)[number];

const durationLabel = (s: Seconds) => (s === 30 ? '30 sec' : '1 min');

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
        title="Numpad Drill"
        description="Training: type each number with the numeric keypad and press Enter. Commas are optional."
      />

      <div className="mb-2 flex flex-wrap items-end gap-6">
        <SegmentedPicker
          label="Difficulty"
          options={DIFFICULTIES}
          value={difficulty}
          onChange={(d) => {
            if (!running) updateSettings({ numpadDifficulty: d });
          }}
        />
        <SegmentedPicker
          label="Duration"
          options={DURATIONS}
          value={seconds}
          format={durationLabel}
          onChange={(s) => {
            if (!running) setSeconds(s);
          }}
        />
      </div>
      <p className="mb-4 text-sm text-slate-700">
        Difficulty {difficulty}: {NUMPAD_DIFFICULTY_LABELS[difficulty]}
      </p>

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
