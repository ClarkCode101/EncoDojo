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
        className={`flex flex-wrap gap-x-6 gap-y-1 rounded-lg border border-belt-400 bg-belt-50 px-4 py-2 text-stone-900 ${className}`}
      >
        <span aria-hidden="true">📏</span>
        {ENCODING_RULES.map((r) => (
          <span key={r.what}>
            <strong>{r.what}:</strong> {r.rule}
          </span>
        ))}
      </p>
    );
  }
  return (
    <section
      aria-label="Mga patakaran sa pag-encode"
      className={`rounded-xl border-2 border-belt-400 bg-belt-50 px-5 py-4 ${className}`}
    >
      <h2 className="mb-2 text-lg font-bold text-stone-900">📏 Mga patakaran sa pag-encode</h2>
      <ul className="grid gap-2 md:grid-cols-3">
        {ENCODING_RULES.map((r) => (
          <li key={r.what} className="rounded-lg bg-white px-3 py-2">
            <div className="font-semibold text-stone-900">
              {r.what}: <span className="font-normal">{r.rule}</span>
            </div>
            <div className="font-mono text-sm text-stone-700">{r.example}</div>
          </li>
        ))}
      </ul>
      <HelpTip label="Bakit may patakaran?">{HELP.encodingRules}</HelpTip>
    </section>
  );
}
