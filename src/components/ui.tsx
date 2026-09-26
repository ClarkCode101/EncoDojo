/**
 * Small shared UI pieces. Kept in one file because each is only a few lines.
 */
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';

type Variant = 'primary' | 'secondary' | 'danger';

const variantClasses: Record<Variant, string> = {
  primary: 'bg-blue-700 text-white hover:bg-blue-800 disabled:bg-blue-300',
  secondary:
    'bg-white text-slate-800 border border-slate-300 hover:bg-slate-100 disabled:text-slate-400',
  danger: 'bg-red-700 text-white hover:bg-red-800 disabled:bg-red-300',
};

const baseButton =
  'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ' +
  'focus-visible:outline-blue-600 disabled:cursor-not-allowed';

export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button type={type} className={`${baseButton} ${variantClasses[variant]} ${className}`} {...props} />
  );
}

/** A link that looks like a Button. */
export function ButtonLink({
  to,
  variant = 'primary',
  children,
}: {
  to: string;
  variant?: Variant;
  children: ReactNode;
}) {
  return (
    <Link to={to} className={`${baseButton} ${variantClasses[variant]}`}>
      {children}
    </Link>
  );
}

export function Card({
  title,
  children,
  className = '',
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      {title && <h2 className="mb-3 text-base font-semibold text-slate-800">{title}</h2>}
      {children}
    </section>
  );
}

/** A label + big number, e.g. "Net WPM  42". */
export function StatBadge({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-600">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-slate-600">{hint}</div>}
    </div>
  );
}

export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      {description && <p className="mt-1 text-slate-600">{description}</p>}
    </header>
  );
}

/** Row of buttons to choose one option, e.g. 1 / 3 / 5 minutes. */
export function SegmentedPicker<T extends string | number>({
  label,
  options,
  value,
  onChange,
  format = String,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  format?: (value: T) => string;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-slate-700">{label}</legend>
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
                'rounded-md border px-4 py-2 text-sm font-semibold focus-visible:outline ' +
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ' +
                (selected
                  ? 'border-blue-700 bg-blue-700 text-white'
                  : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100')
              }
            >
              {format(option)}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
