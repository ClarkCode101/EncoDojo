import { ResultSummary, SaveBanner, TargetRow } from '../../components/ResultPieces';
import { KeyboardIcon } from '../../components/icons';
import { Button, PageHeader, Section, StatBadge } from '../../components/ui';
import { useHelp } from '../../lib/glossary';
import { type T, useT } from '../../lib/i18n';
import { display } from '../../lib/scoring';
import type { Session, SessionMistake } from '../../lib/storage';
import { JOB_READY_TYPING } from '../../lib/targets';
import { formatClock } from '../../lib/useCountdown';
import { mistakeKind } from '../../lib/alignTyping';
import type { TypingComparison } from './compare';

/** e.g. "↑3 kumpara sa huli, best: 45" or "Bagong personal best! (dati: 42)". */
function comparisonText(netWpm: number, comparison: TypingComparison, t: T): string {
  const { previousNetWpm, bestNetWpm } = comparison;
  if (previousNetWpm === null || bestNetWpm === null)
    return t('Una mong na-save na practice', 'Your first saved practice');

  const now = display(netWpm);
  const best = display(bestNetWpm);
  if (now > best) return t(`Bagong personal best! (dati: ${best})`, `New personal best! (before: ${best})`);

  const diff = now - display(previousNetWpm);
  const vsLast =
    diff > 0
      ? t(`↑${diff} kumpara sa huli`, `↑${diff} vs. last time`)
      : diff < 0
        ? t(`↓${-diff} kumpara sa huli`, `↓${-diff} vs. last time`)
        : t('Pareho sa huli', 'Same as last time');
  return `${vsLast}, best: ${best}`;
}

/** Mistake kinds for the table (Taglish, English). */
const KIND_LABEL: Record<ReturnType<typeof mistakeKind>, [string, string]> = {
  'Wrong key': ['Maling letra', 'Wrong letter'],
  'Extra key': ['Sobrang letra', 'Extra letter'],
  Skipped: ['Nalaktawan', 'Skipped'],
};

/** Make spaces visible in the mistakes table. */
function showChar(char: string): string {
  return char === ' ' ? '␣ (space)' : char;
}

/** The list of typing mistakes (also used by the Assessment report). */
export function TypingMistakesCard({
  mistakes,
  errors,
  nested = false,
}: {
  mistakes: SessionMistake[];
  errors: number;
  /** Inside another section (the Assessment report): lighter heading. */
  nested?: boolean;
}) {
  const t = useT();
  return (
    <Section title={`${t('Mga mali sa typing', 'Typing mistakes')} (${errors})`} small={nested}>
      {mistakes.length === 0 ? (
        <p className="text-lg text-stone-700">{t('Walang mali. Ang galing!', 'No mistakes. Great job!')}</p>
      ) : (
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-left text-base">
            <thead className="sticky top-0 bg-paper text-sm text-stone-600">
              <tr>
                <th className="py-2 pr-4 font-semibold">{t('Puwesto', 'Position')}</th>
                <th className="py-2 pr-4 font-semibold">{t('Uri ng mali', 'Kind of mistake')}</th>
                <th className="py-2 pr-4 font-semibold">{t('Dapat', 'Should be')}</th>
                <th className="py-2 font-semibold">{t('Na-type mo', 'You typed')}</th>
              </tr>
            </thead>
            <tbody>
              {mistakes.map((mistake, i) => (
                <tr key={i} className="border-t border-stone-200">
                  <td className="py-2 pr-4 text-stone-600">{mistake.index + 1}</td>
                  <td className="py-2 pr-4 text-stone-800">{t(...KIND_LABEL[mistakeKind(mistake)])}</td>
                  <td className="py-2 pr-4 font-mono text-lg text-green-800">{showChar(mistake.expected) || '—'}</td>
                  <td className="py-2 font-mono text-lg text-red-700">{showChar(mistake.typed) || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {errors > mistakes.length && (
            <p className="mt-2 text-sm text-stone-600">
              {t(`Ipinapakita ang unang ${mistakes.length} na mali.`, `Showing the first ${mistakes.length} mistakes.`)}
            </p>
          )}
        </div>
      )}
    </Section>
  );
}

export default function TypingResults({
  session,
  comparison,
  saved,
  finishedEarly,
  onToggleSaved,
  onRetrySame,
  onNewPassage,
}: {
  session: Session;
  comparison: TypingComparison;
  saved: boolean;
  finishedEarly: boolean;
  onToggleSaved: () => void;
  onRetrySame: () => void;
  onNewPassage: () => void;
}) {
  const t = useT();
  const help = useHelp();
  const m = session.metrics;
  const target = JOB_READY_TYPING;
  const net = display(m.netWpm);
  const acc = display(m.accuracy);
  const ready = net >= target.netWpm && acc >= target.accuracy;

  return (
    <div>
      <PageHeader
        icon={<KeyboardIcon className="h-8 w-8" />}
        title={t('Resulta ng Typing Practice', 'Typing Practice results')}
      />

      <ResultSummary
        ready={ready}
        headline={
          <>
            {t('Ang bilis mo ay', 'Your speed is')} <strong>{net} WPM</strong> {t('at', 'and')} <strong>{acc}%</strong>{' '}
            {t('ang tama.', 'is correct.')}
          </>
        }
        message={
          ready
            ? t(
                'Pasado ka sa karaniwang target ng hiring test. Subukan ang Assessment para makasigurado.',
                'You passed the usual hiring test target. Take the Assessment to be sure.',
              )
            : t(
                `Ang target ay ${target.netWpm} WPM at ${target.accuracy}% na tama. Tuloy lang ang practice.`,
                `The target is ${target.netWpm} WPM and ${target.accuracy}% correct. Keep practicing.`,
              )
        }
      >
        <Button size="lg" onClick={onNewPassage} autoFocus>
          {t('Ulitin (ibang text)', 'Try again (new text)')}
        </Button>
        <Button size="lg" variant="secondary" onClick={onRetrySame}>
          {t('Ulitin ang parehong text', 'Try the same text again')}
        </Button>
      </ResultSummary>

      <SaveBanner saved={saved} finishedEarly={finishedEarly} onToggle={onToggleSaved} />

      <Section title={t('Mga detalye', 'Details')} className="mb-10">
        <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          <StatBadge
            label={t('Bilis (Net WPM)', 'Speed (Net WPM)')}
            value={net}
            hint={comparisonText(m.netWpm, comparison, t)}
            help={help.netWpm}
          />
          <StatBadge label={t('Accuracy (tama)', 'Accuracy')} value={`${acc}%`} help={help.accuracy} />
          <StatBadge
            label="Keystroke accuracy"
            value={`${display(m.keystrokeAccuracy)}%`}
            hint={t('kasama ang mga binura mo', 'counts what you erased')}
            help={help.keystrokeAccuracy}
          />
          <StatBadge
            label="Gross WPM"
            value={display(m.grossWpm)}
            hint={t('bilis kasama ang mali', 'speed with the mistakes')}
            help={help.grossWpm}
          />
          <StatBadge
            label={t('Tagal', 'Time')}
            value={formatClock(session.durationSec)}
            hint={t(`${m.typedChars} letra ang na-type`, `${m.typedChars} letters typed`)}
          />
        </div>
      </Section>

      <Section title={t('Target ng hiring test', 'Hiring test target')} className="mb-10">
        <ul>
          <TargetRow label={t('Bilis (Net WPM)', 'Speed (Net WPM)')} value={m.netWpm} target={target.netWpm} />
          <TargetRow label={t('Accuracy (tama)', 'Accuracy')} value={m.accuracy} target={target.accuracy} unit="%" />
        </ul>
      </Section>

      <TypingMistakesCard mistakes={session.mistakes} errors={m.errors} />
    </div>
  );
}
