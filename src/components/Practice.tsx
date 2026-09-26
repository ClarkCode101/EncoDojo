/**
 * The two screens every practice page uses, so they all feel the same:
 *
 * 1. SETUP ("Bago magsimula"): page title, the choices (duration, layout, ...),
 *    at most 3 short "how to" points, and one big "Simulan" button.
 * 2. PRACTICE: a small header (title + chosen settings + "Palitan ang
 *    settings") and then only the drill itself.
 *
 * Keeping the instructions on the setup screen means the practice screen has
 * nothing to read except the drill (owner's request: less overwhelming).
 */
import type { ReactNode } from 'react';
import { ArrowRightIcon } from './icons';
import { Button, Card, PageHeader, Step } from './ui';

export function PracticeSetup({
  icon,
  title,
  description,
  chooseTitle,
  choices,
  howTo,
  extra,
  onStart,
}: {
  icon: ReactNode;
  title: string;
  /** One short sentence. */
  description: string;
  /** e.g. "Pumili ng tagal" */
  chooseTitle: string;
  /** The pickers. */
  choices: ReactNode;
  /** At most 3 short points. */
  howTo: ReactNode[];
  /** Optional extra under the points (e.g. the encoding rules or a help link). */
  extra?: ReactNode;
  onStart: () => void;
}) {
  return (
    <div>
      <PageHeader icon={icon} title={title} description={description} />
      <Card>
        <div className="space-y-7">
          <Step number={1} title={chooseTitle}>
            {choices}
          </Step>
          <Step number={2} title="Tandaan">
            <ul className="list-disc space-y-1 pl-6 text-lg text-stone-800">
              {howTo.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
            {extra && <div className="mt-4">{extra}</div>}
          </Step>
          <Step number={3} title="Handa ka na?">
            <Button size="lg" autoFocus onClick={onStart}>
              Simulan <ArrowRightIcon className="h-5 w-5" />
            </Button>
          </Step>
        </div>
      </Card>
    </div>
  );
}

export function PracticeHeader({
  icon,
  title,
  summary,
  actions,
  canChangeSettings,
  onChangeSettings,
}: {
  icon: ReactNode;
  title: string;
  /** The chosen settings, e.g. "1 minuto · Spreadsheet". */
  summary: string;
  /** Extra buttons shown before the run starts (e.g. "Ibang text"). */
  actions?: ReactNode;
  /** Only before the first key; after that, use "Finish" instead. */
  canChangeSettings: boolean;
  onChangeSettings: () => void;
}) {
  return (
    <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-800 sm:flex">
          {icon}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-stone-900">{title}</h1>
          <p className="text-stone-600">{summary}</p>
        </div>
      </div>
      {canChangeSettings && (
        <div className="flex flex-wrap gap-2">
          {actions}
          <Button variant="secondary" onClick={onChangeSettings}>
            ‹ Palitan ang settings
          </Button>
        </div>
      )}
    </header>
  );
}
