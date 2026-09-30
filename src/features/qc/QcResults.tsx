import { ExpectedWithMarks } from '../../components/entry/FieldMistakesCard';
import { ResultSummary, SaveBanner, TargetRow } from '../../components/ResultPieces';
import { QcIcon } from '../../components/icons';
import { Button, PageHeader, Section, StatBadge } from '../../components/ui';
import { useHelp } from '../../lib/glossary';
import { useLang, useT } from '../../lib/i18n';
import { display } from '../../lib/scoring';
import type { Session, SessionMistake } from '../../lib/storage';
import { JOB_READY_QC } from '../../lib/targets';
import { formatClock } from '../../lib/useCountdown';
import { copyFieldLabels, type FieldKey } from '../copy/records';
import { isFalseAlarm } from './scoreQc';

/** The wrong decisions (also used by the Assessment report). */
export function QcMistakesCard({ mistakes, nested = false }: { mistakes: SessionMistake[]; nested?: boolean }) {
  const lang = useLang();
  const t = useT();
  const labels = copyFieldLabels(lang);
  const missed = mistakes.filter((m) => !isFalseAlarm(m)).length;
  const red = <span className="rounded bg-red-200 px-1 text-red-900">{t('pula', 'red')}</span>;
  return (
    <Section title={`${t('Mga maling check', 'Wrong checks')} (${mistakes.length})`} small={nested}>
      {mistakes.length === 0 ? (
        <p className="text-lg text-stone-700">{t('Walang maling check. Ang galing!', 'No wrong checks. Great job!')}</p>
      ) : (
        <>
          <p className="mb-3 text-sm text-stone-600">
            {missed > 0 &&
              (lang === 'en' ? (
                <>In the Original, the part that differs from the encoded one is {red}. </>
              ) : (
                <>Sa Original, {red} ang parteng iba sa na-encode. </>
              ))}
            {t(
              'Ang "Tama pero minarkahan" ay field na walang mali pero minarkahan mong may mali.',
              '"Correct but marked" is a field with no mistake that you marked as wrong.',
            )}
          </p>
          <div className="max-h-[28rem] overflow-y-auto">
            <table className="w-full text-left text-base">
              <thead className="sticky top-0 bg-paper text-sm text-stone-600">
                <tr>
                  <th className="py-2 pr-4 font-semibold">Record</th>
                  <th className="py-2 pr-4 font-semibold">Field</th>
                  <th className="py-2 pr-4 font-semibold">Original / Encoded</th>
                  <th className="py-2 font-semibold">{t('Ano ang nangyari', 'What happened')}</th>
                </tr>
              </thead>
              <tbody>
                {mistakes.map((m, i) => {
                  const falseAlarm = isFalseAlarm(m);
                  return (
                    <tr key={i} className="border-t border-stone-200 align-top">
                      <td className="py-2 pr-4 text-stone-600">#{m.index}</td>
                      <td className="py-2 pr-4 font-medium text-stone-800">{labels[m.field as FieldKey] ?? m.field}</td>
                      <td className="py-2 pr-4">
                        {falseAlarm ? (
                          <div className="font-mono text-stone-900">{m.expected}</div>
                        ) : (
                          <>
                            <div className="text-green-900">
                              <ExpectedWithMarks expected={m.expected} typed={m.typed} />
                            </div>
                            <div className="font-mono text-red-700">{m.typed}</div>
                          </>
                        )}
                      </td>
                      <td className={'py-2 font-semibold ' + (falseAlarm ? 'text-amber-800' : 'text-red-700')}>
                        {falseAlarm
                          ? t('Tama pero minarkahan', 'Correct but marked')
                          : t('Hindi napansin ang mali', 'Mistake missed')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Section>
  );
}

export default function QcResults({
  session,
  saved,
  finishedEarly,
  onToggleSaved,
  onRetry,
}: {
  session: Session;
  saved: boolean;
  finishedEarly: boolean;
  onToggleSaved: () => void;
  onRetry: () => void;
}) {
  const lang = useLang();
  const t = useT();
  const help = useHelp();
  const m = session.metrics;
  const target = JOB_READY_QC;
  const acc = display(m.decisionAccuracy);
  const speed = display(m.perMinute);
  const ready = m.records > 0 && acc >= target.decisionAccuracy && speed >= target.perMinute;

  let message = t(
    `Ang target ay ${target.decisionAccuracy}% na tamang check at ${target.perMinute} record bawat minuto. Unahin ang maingat na paghahambing, saka ang bilis.`,
    `The target is ${target.decisionAccuracy}% correct checks and ${target.perMinute} records per minute. Compare carefully first, then get faster.`,
  );
  if (m.records === 0)
    message = t(
      'Wala kang naipasang record. Tandaan: pindutin ang Enter o ang "Submit" pagkatapos mag-check.',
      'You did not submit any record. Remember: press Enter or "Submit" after checking.',
    );
  else if (ready)
    message = t(
      'Pasado ka sa target. Subukan ang Assessment para makasigurado.',
      'You passed the target. Take the Assessment to be sure.',
    );
  else if (m.missed > m.falseAlarms)
    message = t(
      `May ${m.missed} mali na hindi mo napansin. Basahin ang bawat letra at digit, lalo na ang tuldok at numero.`,
      `You missed ${m.missed} mistake${m.missed === 1 ? '' : 's'}. Read every letter and digit, especially periods and numbers.`,
    );

  return (
    <div>
      <PageHeader icon={<QcIcon className="h-8 w-8" />} title={t('Resulta ng QC Check', 'QC Check results')} />

      <ResultSummary
        ready={ready}
        headline={
          lang === 'en' ? (
            <>
              You checked <strong>{m.correctRecords}</strong> of <strong>{m.records}</strong> records right, and caught{' '}
              <strong>{m.caught}</strong> of <strong>{m.errorsTotal}</strong> mistakes.
            </>
          ) : (
            <>
              <strong>{m.correctRecords}</strong> sa <strong>{m.records}</strong> na record ang tama ang check mo, at
              nahuli mo ang <strong>{m.caught}</strong> sa <strong>{m.errorsTotal}</strong> na mali.
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
        <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-5">
          <StatBadge label={t('Tamang check', 'Correct checks')} value={`${acc}%`} help={help.qcAccuracy} />
          <StatBadge
            label={t('Bilis (bawat minuto)', 'Speed (per minute)')}
            value={speed}
            hint={t('record', 'records')}
            help={help.qcSpeed}
          />
          <StatBadge
            label={t('Hindi napansin', 'Missed')}
            value={m.missed}
            hint={t(`sa ${m.errorsTotal} na mali`, `of ${m.errorsTotal} mistakes`)}
          />
          <StatBadge label={t('Tama pero minarkahan', 'Correct but marked')} value={m.falseAlarms} />
          <StatBadge
            label={t('Tagal', 'Time')}
            value={formatClock(session.durationSec)}
            hint={t(`${m.records} record`, `${m.records} records`)}
          />
        </div>
      </Section>

      <Section title="Target" className="mb-10">
        <ul>
          <TargetRow
            label={t('Tamang check', 'Correct checks')}
            value={m.decisionAccuracy}
            target={target.decisionAccuracy}
            unit="%"
          />
          <TargetRow
            label={t('Bilis (bawat minuto)', 'Speed (per minute)')}
            value={m.perMinute}
            target={target.perMinute}
          />
        </ul>
      </Section>

      <QcMistakesCard mistakes={session.mistakes} />
    </div>
  );
}
