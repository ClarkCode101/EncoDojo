import { ExpectedWithMarks } from '../../components/entry/FieldMistakesCard';
import { ResultSummary, SaveBanner, TargetRow } from '../../components/ResultPieces';
import { QcIcon } from '../../components/icons';
import { Button, PageHeader, Section, StatBadge } from '../../components/ui';
import { HELP } from '../../lib/glossary';
import { display } from '../../lib/scoring';
import type { Session, SessionMistake } from '../../lib/storage';
import { JOB_READY_QC } from '../../lib/targets';
import { formatClock } from '../../lib/useCountdown';
import { FIELD_LABEL, type FieldKey } from '../copy/records';
import { isFalseAlarm } from './scoreQc';

/** The wrong decisions (also used by the Assessment report). */
export function QcMistakesCard({ mistakes, nested = false }: { mistakes: SessionMistake[]; nested?: boolean }) {
  const missed = mistakes.filter((m) => !isFalseAlarm(m)).length;
  return (
    <Section title={`Mga maling check (${mistakes.length})`} small={nested}>
      {mistakes.length === 0 ? (
        <p className="text-lg text-stone-700">Walang maling check. Ang galing!</p>
      ) : (
        <>
          <p className="mb-3 text-sm text-stone-600">
            {missed > 0 && (
              <>
                Sa Original, <span className="rounded bg-red-200 px-1 text-red-900">pula</span> ang parteng iba sa
                na-encode.{' '}
              </>
            )}
            Ang &quot;Tama pero minarkahan&quot; ay field na walang mali pero minarkahan mong may mali.
          </p>
          <div className="max-h-[28rem] overflow-y-auto">
            <table className="w-full text-left text-base">
              <thead className="sticky top-0 bg-paper text-sm text-stone-600">
                <tr>
                  <th className="py-2 pr-4 font-semibold">Record</th>
                  <th className="py-2 pr-4 font-semibold">Field</th>
                  <th className="py-2 pr-4 font-semibold">Original / Encoded</th>
                  <th className="py-2 font-semibold">Ano ang nangyari</th>
                </tr>
              </thead>
              <tbody>
                {mistakes.map((m, i) => {
                  const falseAlarm = isFalseAlarm(m);
                  return (
                    <tr key={i} className="border-t border-stone-200 align-top">
                      <td className="py-2 pr-4 text-stone-600">#{m.index}</td>
                      <td className="py-2 pr-4 font-medium text-stone-800">
                        {FIELD_LABEL[m.field as FieldKey] ?? m.field}
                      </td>
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
                        {falseAlarm ? 'Tama pero minarkahan' : 'Hindi napansin ang mali'}
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
  const m = session.metrics;
  const t = JOB_READY_QC;
  const acc = display(m.decisionAccuracy);
  const speed = display(m.perMinute);
  const ready = m.records > 0 && acc >= t.decisionAccuracy && speed >= t.perMinute;

  let message = `Ang target ay ${t.decisionAccuracy}% na tamang check at ${t.perMinute} record bawat minuto. Unahin ang maingat na paghahambing, saka ang bilis.`;
  if (m.records === 0) message = 'Wala kang naipasang record. Tandaan: pindutin ang Enter o ang "Submit" pagkatapos mag-check.';
  else if (ready) message = 'Pasado ka sa target. Subukan ang Assessment para makasigurado.';
  else if (m.missed > m.falseAlarms) message = `May ${m.missed} mali na hindi mo napansin. Basahin ang bawat letra at digit, lalo na ang tuldok at numero.`;

  return (
    <div>
      <PageHeader icon={<QcIcon className="h-8 w-8" />} title="Resulta ng QC Check" />

      <ResultSummary
        ready={ready}
        headline={
          <>
            <strong>{m.correctRecords}</strong> sa <strong>{m.records}</strong> na record ang tama ang check mo, at
            nahuli mo ang <strong>{m.caught}</strong> sa <strong>{m.errorsTotal}</strong> na mali.
          </>
        }
        message={message}
      >
        <Button size="lg" onClick={onRetry} autoFocus>
          Ulitin
        </Button>
      </ResultSummary>

      <SaveBanner saved={saved} finishedEarly={finishedEarly} onToggle={onToggleSaved} />

      <Section title="Mga detalye" className="mb-10">
        <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-5">
          <StatBadge label="Tamang check" value={`${acc}%`} help={HELP.qcAccuracy} />
          <StatBadge label="Bilis (bawat minuto)" value={speed} hint="record" help={HELP.qcSpeed} />
          <StatBadge label="Hindi napansin" value={m.missed} hint={`sa ${m.errorsTotal} na mali`} />
          <StatBadge label="Tama pero minarkahan" value={m.falseAlarms} />
          <StatBadge label="Tagal" value={formatClock(session.durationSec)} hint={`${m.records} record`} />
        </div>
      </Section>

      <Section title="Target" className="mb-10">
        <ul>
          <TargetRow label="Tamang check" value={m.decisionAccuracy} target={t.decisionAccuracy} unit="%" />
          <TargetRow label="Bilis (bawat minuto)" value={m.perMinute} target={t.perMinute} />
        </ul>
      </Section>

      <QcMistakesCard mistakes={session.mistakes} />
    </div>
  );
}
