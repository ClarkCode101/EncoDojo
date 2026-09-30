/**
 * "Ang belt mo" at the bottom of the sidebar: the user's belt (from their best
 * Assessment, see lib/belts.ts), how close the next belt is, and what to do.
 * The whole card links to the Assessment, where belts are earned.
 * Collapsed sidebar: only the colored belt; the details show on hover.
 */
import { Link } from 'react-router-dom';
import { useBeltPreview, previewSessions } from '../features/assessment/DevJump'; // TEMPORARY (DevJump)
import { beltStatus } from '../lib/belts';
import { useAppData } from '../lib/useAppData';
import { BeltIcon } from './icons';

const focusRing =
  'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-brand-600';
/** The belt's outline on the light card (a White Belt would vanish on it without one). */
const BELT_EDGE = '#2E2A6B';

export default function BeltCard({ collapsed }: { collapsed: boolean }) {
  const { sessions } = useAppData();
  // TEMPORARY (DevJump): localhost-only belt preview; null = the real belt.
  // import.meta.env.DEV is a build-time constant, so this is never called (and is removed) in the built site.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const preview = import.meta.env.DEV ? useBeltPreview() : null;
  const s = beltStatus(preview ? previewSessions(preview) : sessions);
  const summary = s.next
    ? `${s.belt.label}. Susunod: ${s.next.label}. ${s.nextHint}`
    : `${s.belt.label}. ${s.nextHint}`;

  if (collapsed) {
    return (
      <Link
        to="/assessment"
        title={summary}
        aria-label={`Ang belt mo: ${summary}`}
        className={`mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-brand-50 transition-colors hover:bg-brand-100 ${focusRing}`}
      >
        <BeltIcon color={s.belt.color} edge={BELT_EDGE} className="h-10 w-10" />
      </Link>
    );
  }

  return (
    <Link
      to="/assessment"
      title={summary}
      aria-label={`Ang belt mo: ${summary}`}
      className={`block rounded-xl border border-brand-100 bg-brand-50 p-3 transition-colors hover:border-brand-300 ${focusRing}`}
    >
      <div className="flex items-center gap-3">
        <BeltIcon color={s.belt.color} edge={BELT_EDGE} className="h-11 w-11 shrink-0" />
        <div>
          <div className="text-sm text-stone-600">Ang belt mo{preview && ' (test preview)'}</div>
          <div className="text-lg font-bold leading-tight text-brand-900">{s.belt.label}</div>
        </div>
      </div>
      {/* Progress toward the next belt (the text below says the same in words). */}
      <div aria-hidden="true" className="mt-3 h-2 overflow-hidden rounded-full bg-brand-100">
        <div className="h-full rounded-full bg-belt-400" style={{ width: `${Math.round(s.progress * 100)}%` }} />
      </div>
      {/* Hidden on short screens so the sidebar never needs to scroll (the hover title has it). */}
      <p className="mt-2 text-sm leading-snug text-stone-600 [@media(max-height:900px)]:hidden">
        {s.next ? (
          <>
            Susunod: <strong className="text-stone-900">{s.next.label}</strong>. {s.nextHint}
          </>
        ) : (
          s.nextHint
        )}
      </p>
    </Link>
  );
}
