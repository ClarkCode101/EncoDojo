import { ResultSummary, SaveBanner, TargetRow } from '../../components/ResultPieces';
import { ExcelIcon } from '../../components/icons';
import { Button, PageHeader, Section, StatBadge } from '../../components/ui';
import { HELP } from '../../lib/glossary';
import { display } from '../../lib/scoring';
import type { Session, SessionMistake } from '../../lib/storage';
import { JOB_READY_EXCEL } from '../../lib/targets';
import { formatClock } from '../../lib/useCountdown';
import { TipKeys } from './ExcelRunner';
import { TASK_LABEL } from './tasks';

/** The tasks that were not done, or not done with the shortcut. */
export function ExcelMistakesCard({ mistakes, nested = false }: { mistakes: SessionMistake[]; nested?: boolean }) {
  return (
    <Section title={`Mga dapat pang sanayin (${mistakes.length})`} small={nested}>
      {mistakes.length === 0 ? (
        <p className="text-lg text-stone-700">Lahat ng task ay nagawa mo gamit ang shortcut. Ang galing!</p>
      ) : (
        <table className="w-full text-left text-base">
          <thead className="text-sm text-stone-600">
            <tr>
              <th className="py-2 pr-4 font-semibold">Task</th>
              <th className="py-2 pr-4 font-semibold">Ang ginawa mo</th>
              <th className="py-2 font-semibold">Shortcut na gagamitin</th>
            </tr>
          </thead>
          <tbody>
            {mistakes.map((m, i) => (
              <tr key={i} className="border-t border-stone-200 align-top">
                <td className="py-2 pr-4 text-stone-800">
                  <span className="text-stone-500">#{m.index}</span> {TASK_LABEL[m.field ?? ''] ?? m.field}
                </td>
                <td className={'py-2 pr-4 font-semibold ' + (m.typed === 'Hindi natapos' ? 'text-red-700' : 'text-amber-800')}>
                  {m.typed}
                </td>
                <td className="py-2 text-stone-900">
                  <TipKeys tip={m.expected} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Section>
  );
}

export default function ExcelResults({
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
  const t = JOB_READY_EXCEL;
  const tasksPct = display(m.taskAccuracy);
  const shortcutPct = display(m.shortcutRate);
  const ready = tasksPct >= t.taskAccuracy && shortcutPct >= t.shortcutRate;

  let message = `Ang target ay ${t.taskAccuracy}% na natapos at ${t.shortcutRate}% gamit ang shortcut. Ulitin ang round hanggang masanay ang mga daliri.`;
  if (ready) message = 'Pasado ka sa target. Kabisado mo na ang mga pangunahing shortcut.';
  else if (m.tasksDone === m.tasksTotal) message = `Natapos mo lahat. Ngayon, sanayin ang shortcut: ${t.shortcutRate}% ang target.`;

  return (
    <div>
      <PageHeader icon={<ExcelIcon className="h-8 w-8" />} title="Resulta ng Excel Practice" description="Navigation at shortcuts" />

      <ResultSummary
        ready={ready}
        headline={
          <>
            Natapos mo ang <strong>{m.tasksDone}</strong> sa <strong>{m.tasksTotal}</strong> na task, at{' '}
            <strong>{m.tasksShortcut}</strong> dito ay gamit ang shortcut.
          </>
        }
        message={message}
      >
        <Button size="lg" onClick={onRetry} autoFocus>
          Ulitin (bagong round)
        </Button>
      </ResultSummary>

      <SaveBanner saved={saved} finishedEarly={finishedEarly} onToggle={onToggleSaved} />

      <Section title="Mga detalye" className="mb-10">
        <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatBadge label="Natapos na task" value={`${tasksPct}%`} hint={`${m.tasksDone} sa ${m.tasksTotal}`} help={HELP.excelTasks} />
          <StatBadge label="Gamit ang shortcut" value={`${shortcutPct}%`} hint={`${m.tasksShortcut} sa ${m.tasksTotal}`} help={HELP.excelShortcut} />
          <StatBadge label="Karaniwang bilis" value={`${display(m.avgSeconds)} seg`} hint="bawat natapos na task" />
          <StatBadge label="Tagal" value={formatClock(session.durationSec)} />
        </div>
      </Section>

      <Section title="Target" className="mb-10">
        <ul>
          <TargetRow label="Natapos na task" value={m.taskAccuracy} target={t.taskAccuracy} unit="%" />
          <TargetRow label="Gamit ang shortcut" value={m.shortcutRate} target={t.shortcutRate} unit="%" />
        </ul>
      </Section>

      <ExcelMistakesCard mistakes={session.mistakes} />
    </div>
  );
}
