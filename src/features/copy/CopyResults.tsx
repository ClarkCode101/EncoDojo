import { SaveBanner, TargetRow } from '../../components/ResultPieces';
import { CopyIcon } from '../../components/icons';
import FieldMistakesCard from '../../components/entry/FieldMistakesCard';
import { Button, Card, PageHeader, StatBadge } from '../../components/ui';
import { HELP } from '../../lib/glossary';
import { display } from '../../lib/scoring';
import type { Session, SessionMistake } from '../../lib/storage';
import { JOB_READY_COPY } from '../../lib/targets';
import { formatClock } from '../../lib/useCountdown';
import { FIELD_LABEL } from './records';
import { copyKphOf } from './scoreCopy';

/** The list of wrong fields (also used by the Assessment report). */
export function CopyMistakesCard({ mistakes, title }: { mistakes: SessionMistake[]; title?: string }) {
  return <FieldMistakesCard mistakes={mistakes} labels={FIELD_LABEL} unitLabel="Record" title={title} />;
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

      <section
        aria-label="Buod ng resulta"
        className={
          'mb-6 rounded-2xl border-2 p-6 ' + (ready ? 'border-green-400 bg-green-50' : 'border-brand-200 bg-white')
        }
      >
        <p className="text-2xl leading-relaxed text-stone-900">
          <strong>{m.correctFields}</strong> sa <strong>{m.totalFields}</strong> na field ang eksaktong tama (
          {m.records} record), sa bilis na <strong>{shownSpeed.toLocaleString()} KPH</strong>.
        </p>
        <p className="mt-2 text-lg text-stone-700">
          {m.records === 0
            ? 'Wala kang naipasang record. Tandaan: sa huling field (ID No.), pindutin ang Enter o ang "Submit".'
            : ready
              ? '🎉 Pasado ka sa target! Subukan ang Assessment para makasigurado.'
              : `Ang target ay ${t.fieldAccuracy}% na tamang field at ${t.kph.toLocaleString()} KPH. Unahin ang tamang pagkopya, saka ang bilis.`}
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
        <StatBadge label="Bilis (KPH)" value={shownSpeed.toLocaleString()} help={HELP.copyKph} />
        <StatBadge label="Natapos na record" value={m.records} hint={`${m.totalFields} field lahat`} />
        <StatBadge label="Net WPM" value={display(m.netWpm)} hint="para maikumpara sa Typing" help={HELP.copyWpm} />
        <StatBadge label="Tagal" value={formatClock(session.durationSec)} hint={`${m.typedChars} letra ang na-type`} />
      </div>

      <Card title="Target" className="mb-6">
        <ul className="space-y-2">
          <TargetRow label="Tamang field" value={m.fieldAccuracy} target={t.fieldAccuracy} unit="%" />
          <TargetRow label="Bilis (KPH)" value={speed} target={t.kph} />
        </ul>
      </Card>

      <CopyMistakesCard mistakes={session.mistakes} />
    </div>
  );
}
