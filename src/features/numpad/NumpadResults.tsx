import { KphLevels, SaveBanner, TargetRow } from '../../components/ResultPieces';
import { NumpadIcon } from '../../components/icons';
import { Button, Card, HelpTip, Notice, PageHeader, StatBadge } from '../../components/ui';
import { HELP } from '../../lib/glossary';
import { display } from '../../lib/scoring';
import type { Session, SessionMistake } from '../../lib/storage';
import { JOB_READY_NUMPAD } from '../../lib/targets';
import { formatClock } from '../../lib/useCountdown';

/** The list of wrong numpad entries (also used by the Assessment report). */
export function NumpadMistakesCard({ mistakes }: { mistakes: SessionMistake[] }) {
  return (
    <Card title={`Mga maling numero (${mistakes.length})`}>
      {mistakes.length === 0 ? (
        <p className="text-lg text-stone-700">Walang maling numero. Ang galing! 👏</p>
      ) : (
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-left text-base">
            <thead className="sticky top-0 bg-white text-stone-600">
              <tr>
                <th className="py-2 pr-4 font-semibold">Pang-ilan</th>
                <th className="py-2 pr-4 font-semibold">Dapat</th>
                <th className="py-2 font-semibold">Na-type mo</th>
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
    </Card>
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
  const m = session.metrics;
  const t = JOB_READY_NUMPAD;
  const speed = display(m.kph);
  const acc = display(m.entryAccuracy);
  const ready = !beginner && speed >= t.kph && acc >= t.entryAccuracy;

  let message = `Ang target ay ${t.kph.toLocaleString()} KPH at ${t.entryAccuracy}% na tama. Tuloy lang ang practice!`;
  if (ready) message = '🎉 Pasado ka sa karaniwang target! Subukan ang Assessment para makasigurado.';
  if (beginner) message = 'Magaling! Kapag komportable ka na sa mga key, subukan ang "Halo-halo" — iyon ang nasa Assessment.';

  return (
    <div>
      <PageHeader icon={<NumpadIcon className="h-8 w-8" />} title="Resulta ng Numpad Practice" />

      <section
        aria-label="Buod ng resulta"
        className={
          'mb-6 rounded-2xl border-2 p-6 ' + (ready ? 'border-green-400 bg-green-50' : 'border-brand-200 bg-white')
        }
      >
        <p className="text-2xl leading-relaxed text-stone-900">
          <strong>{m.correctEntries}</strong> sa <strong>{m.entries}</strong> na numero ang tama, sa bilis na{' '}
          <strong>{speed.toLocaleString()} KPH</strong>.
        </p>
        <p className="mt-2 text-lg text-stone-700">{message}</p>
        <div className="mt-5">
          <Button size="lg" onClick={onRetry} autoFocus>
            Ulitin
          </Button>
        </div>
      </section>

      <SaveBanner saved={saved} finishedEarly={finishedEarly} onToggle={onToggleSaved} />

      <h2 className="mb-3 text-xl font-bold text-stone-900">Mga detalye</h2>
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatBadge label="Bilis (KPH)" value={speed.toLocaleString()} help={HELP.kph} />
        <StatBadge label="Tamang numero" value={`${acc}%`} help={HELP.entryAccuracy} />
        <StatBadge label="Natapos na numero" value={m.entries} hint={`${m.correctEntries} ang tama`} />
        <StatBadge label="Tagal" value={formatClock(session.durationSec)} />
      </div>

      {beginner ? (
        <Notice kind="info" className="mb-6">
          <strong>Pang-baguhan ito.</strong> Maiikling numero lang ang nandito, kaya hindi ito ikinukumpara sa target ng
          hiring test at hindi kasama sa &quot;Pinakamabilis na numpad&quot; sa Home.
        </Notice>
      ) : (
        <>
          <Card title="Target ng hiring test" className="mb-6">
            <ul className="space-y-2">
              <TargetRow label="Bilis (KPH)" value={m.kph} target={t.kph} />
              <TargetRow label="Tamang numero" value={m.entryAccuracy} target={t.entryAccuracy} unit="%" />
            </ul>
          </Card>

          <Card title="Antas ng bilis mo (KPH)" className="mb-6">
            <KphLevels kph={m.kph} />
            <HelpTip label="Saan galing ang mga numerong ito?">{HELP.kphLevels}</HelpTip>
          </Card>
        </>
      )}

      <NumpadMistakesCard mistakes={session.mistakes} />
    </div>
  );
}
