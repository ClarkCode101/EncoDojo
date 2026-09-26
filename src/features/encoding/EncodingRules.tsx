/** The encoding rules, always visible while encoding (practice and Assessment). */
import { HelpTip } from '../../components/ui';
import { HELP } from '../../lib/glossary';
import { ENCODING_RULES } from './rules';

export default function EncodingRules({ className = '' }: { className?: string }) {
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
