/**
 * "Ang belt mo" on Home (moved from the sidebar, owner's choice 2026-10-01: the sidebar
 * is only the menu now): the user's belt (from their best Assessment, see lib/belts.ts),
 * how close the next belt is, and what to do. The whole card links to the Assessment,
 * where belts are earned.
 */
import { Link } from 'react-router-dom';
import { useBeltPreview, previewSessions } from '../features/assessment/DevJump'; // TEMPORARY (DevJump)
import { beltStatus } from '../lib/belts';
import { useLang } from '../lib/i18n';
import { useAppData } from '../lib/useAppData';
import { ArrowRightIcon, BeltIcon } from './icons';

export default function BeltCard() {
  const { sessions } = useAppData();
  // TEMPORARY (DevJump): localhost-only belt preview; null = the real belt.
  // import.meta.env.DEV is a build-time constant, so this is never called (and is removed) in the built site.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const preview = import.meta.env.DEV ? useBeltPreview() : null;
  const lang = useLang();
  const en = lang === 'en';
  const s = beltStatus(preview ? previewSessions(preview) : sessions, lang);
  const nextWord = en ? 'Next' : 'Susunod';

  return (
    <Link
      to="/assessment"
      className="group block rounded-xl border border-stone-300 bg-white p-4 shadow-sm transition-colors hover:border-brand-500 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-brand-600"
    >
      <div className="flex items-center gap-3">
        {/* A dark tile (also in dark mode: theme-fixed), so the white belt shows on the card. */}
        <span className="theme-fixed flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-900">
          <BeltIcon color={s.belt.color} className="h-10 w-10" />
        </span>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-stone-600">
            {en ? 'Your belt' : 'Ang belt mo'}
            {preview && ' (test preview)'}
          </div>
          <div className="text-lg font-bold leading-tight text-stone-900">{s.belt.label}</div>
        </div>
        <ArrowRightIcon className="ml-auto h-5 w-5 text-stone-500 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
      </div>
      {/* Progress toward the next belt (the text below says the same in words). */}
      <div aria-hidden="true" className="mt-3 h-2 overflow-hidden rounded-full bg-stone-200">
        <div className="h-full rounded-full bg-belt-400" style={{ width: `${Math.round(s.progress * 100)}%` }} />
      </div>
      <p className="mt-2 text-stone-700">
        {s.next ? (
          <>
            {nextWord}: <strong className="text-stone-900">{s.next.label}</strong>. {s.nextHint}
          </>
        ) : (
          s.nextHint
        )}
      </p>
    </Link>
  );
}
