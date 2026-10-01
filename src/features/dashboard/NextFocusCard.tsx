/**
 * "Susunod na gagawin" on Home (moved from the sidebar, owner's choice 2026-10-01: the
 * sidebar is only the menu now): the practice to do next (see coach.ts) with one short
 * reason; the whole card is a link to that practice. (The daily goal line was removed
 * with the setting, owner's choice 2026-10-01.)
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
import { useLang } from '../../lib/i18n';
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

export default function NextFocusCard() {
  const { sessions } = useAppData();
  const lang = useLang();
  const f = nextFocus(sessions, lang);

  return (
    <Link
      to={f.to}
      className="group block rounded-xl border border-stone-300 border-l-4 border-l-belt-400 bg-white p-4 shadow-sm transition-colors hover:border-brand-500 hover:border-l-belt-400 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-brand-600"
    >
      <div className="text-sm font-semibold text-stone-600">{lang === 'en' ? 'Do next' : 'Susunod na gagawin'}</div>
      <div className="mt-1 flex items-center gap-2 text-lg font-bold text-stone-900">
        <span className="text-brand-700">{ICONS[f.skill]('h-6 w-6')}</span>
        {f.label}
        <ArrowRightIcon className="ml-auto h-5 w-5 text-stone-500 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
      </div>
      <p className="mt-1 text-stone-700">{f.reason}</p>
    </Link>
  );
}
