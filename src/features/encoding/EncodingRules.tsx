/**
 * The encoding rules. Two sizes:
 * - full (setup / break screens): a box with an example for each rule;
 * - compact (while encoding): one short line, so the document stays in view.
 */
import { HelpTip } from '../../components/ui';
import { HELP } from '../../lib/glossary';
import { ENCODING_RULES } from './rules';

export default function EncodingRules({ className = '', compact = false }: { className?: string; compact?: boolean }) {
  if (compact) {
    return (
      <p
        aria-label="Mga patakaran sa pag-encode"
        className={`flex shrink-0 flex-wrap items-center gap-x-5 gap-y-1 rounded-lg border border-belt-400 bg-belt-50 px-4 py-1.5 text-stone-900 ${className}`}
      >
        <span className="font-semibold">📏 Patakaran:</span>
        {ENCODING_RULES.map((r) => (
          <span key={r.what}>
            {r.what} → <strong className="font-mono">{r.short}</strong>
          </span>
        ))}
      </p>
    );
  }
  return (
    <section
      aria-label="Mga patakaran sa pag-encode"
      className={`rounded-xl border-2 border-belt-400 bg-belt-50 px-4 py-3 ${className}`}
    >
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4">
        <h2 className="text-lg font-bold text-stone-900">📏 Mga patakaran sa pag-encode</h2>
        <HelpTip label="Bakit may patakaran?">{HELP.encodingRules}</HelpTip>
      </div>
      <ul className="grid gap-2 md:grid-cols-3">
        {ENCODING_RULES.map((r) => (
          <li key={r.what} className="rounded-lg bg-white px-3 py-1.5">
            <div className="text-stone-900">
              <strong>{r.what}:</strong> {r.rule}
            </div>
            <div className="font-mono text-sm text-stone-700">{r.example}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}
