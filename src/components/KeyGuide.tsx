/**
 * The on-screen keyboard guide (Settings -> "Gabay sa keyboard", owner's request 2026-10-01):
 * a small keyboard (or numpad) under the practice, with the NEXT key lit in gold (and the Shift
 * to hold), plus one line naming the key and the finger. For beginners; never in the Assessment.
 * The drawing is decoration for screen readers (aria-hidden); the line says the same in words.
 */
import { useLang, useT } from '../lib/i18n';
import { KEY_ROWS, NUMPAD_FINGER, fingerName, keyFor, type Finger } from '../lib/keyGuide';

/** Wider keys, like a real keyboard. */
const WIDTH: Record<string, string> = {
  Backspace: 'w-16',
  Tab: 'w-12',
  '\\': 'w-10',
  Caps: 'w-14',
  Enter: 'w-[4.6rem]',
  Shift: 'w-[4.6rem]',
  'Shift ': 'w-[5.7rem]',
  Space: 'w-72',
};

function Key({ label, lit, className = '' }: { label: string; lit: boolean; className?: string }) {
  return (
    <span
      className={
        'flex h-7 min-w-[1.75rem] items-center justify-center rounded border px-1 font-mono text-xs ' +
        (lit
          ? 'border-belt-600 bg-belt-400 font-bold text-brand-950 shadow'
          : 'border-stone-300 bg-white text-stone-600') +
        ' ' +
        className
      }
    >
      {/* The two home keys have a small bump, like a real keyboard. */}
      {label === 'F' || label === 'J' ? (
        <span className="underline decoration-2 underline-offset-2">{label}</span>
      ) : (
        label.trim()
      )}
    </span>
  );
}

/** "Susunod: Shift + J · kaliwang hinliliit + kanang hintuturo" */
function GuideLine({ keys, fingers }: { keys: string[]; fingers: Finger[] }) {
  const lang = useLang();
  const t = useT();
  return (
    <p className="text-sm text-stone-700">
      {t('Susunod', 'Next')}: <strong className="text-stone-900">{keys.map((k) => k.trim()).join(' + ')}</strong>
      {' · '}
      {fingers.map((f) => fingerName(f, lang)).join(' + ')}
    </p>
  );
}

/** The whole keyboard; `next` is the next character to type (or 'Enter' / 'Backspace'). */
export function KeyboardGuide({ next }: { next: string | null }) {
  const press = next === null ? null : keyFor(next);
  const lit = new Set(press ? [press.key, ...(press.shift ? [press.shift] : [])] : []);
  return (
    <div className="flex shrink-0 flex-col items-center gap-1.5">
      <div aria-hidden="true" className="flex flex-col items-center gap-1">
        {KEY_ROWS.map((row, i) => (
          <div key={i} className="flex gap-1">
            {row.map((k) => (
              <Key key={k} label={k} lit={lit.has(k)} className={WIDTH[k] ?? ''} />
            ))}
          </div>
        ))}
      </div>
      {press && (
        <GuideLine
          keys={press.shift ? ['Shift', press.key] : [press.key]}
          fingers={press.shift ? [press.shift === 'Shift' ? 'lPinky' : 'rPinky', press.finger] : [press.finger]}
        />
      )}
    </div>
  );
}

/** The numpad (Num Lock on): 7-8-9 / 4-5-6 / 1-2-3 / 0 and ., with Enter. `next` = a digit, '.', 'Enter' or 'Backspace'. */
export function NumpadGuide({ next }: { next: string | null }) {
  const t = useT();
  const cell = (label: string, extra = '') => (
    <Key key={label} label={label} lit={next === label} className={`h-auto min-h-[1.75rem] w-full ${extra}`} />
  );
  return (
    <div className="flex shrink-0 flex-col items-center gap-1.5">
      <div aria-hidden="true" className="grid w-44 grid-cols-4 grid-rows-5 gap-1">
        {cell('Num')}
        {cell('/')}
        {cell('*')}
        {cell('-')}
        {cell('7')}
        {cell('8')}
        {cell('9')}
        {cell('+', 'row-span-2')}
        {cell('4')}
        {cell('5')}
        {cell('6')}
        {cell('1')}
        {cell('2')}
        {cell('3')}
        {cell('Enter', 'row-span-2 text-[0.6rem]')}
        {cell('0', 'col-span-2')}
        {cell('.')}
      </div>
      {next === 'Backspace' ? (
        <p className="text-sm font-semibold text-red-700">
          {t(
            'May mali: Backspace muna (nasa itaas na kanan ng keyboard).',
            'A mistake: Backspace first (top right of the keyboard).',
          )}
        </p>
      ) : (
        next && NUMPAD_FINGER[next] && <GuideLine keys={[next]} fingers={[NUMPAD_FINGER[next]]} />
      )}
    </div>
  );
}
