import { KphLevels, ResultSummary, SaveBanner, TargetRow } from '../../components/ResultPieces';
import { NumpadIcon } from '../../components/icons';
import { Button, HelpTip, Notice, PageHeader, Section, StatBadge } from '../../components/ui';
import { useHelp } from '../../lib/glossary';
import { useLang, useT } from '../../lib/i18n';
import { display } from '../../lib/scoring';
import type { Session, SessionMistake } from '../../lib/storage';
import { JOB_READY_NUMPAD } from '../../lib/targets';
import { formatClock } from '../../lib/useCountdown';

/** The list of wrong numpad entries (also used by the Assessment report). */
export function NumpadMistakesCard({ mistakes, nested = false }: { mistakes: SessionMistake[]; nested?: boolean }) {
  const t = useT();
  return (
    <Section title={`${t('Mga maling numero', 'Wrong numbers')} (${mistakes.length})`} small={nested}>
      {mistakes.length === 0 ? (
        <p className="text-lg text-stone-700">
          {t('Walang maling numero. Ang galing!', 'No wrong numbers. Great job!')}
        </p>
      ) : (
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-left text-base">
            <thead className="sticky top-0 bg-paper text-sm text-stone-600">
              <tr>
                <th className="py-2 pr-4 font-semibold">{t('Pang-ilan', 'No.')}</th>
                <th className="py-2 pr-4 font-semibold">{t('Dapat', 'Should be')}</th>
                <th className="py-2 font-semibold">{t('Na-type mo', 'You typed')}</th>
              </tr>
            </thead>
            <tbody className="font-mono text-lg tabular-nums">
              {mistakes.map((mistake, i) => (
                <tr key={i} className="border-t border-stone-200">
                  <td className="py-2 pr-4 font-sans text-base text-stone-600">#{mistake.index}</td>
                  <td className="py-2 pr-4 text-green-800">{mistake.expected}</td>
                  <td className="py-2 text-red-700">{mistake.typed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}

export default function NumpadResults({
  session,
  beginner,
  saved,
  finishedEarly,
  onToggleSaved,
  onRetry,
}: {
  session: Session;
  /** "Pang-baguhan" run: short numbers only, so hiring targets don't apply. */
  beginner: boolean;
  saved: boolean;
  finishedEarly: boolean;
  onToggleSaved: () => void;
  onRetry: () => void;
}) {
  const lang = useLang();
  const t = useT();
  const help = useHelp();
  const m = session.metrics;
  const target = JOB_READY_NUMPAD;
  const speed = display(m.kph);
  const acc = display(m.entryAccuracy);
  const ready = !beginner && speed >= target.kph && acc >= target.entryAccuracy;

  let message = t(
    `Ang target ay ${target.kph.toLocaleString()} KPH at ${target.entryAccuracy}% na tama. Tuloy lang ang practice!`,
    `The target is ${target.kph.toLocaleString()} KPH and ${target.entryAccuracy}% correct. Keep practicing!`,
  );
  if (ready)
    message = t(
      'Pasado ka sa karaniwang target. Subukan ang Assessment para makasigurado.',
      'You passed the usual target. Take the Assessment to be sure.',
    );
  if (beginner)
    message = t(
      'Magaling! Kapag komportable ka na sa mga key, subukan ang "Halo-halo". Iyon ang nasa Assessment.',
      'Well done! Once you are comfortable with the keys, try "Mixed". That is what the Assessment uses.',
    );

  return (
    <div>
      <PageHeader
        icon={<NumpadIcon className="h-8 w-8" />}
        title={t('Resulta ng Numpad Practice', 'Numpad Practice results')}
      />

      <ResultSummary
        ready={ready}
        headline={
          lang === 'en' ? (
            <>
              <strong>{m.correctEntries}</strong> of <strong>{m.entries}</strong> numbers correct, at a speed of{' '}
              <strong>{speed.toLocaleString()} KPH</strong>.
            </>
          ) : (
            <>
              <strong>{m.correctEntries}</strong> sa <strong>{m.entries}</strong> na numero ang tama, sa bilis na{' '}
              <strong>{speed.toLocaleString()} KPH</strong>.
            </>
          )
        }
        message={message}
      >
        <Button size="lg" onClick={onRetry} autoFocus>
          {t('Ulitin', 'Try again')}
        </Button>
      </ResultSummary>

      <SaveBanner saved={saved} finishedEarly={finishedEarly} onToggle={onToggleSaved} />

      <Section title={t('Mga detalye', 'Details')} className="mb-10">
        <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatBadge label={t('Bilis (KPH)', 'Speed (KPH)')} value={speed.toLocaleString()} help={help.kph} />
          <StatBadge label={t('Tamang numero', 'Correct numbers')} value={`${acc}%`} help={help.entryAccuracy} />
          <StatBadge
            label={t('Natapos na numero', 'Numbers done')}
            value={m.entries}
            hint={t(`${m.correctEntries} ang tama`, `${m.correctEntries} correct`)}
          />
          <StatBadge label={t('Tagal', 'Time')} value={formatClock(session.durationSec)} />
        </div>
      </Section>

      {beginner ? (
        <Notice kind="info" className="mb-10">
          {lang === 'en' ? (
            <>
              <strong>This was Beginner.</strong> It has short numbers only, so it is not compared with the hiring test
              target and does not count for &quot;Fastest numpad&quot; on Home.
            </>
          ) : (
            <>
              <strong>Pang-baguhan ito.</strong> Maiikling numero lang ang nandito, kaya hindi ito ikinukumpara sa
              target ng hiring test at hindi kasama sa &quot;Pinakamabilis na numpad&quot; sa Home.
            </>
          )}
        </Notice>
      ) : (
        <>
          <Section title={t('Target ng hiring test', 'Hiring test target')} className="mb-10">
            <ul>
              <TargetRow label={t('Bilis (KPH)', 'Speed (KPH)')} value={m.kph} target={target.kph} />
              <TargetRow
                label={t('Tamang numero', 'Correct numbers')}
                value={m.entryAccuracy}
                target={target.entryAccuracy}
                unit="%"
              />
            </ul>
          </Section>

          <Section title={t('Antas ng bilis mo (KPH)', 'Your speed level (KPH)')} className="mb-10">
            <KphLevels kph={m.kph} />
            <HelpTip label={t('Saan galing ang mga numerong ito?', 'Where do these numbers come from?')}>
              {help.kphLevels}
            </HelpTip>
          </Section>
        </>
      )}

      <NumpadMistakesCard mistakes={session.mistakes} />
    </div>
  );
}
