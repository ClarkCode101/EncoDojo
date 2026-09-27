/**
 * One Excel Practice round: 8 short tasks on an Excel-like sheet, one at a
 * time. A task is checked after every key; when it's done the next one
 * starts right away. "Laktawan" skips a task (it counts as not done).
 *
 * It does NOT save anything; it builds a Session and hands it to `onFinish`.
 */
import { Fragment, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Button, EnTl, Kbd, LiveStatsBar } from '../../components/ui';
import { makeRng, randomSeed } from '../../lib/random';
import { correctTick } from '../../lib/sound';
import type { Session } from '../../lib/storage';
import { useAppData } from '../../lib/useAppData';
import { useCountdown } from '../../lib/useCountdown';
import ExcelSheetView from './ExcelSheetView';
import { buildExcelSession, type TaskResult } from './scoreExcel';
import { isTypingKey, pressKey, typeInCell, type KeyPress, type Pos, type Sheet } from './sheet';
import { TASKS_PER_ROUND, makeRound, startTask } from './tasks';

/** Column widths for the sales log: Ref No., Customer, Branch, Date, Amount, then empty columns. */
const COLUMN_WIDTHS = [
  'w-40 min-w-[10rem]',
  'w-64 min-w-[16rem]',
  'w-40 min-w-[10rem]',
  'w-32 min-w-[8rem]',
  'w-28 min-w-[7rem]',
];

/** "Ctrl + Shift + ↓" -> keys drawn as keyboard keys, the words in between as text. */
export function TipKeys({ tip }: { tip: string }) {
  const parts = tip.split(/(Ctrl|Shift|Home|End|Delete|Enter|F2|Tab|↓|↑|→|←|(?<=\+ )[A-Z])/);
  return <span>{parts.map((p, i) => (i % 2 === 1 ? <Kbd key={i}>{p}</Kbd> : <Fragment key={i}>{p}</Fragment>))}</span>;
}

type Feedback = { n: number; text: ReactNode; good: boolean } | null;

export default function ExcelRunner({
  seconds,
  showLiveStats,
  allowFinishEarly,
  onStart,
  onFinish,
}: {
  seconds: number;
  showLiveStats: boolean;
  allowFinishEarly: boolean;
  onStart?: () => void;
  onFinish: (session: Session, finishedEarly: boolean) => void;
}) {
  const [round] = useState(() => makeRound(makeRng(randomSeed())));
  const [sheet, setSheet] = useState<Sheet>(() => startTask(round.sheet, round.tasks[0]));
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<TaskResult[]>([]);
  const [feedback, setFeedback] = useState<Feedback>(null);

  // Per-task counters (refs: they change on every key, no need to re-render).
  const keysRef = useRef(0);
  const mouseRef = useRef(false);
  const taskStartRef = useRef<number | null>(null);

  const resultsRef = useRef(results);
  resultsRef.current = results;
  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    onFinishRef.current = onFinish;
  });
  const finishedRef = useRef(false);

  const finish = useCallback(
    (elapsedSec: number, finishedEarly: boolean) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      onFinishRef.current(buildExcelSession(resultsRef.current, TASKS_PER_ROUND, elapsedSec, seconds), finishedEarly);
    },
    [seconds],
  );

  const soundCorrect = useAppData().settings.soundCorrect === true;
  const timer = useCountdown(seconds, () => finish(seconds, false));
  const task = round.tasks[index];

  function begin() {
    if (!timer.started) {
      timer.start();
      onStart?.();
    }
    taskStartRef.current ??= Date.now();
  }

  /** The current task ends (done or skipped): save its result and start the next one. */
  function endTask(after: Sheet, done: boolean) {
    const keys = keysRef.current;
    const usedMouse = mouseRef.current;
    const shortcut = done && !usedMouse && keys <= task.maxKeys;
    const result: TaskResult = {
      id: task.id,
      tip: task.tip,
      done,
      keys,
      usedMouse,
      shortcut,
      seconds: taskStartRef.current ? (Date.now() - taskStartRef.current) / 1000 : 0,
    };
    const all = [...resultsRef.current, result];
    resultsRef.current = all;
    setResults(all);
    if (shortcut && soundCorrect) correctTick();

    const n = index + 1;
    if (!done) setFeedback({ n, good: false, text: 'Nilaktawan.' });
    else if (shortcut) setFeedback({ n, good: true, text: 'Tama, gamit ang shortcut.' });
    else
      setFeedback({
        n,
        good: false,
        text: (
          <>
            Tama, pero {usedMouse ? 'gumamit ng mouse' : `${keys} pindot`}. Mas mabilis: <TipKeys tip={task.tip} />
          </>
        ),
      });

    keysRef.current = 0;
    mouseRef.current = false;
    taskStartRef.current = null;
    if (n >= round.tasks.length) {
      setSheet({ ...after, editing: null });
      finish(timer.stop(), false);
      return;
    }
    setIndex(n);
    setSheet(startTask(after, round.tasks[n]));
  }

  /** After every change: is the task done? */
  function update(next: Sheet) {
    if (task.check(next)) endTask(next, true);
    else setSheet(next);
  }

  function onKey(k: KeyPress): boolean {
    if (timer.finished) return false;
    const next = pressKey(sheet, k);
    if (next === sheet) return false;
    begin();
    // Count the command keys (arrows, Enter, Ctrl+...), not the letters typed.
    if (!isTypingKey(k)) keysRef.current += 1;
    update(next);
    return true;
  }

  function onCellClick(p: Pos, shift: boolean) {
    if (timer.finished) return;
    begin();
    mouseRef.current = true;
    // Clicking another cell ends an edit first (like Excel).
    const base = sheet.editing ? pressKey(sheet, { key: 'Enter' }) : sheet;
    update({ ...base, active: p, anchor: shift ? base.anchor : p, editing: null });
  }

  function onCellDoubleClick(p: Pos) {
    if (timer.finished) return;
    begin();
    mouseRef.current = true;
    setSheet({ ...sheet, active: p, anchor: p, editing: { value: sheet.cells[p.r][p.c], mode: 'edit' } });
  }

  const done = results.filter((r) => r.done).length;
  const shortcuts = results.filter((r) => r.shortcut).length;

  return (
    <>
      <LiveStatsBar
        seconds={timer.remainingSec}
        started={timer.started}
        stats={[
          { label: 'Task', value: `${Math.min(index + 1, TASKS_PER_ROUND)} sa ${TASKS_PER_ROUND}` },
          ...(showLiveStats
            ? [
                { label: 'Natapos', value: done },
                { label: 'Gamit ang shortcut', value: shortcuts },
              ]
            : []),
        ]}
      />

      <div className="flex min-h-0 flex-col">
        {/* The task: what to do and the shortcut, then skip / finish. */}
        <div className="mb-3 shrink-0 rounded-r-lg border-l-4 border-brand-700 bg-white px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-x-5 gap-y-2">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-stone-600">
                Task {index + 1} sa {TASKS_PER_ROUND}
              </div>
              <p className="text-lg font-bold text-stone-900">{task.text}</p>
              <p className="mt-0.5 text-stone-700">
                Shortcut: <TipKeys tip={task.tip} />
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => endTask(sheet, false)}>
                Laktawan
              </Button>
              {allowFinishEarly && timer.started && (
                <Button variant="secondary" onClick={() => finish(timer.stop(), true)}>
                  <EnTl en="Finish" tl="Tapusin na" />
                </Button>
              )}
            </div>
          </div>
          <p role="status" className="mt-1 min-h-[1.5rem] text-sm font-semibold">
            {feedback && (
              <span className={feedback.good ? 'text-green-800' : 'text-amber-800'}>
                {feedback.good ? '✓' : '•'} Task {feedback.n}: {feedback.text}
              </span>
            )}
          </p>
        </div>

        <ExcelSheetView
          sheet={sheet}
          columnWidths={COLUMN_WIDTHS}
          onKey={onKey}
          onEditChange={(v) => setSheet(typeInCell(sheet, v))}
          onCellClick={onCellClick}
          onCellDoubleClick={onCellDoubleClick}
        />
      </div>
    </>
  );
}
