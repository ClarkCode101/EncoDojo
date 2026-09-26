/**
 * Pieces shared by the results screens (Typing, Numpad, Assessment).
 */
import { display } from '../lib/scoring';
import { Button } from './ui';

/**
 * Tells the user whether a training result is saved, with a button to change it.
 * Results finished early with "Finish now" start unsaved, because a very short
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
  let message = 'This result is NOT saved.';
  let button = 'Save it again';
  if (saved) {
    message = 'Saved to your progress.';
    button = "Don't save this result";
  } else if (finishedEarly) {
    message = 'You finished early, so this result was NOT saved (a short run makes your speed look higher than it is).';
    button = 'Save anyway';
  }

  return (
    <div
      role="status"
      className={
        'mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border px-4 py-2 text-sm ' +
        (saved ? 'border-green-300 bg-green-50 text-green-900' : 'border-amber-300 bg-amber-50 text-amber-900')
      }
    >
      <span>{message}</span>
      <Button variant="secondary" onClick={onToggle}>
        {button}
      </Button>
    </div>
  );
}

/** One "✅ Net WPM 43 / 40 needed" line. Compares the ROUNDED value, like the screen shows. */
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
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span aria-hidden="true" className="text-lg">
        {pass ? '✅' : '❌'}
      </span>
      <span className="w-40 text-slate-700">{label}</span>
      <span className="font-semibold tabular-nums text-slate-900">
        {display(value).toLocaleString()}
        {unit}
      </span>
      <span className="text-sm text-slate-600">
        / {target.toLocaleString()}
        {unit} needed
      </span>
      <span className="sr-only">{pass ? 'passed' : 'not yet'}</span>
    </li>
  );
}
