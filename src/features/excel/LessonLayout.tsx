/**
 * The lesson and quiz screens of the Excel learning track (owner's choice,
 * 2026-09-28: "gabay sa gilid"): the guide on the left (a narrow column that
 * scrolls by itself if it must), the sheet on the right using the full height.
 * The app sidebar is hidden meanwhile (focus mode, like the Assessment), so the
 * sheet gets the width.
 */
import type { ReactNode } from 'react';
import { ExcelIcon } from '../../components/icons';
import { useFocusMode } from '../../lib/focusMode';

export default function LessonLayout({
  eyebrow,
  title,
  onBack,
  panel,
  sheet,
}: {
  /** Small line above the title, e.g. "Aralin 4" or "Pagsusulit". */
  eyebrow: string;
  title: string;
  onBack: () => void;
  panel: ReactNode;
  sheet: ReactNode;
}) {
  useFocusMode(true);
  return (
    <div className="grid min-h-0 flex-1 gap-5 md:grid-cols-[18rem_minmax(0,1fr)]">
      <aside aria-label="Gabay" className="flex min-h-0 flex-col gap-4 overflow-y-auto pb-2 pr-1">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="mb-2 inline-flex min-h-[2.25rem] items-center rounded-lg border-[1.5px] border-stone-400 bg-white px-3 text-sm font-semibold text-stone-800 hover:border-stone-600 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            ‹ Mga aralin
          </button>
          <div className="flex items-center gap-2 text-sm font-semibold text-stone-600">
            <ExcelIcon className="h-4 w-4 text-brand-700" />
            {eyebrow}
          </div>
          <h1 className="text-xl font-bold leading-tight text-stone-900">{title}</h1>
        </div>
        {panel}
      </aside>
      <div className="flex min-h-0 flex-col">{sheet}</div>
    </div>
  );
}
