/**
 * Numpad Practice — TRAINING mode. Two screens (components/Practice.tsx):
 * setup (number type + duration + short tips + "Simulan"), then the drill. Results are saved by default (optional). The Assessment uses
 * the same NumpadRunner with stricter rules and the "mixed" numbers.
 */
import { useState } from 'react';
import { NumpadIcon } from '../../components/icons';
import { PracticeFrame, PracticeHeader, PracticeSetup } from '../../components/Practice';
import { HelpTip, SegmentedPicker } from '../../components/ui';
import { HELP } from '../../lib/glossary';
import type { NumpadMode, Session } from '../../lib/storage';
import { removeSession, saveSession, updateSettings, useAppData } from '../../lib/useAppData';
import NumpadResults from './NumpadResults';
import NumpadRunner from './NumpadRunner';
import { NUMPAD_MODES } from './entries';

const DURATIONS = [30, 60] as const;
type Seconds = (typeof DURATIONS)[number];

const durationLabel = (s: Seconds) => (s === 30 ? '30 segundo' : '1 minuto');

const MODES: NumpadMode[] = ['mixed', 'beginner'];

type Result = { session: Session; finishedEarly: boolean };

export default function NumpadPage() {
  const data = useAppData();
  const { numpadMode: mode, sound } = data.settings;
  const difficulty = NUMPAD_MODES[mode].difficulty;

  const [seconds, setSeconds] = useState<Seconds>(60);
  const [screen, setScreen] = useState<'setup' | 'practice'>('setup');
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
        beginner={mode === 'beginner'}
        saved={saved}
        finishedEarly={result.finishedEarly}
        onToggleSaved={toggleSaved}
        onRetry={restart}
      />
    );
  }

  if (screen === 'setup') {
    return (
      <PracticeSetup
        icon={<NumpadIcon className="h-8 w-8" />}
        title="Numpad Practice"
        description="Sanayin ang pag-type ng mga numero gamit ang numpad."
        chooseTitle="Pumili ng klase ng numero at tagal"
        choices={
          <>
            <div className="flex flex-wrap items-end gap-6">
              <SegmentedPicker
                label="Anong klase ng numero?"
                options={MODES}
                value={mode}
                format={(m) => NUMPAD_MODES[m].label}
                onChange={(m) => updateSettings({ numpadMode: m })}
              />
              <SegmentedPicker label="Gaano katagal?" options={DURATIONS} value={seconds} format={durationLabel} onChange={setSeconds} />
            </div>
            <p className="mt-3 text-stone-700">
              {NUMPAD_MODES[mode].description}
              {mode === 'beginner' && ' Hindi ito kasama sa "Pinakamabilis na numpad" sa Home.'}
            </p>
          </>
        }
        howTo={[
          'I-ON ang Num Lock at ilagay ang mga daliri sa 4-5-6 ng numpad.',
          'I-type ang numerong lalabas at pindutin ang Enter. Hindi kailangan ang comma.',
          'Magsisimula ang oras sa unang numero na ita-type mo.',
        ]}
        extra={<HelpTip label="Nasaan ang numpad?">{HELP.numpad}</HelpTip>}
        onStart={() => setScreen('practice')}
      />
    );
  }

  return (
    <PracticeFrame>
      <PracticeHeader
        icon={<NumpadIcon className="h-6 w-6" />}
        title="Numpad Practice"
        summary={`${NUMPAD_MODES[mode].label}, ${durationLabel(seconds)}`}
        canChangeSettings={!running}
        onChangeSettings={() => setScreen('setup')}
      />

      <NumpadRunner
        key={`${seconds}-${mode}-${attempt}`}
        seconds={seconds}
        difficulty={difficulty}
        showLiveStats // always shown in practice (hidden in the Assessment)
        allowFinishEarly
        sound={sound}
        onStart={() => setRunning(true)}
        onFinish={handleFinish}
      />
    </PracticeFrame>
  );
}
