import { ResultSummary, SaveBanner, TargetRow } from '../../components/ResultPieces';
import { CopyIcon } from '../../components/icons';
import FieldMistakesCard from '../../components/entry/FieldMistakesCard';
import { Button, PageHeader, Section, StatBadge } from '../../components/ui';
import { useHelp } from '../../lib/glossary';
import { useLang, useT } from '../../lib/i18n';
import { display } from '../../lib/scoring';
import type { Session, SessionMistake } from '../../lib/storage';
import { JOB_READY_COPY } from '../../lib/targets';
import { formatClock } from '../../lib/useCountdown';
import { copyFieldLabels, copyModeLabel } from './records';
import { copyKphOf } from './scoreCopy';

/** The list of wrong fields (also used by the Assessment report). */
export function CopyMistakesCard({
  mistakes,
  title,
  nested,
}: {
  mistakes: SessionMistake[];
  title?: string;
  nested?: boolean;
}) {
  const lang = useLang();
  return (
    <FieldMistakesCard
      mistakes={mistakes}
      labels={copyFieldLabels(lang)}
      unitLabel="Record"
      title={title}
      nested={nested}
    />
  );
}

export default function CopyResults({
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
  const target = JOB_READY_COPY;
  const speed = copyKphOf(m);
  const shownSpeed = display(speed);
  const acc = display(m.fieldAccuracy);
  const ready = m.records > 0 && shownSpeed >= target.kph && acc >= target.fieldAccuracy;

  return (
    <div>
      <PageHeader
        icon={<CopyIcon className="h-8 w-8" />}
        title={t('Resulta ng Copy Test', 'Copy Test results')}
        description={copyModeLabel(m.sheet === 1 ? 'sheet' : 'form', t)}
      />

      <ResultSummary
        ready={ready}
        headline={
          lang === 'en' ? (
            <>
              <strong>{m.correctFields}</strong> of <strong>{m.totalFields}</strong> fields exactly right ({m.records}{' '}
              {m.records === 1 ? 'record' : 'records'}), at a speed of{' '}
              <strong>{shownSpeed.toLocaleString()} KPH</strong>.
            </>
          ) : (
            <>
              <strong>{m.correctFields}</strong> sa <strong>{m.totalFields}</strong> na field ang eksaktong tama (
              {m.records} record), sa bilis na <strong>{shownSpeed.toLocaleString()} KPH</strong>.
            </>
          )
        }
        message={
          m.records === 0
            ? t(
                'Wala kang naipasang record. Tandaan: sa huling field (ID No.), pindutin ang Enter o ang "Submit".',
                'You did not submit any record. Remember: on the last field (ID No.), press Enter or "Submit".',
              )
            : ready
              ? t(
                  'Pasado ka sa target. Subukan ang Assessment para makasigurado.',
                  'You passed the target. Take the Assessment to be sure.',
                )
              : t(
                  `Ang target ay ${target.fieldAccuracy}% na tamang field at ${target.kph.toLocaleString()} KPH. Unahin ang tamang pagkopya, saka ang bilis.`,
                  `The target is ${target.fieldAccuracy}% correct fields and ${target.kph.toLocaleString()} KPH. Copy correctly first, then get faster.`,
                )
        }
      >
        <Button size="lg" onClick={onRetry} autoFocus>
          {t('Ulitin', 'Try again')}
        </Button>
      </ResultSummary>

      <SaveBanner saved={saved} finishedEarly={finishedEarly} onToggle={onToggleSaved} />

      <Section title={t('Mga detalye', 'Details')} className="mb-10">
        <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          <StatBadge label={t('Tamang field', 'Correct fields')} value={`${acc}%`} help={help.fieldAccuracy} />
          <StatBadge label={t('Bilis (KPH)', 'Speed (KPH)')} value={shownSpeed.toLocaleString()} help={help.copyKph} />
          <StatBadge
            label={t('Natapos na record', 'Records done')}
            value={m.records}
            hint={t(`${m.totalFields} field lahat`, `${m.totalFields} fields in all`)}
          />
          <StatBadge
            label="Net WPM"
            value={display(m.netWpm)}
            hint={t('para maikumpara sa Typing', 'to compare with Typing')}
            help={help.copyWpm}
          />
          <StatBadge
            label={t('Tagal', 'Time')}
            value={formatClock(session.durationSec)}
            hint={t(`${m.typedChars} letra ang na-type`, `${m.typedChars} letters typed`)}
          />
        </div>
      </Section>

      <Section title="Target" className="mb-10">
        <ul>
          <TargetRow
            label={t('Tamang field', 'Correct fields')}
            value={m.fieldAccuracy}
            target={target.fieldAccuracy}
            unit="%"
          />
          <TargetRow label={t('Bilis (KPH)', 'Speed (KPH)')} value={speed} target={target.kph} />
        </ul>
      </Section>

      <CopyMistakesCard mistakes={session.mistakes} />
    </div>
  );
}
