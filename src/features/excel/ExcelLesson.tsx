/**
 * An Excel lesson, step by step (learning track, no timer):
 * for every topic, ALAMIN (a short explanation + the keys) and then SUBUKAN
 * (a task on the sheet). While trying:
 * - "Hint": first a hint in words, then the keys themselves;
 * - "Ipakita kung paano": the app does it on the sheet, step by step, then
 *   puts the sheet back so the user can do it too;
 * - done = "✓ Tama!" (plus the faster shortcut if it was done the long way).
 * Nothing is saved here; the Pagsusulit at the end is what gets saved.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRightIcon } from '../../components/icons';
import { Button } from '../../components/ui';
import { makeRng, randomSeed } from '../../lib/random';
import { correctTick } from '../../lib/sound';
import { useAppData } from '../../lib/useAppData';
import ExcelSheetView from './ExcelSheetView';
import { focusSheet } from './focusSheet';
import type { LessonContent } from './lessons';
import { clickCell, isTypingKey, pressKey, typeInCell, type KeyPress, type Pos, type Sheet } from './sheet';
import { solutionFrames, startTask } from './tasks';
import TaskRecord from './TaskRecord';
import TipKeys from './TipKeys';

type Step = { topic: number; task: string | null };

/** How long each step of "Ipakita kung paano" stays on screen (faster when there are many, e.g. arrows). */
const DEMO_STEP_MS = 700;
const DEMO_FAST_STEP_MS = 300;
const DEMO_END_MS = 1600;

export default function ExcelLesson({ content, onDone }: { content: LessonContent; onDone: () => void }) {
  const { topics } = content;
  const [set] = useState(() => content.makeSet(makeRng(randomSeed())));
  // Every topic: first "Alamin" (task null), then one step per task to try.
  const steps = useMemo<Step[]>(
    () => topics.flatMap((t, i) => [{ topic: i, task: null }, ...t.tasks.map((task) => ({ topic: i, task }))]),
    [topics],
  );
  const [index, setIndex] = useState(0);
  const [sheet, setSheet] = useState<Sheet>(set.sheet);
  const [hintLevel, setHintLevel] = useState(0);
  const [done, setDone] = useState<{ shortcut: boolean; keys: number; mouse: boolean } | null>(null);
  const [demo, setDemo] = useState<'playing' | 'shown' | null>(null);

  const keysRef = useRef(0);
  const mouseRef = useRef(false);
  /** The sheet as it was when the current task started (to put it back after "Ipakita kung paano"). */
  const startSheetRef = useRef<Sheet>(set.sheet);
  const timersRef = useRef<number[]>([]);
  const soundCorrect = useAppData().settings.soundCorrect === true;

  const step = steps[index];
  const topic = topics[step.topic];
  const task = step.task ? set.tasks[step.task] : null;

  useEffect(() => () => timersRef.current.forEach((t) => window.clearTimeout(t)), []);

  function goTo(next: number, from: Sheet) {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
    if (next >= steps.length) {
      onDone();
      return;
    }
    const nextTask = steps[next].task ? set.tasks[steps[next].task!] : null;
    const s = nextTask ? startTask({ ...from, editing: null }, nextTask) : { ...from, editing: null };
    startSheetRef.current = s;
    keysRef.current = 0;
    mouseRef.current = false;
    setSheet(s);
    setIndex(next);
    setHintLevel(0);
    setDone(null);
    setDemo(null);
    focusSheet();
  }

  /** After every change on the sheet: is the task done? */
  function update(next: Sheet) {
    setSheet(next);
    if (!task || done || demo === 'playing' || !task.check(next)) return;
    const shortcut = !mouseRef.current && keysRef.current <= task.maxKeys;
    setDone({ shortcut, keys: keysRef.current, mouse: mouseRef.current });
    if (soundCorrect) correctTick();
  }

  function onKey(k: KeyPress): boolean {
    if (demo === 'playing') return true; // keys wait while the app shows how
    const next = pressKey(sheet, k);
    if (next === sheet) return false;
    if (!isTypingKey(k)) keysRef.current += 1;
    update(next);
    return true;
  }

  function onCellClick(p: Pos, shift: boolean) {
    if (demo === 'playing') return;
    mouseRef.current = true;
    update(clickCell(sheet, p, shift));
  }

  function onCellDoubleClick(p: Pos) {
    if (demo === 'playing') return;
    mouseRef.current = true;
    setSheet({ ...sheet, active: p, anchor: p, editing: { value: sheet.cells[p.r][p.c], mode: 'edit' } });
  }

  /** "Ipakita kung paano": play the solution on the sheet, then put the sheet back for the user. */
  function showHow() {
    if (!task) return;
    const start = startSheetRef.current;
    const frames = solutionFrames(start, task);
    const stepMs = frames.length > 3 ? DEMO_FAST_STEP_MS : DEMO_STEP_MS;
    setDemo('playing');
    setSheet(start);
    frames.forEach((f, i) => timersRef.current.push(window.setTimeout(() => setSheet(f), (i + 1) * stepMs)));
    timersRef.current.push(
      window.setTimeout(
        () => {
          keysRef.current = 0;
          mouseRef.current = false;
          setSheet(start);
          setDemo('shown');
          focusSheet();
        },
        frames.length * stepMs + DEMO_END_MS,
      ),
    );
  }

  const isLast = index === steps.length - 1;
  const nextLabel = isLast ? 'Tapusin ang aralin' : 'Susunod';

  return (
    <div className="flex min-h-0 flex-col">
      {/* Progress: which topic, and a thin bar of all the steps. */}
      <div className="mb-2 flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <span className="text-sm font-semibold text-stone-600">
          Bahagi {step.topic + 1} sa {topics.length}: {topic.title}
        </span>
        <div className="flex w-56 gap-1" aria-hidden="true">
          {steps.map((_, i) => (
            <div key={i} className={'h-1.5 flex-1 rounded-full ' + (i <= index ? 'bg-brand-700' : 'bg-stone-300')} />
          ))}
        </div>
      </div>

      <div className="mb-3 shrink-0 rounded-r-lg border-l-4 border-brand-700 bg-white px-5 py-3">
        {!task ? (
          // ALAMIN
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <div className="min-w-0 max-w-3xl">
              <div className="text-sm font-bold text-brand-700">Alamin</div>
              <h2 className="text-xl font-bold text-stone-900">{topic.title}</h2>
              {topic.body.map((line) => (
                <p key={line} className="mt-1 text-stone-800">
                  {line}
                </p>
              ))}
              <ul className="mt-2 grid gap-x-8 gap-y-1 sm:grid-cols-2">
                {topic.keys.map((k) => (
                  <li key={k.keys} className="text-stone-800">
                    <TipKeys tip={k.keys} /> <span className="text-stone-600">{k.what}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Button size="lg" autoFocus onClick={() => goTo(index + 1, sheet)}>
              Subukan <ArrowRightIcon className="h-5 w-5" />
            </Button>
          </div>
        ) : (
          // SUBUKAN
          <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
            <div className="min-w-0 max-w-3xl">
              <div className="text-sm font-bold text-brand-700">Subukan</div>
              <p className="text-lg font-bold text-stone-900">{task.text}</p>
              {task.record && <TaskRecord record={task.record} />}
              <div role="status" className="mt-1 min-h-[1.75rem] text-stone-800">
                {done ? (
                  <span className="font-semibold text-green-800">
                    ✓ Tama!{' '}
                    {done.shortcut ? (
                      'Ang galing.'
                    ) : (
                      <span className="font-normal text-stone-700">
                        Mas mabilis kung <TipKeys tip={task.tip} /> ang gagamitin.
                      </span>
                    )}
                  </span>
                ) : demo === 'playing' ? (
                  <span>
                    Ganito: <TipKeys tip={task.tip} />
                  </span>
                ) : demo === 'shown' ? (
                  <span className="font-semibold">
                    Ikaw naman ngayon: <TipKeys tip={task.tip} />
                  </span>
                ) : hintLevel === 1 ? (
                  <span>{task.hint}</span>
                ) : hintLevel >= 2 ? (
                  <span>
                    {task.hint} <TipKeys tip={task.tip} />
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {done ? (
                <Button size="lg" autoFocus onClick={() => goTo(index + 1, sheet)}>
                  {nextLabel} <ArrowRightIcon className="h-5 w-5" />
                </Button>
              ) : (
                <>
                  <Button
                    variant="secondary"
                    disabled={demo === 'playing' || hintLevel >= 2}
                    onClick={() => {
                      setHintLevel((h) => h + 1);
                      focusSheet();
                    }}
                  >
                    {hintLevel === 0 ? 'Hint' : 'Isa pang hint'}
                  </Button>
                  <Button variant="secondary" disabled={demo === 'playing'} onClick={showHow}>
                    Ipakita kung paano
                  </Button>
                  <Button variant="secondary" disabled={demo === 'playing'} onClick={() => goTo(index + 1, sheet)}>
                    Laktawan
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <ExcelSheetView
        sheet={sheet}
        columnWidths={content.columnWidths}
        onKey={onKey}
        onEditChange={(v) => setSheet(typeInCell(sheet, v))}
        onCellClick={onCellClick}
        onCellDoubleClick={onCellDoubleClick}
      />
    </div>
  );
}
