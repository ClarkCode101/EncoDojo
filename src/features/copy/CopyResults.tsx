import { SaveBanner, TargetRow } from '../../components/ResultPieces';
import { CopyIcon } from '../../components/icons';
import { Button, Card, PageHeader, StatBadge } from '../../components/ui';
import { HELP } from '../../lib/glossary';
import { display } from '../../lib/scoring';
import type { Session, SessionMistake } from '../../lib/storage';
import { JOB_READY_COPY } from '../../lib/targets';
import { formatClock } from '../../lib/useCountdown';
import { alignTyping } from '../typing/alignTyping';
import { FIELD_LABEL, type FieldKey } from './records';
import { copyKphOf } from './scoreCopy';

/**
 * The correct value, with the characters the user got wrong highlighted:
 * red = wrong character, crossed out = left out.
 */
function ExpectedWithMarks({ expected, typed }: { expected: string; typed: string }) {
  const a = alignTyping(expected, typed);
  return (
    <span className="font-mono">
      {Array.from(expected).map((char, i) => {
        const status = i < a.cursor ? a.statuses[i] : 'skipped';
        const cls =
          status === 'correct' ? '' : status === 'wrong' ? 'rounded bg-red-200 text-red-900' : 'rounded bg-red-100 text-red-800 line-through';
        return (
          <span key={i} className={cls}>
            {char}
          </span>
        );
      })}
    </span>
  );
}

/** The list of wrong fields (also used by the Assessment report). */
export function CopyMistakesCard({ mistakes }: { mistakes: SessionMistake[] }) {
  return (
    <Card title={`Mga maling field (${mistakes.length})`}>
      {mistakes.length === 0 ? (
        <p className="text-lg text-stone-700">Walang maling field. Ang galing! 👏</p>
      ) : (
        <>
          <p className="mb-3 text-sm text-stone-600">
            Sa &quot;Dapat&quot;, <span className="rounded bg-red-200 px-1 text-red-900">pula</span> ang maling letra at{' '}
            <span className="rounded bg-red-100 px-1 text-red-800 line-through">naka-guhit</span> ang nakalimutan.
          </p>
          <div className="max-h-[28rem] overflow-y-auto">
            <table className="w-full text-left text-base">
              <thead className="sticky top-0 bg-white text-stone-600">
                <tr>
                  <th className="py-2 pr-4 font-semibold">Record</th>
                  <th className="py-2 pr-4 font-semibold">Field</th>
                  <th className="py-2 font-semibold">Dapat / Na-type mo</th>
                </tr>
              </thead>
              <tbody>
                {mistakes.map((m, i) => (
                  <tr key={i} className="border-t border-stone-200 align-top">
                    <td className="py-2 pr-4 text-stone-600">#{m.index}</td>
                    <td className="py-2 pr-4 font-medium text-stone-800">
                      {FIELD_LABEL[m.field as FieldKey] ?? m.field}
                    </td>
                    <td className="py-2">
                      <div className="text-green-900">
                        <ExpectedWithMarks expected={m.expected} typed={m.typed} />
                      </div>
                      <div className="font-mono text-red-700">{m.typed || '(walang na-type)'}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
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
  const m = session.metrics;
  const t = JOB_READY_COPY;
  const speed = copyKphOf(m);
  const shownSpeed = display(speed);
  const acc = display(m.fieldAccuracy);
  const ready = m.records > 0 && shownSpeed >= t.kph && acc >= t.fieldAccuracy;

  return (
    <div>
      <PageHeader icon={<CopyIcon className="h-8 w-8" />} title="Resulta ng Copy Test" />

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
