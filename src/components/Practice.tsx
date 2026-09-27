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
 *
 * On laptops/desktops the practice screen fits the window exactly
 * (`PracticeFrame`): the page itself never scrolls; a long document, passage,
 * or sheet scrolls inside its own box instead (owner's request).
 */
import type { ReactNode } from 'react';
import { useSenseiQuiet } from '../features/sensei/quiet';
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
        <div className="space-y-5">
          <Step number={1} title={chooseTitle}>
            {choices}
          </Step>
          <Step number={2} title="Tandaan">
            <ul className="list-disc space-y-0.5 pl-6 text-lg text-stone-800">
              {howTo.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
            {extra && <div className="mt-3">{extra}</div>}
          </Step>
        </div>
        <div className="mt-5 flex items-center gap-4">
          <div
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-700 text-lg font-bold text-white"
          >
            3
          </div>
          <Button size="lg" autoFocus onClick={onStart}>
            Simulan <ArrowRightIcon className="h-5 w-5" />
          </Button>
        </div>
      </Card>
    </div>
  );
}

/**
 * The practice screen's outer box. From tablet width up it is exactly as tall
 * as the window (minus the page padding), and the drill inside shrinks its
 * scrollable parts to fit. On phones it is a normal page.
 */
export function PracticeFrame({ children }: { children: ReactNode }) {
  // Sensei stays hidden while practicing (he talks again on the results).
  useSenseiQuiet(true);
  return <div className="md:flex md:h-[calc(100dvh-3rem)] md:min-h-[30rem] md:flex-col">{children}</div>;
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
    <header className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-800 sm:flex">
          {icon}
        </div>
        <h1 className="text-2xl font-bold text-stone-900">
          {title} <span className="ml-1 text-base font-normal text-stone-600">{summary}</span>
        </h1>
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
