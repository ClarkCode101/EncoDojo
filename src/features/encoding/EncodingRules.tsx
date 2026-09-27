/**
 * The encoding rules, with an example for each (setup and break screens).
 * While encoding, the formats show in the sheet headers / form placeholders instead.
 */
import { HelpTip } from '../../components/ui';
import { HELP } from '../../lib/glossary';
import { ENCODING_RULES } from './rules';

export default function EncodingRules({ className = '' }: { className?: string }) {
  return (
    <section
      aria-label="Mga patakaran sa pag-encode"
      className={`rounded-r-lg border-l-4 border-belt-400 bg-belt-50 px-4 py-3 ${className}`}
    >
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4">
        <h2 className="text-lg font-bold text-stone-900">Mga patakaran sa pag-encode</h2>
        <HelpTip label="Bakit may patakaran?">{HELP.encodingRules}</HelpTip>
      </div>
      {/* Three columns split by thin lines, like a ruled page (no box per rule). */}
      <ul className="grid gap-y-2 md:grid-cols-3 md:divide-x md:divide-belt-300">
        {ENCODING_RULES.map((r) => (
          <li key={r.what} className="md:px-4 md:first:pl-0">
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
