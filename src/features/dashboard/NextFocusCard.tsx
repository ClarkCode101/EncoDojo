/**
 * "Susunod na gagawin" in the sidebar, above the belt card: the practice to do
 * next (see coach.ts) with one short reason; the whole card is a link to it.
 * Collapsed sidebar: just that practice's icon; the details show on hover.
 */
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRightIcon,
  AssessmentIcon,
  CopyIcon,
  DocumentIcon,
  KeyboardIcon,
  NumpadIcon,
  QcIcon,
} from '../../components/icons';
import { dailyGoalText, doneToday } from '../../lib/reminders';
import { useAppData } from '../../lib/useAppData';
import { nextFocus, type NextFocus } from './coach';

const ICONS: Record<NextFocus['skill'], (className: string) => ReactNode> = {
  typing: (c) => <KeyboardIcon className={c} />,
  numpad: (c) => <NumpadIcon className={c} />,
  copy: (c) => <CopyIcon className={c} />,
  encoding: (c) => <DocumentIcon className={c} />,
  qc: (c) => <QcIcon className={c} />,
  assessment: (c) => <AssessmentIcon className={c} />,
};

const focusRing =
  'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-brand-300';

export default function NextFocusCard({ collapsed }: { collapsed: boolean }) {
  const { sessions, settings } = useAppData();
  const f = nextFocus(sessions);
  // Settings -> "Araw-araw na target" (null when there is no goal).
  const goal = dailyGoalText(settings.dailyGoal, doneToday(sessions));
  const summary = `Susunod na gagawin: ${f.label}. ${f.reason}${goal ? ` ${goal}` : ''}`;

  if (collapsed) {
    return (
      <Link
        to={f.to}
        title={summary}
        aria-label={summary}
        className={`mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-belt-400 text-belt-300 transition-colors hover:bg-brand-800 ${focusRing}`}
      >
        {ICONS[f.skill]('h-6 w-6')}
      </Link>
    );
  }

  return (
    <Link
      to={f.to}
      title={summary}
      aria-label={summary}
      className={`group block rounded-xl border border-dashed border-brand-600 p-3 transition-colors hover:border-belt-400 hover:bg-brand-800 ${focusRing}`}
    >
      <div className="text-sm text-brand-200">Susunod na gagawin</div>
      <div className="mt-0.5 flex items-center gap-2 font-bold text-white">
        <span className="text-belt-300">{ICONS[f.skill]('h-5 w-5')}</span>
        {f.label}
        <ArrowRightIcon className="ml-auto h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
      </div>
      {/*
        Hidden on short screens so the sidebar never needs to scroll (the hover title has it).
        With a daily goal there is one more line, so the reason already hides below 900px
        (the goal line is the one kept there).
      */}
      <p
        className={
          'mt-1 text-sm leading-snug text-brand-100 [@media(max-height:800px)]:hidden ' +
          (goal ? '[@media(max-height:900px)]:hidden' : '')
        }
      >
        {f.reason}
      </p>
      {goal && (
        <p className="mt-1 text-sm font-semibold text-belt-300 [@media(max-height:700px)]:hidden">{goal}</p>
      )}
    </Link>
  );
}
