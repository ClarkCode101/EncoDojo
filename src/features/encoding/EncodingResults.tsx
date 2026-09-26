import FieldMistakesCard from '../../components/entry/FieldMistakesCard';
import { SaveBanner, TargetRow } from '../../components/ResultPieces';
import { DocumentIcon } from '../../components/icons';
import { Button, Card, PageHeader, StatBadge } from '../../components/ui';
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
        description={`${docLabel} · ${m.sheet === 1 ? 'Spreadsheet (gaya ng Excel)' : 'Form (gaya ng hiring test)'}`}
      />

      <section
        aria-label="Buod ng resulta"
        className={
          'mb-6 rounded-2xl border-2 p-6 ' + (ready ? 'border-green-400 bg-green-50' : 'border-brand-200 bg-white')
        }
      >
        <p className="text-2xl leading-relaxed text-stone-900">
          <strong>{m.correctFields}</strong> sa <strong>{m.totalFields}</strong> na field ang eksaktong tama (
          {m.documents} dokumento), sa bilis na <strong>{speed.toLocaleString()} KPH</strong>.
        </p>
        <p className="mt-2 text-lg text-stone-700">
          {m.documents === 0
            ? m.sheet === 1
              ? 'Wala kang natapos na dokumento. Tandaan: sa dulo ng row, pindutin ang Enter.'
              : 'Wala kang naipasang dokumento. Tandaan: sa huling field, pindutin ang Enter o ang "Submit".'
            : ready
              ? '🎉 Pasado ka sa target! Subukan ang Assessment para makasigurado.'
              : `Ang target ay ${t.fieldAccuracy}% na tamang field at ${t.kph.toLocaleString()} KPH. Unahin ang tamang format ng petsa at halaga, saka ang bilis.`}
        </p>
        <div className="mt-5">
          <Button size="lg" onClick={onRetry} autoFocus>
            Ulitin
          </Button>
        </div>
      </section>

      <SaveBanner saved={saved} finishedEarly={finishedEarly} onToggle={onToggleSaved} />

      <h2 className="mb-3 text-xl font-bold text-stone-900">Mga detalye</h2>
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatBadge label="Tamang field" value={`${acc}%`} help={HELP.fieldAccuracy} />
        <StatBadge label="Bilis (KPH)" value={speed.toLocaleString()} help={HELP.encodingKph} />
        <StatBadge label="Natapos na dokumento" value={m.documents} hint={`${m.totalFields} field lahat`} />
        <StatBadge label="Tagal" value={formatClock(session.durationSec)} hint={`${m.typedChars} letra ang na-type`} />
      </div>

      <Card title="Target" className="mb-6">
        <ul className="space-y-2">
          <TargetRow label="Tamang field" value={m.fieldAccuracy} target={t.fieldAccuracy} unit="%" />
          <TargetRow label="Bilis (KPH)" value={m.kph} target={t.kph} />
        </ul>
      </Card>

      <FieldMistakesCard mistakes={session.mistakes} labels={ENCODING_FIELD_LABEL} unitLabel="Dokumento" />
    </div>
  );
}
