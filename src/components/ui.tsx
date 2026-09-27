/**
 * Small shared UI pieces. Kept in one file because each is only a few lines.
 *
 * Design rules (for people who are not "techy" or have weaker eyesight):
 * - Big, clear buttons (at least 44px tall) and readable text sizes.
 * - Normal-case labels (no ALL CAPS): easier to read.
 * - Explanations are shown by clicking "Ano ito?" (no hover-only tooltips).
 *
 * "Dojo notebook" look (owner's choice, 2026-09-27): thin ruled lines like a
 * notebook or ledger instead of a box around everything, slab-serif headings
 * (`font-display`), and numbers written "01, 02" like a list on paper.
 */
import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { listNumber } from '../lib/listNumber';
import { useAppData } from '../lib/useAppData';
import { formatClock } from '../lib/useCountdown';

type Variant = 'primary' | 'secondary' | 'danger';
type Size = 'lg' | 'md' | 'sm';

const variantClasses: Record<Variant, string> = {
  primary: 'bg-brand-700 text-white shadow-sm hover:bg-brand-800 disabled:bg-brand-300',
  secondary:
    'bg-white text-stone-800 border-[1.5px] border-stone-400 hover:border-stone-600 hover:bg-stone-50 disabled:text-stone-400',
  danger: 'bg-red-700 text-white shadow-sm hover:bg-red-800 disabled:bg-red-300',
};

const sizeClasses: Record<Size, string> = {
  lg: 'min-h-[3.25rem] px-6 py-3 text-lg',
  md: 'min-h-[2.75rem] px-5 py-2 text-base',
  sm: 'min-h-[2.25rem] px-3 py-1.5 text-sm',
};

const baseButton =
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors ' +
  'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 ' +
  'focus-visible:outline-brand-600 disabled:cursor-not-allowed';

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      type={type}
      className={`${baseButton} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}

/** A link that looks like a Button. */
export function ButtonLink({
  to,
  variant = 'primary',
  size = 'md',
  children,
}: {
  to: string;
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}) {
  return (
    <Link to={to} className={`${baseButton} ${sizeClasses[size]} ${variantClasses[variant]}`}>
      {children}
    </Link>
  );
}

/**
 * A button that asks "Sigurado ka?" before doing something that can't be
 * undone (like deleting). First click shows the question with Yes / Cancel.
 */
export function ConfirmButton({
  label,
  question,
  confirmLabel = 'Oo, burahin',
  onConfirm,
  size = 'md',
}: {
  label: string;
  question: string;
  confirmLabel?: string;
  onConfirm: () => void;
  size?: Size;
}) {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <Button variant="secondary" size={size} onClick={() => setAsking(true)}>
        {label}
      </Button>
    );
  }
  return (
    <span role="alertdialog" aria-label={question} className="inline-flex flex-wrap items-center justify-end gap-2">
      <span className={`font-medium text-stone-900 ${size === 'sm' ? 'text-sm' : 'text-base'}`}>{question}</span>
      <Button
        variant="danger"
        size={size}
        autoFocus
        onClick={() => {
          setAsking(false);
          onConfirm();
        }}
      >
        {confirmLabel}
      </Button>
      <Button variant="secondary" size={size} onClick={() => setAsking(false)}>
        Huwag na
      </Button>
    </span>
  );
}

export function Card({
  title,
  icon,
  children,
  className = '',
  compact = false,
}: {
  title?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Less padding (practice screens, where every pixel of height counts). */
  compact?: boolean;
}) {
  return (
    <section className={`rounded-lg border border-stone-300 bg-white ${compact ? 'p-4' : 'p-6'} ${className}`}>
      {title && (
        <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-stone-900">
          {icon && <span className="text-brand-700">{icon}</span>}
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

/**
 * A part of a page with a ruled heading, like a section in a notebook:
 * a slab heading over a dark line, then the content (no box around it).
 * `aside` sits at the right of the heading (e.g. a HelpTip).
 * `small`: a lighter heading for a section inside another one (e.g. inside a folded part of a report).
 */
export function Section({
  title,
  aside,
  small = false,
  children,
  className = '',
}: {
  title: string;
  aside?: ReactNode;
  small?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <div
        className={
          'flex flex-wrap items-baseline justify-between gap-x-4 ' +
          (small ? 'mb-2 border-b border-stone-300 pb-1' : 'mb-4 border-b-2 border-stone-800 pb-2')
        }
      >
        {small ? (
          <h3 className="text-lg font-bold text-stone-900">{title}</h3>
        ) : (
          <h2 className="text-2xl font-bold text-stone-900">{title}</h2>
        )}
        {aside}
      </div>
      {children}
    </section>
  );
}

/**
 * "Ano ito?": click to show a short explanation. Uses <details>, so it works
 * with mouse, keyboard, touch, and screen readers without extra code.
 */
export function HelpTip({ children, label = 'Ano ito?' }: { children: ReactNode; label?: string }) {
  return (
    <details className="group mt-1 text-sm">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded font-medium text-brand-700 underline decoration-dotted underline-offset-2 hover:text-brand-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600 [&::-webkit-details-marker]:hidden">
        <span aria-hidden="true" className="inline-block transition-transform group-open:rotate-90">
          ›
        </span>
        {label}
      </summary>
      <div className="mt-1 border-l-2 border-brand-300 bg-brand-50/70 px-3 py-2 text-stone-800">{children}</div>
    </details>
  );
}

/** A label + big number, e.g. "Bilis (Net WPM)  42", under a thin rule, with an optional explanation. */
export function StatBadge({
  label,
  value,
  hint,
  help,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  help?: ReactNode;
}) {
  return (
    <div className="border-t-2 border-stone-800 pt-2">
      <div className="text-sm font-medium text-stone-600">{label}</div>
      <div className="mt-0.5 font-display text-4xl font-bold tabular-nums text-stone-900">{value}</div>
      {hint && <div className="mt-0.5 text-sm text-stone-600">{hint}</div>}
      {help && <HelpTip>{help}</HelpTip>}
    </div>
  );
}

/**
 * One slim bar during a run: time left first (big), then the live numbers.
 * Stays at the top of the screen while scrolling (long documents), and turns
 * amber in the last 10 seconds so it's noticed.
 */
export function LiveStatsBar({
  seconds,
  started,
  stats,
}: {
  seconds: number;
  /** Before the first key the clock waits (the setup screen explains why). */
  started: boolean;
  stats: { label: string; value: ReactNode }[];
}) {
  const almostDone = started && seconds <= 10;
  // Equal cells, label on top and the number below, split by thin lines.
  const cell = 'min-w-0 flex-1 px-5 py-2';
  const label = 'truncate text-sm font-medium text-stone-600';
  const value = 'font-display text-2xl font-bold leading-tight tabular-nums text-stone-900';
  return (
    <div
      className={
        'sticky top-0 z-10 mb-3 grid shrink-0 grid-cols-2 overflow-hidden rounded-lg border ' +
        'sm:flex sm:divide-x sm:divide-stone-300 ' +
        (almostDone ? 'border-amber-500 bg-white' : 'border-stone-300 bg-white')
      }
    >
      <div className={`${cell} ${almostDone ? 'bg-amber-100' : 'bg-brand-50'}`}>
        <div className={label}>Natitirang oras</div>
        <div className={value}>
          {formatClock(seconds)}
          {!started && (
            <span className="ml-2 hidden whitespace-nowrap text-sm font-medium text-stone-600 sm:inline">
              hindi pa tumatakbo
            </span>
          )}
        </div>
      </div>
      {stats.map((s) => (
        <div key={s.label} className={cell}>
          <div className={label}>{s.label}</div>
          <div className={value}>{s.value}</div>
        </div>
      ))}
    </div>
  );
}

/**
 * A one-line keyboard reminder under the typing area, e.g.
 * [Tab] susunod na cell, [Enter] susunod na row.
 */
export function KeyTips({ tips }: { tips: { key?: string; text: string }[] }) {
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-stone-700">
      {tips.map((t) => (
        <span key={t.text}>
          {t.key && <Kbd>{t.key}</Kbd>} {t.text}
        </span>
      ))}
    </p>
  );
}

export function PageHeader({ title, description, icon }: { title: string; description?: ReactNode; icon?: ReactNode }) {
  return (
    <header className="mb-8">
      <h1 className="flex items-center gap-3 text-4xl font-bold text-stone-900">
        {/* The same icon as in the sidebar, small, so the page is easy to recognize. */}
        {icon && <span className="hidden text-brand-700 sm:inline-flex [&>svg]:h-8 [&>svg]:w-8">{icon}</span>}
        {title}
      </h1>
      {description && <p className="mt-2 text-lg text-stone-700">{description}</p>}
    </header>
  );
}

/** A numbered step, e.g. "01  Pumili ng oras", so the order is obvious. */
export function Step({ number, title, children }: { number: number; title: string; children?: ReactNode }) {
  return (
    <div className="grid grid-cols-[2.5rem_1fr] gap-x-4">
      <div aria-hidden="true" className="font-display text-2xl font-semibold leading-8 tabular-nums text-stone-400">
        {listNumber(number)}
      </div>
      <div className="min-w-0">
        <h2 className="font-sans text-lg font-bold leading-8 text-stone-900">
          <span className="sr-only">Hakbang {number}: </span>
          {title}
        </h2>
        {children && <div className="mt-2">{children}</div>}
      </div>
    </div>
  );
}

/**
 * English word with its Taglish meaning, e.g. "Submit (Ipasa)".
 * Used inside tests so users learn the English words they'll see on real
 * hiring tests and forms, while still understanding them.
 */
export function EnTl({ en, tl }: { en: string; tl: string }) {
  // Settings -> "English lang": only the English word, like a real hiring test.
  const englishOnly = useAppData().settings.englishOnly === true;
  if (englishOnly) return <>{en}</>;
  return (
    <>
      {en} <span className="text-[0.85em] font-normal opacity-80">({tl})</span>
    </>
  );
}

/** A keyboard key, e.g. <Kbd>Tab</Kbd>, so people can see which key to press. */
export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="mx-0.5 inline-block rounded-md border border-b-[3px] border-stone-400 bg-white px-1.5 py-0.5 font-mono text-[0.85em] font-semibold text-stone-800">
      {children}
    </kbd>
  );
}

/**
 * An On/Off switch (Settings rows). The words "On" / "Off" are shown too, so
 * the state doesn't depend on color alone.
 */
export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="inline-flex min-h-[2.75rem] items-center gap-3 rounded-full pr-2 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-brand-600"
    >
      <span
        aria-hidden="true"
        className={
          'relative h-7 w-12 shrink-0 rounded-full transition-colors ' + (checked ? 'bg-brand-700' : 'bg-stone-400')
        }
      >
        <span
          className={
            'absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ' +
            (checked ? 'translate-x-6' : 'translate-x-1')
          }
        />
      </span>
      <span aria-hidden="true" className="w-8 text-left font-semibold text-stone-800">
        {checked ? 'On' : 'Off'}
      </span>
    </button>
  );
}

/** A big, easy-to-click checkbox with a label (and optional description). */
export function Checkbox({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        className="mt-0.5 h-6 w-6 shrink-0 cursor-pointer accent-brand-700"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        <span className="block text-base font-semibold text-stone-900">{label}</span>
        {description && <span className="block text-sm text-stone-600">{description}</span>}
      </span>
    </label>
  );
}

type NoticeKind = 'info' | 'success' | 'warning';

const noticeClasses: Record<NoticeKind, string> = {
  info: 'border-brand-500 bg-brand-50 text-brand-950',
  success: 'border-green-600 bg-green-50 text-green-950',
  warning: 'border-amber-500 bg-amber-50 text-amber-950',
};

/** A colored message with a thick left edge (the color keeps its meaning: info, correct, warning). */
export function Notice({
  kind = 'info',
  children,
  className = '',
}: {
  kind?: NoticeKind;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div role="status" className={`rounded-r-lg border-l-4 px-5 py-3 text-base ${noticeClasses[kind]} ${className}`}>
      {children}
    </div>
  );
}

/** Row of buttons to choose one option, e.g. 30 sec / 1 min. */
export function SegmentedPicker<T extends string | number>({
  label,
  options,
  value,
  onChange,
  format = String,
  disabled = false,
  hideLabel = false,
}: {
  label: string;
  /** The label is already shown next to it (e.g. a Settings row): keep it for screen readers only. */
  hideLabel?: boolean;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  format?: (value: T) => string;
  disabled?: boolean;
}) {
  return (
    <fieldset disabled={disabled}>
      <legend className={hideLabel ? 'sr-only' : 'mb-2 text-base font-semibold text-stone-800'}>{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = option === value;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(option)}
              className={
                'min-h-[2.75rem] min-w-[3rem] rounded-lg border-[1.5px] px-4 py-2 text-base font-semibold transition-colors ' +
                'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-brand-600 ' +
                'disabled:cursor-not-allowed disabled:opacity-60 ' +
                (selected
                  ? 'border-brand-700 bg-brand-700 text-white'
                  : 'border-stone-400 bg-white text-stone-800 hover:border-stone-600 hover:bg-stone-50')
              }
            >
              {selected && <span aria-hidden="true">✓ </span>}
              {format(option)}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
