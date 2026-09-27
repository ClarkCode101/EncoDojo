/**
 * Excel Practice, TRAINING mode (Phase 3). Round 1: "Navigation at shortcuts":
 * 8 short tasks on an Excel-like sheet in 3 minutes. Two screens
 * (components/Practice.tsx): setup, then the round. Results after.
 * Later rounds (formatting, sort/filter, formulas...) will be added here.
 */
import { useState } from 'react';
import { ExcelIcon } from '../../components/icons';
import { PracticeFrame, PracticeHeader, PracticeSetup } from '../../components/Practice';
import type { Session } from '../../lib/storage';
import { removeSession, saveSession } from '../../lib/useAppData';
import ExcelResults from './ExcelResults';
import ExcelRunner from './ExcelRunner';

const SECONDS = 180;

/** Shown on the setup screen: what is here now and what comes next. */
const TOPICS = [
  { title: 'Navigation at shortcuts', ready: true },
  { title: 'Formatting', ready: false },
  { title: 'Sort, filter, find & replace', ready: false },
  { title: 'Formulas (SUM, IF, VLOOKUP)', ready: false },
];

type Result = { session: Session; finishedEarly: boolean };

export default function ExcelPage() {
  const [screen, setScreen] = useState<'setup' | 'practice'>('setup');
  const [attempt, setAttempt] = useState(0); // changes to start a fresh round
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [saved, setSaved] = useState(false);

  function handleFinish(session: Session, finishedEarly: boolean) {
    // Finished early = not every task was tried, so don't save unless asked.
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
      <ExcelResults
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
        icon={<ExcelIcon className="h-8 w-8" />}
        title="Excel Practice"
        description="Sanayin ang mga shortcut na ginagamit araw-araw sa Excel at Google Sheets."
        chooseTitle="Ang aaralin"
        choices={
          <ol className="space-y-1 text-lg">
            {TOPICS.map((t) => (
              <li key={t.title} className={t.ready ? 'font-semibold text-stone-900' : 'text-stone-500'}>
                {t.title}
                {t.ready ? (
                  <span className="ml-2 text-base font-normal text-stone-600">8 task, 3 minuto</span>
                ) : (
                  <span className="ml-2 text-sm">parating pa</span>
                )}
              </li>
            ))}
          </ol>
        }
        howTo={[
          'Basahin ang task sa itaas ng sheet at gawin ito gamit ang keyboard. Nakasulat din ang shortcut.',
          'Kusang lilipat sa susunod na task kapag tama na. May "Laktawan" kung hindi mo alam.',
          'Mas mataas ang score kapag shortcut ang ginamit, hindi mouse o maraming pindot.',
        ]}
        onStart={() => setScreen('practice')}
      />
    );
  }

  return (
    <PracticeFrame>
      <PracticeHeader
        icon={<ExcelIcon className="h-6 w-6" />}
        title="Excel Practice"
        summary="Navigation at shortcuts, 3 minuto"
        canChangeSettings={!running}
        onChangeSettings={() => setScreen('setup')}
      />

      <ExcelRunner
        key={attempt}
        seconds={SECONDS}
        showLiveStats // always shown in practice
        allowFinishEarly
        onStart={() => setRunning(true)}
        onFinish={handleFinish}
      />
    </PracticeFrame>
  );
}
