import FieldMistakesCard from '../../components/entry/FieldMistakesCard';
import { ResultSummary, SaveBanner, TargetRow } from '../../components/ResultPieces';
import { DocumentIcon } from '../../components/icons';
import { Button, PageHeader, Section, StatBadge } from '../../components/ui';
import { HELP } from '../../lib/glossary';
import { display } from '../../lib/scoring';
import type { Session } from '../../lib/storage';
import { JOB_READY_ENCODING } from '../../lib/targets';
import { formatClock } from '../../lib/useCountdown';
import { DOC_INFO, ENCODING_FIELD_LABEL } from './documents';
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
  const m = session.metrics;
  const t = JOB_READY_ENCODING;
  const speed = display(m.kph);
  const acc = display(m.fieldAccuracy);
  const ready = m.documents > 0 && speed >= t.kph && acc >= t.fieldAccuracy;
  const docType = docTypeFromCode(m.docType);
  const docLabel = docType ? DOC_INFO[docType].label : 'Halo-halong dokumento';

  return (
    <div>
      <PageHeader
        icon={<DocumentIcon className="h-8 w-8" />}
        title="Resulta ng Document Encoding"
        description={`${docLabel}, ${m.sheet === 1 ? 'Spreadsheet (gaya ng Excel)' : 'Form (gaya ng hiring test)'}`}
      />

      <ResultSummary
        ready={ready}
        headline={
          <>
            <strong>{m.correctFields}</strong> sa <strong>{m.totalFields}</strong> na field ang eksaktong tama (
            {m.documents} dokumento), sa bilis na <strong>{speed.toLocaleString()} KPH</strong>.
          </>
        }
        message={
          m.documents === 0
            ? m.sheet === 1
              ? 'Wala kang natapos na dokumento. Tandaan: sa dulo ng row, pindutin ang Enter.'
              : 'Wala kang naipasang dokumento. Tandaan: sa huling field, pindutin ang Enter o ang "Submit".'
            : ready
              ? 'Pasado ka sa target. Subukan ang Assessment para makasigurado.'
              : `Ang target ay ${t.fieldAccuracy}% na tamang field at ${t.kph.toLocaleString()} KPH. Unahin ang tamang format ng petsa at halaga, saka ang bilis.`
        }
      >
        <Button size="lg" onClick={onRetry} autoFocus>
          Ulitin
        </Button>
      </ResultSummary>

      <SaveBanner saved={saved} finishedEarly={finishedEarly} onToggle={onToggleSaved} />

      <Section title="Mga detalye" className="mb-10">
        <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatBadge label="Tamang field" value={`${acc}%`} help={HELP.fieldAccuracy} />
          <StatBadge label="Bilis (KPH)" value={speed.toLocaleString()} help={HELP.encodingKph} />
          <StatBadge label="Natapos na dokumento" value={m.documents} hint={`${m.totalFields} field lahat`} />
          <StatBadge
            label="Tagal"
            value={formatClock(session.durationSec)}
            hint={`${m.typedChars} letra ang na-type`}
          />
        </div>
      </Section>

      <Section title="Target" className="mb-10">
        <ul>
          <TargetRow label="Tamang field" value={m.fieldAccuracy} target={t.fieldAccuracy} unit="%" />
          <TargetRow label="Bilis (KPH)" value={m.kph} target={t.kph} />
        </ul>
      </Section>

      <FieldMistakesCard mistakes={session.mistakes} labels={ENCODING_FIELD_LABEL} unitLabel="Dokumento" />
    </div>
  );
}
