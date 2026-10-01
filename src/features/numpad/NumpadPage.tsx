/**
 * Numpad Practice — TRAINING mode. Two screens (components/Practice.tsx):
 * setup (number type + duration + short tips + "Simulan"), then the drill. Results are saved by default (optional). The Assessment uses
 * the same NumpadRunner with stricter rules and the "mixed" numbers.
 */
import { useState } from 'react';
import { NumpadIcon } from '../../components/icons';
import { PracticeFrame, PracticeHeader, PracticeSetup } from '../../components/Practice';
import { HelpTip, SegmentedPicker } from '../../components/ui';
import { useHelp } from '../../lib/glossary';
import { type T, useLang, useT } from '../../lib/i18n';
import type { NumpadMode, Session } from '../../lib/storage';
import { removeSession, saveSession, updateSettings, useAppData } from '../../lib/useAppData';
import NumpadResults from './NumpadResults';
import NumpadRunner from './NumpadRunner';
import { NUMPAD_MODES } from './entries';

const DURATIONS = [30, 60] as const;
type Seconds = (typeof DURATIONS)[number];

const durationLabel = (s: Seconds, t: T) => (s === 30 ? t('30 segundo', '30 seconds') : t('1 minuto', '1 minute'));

const MODES: NumpadMode[] = ['mixed', 'beginner'];

type Result = { session: Session; finishedEarly: boolean };

export default function NumpadPage() {
  const data = useAppData();
  const { numpadMode: mode, sound, noNumpad } = data.settings;
  const difficulty = NUMPAD_MODES[mode].difficulty;
  const lang = useLang();
  const t = useT();
  const help = useHelp();
  const modeText = (m: NumpadMode) => (lang === 'en' ? NUMPAD_MODES[m].en : NUMPAD_MODES[m]);

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
        description={t('Sanayin ang pag-type ng mga numero gamit ang numpad.', 'Train typing numbers on the numpad.')}
        chooseTitle={t('Pumili ng klase ng numero at tagal', 'Choose the kind of numbers and how long')}
        choices={
          <>
            <div className="flex flex-wrap items-end gap-6">
              <SegmentedPicker
                label={t('Anong klase ng numero?', 'What kind of numbers?')}
                options={MODES}
                value={mode}
                format={(m) => modeText(m).label}
                onChange={(m) => updateSettings({ numpadMode: m })}
              />
              <SegmentedPicker
                label={t('Gaano katagal?', 'How long?')}
                options={DURATIONS}
                value={seconds}
                format={(s) => durationLabel(s, t)}
                onChange={setSeconds}
              />
            </div>
            <p className="mt-3 text-stone-700">
              {modeText(mode).description}
              {mode === 'beginner' &&
                t(
                  ' Hindi ito kasama sa "Pinakamabilis na numpad" sa Home.',
                  ' It does not count for "Fastest numpad" on Home.',
                )}
            </p>
          </>
        }
        howTo={[
          // Settings -> "Walang numpad ang keyboard ko": the number keys above the letters instead.
          noNumpad
            ? t(
                'Gamitin ang number keys sa itaas ng mga letra (1 hanggang 0). Ang tuldok ay ang . sa kanan ng M.',
                'Use the number keys above the letters (1 to 0). The period is the . right of M.',
              )
            : t(
                'I-ON ang Num Lock at ilagay ang mga daliri sa 4-5-6 ng numpad.',
                'Turn ON Num Lock and rest your fingers on 4-5-6 of the numpad.',
              ),
          t(
            'I-type ang numerong lalabas at pindutin ang Enter. Hindi kailangan ang comma.',
            'Type the number you see and press Enter. No commas needed.',
          ),
          t('Magsisimula ang oras sa unang numero na ita-type mo.', 'The timer starts at the first number you type.'),
        ]}
        extra={
          noNumpad ? (
            <HelpTip label={t('Walang numpad?', 'No numpad?')}>{help.numpadTop}</HelpTip>
          ) : (
            <HelpTip label={t('Nasaan ang numpad?', 'Where is the numpad?')}>{help.numpad}</HelpTip>
          )
        }
        onStart={() => setScreen('practice')}
      />
    );
  }

  return (
    <PracticeFrame>
      <PracticeHeader
        icon={<NumpadIcon className="h-6 w-6" />}
        title="Numpad Practice"
        summary={`${modeText(mode).label}, ${durationLabel(seconds, t)}`}
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
