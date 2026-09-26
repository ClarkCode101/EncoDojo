/**
 * Typing Test — TRAINING mode. Two screens (components/Practice.tsx):
 * setup (duration + short tips + "Simulan"), then the drill. Results after.
 * Results are saved by default (optional). The Assessment uses the same
 * TypingRunner with stricter rules.
 *
 * For now the Typing Test uses PLAIN office text only. Names, addresses,
 * and numbers will be trained by upcoming features (Copy Test, Encoding).
 */
import { useMemo, useState } from 'react';
import { KeyboardIcon } from '../../components/icons';
import { PracticeHeader, PracticeSetup } from '../../components/Practice';
import { Button, SegmentedPicker } from '../../components/ui';
import { makeRng, randomSeed } from '../../lib/random';
import type { Session } from '../../lib/storage';
import { removeSession, saveSession, useAppData } from '../../lib/useAppData';
import { PLAIN_TEXT_LEVEL, buildPassage, charsNeeded } from './buildPassage';
import { compareWithHistory, type TypingComparison } from './compare';
import TypingResults from './TypingResults';
import TypingRunner from './TypingRunner';

const DURATIONS = [30, 60] as const;
type Seconds = (typeof DURATIONS)[number];

const durationLabel = (s: Seconds) => (s === 30 ? '30 segundo' : '1 minuto');

type Result = {
  session: Session;
  comparison: TypingComparison;
  finishedEarly: boolean;
};

export default function TypingPage() {
  const data = useAppData();
  const { sound } = data.settings;

  const [seconds, setSeconds] = useState<Seconds>(60);
  const [screen, setScreen] = useState<'setup' | 'practice'>('setup');
  const [seed, setSeed] = useState(randomSeed);
  const [attempt, setAttempt] = useState(0); // changes to start a fresh run
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [saved, setSaved] = useState(false);

  const passage = useMemo(
    () => buildPassage(makeRng(seed), PLAIN_TEXT_LEVEL, charsNeeded(seconds / 60)),
    [seed, seconds],
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

  if (screen === 'setup') {
    return (
      <PracticeSetup
        icon={<KeyboardIcon className="h-8 w-8" />}
        title="Typing Practice"
        description="Sanayin ang bilis at tamang pagta-type."
        chooseTitle="Pumili ng tagal"
        choices={
          <SegmentedPicker label="Gaano katagal?" options={DURATIONS} value={seconds} format={durationLabel} onChange={setSeconds} />
        }
        howTo={[
          'I-type ang text nang eksakto — pati malalaking titik, tuldok, at comma.',
          'Magsisimula ang oras sa unang letra na ita-type mo.',
          'Bawat maling, sobra, o nalaktawang letra ay isang mali. Puwede kang magbura gamit ang Backspace.',
        ]}
        onStart={() => setScreen('practice')}
      />
    );
  }

  return (
    <div>
      <PracticeHeader
        icon={<KeyboardIcon className="h-6 w-6" />}
        title="Typing Practice"
        summary={durationLabel(seconds)}
        canChangeSettings={!running}
        onChangeSettings={() => setScreen('setup')}
        actions={
          <Button variant="secondary" onClick={() => restart(true)}>
            Ibang text
          </Button>
        }
      />

      <TypingRunner
        key={`${seed}-${seconds}-${attempt}`}
        passage={passage}
        seconds={seconds}
        level={PLAIN_TEXT_LEVEL}
        showLiveStats // always shown in practice (hidden in the Assessment)
        allowFinishEarly
        sound={sound}
        onStart={() => setRunning(true)}
        onFinish={handleFinish}
      />
    </div>
  );
}
