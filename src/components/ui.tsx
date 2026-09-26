/**
 * Small shared UI pieces. Kept in one file because each is only a few lines.
 *
 * Design rules (for people who are not "techy" or have weaker eyesight):
 * - Big, clear buttons (at least 44px tall) and readable text sizes.
 * - Normal-case labels (no ALL CAPS) — easier to read.
 * - Explanations are shown by clicking "Ano ito?" (no hover-only tooltips).
 */
import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { formatClock } from '../lib/useCountdown';

type Variant = 'primary' | 'secondary' | 'danger';
type Size = 'lg' | 'md' | 'sm';

const variantClasses: Record<Variant, string> = {
  primary: 'bg-blue-700 text-white shadow-sm hover:bg-blue-800 disabled:bg-blue-300',
  secondary:
    'bg-white text-slate-800 border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50 disabled:text-slate-400',
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
  'focus-visible:outline-blue-600 disabled:cursor-not-allowed';

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
      <span className={`font-medium text-slate-900 ${size === 'sm' ? 'text-sm' : 'text-base'}`}>{question}</span>
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
}: {
  title?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}>
      {title && (
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-900">
          {icon && <span className="text-blue-700">{icon}</span>}
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

/**
 * "Ano ito?" — click to show a short explanation. Uses <details>, so it works
 * with mouse, keyboard, touch, and screen readers without extra code.
 */
export function HelpTip({ children, label = 'Ano ito?' }: { children: ReactNode; label?: string }) {
  return (
    <details className="group mt-1 text-sm">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded font-medium text-blue-700 underline decoration-dotted underline-offset-2 hover:text-blue-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 [&::-webkit-details-marker]:hidden">
        <span aria-hidden="true" className="inline-block transition-transform group-open:rotate-90">
          ›
        </span>
        {label}
      </summary>
      <div className="mt-1 rounded-md bg-blue-50 px-3 py-2 text-slate-800">{children}</div>
    </details>
  );
}

/** A label + big number, e.g. "Bilis (Net WPM)  42", with an optional explanation. */
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
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="text-sm font-medium text-slate-600">{label}</div>
      <div className="mt-1 text-3xl font-bold tabular-nums text-slate-900">{value}</div>
      {hint && <div className="mt-0.5 text-sm text-slate-600">{hint}</div>}
      {help && <HelpTip>{help}</HelpTip>}
    </div>
  );
}

/** The countdown during a run. Turns amber in the last 10 seconds so it's noticed. */
export function TimeLeft({
  seconds,
  started,
  waitingText,
}: {
  seconds: number;
  started: boolean;
  /** Shown before the first key, e.g. "naghihintay sa unang letra". */
  waitingText: string;
}) {
  const almostDone = started && seconds <= 10;
  return (
    <div
      className={
        'rounded-xl border-2 px-4 py-3 shadow-sm ' +
        (almostDone ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-white')
      }
    >
      <div className="text-sm font-medium text-slate-600">Natitirang oras</div>
      <div className="mt-1 text-3xl font-bold tabular-nums text-slate-900">{formatClock(seconds)}</div>
      {!started && <div className="mt-0.5 text-sm text-slate-600">{waitingText}</div>}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  icon,
}: {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <header className="mb-8 flex items-start gap-4">
      {icon && (
        <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-800 sm:flex">
          {icon}
        </div>
      )}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-lg text-slate-700">{description}</p>}
      </div>
    </header>
  );
}

/** A numbered step, e.g. "① Pumili ng oras", so the order is obvious. */
export function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-700 text-lg font-bold text-white"
      >
        {number}
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="pt-1 text-lg font-bold text-slate-900">
          <span className="sr-only">Hakbang {number}: </span>
          {title}
        </h2>
        {children && <div className="mt-2">{children}</div>}
      </div>
    </div>
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
        className="mt-0.5 h-6 w-6 shrink-0 cursor-pointer accent-blue-700"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        <span className="block text-base font-semibold text-slate-900">{label}</span>
        {description && <span className="block text-sm text-slate-600">{description}</span>}
      </span>
    </label>
  );
}

type NoticeKind = 'info' | 'success' | 'warning';

const noticeClasses: Record<NoticeKind, string> = {
  info: 'border-blue-300 bg-blue-50 text-blue-950',
  success: 'border-green-400 bg-green-50 text-green-950',
  warning: 'border-amber-400 bg-amber-50 text-amber-950',
};

/** A colored message box. */
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
    <div role="status" className={`rounded-xl border-2 px-5 py-4 text-base ${noticeClasses[kind]} ${className}`}>
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
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  format?: (value: T) => string;
  disabled?: boolean;
}) {
  return (
    <fieldset disabled={disabled}>
      <legend className="mb-2 text-base font-semibold text-slate-800">{label}</legend>
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
                'min-h-[2.75rem] min-w-[3rem] rounded-lg border-2 px-4 py-2 text-base font-semibold transition-colors ' +
                'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-blue-600 ' +
                'disabled:cursor-not-allowed disabled:opacity-60 ' +
                (selected
                  ? 'border-blue-700 bg-blue-700 text-white'
                  : 'border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50')
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
