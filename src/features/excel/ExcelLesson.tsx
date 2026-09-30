/**
 * An Excel lesson (learning track, no timer), in the "gabay sa gilid" layout
 * (LessonLayout, owner's choice 2026-09-28): the guide on the left, the sheet
 * on the right.
 *
 * The guide shows the topics as a list (jump to any of them), and for the
 * current topic: the short explanation and its keys, then "Gawin" (the task on
 * the sheet). One help button gets stronger each time: a hint in words, then
 * the keys, then "Ipakita kung paano" (the app does it on the sheet, step by
 * step, then puts the sheet back so the user can do it too). "Laktawan" is a
 * small link. Done = "✓ Tama!" (plus the faster shortcut if it was done the
 * long way) and a "Susunod" button. Nothing is saved here; the Pagsusulit at
 * the end is what gets saved.
 *
 * Owner's request 2026-09-30 (a better lesson UX): the "Gawin" card is pinned
 * at the bottom of the guide (always in view), and a finished task is clearly
 * seen: the card turns green, and the cells the user changed (or, when nothing
 * changed, the cells they went to or selected) light up green on the sheet.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRightIcon } from '../../components/icons';
import { Button } from '../../components/ui';
import { makeRng, randomSeed } from '../../lib/random';
import { correctTick } from '../../lib/sound';
import { useAppData } from '../../lib/useAppData';
import ExcelSheetView from './ExcelSheetView';
import { focusSheet } from './focusSheet';
import LessonLayout from './LessonLayout';
import type { LessonContent } from './lessons';
import {
  clickCell,
  editCell,
  isTypingKey,
  cellsForCompute,
  pressKey,
  tabCells,
  runCommand,
  selectionRange,
  typeInCell,
  type KeyPress,
  type Pos,
  type Sheet,
  type SheetCommand,
} from './sheet';
import { solutionFrames, startTask } from './tasks';
import TaskRecord from './TaskRecord';
import TipKeys from './TipKeys';

/** One task to do, in its topic. */
type Step = { topic: number; task: string };

/** How long each step of "Ipakita kung paano" stays on screen (faster when there are many, e.g. arrows). */
const DEMO_STEP_MS = 700;
const DEMO_FAST_STEP_MS = 300;
const DEMO_END_MS = 1600;

/**
 * The cells to light up when a task is done: the ones whose value changed since the task started,
 * or (a move, a selection, a format, another tab) the cells now selected. As "row,col" keys.
 */
function doneCells(before: Sheet, after: Sheet): Set<string> {
  const out = new Set<string>();
  const sameShape =
    (before.tabs?.index ?? 0) === (after.tabs?.index ?? 0) &&
    before.cells.length === after.cells.length &&
    before.cells[0].length === after.cells[0].length;
  if (sameShape) {
    after.cells.forEach((row, r) =>
      row.forEach((v, c) => {
        if (v !== before.cells[r][c]) out.add(`${r},${c}`);
      }),
    );
  }
  if (out.size === 0) {
    const { top, left, bottom, right } = selectionRange(after);
    for (let r = top; r <= bottom; r++) for (let c = left; c <= right; c++) out.add(`${r},${c}`);
  }
  return out;
}

/** The help button's words, by how much help was already given. */
const HELP_LABELS = ['Kailangan ng tulong?', 'Ipakita ang key', 'Ipakita kung paano', 'Ipakita ulit kung paano'];

export default function ExcelLesson({
  level,
  title,
  content,
  startTopic = 0,
  onDone,
  onExit,
}: {
  level: number;
  title: string;
  content: LessonContent;
  /** Start at this topic (0 = the first), e.g. from the lessons list. */
  startTopic?: number;
  onDone: () => void;
  onExit: () => void;
}) {
  const { topics } = content;
  const [set] = useState(() => content.makeSet(makeRng(randomSeed())));
  const steps = useMemo<Step[]>(() => topics.flatMap((t, i) => t.tasks.map((task) => ({ topic: i, task }))), [topics]);
  /** The first task of a topic. */
  const firstStepOf = (topicIndex: number) =>
    Math.max(
      0,
      steps.findIndex((s) => s.topic === topicIndex),
    );

  const [index, setIndex] = useState(() => firstStepOf(startTopic));
  const [sheet, setSheet] = useState<Sheet>(() => startTask(set.sheet, set.tasks[steps[firstStepOf(startTopic)].task]));
  /** 0 = no help yet, 1 = hint in words, 2 = the keys, 3 = shown how. */
  const [help, setHelp] = useState(0);
  /** The task is done: how (with the shortcut or not), and the cells to light up on the sheet. */
  const [done, setDone] = useState<{ shortcut: boolean; cells: Set<string> } | null>(null);
  const [demo, setDemo] = useState<'playing' | 'shown' | null>(null);
  /** The tasks done in this lesson (to show which topics are finished). */
  const [doneSteps, setDoneSteps] = useState<Set<number>>(() => new Set());

  const keysRef = useRef(0);
  const mouseRef = useRef(false);
  /** The sheet as it was when the current task started (to put it back after "Ipakita kung paano"). */
  const startSheetRef = useRef<Sheet>(sheet);
  const timersRef = useRef<number[]>([]);
  const soundCorrect = useAppData().settings.soundCorrect === true;
  // Formula lessons: the computed values of the cells (HyperFormula), for the view.
  const computed = useMemo(
    () => (content.compute ? content.compute(cellsForCompute(sheet), tabCells(sheet)) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the cells and formats matter
    [content, sheet.cells, sheet.formats, sheet.tabs],
  );

  const step = steps[index];
  const topic = topics[step.topic];
  const task = set.tasks[step.task];
  const tasksInTopic = steps.filter((s) => s.topic === step.topic);
  const nthInTopic = tasksInTopic.findIndex((s) => s.task === step.task) + 1;

  useEffect(() => () => timersRef.current.forEach((t) => window.clearTimeout(t)), []);

  function goTo(next: number, from: Sheet) {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
    if (next >= steps.length) {
      onDone();
      return;
    }
    const s = startTask({ ...from, editing: null }, set.tasks[steps[next].task]);
    startSheetRef.current = s;
    keysRef.current = 0;
    mouseRef.current = false;
    setSheet(s);
    setIndex(next);
    setHelp(0);
    setDone(null);
    setDemo(null);
    focusSheet();
  }

  /** After every change on the sheet: is the task done? */
  function update(next: Sheet) {
    setSheet(next);
    if (done || demo === 'playing' || !task.check(next)) return;
    setDone({
      shortcut: !mouseRef.current && keysRef.current <= task.maxKeys,
      cells: doneCells(startSheetRef.current, next),
    });
    setDoneSteps((d) => new Set(d).add(index));
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

  /** A data tool (Aralin 4): counts as one key, never as the mouse. */
  function onCommand(cmd: SheetCommand) {
    if (demo === 'playing') return;
    keysRef.current += 1;
    update(runCommand(sheet, cmd));
  }

  function onCellClick(p: Pos, shift: boolean) {
    if (demo === 'playing') return;
    mouseRef.current = true;
    update(clickCell(sheet, p, shift));
  }

  function onCellDoubleClick(p: Pos) {
    if (demo === 'playing') return;
    mouseRef.current = true;
    setSheet(editCell(sheet, p));
  }

  /** "Ipakita kung paano": play the solution on the sheet, then put the sheet back for the user. */
  function showHow() {
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

  /** The one help button: each press gives a bit more help. */
  function moreHelp() {
    if (help >= 2) {
      setHelp(3);
      showHow();
      return;
    }
    setHelp(help + 1);
    focusSheet();
  }

  const isLast = index === steps.length - 1;

  const panel = (
    <>
      {/* The topics, as a list: where you are, and a jump to any of them (back or ahead). */}
      <nav aria-label="Mga bahagi ng aralin">
        <div className="mb-1.5 text-sm font-semibold text-stone-600">
          Bahagi {step.topic + 1} sa {topics.length}
        </div>
        {/* One small numbered circle per topic (the title shows on hover): compact, so the task stays in view. */}
        <ol className="flex flex-wrap gap-1.5">
          {topics.map((t, i) => {
            const current = i === step.topic;
            const finished = steps.every((s, si) => s.topic !== i || doneSteps.has(si));
            return (
              <li key={t.title}>
                <button
                  type="button"
                  title={t.title}
                  aria-label={`${i + 1}: ${t.title}${finished ? ' (tapos na)' : ''}`}
                  aria-current={current ? 'step' : undefined}
                  disabled={demo === 'playing'}
                  onClick={() => goTo(firstStepOf(i), sheet)}
                  className={
                    'flex h-9 w-9 items-center justify-center rounded-full font-display text-sm font-bold tabular-nums transition-colors ' +
                    'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed ' +
                    (current
                      ? 'bg-brand-700 text-white'
                      : finished
                        ? 'bg-brand-100 text-brand-900 hover:bg-brand-200'
                        : 'border border-stone-400 bg-white text-stone-600 hover:border-stone-600')
                  }
                >
                  {i + 1}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* The current topic: the short explanation and its keys. */}
      <section aria-label={topic.title} className="border-t border-stone-300 pt-3">
        <h2 className="mb-1.5 text-lg font-bold text-stone-900">{topic.title}</h2>
        {topic.body.map((line) => (
          <p key={line} className="mb-1.5 text-stone-800">
            {line}
          </p>
        ))}
        <ul className="mt-2 space-y-1">
          {topic.keys.map((k) => (
            <li key={k.keys} className="text-sm text-stone-700">
              <TipKeys tip={k.keys} /> <span>{k.what}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );

  // What to do now, on the sheet: pinned at the bottom of the guide (LessonLayout `footer`), always in view.
  const gawin = (
    <section
      aria-label="Gawin"
      className={
        'rounded-r-lg border-l-4 px-4 py-3 shadow-sm transition-colors ' +
        (done ? 'border-green-600 bg-green-50' : 'border-brand-700 bg-white')
      }
    >
      <div className={'text-sm font-bold ' + (done ? 'text-green-800' : 'text-brand-700')}>
        Gawin{tasksInTopic.length > 1 ? ` (${nthInTopic} sa ${tasksInTopic.length})` : ''}
      </div>
      <p className="font-bold text-stone-900">{task.text}</p>
      {task.record && <TaskRecord record={task.record} />}

      <div role="status" className="mt-2 text-sm text-stone-800">
        {done ? (
          <span className="block">
            <span className="block text-lg font-bold text-green-800">✓ Tama!{done.shortcut ? ' Ang galing.' : ''}</span>
            {!done.shortcut && (
              <span className="text-stone-700">
                Mas mabilis kung <TipKeys tip={task.tip} /> ang gagamitin.
              </span>
            )}
          </span>
        ) : demo === 'playing' ? (
          <span>
            Pinapakita: <TipKeys tip={task.tip} />
          </span>
        ) : demo === 'shown' ? (
          <span className="font-semibold">
            Ikaw naman ngayon: <TipKeys tip={task.tip} />
          </span>
        ) : help === 1 ? (
          <span>{task.hint}</span>
        ) : help >= 2 ? (
          <span>
            Gamitin: <TipKeys tip={task.tip} />
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        {done ? (
          <Button autoFocus onClick={() => goTo(index + 1, sheet)}>
            {isLast ? 'Tapusin ang aralin' : 'Susunod'} <ArrowRightIcon className="h-5 w-5" />
          </Button>
        ) : (
          <>
            <Button variant="secondary" disabled={demo === 'playing'} onClick={moreHelp}>
              {HELP_LABELS[help]}
            </Button>
            <button
              type="button"
              disabled={demo === 'playing'}
              onClick={() => goTo(index + 1, sheet)}
              className="rounded text-sm text-stone-600 underline decoration-dotted underline-offset-2 hover:text-stone-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600 disabled:opacity-50"
            >
              Laktawan
            </button>
          </>
        )}
      </div>
    </section>
  );

  return (
    <LessonLayout
      eyebrow={`Aralin ${level}`}
      title={title}
      onBack={onExit}
      panel={panel}
      footer={gawin}
      sheet={
        <ExcelSheetView
          sheet={sheet}
          columnWidths={content.columnWidths}
          tools={content.tools}
          taskKey={index}
          computed={computed}
          flash={done?.cells ?? null}
          onKey={onKey}
          onCommand={onCommand}
          onEditChange={(v) => setSheet(typeInCell(sheet, v))}
          onCellClick={onCellClick}
          onCellDoubleClick={onCellDoubleClick}
        />
      }
    />
  );
}
