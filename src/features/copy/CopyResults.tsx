import { ResultSummary, SaveBanner, TargetRow } from '../../components/ResultPieces';
import { CopyIcon } from '../../components/icons';
import FieldMistakesCard from '../../components/entry/FieldMistakesCard';
import { Button, PageHeader, Section, StatBadge } from '../../components/ui';
import { HELP } from '../../lib/glossary';
import { display } from '../../lib/scoring';
import type { Session, SessionMistake } from '../../lib/storage';
import { JOB_READY_COPY } from '../../lib/targets';
import { formatClock } from '../../lib/useCountdown';
import { FIELD_LABEL } from './records';
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
  return <FieldMistakesCard mistakes={mistakes} labels={FIELD_LABEL} unitLabel="Record" title={title} nested={nested} />;
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
  const m = session.metrics;
  const t = JOB_READY_COPY;
  const speed = copyKphOf(m);
  const shownSpeed = display(speed);
  const acc = display(m.fieldAccuracy);
  const ready = m.records > 0 && shownSpeed >= t.kph && acc >= t.fieldAccuracy;

  return (
    <div>
      <PageHeader
        icon={<CopyIcon className="h-8 w-8" />}
        title="Resulta ng Copy Test"
        description={m.sheet === 1 ? 'Spreadsheet (gaya ng Excel)' : 'Form (gaya ng hiring test)'}
      />

      <ResultSummary
        ready={ready}
        headline={
          <>
            <strong>{m.correctFields}</strong> sa <strong>{m.totalFields}</strong> na field ang eksaktong tama (
            {m.records} record), sa bilis na <strong>{shownSpeed.toLocaleString()} KPH</strong>.
          </>
        }
        message={
          m.records === 0
            ? 'Wala kang naipasang record. Tandaan: sa huling field (ID No.), pindutin ang Enter o ang "Submit".'
            : ready
              ? 'Pasado ka sa target. Subukan ang Assessment para makasigurado.'
              : `Ang target ay ${t.fieldAccuracy}% na tamang field at ${t.kph.toLocaleString()} KPH. Unahin ang tamang pagkopya, saka ang bilis.`
        }
      >
        <Button size="lg" onClick={onRetry} autoFocus>
          Ulitin
        </Button>
      </ResultSummary>

      <SaveBanner saved={saved} finishedEarly={finishedEarly} onToggle={onToggleSaved} />

      <Section title="Mga detalye" className="mb-10">
        <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          <StatBadge label="Tamang field" value={`${acc}%`} help={HELP.fieldAccuracy} />
          <StatBadge label="Bilis (KPH)" value={shownSpeed.toLocaleString()} help={HELP.copyKph} />
          <StatBadge label="Natapos na record" value={m.records} hint={`${m.totalFields} field lahat`} />
          <StatBadge label="Net WPM" value={display(m.netWpm)} hint="para maikumpara sa Typing" help={HELP.copyWpm} />
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
          <TargetRow label="Bilis (KPH)" value={speed} target={t.kph} />
        </ul>
      </Section>

      <CopyMistakesCard mistakes={session.mistakes} />
    </div>
  );
}
