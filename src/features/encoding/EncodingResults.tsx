import FieldMistakesCard from '../../components/entry/FieldMistakesCard';
import { ResultSummary, SaveBanner, TargetRow } from '../../components/ResultPieces';
import { DocumentIcon } from '../../components/icons';
import { Button, PageHeader, Section, StatBadge } from '../../components/ui';
import { useHelp } from '../../lib/glossary';
import { useLang, useT } from '../../lib/i18n';
import { display } from '../../lib/scoring';
import type { Session } from '../../lib/storage';
import { JOB_READY_ENCODING } from '../../lib/targets';
import { formatClock } from '../../lib/useCountdown';
import { copyModeLabel } from '../copy/records';
import { DOC_INFO, encodingFieldLabels } from './documents';
import { docTypeFromCode } from './scoreEncoding';

export default function EncodingResults({
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
  const target = JOB_READY_ENCODING;
  const speed = display(m.kph);
  const acc = display(m.fieldAccuracy);
  const ready = m.documents > 0 && speed >= target.kph && acc >= target.fieldAccuracy;
  const docType = docTypeFromCode(m.docType);
  const docLabel = docType ? DOC_INFO[docType].label : t('Halo-halong dokumento', 'Mixed documents');

  return (
    <div>
      <PageHeader
        icon={<DocumentIcon className="h-8 w-8" />}
        title={t('Resulta ng Document Encoding', 'Document Encoding results')}
        description={`${docLabel}, ${copyModeLabel(m.sheet === 1 ? 'sheet' : 'form', t)}`}
      />

      <ResultSummary
        ready={ready}
        headline={
          lang === 'en' ? (
            <>
              <strong>{m.correctFields}</strong> of <strong>{m.totalFields}</strong> fields exactly right ({m.documents}{' '}
              {m.documents === 1 ? 'document' : 'documents'}), at a speed of{' '}
              <strong>{speed.toLocaleString()} KPH</strong>.
            </>
          ) : (
            <>
              <strong>{m.correctFields}</strong> sa <strong>{m.totalFields}</strong> na field ang eksaktong tama (
              {m.documents} dokumento), sa bilis na <strong>{speed.toLocaleString()} KPH</strong>.
            </>
          )
        }
        message={
          m.documents === 0
            ? m.sheet === 1
              ? t(
                  'Wala kang natapos na dokumento. Tandaan: sa dulo ng row, pindutin ang Enter.',
                  'You did not finish any document. Remember: at the end of the row, press Enter.',
                )
              : t(
                  'Wala kang naipasang dokumento. Tandaan: sa huling field, pindutin ang Enter o ang "Submit".',
                  'You did not submit any document. Remember: on the last field, press Enter or "Submit".',
                )
            : ready
              ? t(
                  'Pasado ka sa target. Subukan ang Assessment para makasigurado.',
                  'You passed the target. Take the Assessment to be sure.',
                )
              : t(
                  `Ang target ay ${target.fieldAccuracy}% na tamang field at ${target.kph.toLocaleString()} KPH. Unahin ang tamang format ng petsa at halaga, saka ang bilis.`,
                  `The target is ${target.fieldAccuracy}% correct fields and ${target.kph.toLocaleString()} KPH. Get the date and amount formats right first, then get faster.`,
                )
        }
      >
        <Button size="lg" onClick={onRetry} autoFocus>
          {t('Ulitin', 'Try again')}
        </Button>
      </ResultSummary>

      <SaveBanner saved={saved} finishedEarly={finishedEarly} onToggle={onToggleSaved} />

      <Section title={t('Mga detalye', 'Details')} className="mb-10">
        <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatBadge label={t('Tamang field', 'Correct fields')} value={`${acc}%`} help={help.fieldAccuracy} />
          <StatBadge label={t('Bilis (KPH)', 'Speed (KPH)')} value={speed.toLocaleString()} help={help.encodingKph} />
          <StatBadge
            label={t('Natapos na dokumento', 'Documents done')}
            value={m.documents}
            hint={t(`${m.totalFields} field lahat`, `${m.totalFields} fields in all`)}
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
          <TargetRow label={t('Bilis (KPH)', 'Speed (KPH)')} value={m.kph} target={target.kph} />
        </ul>
      </Section>

      <FieldMistakesCard
        mistakes={session.mistakes}
        labels={encodingFieldLabels(lang)}
        unitLabel={t('Dokumento', 'Document')}
      />
    </div>
  );
}
