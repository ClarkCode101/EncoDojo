/**
 * "Ang belt mo" at the bottom of the sidebar: the user's belt (from their best
 * Assessment, see lib/belts.ts), how close the next belt is, and what to do.
 * The whole card links to the Assessment, where belts are earned.
 * Collapsed sidebar: only the colored belt; the details show on hover.
 */
import { Link } from 'react-router-dom';
import { useBeltPreview, previewSessions } from '../features/assessment/DevJump'; // TEMPORARY (DevJump)
import { beltStatus } from '../lib/belts';
import { useLang } from '../lib/i18n';
import { useAppData } from '../lib/useAppData';
import { BeltIcon } from './icons';

const focusRing =
  'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-brand-300';

export default function BeltCard({ collapsed }: { collapsed: boolean }) {
  const { sessions } = useAppData();
  // TEMPORARY (DevJump): localhost-only belt preview; null = the real belt.
  // import.meta.env.DEV is a build-time constant, so this is never called (and is removed) in the built site.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const preview = import.meta.env.DEV ? useBeltPreview() : null;
  const lang = useLang();
  const en = lang === 'en';
  const s = beltStatus(preview ? previewSessions(preview) : sessions, lang);
  const nextWord = en ? 'Next' : 'Susunod';
  const summary = s.next
    ? `${s.belt.label}. ${nextWord}: ${s.next.label}. ${s.nextHint}`
    : `${s.belt.label}. ${s.nextHint}`;
  const yourBelt = en ? 'Your belt' : 'Ang belt mo';

  if (collapsed) {
    return (
      <Link
        to="/assessment"
        title={summary}
        aria-label={`${yourBelt}: ${summary}`}
        className={`mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-brand-800 transition-colors hover:bg-brand-700 ${focusRing}`}
      >
        <BeltIcon color={s.belt.color} className="h-10 w-10" />
      </Link>
    );
  }

  return (
    <Link
      to="/assessment"
      title={summary}
      aria-label={`${yourBelt}: ${summary}`}
      className={`sb-card block rounded-xl border border-brand-700 bg-brand-800 p-3 transition-colors hover:border-belt-400 ${focusRing}`}
    >
      <div className="flex items-center gap-3">
        <BeltIcon color={s.belt.color} className="h-11 w-11 shrink-0" />
        <div>
          <div className="sb-card-label text-sm text-brand-200">
            {yourBelt}
            {preview && ' (test preview)'}
          </div>
          <div className="text-lg font-bold leading-tight text-white">{s.belt.label}</div>
        </div>
      </div>
      {/* Progress toward the next belt (the text below says the same in words). */}
      <div aria-hidden="true" className="sb-belt-bar mt-3 h-2 overflow-hidden rounded-full bg-brand-950">
        <div className="h-full rounded-full bg-belt-400" style={{ width: `${Math.round(s.progress * 100)}%` }} />
      </div>
      {/* Hidden when the sidebar must fit a short window (useSidebarFit; the hover title has it). */}
      <p className="sb-belt-hint mt-2 text-sm leading-snug text-brand-100">
        {s.next ? (
          <>
            {nextWord}: <strong className="text-white">{s.next.label}</strong>. {s.nextHint}
          </>
        ) : (
          s.nextHint
        )}
      </p>
    </Link>
  );
}
