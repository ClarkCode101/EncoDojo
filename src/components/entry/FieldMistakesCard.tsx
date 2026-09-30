/**
 * The list of wrong fields after a Copy Test or Document Encoding run, with
 * the exact wrong / missing characters highlighted.
 */
import { alignTyping } from '../../lib/alignTyping';
import { useLang, useT } from '../../lib/i18n';
import type { SessionMistake } from '../../lib/storage';
import { Section } from '../ui';

/**
 * The correct value, with the characters the user got wrong highlighted:
 * red = wrong character, crossed out = left out.
 */
export function ExpectedWithMarks({ expected, typed }: { expected: string; typed: string }) {
  const a = alignTyping(expected, typed);
  return (
    <span className="font-mono">
      {Array.from(expected).map((char, i) => {
        const status = i < a.cursor ? a.statuses[i] : 'skipped';
        const cls =
          status === 'correct'
            ? ''
            : status === 'wrong'
              ? 'rounded bg-red-200 text-red-900'
              : 'rounded bg-red-100 text-red-800 line-through';
        return (
          <span key={i} className={cls}>
            {char}
          </span>
        );
      })}
    </span>
  );
}

export default function FieldMistakesCard({
  mistakes,
  labels,
  unitLabel,
  title,
  nested = false,
}: {
  mistakes: SessionMistake[];
  /** field key -> display name, e.g. { date: "Date (Petsa)" } */
  labels: Record<string, string>;
  /** Column header for the item number, e.g. "Record" or "Dokumento". */
  unitLabel: string;
  /** Section title; the count is added after it. */
  title?: string;
  /** Inside another section (the Assessment report): lighter heading. */
  nested?: boolean;
}) {
  const lang = useLang();
  const t = useT();
  const red = <span className="rounded bg-red-200 px-1 text-red-900">{t('pula', 'red')}</span>;
  const crossed = (
    <span className="rounded bg-red-100 px-1 text-red-800 line-through">{t('naka-guhit', 'crossed out')}</span>
  );
  return (
    <Section title={`${title ?? t('Mga maling field', 'Wrong fields')} (${mistakes.length})`} small={nested}>
      {mistakes.length === 0 ? (
        <p className="text-lg text-stone-700">{t('Walang maling field. Ang galing!', 'No wrong fields. Great job!')}</p>
      ) : (
        <>
          <p className="mb-3 text-sm text-stone-600">
            {lang === 'en' ? (
              <>
                In &quot;Should be&quot;, wrong letters are {red} and left-out letters are {crossed}.
              </>
            ) : (
              <>
                Sa &quot;Dapat&quot;, {red} ang maling letra at {crossed} ang nakalimutan.
              </>
            )}
          </p>
          <div className="max-h-[28rem] overflow-y-auto">
            <table className="w-full text-left text-base">
              <thead className="sticky top-0 bg-paper text-sm text-stone-600">
                <tr>
                  <th className="py-2 pr-4 font-semibold">{unitLabel}</th>
                  <th className="py-2 pr-4 font-semibold">Field</th>
                  <th className="py-2 font-semibold">{t('Dapat / Na-type mo', 'Should be / You typed')}</th>
                </tr>
              </thead>
              <tbody>
                {mistakes.map((m, i) => (
                  <tr key={i} className="border-t border-stone-200 align-top">
                    <td className="py-2 pr-4 text-stone-600">#{m.index}</td>
                    <td className="py-2 pr-4 font-medium text-stone-800">{labels[m.field ?? ''] ?? m.field}</td>
                    <td className="py-2">
                      <div className="text-green-900">
                        <ExpectedWithMarks expected={m.expected} typed={m.typed} />
                      </div>
                      <div className="font-mono text-red-700">
                        {m.typed || t('(walang na-type)', '(nothing typed)')}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Section>
  );
}
