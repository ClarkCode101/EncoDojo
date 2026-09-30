/**
 * Copy Test — PRACTICE mode. Copy fake records (name, birth date, address,
 * contact no., ID) exactly as written, into either:
 * - a FORM (like a hiring test or company software), or
 * - a SPREADSHEET (like Excel: one row per record); both via CopyRunner.
 * Spreadsheet is the default (most encoder jobs use Excel / Google Sheets).
 * Results are saved by default (optional). The Assessment always uses the
 * form, like real alphanumeric data entry hiring tests.
 * Two screens (components/Practice.tsx): setup, then the drill.
 */
import { useState } from 'react';
import { CopyIcon } from '../../components/icons';
import { PracticeFrame, PracticeHeader, PracticeSetup } from '../../components/Practice';
import { SegmentedPicker } from '../../components/ui';
import { type T, useT } from '../../lib/i18n';
import type { CopyMode, Session } from '../../lib/storage';
import { removeSession, saveSession, updateSettings, useAppData } from '../../lib/useAppData';
import CopyResults from './CopyResults';
import CopyRunner from './CopyRunner';
import { copyModeLabel } from './records';

/** A record takes about 20-40 seconds, so 30 seconds would be too short. */
const DURATIONS = [60, 120] as const;
type Seconds = (typeof DURATIONS)[number];

const durationLabel = (s: Seconds, t: T) => (s === 60 ? t('1 minuto', '1 minute') : t('2 minuto', '2 minutes'));

/** Spreadsheet first: it's the default, since most encoder jobs use Excel / Google Sheets. */
const MODES: CopyMode[] = ['sheet', 'form'];

type Result = { session: Session; finishedEarly: boolean };

export default function CopyPage() {
  const data = useAppData();
  const { sound } = data.settings;
  const t = useT();
  // Default = spreadsheet (like most encoder jobs). The Assessment always uses the form.
  const mode: CopyMode = data.settings.copyMode ?? 'sheet';

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
      <CopyResults
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
        icon={<CopyIcon className="h-8 w-8" />}
        title="Copy Test"
        description={t(
          'Kopyahin ang mga record nang eksakto, gaya ng pag-encode sa Excel o sa hiring test.',
          'Copy the records exactly, like encoding in Excel or in a hiring test.',
        )}
        chooseTitle={t('Pumili kung saan mag-e-encode at gaano katagal', 'Choose where to encode and how long')}
        choices={
          <div className="flex flex-wrap items-end gap-6">
            <SegmentedPicker
              label={t('Saan ka mag-e-encode?', 'Where will you encode?')}
              options={MODES}
              value={mode}
              format={(m) => copyModeLabel(m, t)}
              onChange={(m) => updateSettings({ copyMode: m })}
            />
            <SegmentedPicker
              label={t('Gaano katagal?', 'How long?')}
              options={DURATIONS}
              value={seconds}
              format={(s) => durationLabel(s, t)}
              onChange={setSeconds}
            />
          </div>
        }
        howTo={[
          t(
            'Kopyahin ang bawat record nang eksakto, pati malalaking titik, tuldok, comma at space.',
            'Copy every record exactly, including capital letters, periods, commas and spaces.',
          ),
          mode === 'sheet'
            ? t(
                'Tab = susunod na cell. Enter sa dulo ng row = susunod na record. Puwede mong balikan ang naunang row.',
                'Tab = next cell. Enter at the end of a row = next record. You can go back to an earlier row.',
              )
            : t(
                'Tab = susunod na field. Enter sa huling field (ID No.) = ipasa ang record.',
                'Tab = next field. Enter on the last field (ID No.) = submit the record.',
              ),
          t(
            'Kahit isang letra lang ang mali, mali na ang buong field.',
            'Even one wrong letter makes the whole field wrong.',
          ),
        ]}
        onStart={() => setScreen('practice')}
      />
    );
  }

  return (
    <PracticeFrame>
      <PracticeHeader
        icon={<CopyIcon className="h-6 w-6" />}
        title="Copy Test"
        summary={`${copyModeLabel(mode, t)}, ${durationLabel(seconds, t)}`}
        canChangeSettings={!running}
        onChangeSettings={() => setScreen('setup')}
      />

      <CopyRunner
        key={`${mode}-${seconds}-${attempt}`}
        mode={mode}
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
