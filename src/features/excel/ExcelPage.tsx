/**
 * Excel, a LEARNING TRACK ("Matuto", owner's decision 2026-09-27): lessons one
 * at a time, not part of the Assessment or the belt. Lesson 1 "Navigation at
 * shortcuts": 8 short tasks on an Excel-like sheet in 3 minutes. Two screens
 * (components/Practice.tsx): setup, then the round. Results after.
 * Later lessons (formatting, sort/filter, formulas...) are listed in lessons.ts.
 */
import { useState } from 'react';
import { ExcelIcon } from '../../components/icons';
import { PracticeFrame, PracticeHeader, PracticeSetup } from '../../components/Practice';
import type { Session } from '../../lib/storage';
import { removeSession, saveSession, useAppData } from '../../lib/useAppData';
import ExcelResults from './ExcelResults';
import ExcelRunner from './ExcelRunner';
import { LESSONS, passedLessons } from './lessons';

const SECONDS = 180;

type Result = { session: Session; finishedEarly: boolean };

export default function ExcelPage() {
  const passed = passedLessons(useAppData().sessions);
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
        title="Excel"
        description="Matuto ng Excel, isang aralin sa isang pagkakataon. Para matuto lang ito, hindi kasama sa Assessment."
        chooseTitle="Mga aralin"
        choices={
          <ol className="space-y-1 text-lg">
            {LESSONS.map((l) => (
              <li key={l.level} className={l.ready ? 'text-stone-900' : 'text-stone-500'}>
                <span className="mr-2 text-stone-500">Aralin {l.level}:</span>
                <span className={l.ready ? 'font-semibold' : ''}>{l.title}</span>
                {l.ready ? (
                  <span className="ml-2 text-base text-stone-600">
                    8 task, 3 minuto
                    {passed.has(l.level) && (
                      <span className="ml-2 font-semibold text-green-800">Pasado na, puwedeng ulitin</span>
                    )}
                  </span>
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
        title="Excel"
        summary="Aralin 1: Navigation at shortcuts, 3 minuto"
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
