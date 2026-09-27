/**
 * Pieces shared by the results screens (Typing, Numpad, Assessment).
 */
import { display } from '../lib/scoring';
import { KPH_LEVELS, kphLevel } from '../lib/targets';
import type { ReactNode } from 'react';
import { CheckIcon, XIcon } from './icons';
import { Button } from './ui';

/**
 * The top of every results screen: one plain sentence with the main numbers,
 * one line of advice, then the main buttons. A thick left edge (green when the
 * target is reached) instead of a box, like a note on the page.
 */
export function ResultSummary({
  ready,
  headline,
  message,
  children,
}: {
  ready: boolean;
  headline: ReactNode;
  message: ReactNode;
  /** The main buttons (e.g. "Ulitin"). */
  children: ReactNode;
}) {
  return (
    <section
      aria-label="Buod ng resulta"
      className={
        'mb-6 rounded-r-lg border-l-4 py-5 pl-6 pr-5 ' +
        (ready ? 'border-green-600 bg-green-50' : 'border-brand-700 bg-white')
      }
    >
      <p className="text-2xl leading-relaxed text-stone-900">{headline}</p>
      <p className="mt-2 text-lg text-stone-700">{message}</p>
      <div className="mt-5 flex flex-wrap gap-3">{children}</div>
    </section>
  );
}

/**
 * Tells the user whether a practice result is saved, with a button to change it.
 * Results finished early with "Tapusin na" start unsaved, because a very short
 * run makes WPM/KPH look much higher than it really is.
 */
export function SaveBanner({
  saved,
  finishedEarly,
  onToggle,
}: {
  saved: boolean;
  finishedEarly: boolean;
  onToggle: () => void;
}) {
  let message = 'HINDI naka-save ang resultang ito.';
  let button = 'I-save ulit';
  if (saved) {
    message = '✓ Na-save sa progress mo.';
    button = 'Huwag i-save';
  } else if (finishedEarly) {
    message =
      'Tinapos mo nang maaga, kaya HINDI ito na-save. (Kapag maikli ang oras, lalabas na mas mabilis ka kaysa sa totoo.)';
    button = 'I-save pa rin';
  }

  return (
    <div
      role="status"
      className={
        'mb-6 flex flex-wrap items-center justify-between gap-3 rounded-r-lg border-l-4 px-5 py-3 text-base ' +
        (saved ? 'border-green-600 bg-green-50 text-green-950' : 'border-amber-500 bg-amber-50 text-amber-950')
      }
    >
      <span className="font-medium">{message}</span>
      <Button variant="secondary" size="sm" onClick={onToggle}>
        {button}
      </Button>
    </div>
  );
}

/**
 * Where a KPH score stands among the job levels (Pasado / Karaniwan / Magaling):
 * a plain sentence first, then a bar with a marker, then the list of levels.
 */
export function KphLevels({ kph }: { kph: number }) {
  const score = display(kph);
  const { reached, next } = kphLevel(kph);
  const top = KPH_LEVELS[KPH_LEVELS.length - 1].min;
  const scaleMax = Math.max(top + 3000, score * 1.05);
  const pos = (value: number) => `${Math.min(100, (value / scaleMax) * 100)}%`;

  return (
    <div>
      <p className="text-lg text-stone-900">
        Antas mo: <strong>{reached ? reached.label : 'Hindi pa pasado'}</strong>
        {next && (
          <span className="text-stone-700">
            {' '}
            ({(next.min - score).toLocaleString()} KPH pa para sa &quot;{next.label}&quot;)
          </span>
        )}
        {!next && <span className="text-stone-700">, ang pinakamataas na antas.</span>}
      </p>

      {/* The bar is only a picture of the sentence above, so screen readers skip it. */}
      <div aria-hidden="true" className="relative mb-8 mt-4 h-4 rounded-full bg-stone-200">
        {KPH_LEVELS.map((level, i) => {
          const end = KPH_LEVELS[i + 1]?.min ?? scaleMax;
          const shade = ['bg-green-200', 'bg-green-400', 'bg-green-600'][i] ?? 'bg-green-600';
          return (
            <div
              key={level.min}
              className={`absolute inset-y-0 ${shade} ${i === KPH_LEVELS.length - 1 ? 'rounded-r-full' : ''}`}
              style={{ left: pos(level.min), width: `calc(${pos(end)} - ${pos(level.min)})` }}
            />
          );
        })}
        {KPH_LEVELS.map((level) => (
          <div
            key={level.min}
            className="absolute top-5 -translate-x-1/2 text-xs font-semibold text-stone-600"
            style={{ left: pos(level.min) }}
          >
            {(level.min / 1000).toLocaleString()}k
          </div>
        ))}
        <div
          className="absolute -top-2 h-8 w-1.5 -translate-x-1/2 rounded-full bg-brand-800 ring-2 ring-white"
          style={{ left: pos(score) }}
        />
      </div>

      <ul className="space-y-1.5">
        {KPH_LEVELS.map((level) => {
          const done = score >= level.min;
          return (
            <li key={level.min} className="flex flex-wrap items-baseline gap-x-2 text-base">
              <span aria-hidden="true" className="self-center">
                {done ? (
                  <CheckIcon className="h-5 w-5 text-green-700" />
                ) : (
                  <span className="block h-4 w-4 rounded-full border-2 border-stone-400" />
                )}
              </span>
              <span className="w-20 font-bold tabular-nums">{level.min.toLocaleString()}</span>
              <span className="font-semibold text-stone-900">{level.label}</span>
              <span className="text-sm text-stone-600">{level.description}</span>
              <span className="sr-only">{done ? 'naabot mo na' : 'hindi pa naaabot'}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * A tilted rubber stamp, like the ones used in offices: "PASADO" or "HINDI PA".
 * It "lands" with a short animation (skipped if the user prefers less motion).
 */
export function Stamp({ passed }: { passed: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={
        'inline-block -rotate-[8deg] select-none rounded-lg border-[5px] border-double px-5 py-1 ' +
        'text-3xl font-black tracking-[0.2em] opacity-90 motion-safe:animate-stamp ' +
        (passed ? 'border-green-700 text-green-700' : 'border-amber-700 text-amber-700')
      }
    >
      {passed ? 'PASADO' : 'HINDI PA'}
    </div>
  );
}

/** One "✓ Net WPM  43  / 40 ang kailangan" line. Compares the ROUNDED value, like the screen shows. */
export function TargetRow({
  label,
  value,
  target,
  unit = '',
}: {
  label: string;
  value: number;
  target: number;
  unit?: string;
}) {
  const pass = display(value) >= target;
  return (
    <li className={'flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-stone-200 px-1 py-2 last:border-b-0'}>
      <span aria-hidden="true">
        {pass ? <CheckIcon className="h-6 w-6 text-green-700" /> : <XIcon className="h-6 w-6 text-red-700" />}
      </span>
      <span className="w-44 font-medium text-stone-800">{label}</span>
      <span className="text-lg font-bold tabular-nums text-stone-900">
        {display(value).toLocaleString()}
        {unit}
      </span>
      <span className="text-stone-600">
        / {target.toLocaleString()}
        {unit} ang kailangan
      </span>
      <span className={`ml-auto text-sm font-semibold ${pass ? 'text-green-800' : 'text-red-700'}`}>
        {pass ? 'Pasado' : 'Hindi pa'}
      </span>
    </li>
  );
}
