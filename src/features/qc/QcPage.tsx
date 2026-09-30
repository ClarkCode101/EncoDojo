/**
 * QC Check (QC / Spot the Difference), TRAINING mode. Two screens
 * (components/Practice.tsx): setup, then the drill. Results after.
 * Saved by default (optional). The Assessment uses the same QcRunner.
 */
import { useState } from 'react';
import { QcIcon } from '../../components/icons';
import { PracticeFrame, PracticeHeader, PracticeSetup } from '../../components/Practice';
import { SegmentedPicker } from '../../components/ui';
import { type T, useT } from '../../lib/i18n';
import type { Session } from '../../lib/storage';
import { removeSession, saveSession, useAppData } from '../../lib/useAppData';
import QcResults from './QcResults';
import QcRunner from './QcRunner';

/** A record takes about 15-30 seconds, so 30 seconds would be too short. */
const DURATIONS = [60, 120] as const;
type Seconds = (typeof DURATIONS)[number];

const durationLabel = (s: Seconds, t: T) => (s === 60 ? t('1 minuto', '1 minute') : t('2 minuto', '2 minutes'));

type Result = { session: Session; finishedEarly: boolean };

export default function QcPage() {
  const data = useAppData();
  const { sound } = data.settings;
  const t = useT();

  const [seconds, setSeconds] = useState<Seconds>(60);
  const [screen, setScreen] = useState<'setup' | 'practice'>('setup');
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
      <QcResults
        session={result.session}
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
        icon={<QcIcon className="h-8 w-8" />}
        title="QC Check"
        description={t(
          'Hanapin ang mali sa na-encode ng iba, gaya ng QC checker sa encoding job.',
          "Find the mistakes in someone else's encoding, like a QC checker in an encoding job.",
        )}
        chooseTitle={t('Pumili ng tagal', 'Choose how long')}
        choices={
          <SegmentedPicker
            label={t('Gaano katagal?', 'How long?')}
            options={DURATIONS}
            value={seconds}
            format={(s) => durationLabel(s, t)}
            onChange={setSeconds}
          />
        }
        howTo={[
          t(
            'Ihambing ang Original at ang Encoded sa bawat field: letra, digit, tuldok at malaking titik.',
            'Compare the Original and the Encoded in every field: letters, digits, periods and capitals.',
          ),
          t(
            'I-click ang field na may mali, o pindutin ang numero nito (1 hanggang 5). Walang minarkahan = walang mali.',
            'Click a field with a mistake, or press its number (1 to 5). Nothing marked = no mistakes.',
          ),
          t(
            'Pindutin ang Enter para ipasa ang record at lalabas ang susunod.',
            'Press Enter to submit the record and the next one appears.',
          ),
        ]}
        onStart={() => setScreen('practice')}
      />
    );
  }

  return (
    <PracticeFrame>
      <PracticeHeader
        icon={<QcIcon className="h-6 w-6" />}
        title="QC Check"
        summary={durationLabel(seconds, t)}
        canChangeSettings={!running}
        onChangeSettings={() => setScreen('setup')}
      />

      <QcRunner
        key={`${seconds}-${attempt}`}
        seconds={seconds}
        showLiveStats // always shown in practice (hidden in the Assessment)
        allowFinishEarly
        sound={sound}
        onStart={() => setRunning(true)}
        onFinish={handleFinish}
      />
    </PracticeFrame>
  );
}
