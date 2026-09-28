/**
 * The Pagsusulit at the end of an Excel lesson: 6 tasks, no hints, NO timer
 * (learning track). A task is checked after every key; when it's done the
 * next one starts right away. "Laktawan" skips (counts as not done).
 * Passed = at least 5 of 6 done. The shortcut is not required, only shown.
 *
 * It does NOT save anything; it builds a Session and hands it to `onFinish`.
 */
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { makeRng, randomSeed } from '../../lib/random';
import { correctTick } from '../../lib/sound';
import type { Session } from '../../lib/storage';
import { useAppData } from '../../lib/useAppData';
import ExcelSheetView from './ExcelSheetView';
import { focusSheet } from './focusSheet';
import { buildExcelSession, type TaskResult } from './scoreExcel';
import {
  clickCell,
  editCell,
  isTypingKey,
  cellsForCompute,
  pressKey,
  tabCells,
  runCommand,
  typeInCell,
  type KeyPress,
  type Pos,
  type Sheet,
  type SheetCommand,
} from './sheet';
import type { LessonContent } from './lessons';
import { QUIZ_TASKS, startTask } from './tasks';
import LessonLayout from './LessonLayout';
import TaskRecord from './TaskRecord';
import TipKeys from './TipKeys';

type Feedback = { n: number; text: ReactNode; good: boolean } | null;

export default function ExcelQuiz({
  level,
  title,
  content,
  onFinish,
  onExit,
}: {
  level: number;
  title: string;
  content: LessonContent;
  onFinish: (session: Session) => void;
  onExit: () => void;
}) {
  const [quiz] = useState(() => content.makeQuiz(makeRng(randomSeed())));
  const [sheet, setSheet] = useState<Sheet>(() => startTask(quiz.sheet, quiz.tasks[0]));
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const resultsRef = useRef<TaskResult[]>([]);
  const keysRef = useRef(0);
  const mouseRef = useRef(false);
  const startedRef = useRef(Date.now());
  const taskStartRef = useRef(Date.now());
  const finishedRef = useRef(false);
  const soundCorrect = useAppData().settings.soundCorrect === true;
  // Formula lessons: the computed values of the cells (HyperFormula), for the view.
  const computed = useMemo(
    () => (content.compute ? content.compute(cellsForCompute(sheet), tabCells(sheet)) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the cells and formats matter
    [content, sheet.cells, sheet.formats, sheet.tabs],
  );

  const task = quiz.tasks[index];

  /** The current task ends (done or skipped): save its result and start the next one. */
  function endTask(after: Sheet, done: boolean) {
    if (finishedRef.current) return;
    const keys = keysRef.current;
    const usedMouse = mouseRef.current;
    const shortcut = done && !usedMouse && keys <= task.maxKeys;
    resultsRef.current = [
      ...resultsRef.current,
      {
        id: task.id,
        tip: task.tip,
        done,
        keys,
        usedMouse,
        shortcut,
        seconds: (Date.now() - taskStartRef.current) / 1000,
      },
    ];
    if (done && soundCorrect) correctTick();

    const n = index + 1;
    if (!done) setFeedback({ n, good: false, text: 'Nilaktawan.' });
    else if (shortcut) setFeedback({ n, good: true, text: 'Tama.' });
    else
      setFeedback({
        n,
        good: true,
        text: (
          <>
            Tama. <span className="font-normal text-stone-700">Mas mabilis gamit ang</span> <TipKeys tip={task.tip} />
          </>
        ),
      });

    keysRef.current = 0;
    mouseRef.current = false;
    taskStartRef.current = Date.now();
    if (n >= quiz.tasks.length) {
      finishedRef.current = true;
      const elapsed = (Date.now() - startedRef.current) / 1000;
      onFinish(buildExcelSession(resultsRef.current, QUIZ_TASKS, elapsed, level));
      return;
    }
    setIndex(n);
    setSheet(startTask(after, quiz.tasks[n]));
    focusSheet();
  }

  function update(next: Sheet) {
    if (task.check(next)) endTask(next, true);
    else setSheet(next);
  }

  function onKey(k: KeyPress): boolean {
    const next = pressKey(sheet, k);
    if (next === sheet) return false;
    if (!isTypingKey(k)) keysRef.current += 1;
    update(next);
    return true;
  }

  /** A data tool (Aralin 4): counts as one key, never as the mouse. */
  function onCommand(cmd: SheetCommand) {
    keysRef.current += 1;
    update(runCommand(sheet, cmd));
  }

  function onCellClick(p: Pos, shift: boolean) {
    mouseRef.current = true;
    update(clickCell(sheet, p, shift));
  }

  function onCellDoubleClick(p: Pos) {
    mouseRef.current = true;
    setSheet(editCell(sheet, p));
  }

  return (
    <LessonLayout
      eyebrow={`Pagsusulit, Aralin ${level}`}
      title={title}
      onBack={onExit}
      panel={
        <>
          {/* Progress: one dot per question. */}
          <div>
            <div className="mb-1.5 text-sm font-semibold text-stone-700">
              Tanong {index + 1} sa {QUIZ_TASKS}
            </div>
            <div className="flex gap-1" aria-hidden="true">
              {Array.from({ length: QUIZ_TASKS }, (_, i) => (
                <div key={i} className={'h-1.5 flex-1 rounded-full ' + (i <= index ? 'bg-belt-400' : 'bg-stone-300')} />
              ))}
            </div>
            <p className="mt-2 text-sm text-stone-600">Walang hint at walang oras. Pasado kapag 5 ang tama.</p>
          </div>

          <section aria-label="Gawin" className="rounded-r-lg border-l-4 border-belt-400 bg-white px-4 py-3">
            <div className="text-sm font-bold text-stone-600">Gawin</div>
            <p className="font-bold text-stone-900">{task.text}</p>
            {task.record && <TaskRecord record={task.record} />}
            <div className="mt-3">
              <button
                type="button"
                onClick={() => endTask(sheet, false)}
                className="rounded text-sm text-stone-600 underline decoration-dotted underline-offset-2 hover:text-stone-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"
              >
                Laktawan
              </button>
            </div>
          </section>

          <p role="status" className="min-h-[1.5rem] text-sm font-semibold">
            {feedback && (
              <span className={feedback.good ? 'text-green-800' : 'text-amber-800'}>
                {feedback.good ? '✓' : '•'} Tanong {feedback.n}: {feedback.text}
              </span>
            )}
          </p>
        </>
      }
      sheet={
        <ExcelSheetView
          sheet={sheet}
          columnWidths={content.columnWidths}
          tools={content.tools}
          taskKey={index}
          computed={computed}
          onCommand={onCommand}
          onKey={onKey}
          onEditChange={(v) => setSheet(typeInCell(sheet, v))}
          onCellClick={onCellClick}
          onCellDoubleClick={onCellDoubleClick}
        />
      }
    />
  );
}
