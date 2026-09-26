/**
 * Pieces shared by the results screens (Typing, Numpad, Assessment).
 */
import { display } from '../lib/scoring';
import { Button } from './ui';

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
        'mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 px-5 py-3 text-base ' +
        (saved ? 'border-green-400 bg-green-50 text-green-950' : 'border-amber-400 bg-amber-50 text-amber-950')
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

/** One "✅ Net WPM  43  / 40 ang kailangan" line. Compares the ROUNDED value, like the screen shows. */
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
    <li
      className={
        'flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-3 py-2 ' + (pass ? 'bg-green-50' : 'bg-red-50')
      }
    >
      <span aria-hidden="true" className="text-xl">
        {pass ? '✅' : '❌'}
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
      <span className="ml-auto text-sm font-semibold">{pass ? 'Pasado' : 'Hindi pa'}</span>
    </li>
  );
}
