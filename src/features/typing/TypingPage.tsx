/**
 * Typing Test — TRAINING mode. Pick a duration, type, see results.
 * Results are saved by default (optional). The Assessment uses the same
 * TypingRunner with stricter rules.
 */
import { useMemo, useState } from 'react';
import { Button, PageHeader, SegmentedPicker } from '../../components/ui';
import { makeRng, randomSeed } from '../../lib/random';
import type { Session, TypingLevel } from '../../lib/storage';
import { removeSession, saveSession, updateSettings, useAppData } from '../../lib/useAppData';
import { TYPING_LEVEL_LABELS, buildPassage, charsNeeded } from './buildPassage';
import { compareWithHistory, type TypingComparison } from './compare';
import TypingResults from './TypingResults';
import TypingRunner from './TypingRunner';

const DURATIONS = [30, 60] as const;
type Seconds = (typeof DURATIONS)[number];

const durationLabel = (s: Seconds) => (s === 30 ? '30 sec' : '1 min');

const LEVELS: TypingLevel[] = [1, 2, 3];

type Result = {
  session: Session;
  comparison: TypingComparison;
  finishedEarly: boolean;
};

export default function TypingPage() {
  const data = useAppData();
  const { typingLevel, showLiveStats, sound } = data.settings;

  const [seconds, setSeconds] = useState<Seconds>(60);
  const [seed, setSeed] = useState(randomSeed);
  const [attempt, setAttempt] = useState(0); // changes to start a fresh run
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [saved, setSaved] = useState(false);

  const passage = useMemo(
    () => buildPassage(makeRng(seed), typingLevel, charsNeeded(seconds / 60)),
    [seed, typingLevel, seconds],
  );

  function handleFinish(session: Session, finishedEarly: boolean) {
    // Compare with earlier tests BEFORE saving this one.
    const comparison = compareWithHistory(data.sessions);
    // Finished early = unrealistically high speed, so don't save unless asked.
    const save = !finishedEarly;
    if (save) saveSession(session);
    setSaved(save);
    setRunning(false);
    setResult({ session, comparison, finishedEarly });
  }

  function toggleSaved() {
    if (!result) return;
    if (saved) removeSession(result.session.id);
    else saveSession(result.session);
    setSaved(!saved);
  }

  function restart(newPassage: boolean) {
    setResult(null);
    setSaved(false);
    setRunning(false);
    setAttempt((n) => n + 1);
    if (newPassage) setSeed(randomSeed());
  }

  if (result) {
    return (
      <TypingResults
        session={result.session}
        comparison={result.comparison}
        saved={saved}
        finishedEarly={result.finishedEarly}
        onToggleSaved={toggleSaved}
        onRetrySame={() => restart(false)}
        onNewPassage={() => restart(true)}
      />
    );
  }

  return (
    <div>
      <PageHeader
        title="Typing Test"
        description="Training: type the passage exactly as shown. The timer starts on your first keystroke."
      />

      <div className="mb-4 flex flex-wrap items-end gap-6">
        <SegmentedPicker
          label="Level"
          options={LEVELS}
          value={typingLevel}
          format={(l) => TYPING_LEVEL_LABELS[l]}
          onChange={(l) => {
            if (!running) updateSettings({ typingLevel: l });
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
        <Button variant="secondary" onClick={() => restart(true)}>
          New passage
        </Button>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={showLiveStats}
            onChange={(e) => updateSettings({ showLiveStats: e.target.checked })}
          />
          Show live stats
        </label>
      </div>

      <TypingRunner
        key={`${seed}-${seconds}-${typingLevel}-${attempt}`}
        passage={passage}
        seconds={seconds}
        level={typingLevel}
        showLiveStats={showLiveStats}
        allowFinishEarly
        sound={sound}
        onStart={() => setRunning(true)}
        onFinish={handleFinish}
      />
    </div>
  );
}
