/**
 * The Pagsusulit at the end of an Excel lesson: 6 tasks, no hints, NO timer
 * (learning track). A task is checked after every key; when it's done the
 * next one starts right away. "Laktawan" skips (counts as not done).
 * Passed = at least 5 of 6 done. The shortcut is not required, only shown.
 *
 * It does NOT save anything; it builds a Session and hands it to `onFinish`.
 */
import { useRef, useState, type ReactNode } from 'react';
import { Button } from '../../components/ui';
import { makeRng, randomSeed } from '../../lib/random';
import { correctTick } from '../../lib/sound';
import type { Session } from '../../lib/storage';
import { useAppData } from '../../lib/useAppData';
import ExcelSheetView from './ExcelSheetView';
import { focusSheet } from './focusSheet';
import { buildExcelSession, type TaskResult } from './scoreExcel';
import { clickCell, editCell, isTypingKey, pressKey, runCommand, typeInCell, type KeyPress, type Pos, type Sheet, type SheetCommand } from './sheet';
import type { LessonContent } from './lessons';
import { QUIZ_TASKS, startTask } from './tasks';
import TaskRecord from './TaskRecord';
import TipKeys from './TipKeys';

type Feedback = { n: number; text: ReactNode; good: boolean } | null;

export default function ExcelQuiz({
  level,
  content,
  onFinish,
}: {
  level: number;
  content: LessonContent;
  onFinish: (session: Session) => void;
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
    <div className="flex min-h-0 flex-col">
      <div className="mb-3 shrink-0 rounded-r-lg border-l-4 border-belt-400 bg-white px-5 py-3">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
          <div className="min-w-0">
            <div className="text-sm font-bold text-stone-600">
              Tanong {index + 1} sa {QUIZ_TASKS}
            </div>
            <p className="text-lg font-bold text-stone-900">{task.text}</p>
            {task.record && <TaskRecord record={task.record} />}
          </div>
          <Button variant="secondary" onClick={() => endTask(sheet, false)}>
            Laktawan
          </Button>
        </div>
        <p role="status" className="mt-1 min-h-[1.5rem] text-sm font-semibold">
          {feedback && (
            <span className={feedback.good ? 'text-green-800' : 'text-amber-800'}>
              {feedback.good ? '✓' : '•'} Tanong {feedback.n}: {feedback.text}
            </span>
          )}
        </p>
      </div>

      <ExcelSheetView
        sheet={sheet}
        columnWidths={content.columnWidths}
        tools={content.tools}
        taskKey={index}
        onCommand={onCommand}
        onKey={onKey}
        onEditChange={(v) => setSheet(typeInCell(sheet, v))}
        onCellClick={onCellClick}
        onCellDoubleClick={onCellDoubleClick}
      />
    </div>
  );
}
