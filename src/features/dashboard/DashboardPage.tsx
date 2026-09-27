/**
 * Home, in the "Dojo notebook" style (owner's choice, 2026-09-27): it should
 * feel made by a person, not generated. So: a real greeting, a ruled list
 * like a notebook or ledger (not a grid of identical cards), numbers that
 * belong to each row, thin rules instead of boxes, and no emoji.
 */
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon, CopyIcon, DocumentIcon, KeyboardIcon, NumpadIcon } from '../../components/icons';
import { ConfirmButton, HelpTip } from '../../components/ui';
import { display } from '../../lib/scoring';
import { PRACTICE_TYPES, type Session } from '../../lib/storage';
import { clearSessions, removeSession, useAppData } from '../../lib/useAppData';
import { formatClock } from '../../lib/useCountdown';
import { copyKphOf } from '../copy/scoreCopy';
import { DOC_INFO } from '../encoding/documents';
import { docTypeFromCode } from '../encoding/scoreEncoding';
import {
  bestMetric,
  currentStreak,
  forNumpadBest,
  greeting,
  isBeginnerNumpad,
  latestMetric,
  recentSessions,
} from './stats';

function summary(session: Session): string {
  const m = session.metrics;
  if (session.type === 'typing') return `${display(m.netWpm)} WPM, ${display(m.accuracy)}% tama`;
  if (session.type === 'assessment') {
    const verdict = m.jobReady === 1 ? 'Job-ready' : `${m.targetsMet} sa ${m.targetsTotal} na target`;
    return `${verdict}, ${display(m.typingNetWpm)} WPM, ${display(m.numpadKph).toLocaleString()} KPH`;
  }
  if (session.type === 'copy') {
    if (m.records === 0) return 'Walang natapos na record';
    return `${display(m.fieldAccuracy)}% tamang field, ${display(copyKphOf(m)).toLocaleString()} KPH, ${m.records} record`;
  }
  if (session.type === 'encoding') {
    if (m.documents === 0) return 'Walang natapos na dokumento';
    return `${display(m.fieldAccuracy)}% tamang field, ${display(m.kph).toLocaleString()} KPH, ${m.documents} dokumento`;
  }
  return `${display(m.kph).toLocaleString()} KPH, ${display(m.entryAccuracy)}% tama`;
}

/** Small grey detail under the name in the log, e.g. "Sales Invoice, spreadsheet". */
function detail(session: Session): string | null {
  if (session.type === 'copy' && session.metrics.sheet === 1) return 'spreadsheet';
  if (isBeginnerNumpad(session)) return 'pang-baguhan';
  if (session.type === 'encoding') {
    const docType = docTypeFromCode(session.metrics.docType);
    const doc = docType ? DOC_INFO[docType].label : 'Halo-halo';
    return session.metrics.sheet === 1 ? `${doc}, spreadsheet` : doc;
  }
  return null;
}

const typeLabel: Record<Session['type'], string> = {
  typing: 'Typing Practice',
  numpad: 'Numpad Practice',
  copy: 'Copy Test',
  encoding: 'Document Encoding',
  assessment: 'Assessment',
};

/** One ruled line of the "Ensayo" list: number, name, a short line, your number, arrow. The whole row is a link. */
function EnsayoRow({
  n,
  to,
  icon,
  title,
  text,
  value,
  unit,
}: {
  n: string;
  to: string;
  icon: ReactNode;
  title: string;
  text: string;
  /** null = not tried yet */
  value: string | null;
  unit: string;
}) {
  return (
    <li className="border-b border-stone-300">
      <Link
        to={to}
        className="group grid grid-cols-[2.5rem_1fr_auto] items-center gap-x-4 gap-y-1 py-4 pl-1 pr-2 transition-colors hover:bg-white/70 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-brand-600 sm:grid-cols-[2.5rem_1fr_auto_1.5rem]"
      >
        <span className="font-display text-2xl font-semibold tabular-nums text-stone-400">{n}</span>
        <span className="min-w-0">
          <span className="flex items-center gap-2 text-lg font-bold text-stone-900">
            <span className="text-brand-700">{icon}</span>
            {title}
          </span>
          <span className="block text-stone-600">{text}</span>
        </span>
        <span className="text-right">
          {value === null ? (
            <span className="text-sm text-stone-500">hindi pa nasusubukan</span>
          ) : (
            <>
              <span className="font-display text-2xl font-bold tabular-nums text-stone-900">{value}</span>
              <span className="ml-1 text-sm text-stone-600">{unit}</span>
            </>
          )}
        </span>
        <ArrowRightIcon className="hidden h-5 w-5 text-stone-400 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-700 motion-reduce:transition-none sm:block" />
      </Link>
    </li>
  );
}

const comingSoon = ['QC / Spot the Difference', 'Excel Practice', 'Progress Reports'];

export default function DashboardPage() {
  const { profile, sessions } = useAppData();
  const now = new Date();
  const training = sessions.filter((s) => s.type !== 'assessment');
  // Copy Test / Encoding runs with nothing finished say "100%" (nothing wrong yet): skip them.
  const withFinishedItems = sessions.filter(
    (s) => !(s.type === 'copy' && s.metrics.records === 0) && !(s.type === 'encoding' && s.metrics.documents === 0),
  );
  const recent = recentSessions(sessions, sessions.length);
  const streak = currentStreak(sessions);
  const latestAssessment = recentSessions(sessions.filter((s) => s.type === 'assessment'), 1)[0] ?? null;

  const num = (v: number | null) => (v === null ? null : display(v).toLocaleString());
  const typingBest = num(bestMetric(sessions, 'typing', 'netWpm'));
  const numpadBest = num(bestMetric(forNumpadBest(sessions), 'numpad', 'kph'));
  const copyLatest = num(latestMetric(withFinishedItems, 'copy', 'fieldAccuracy'));
  const encodingLatest = num(latestMetric(withFinishedItems, 'encoding', 'fieldAccuracy'));

  const today = now.toLocaleDateString('fil-PH', { weekday: 'long', month: 'long', day: 'numeric' });
  const hello = `${greeting(now)}${profile.displayName ? `, ${profile.displayName}` : ''}.`;
  const subline =
    sessions.length === 0
      ? 'Bago ka rito. Simulan natin sa Typing Practice.'
      : streak >= 2
        ? `${streak} araw ka nang sunod-sunod na nag-eensayo. Ituloy mo lang.`
        : 'Handa na ang dojo. Saan tayo mag-eensayo ngayon?';

  return (
    <div className="space-y-12">
      {/* Greeting */}
      <header>
        <p className="text-stone-600">{today}</p>
        <h1 className="mt-1 font-display text-4xl font-bold text-stone-900">{hello}</h1>
        <p className="mt-2 text-lg text-stone-700">{subline}</p>
      </header>

      {/* Ensayo: the four practices, then the Assessment */}
      <section aria-labelledby="ensayo-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 border-b-2 border-stone-800 pb-2">
          <h2 id="ensayo-heading" className="font-display text-2xl font-bold text-stone-900">
            Ensayo
          </h2>
          {/* One explanation for all the numbers (not one per row). */}
          <HelpTip label="Ano ang mga numerong ito?">
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong>Typing:</strong> ang pinakamabilis mong Net WPM.
              </li>
              <li>
                <strong>Numpad:</strong> ang pinakamabilis mong KPH (Halo-halo lang ang binibilang).
              </li>
              <li>
                <strong>Copy Test at Document Encoding:</strong> ilang porsyento ng field ang eksaktong tama sa huli mong practice.
              </li>
            </ul>
          </HelpTip>
        </div>
        <ol>
          <EnsayoRow
            n="01"
            to="/typing"
            icon={<KeyboardIcon className="h-5 w-5" />}
            title="Typing Practice"
            text="Bilis at tamang pagta-type"
            value={typingBest}
            unit="WPM"
          />
          <EnsayoRow
            n="02"
            to="/numpad"
            icon={<NumpadIcon className="h-5 w-5" />}
            title="Numpad Practice"
            text="Mga numero gamit ang numpad"
            value={numpadBest}
            unit="KPH"
          />
          <EnsayoRow
            n="03"
            to="/copy"
            icon={<CopyIcon className="h-5 w-5" />}
            title="Copy Test"
            text="Kopyahin ang record nang eksakto"
            value={copyLatest}
            unit="% tama"
          />
          <EnsayoRow
            n="04"
            to="/encoding"
            icon={<DocumentIcon className="h-5 w-5" />}
            title="Document Encoding"
            text="Mula sa invoice, resibo at form"
            value={encodingLatest}
            unit="% tama"
          />
        </ol>

        {/* 05: the Assessment, set apart like a seal on the page */}
        <div className="mt-6 grid grid-cols-[2.5rem_1fr] items-center gap-x-4 gap-y-3 border-l-4 border-belt-400 bg-belt-50 py-5 pl-3 pr-5 sm:grid-cols-[2.5rem_1fr_auto]">
          <span className="font-display text-2xl font-semibold tabular-nums text-belt-600">05</span>
          <div>
            <div className="text-lg font-bold text-stone-900">Assessment</div>
            <p className="text-stone-700">
              {latestAssessment
                ? latestAssessment.metrics.jobReady === 1
                  ? 'Job-ready ka na sa huli mong subok. Ulitin sa ibang araw para sa susunod na belt.'
                  : `Huling subok: ${latestAssessment.metrics.targetsMet} sa ${latestAssessment.metrics.targetsTotal} na target. Mga 8 hanggang 10 minuto.`
                : 'Ang apat na skill sa iisang exam. Mga 8 hanggang 10 minuto.'}
            </p>
          </div>
          <Link
            to="/assessment"
            className="col-start-2 inline-flex min-h-[2.75rem] items-center justify-center gap-2 justify-self-start rounded-lg bg-brand-700 px-5 py-2 font-semibold text-white shadow-sm transition-colors hover:bg-brand-800 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-brand-600 sm:col-start-auto"
          >
            {latestAssessment ? 'Subukan ulit' : 'Simulan'} <ArrowRightIcon className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* The log */}
      <section aria-labelledby="log-heading">
        <div className="border-b-2 border-stone-800 pb-2">
          <h2 id="log-heading" className="font-display text-2xl font-bold text-stone-900">
            Mga huling ginawa
          </h2>
        </div>
        {recent.length === 0 ? (
          <p className="py-4 text-lg text-stone-700">Wala pa rito. Lalabas dito ang bawat practice at Assessment mo.</p>
        ) : (
          // About 5 rows tall; more rows scroll inside the list (the header row stays put).
          <div className="max-h-[25rem] overflow-auto">
            <table className="w-full text-left text-base">
              <thead className="sticky top-0 z-[1] bg-paper text-sm text-stone-600">
                <tr className="border-b border-stone-300">
                  <th className="py-2 pr-4 font-semibold">Kailan</th>
                  <th className="py-2 pr-4 font-semibold">Ginawa</th>
                  <th className="py-2 pr-4 font-semibold">Tagal</th>
                  <th className="py-2 pr-4 font-semibold">Resulta</th>
                  <th className="py-2">
                    <span className="sr-only">Burahin</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {recent.map((s) => (
                  <tr key={s.id} className="border-b border-stone-200">
                    <td className="py-3 pr-4 text-stone-600">
                      {new Date(s.startedAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 pr-4 font-medium text-stone-900">
                      {typeLabel[s.type]}
                      {detail(s) && <span className="block text-sm font-normal text-stone-500">{detail(s)}</span>}
                    </td>
                    <td className="py-3 pr-4 tabular-nums text-stone-700">{formatClock(s.durationSec)}</td>
                    <td className="py-3 pr-4 tabular-nums text-stone-800">{summary(s)}</td>
                    <td className="py-3 text-right">
                      <ConfirmButton size="sm" label="Burahin" question="Burahin ito?" onConfirm={() => removeSession(s.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {training.length > 0 && (
          <div className="mt-4 flex justify-end">
            <ConfirmButton
              label="Burahin lahat ng practice"
              // The warning shows only when it matters: right before deleting. (Assessments stay.)
              question={`Burahin lahat ng ${training.length} practice? Magbabago rin ang best scores at streak.`}
              confirmLabel="Oo, burahin lahat"
              onConfirm={() => clearSessions(PRACTICE_TYPES)}
            />
          </div>
        )}
      </section>

      <p className="border-t border-stone-300 pt-4 text-stone-600">
        <span className="font-semibold text-stone-700">Parating pa:</span> {comingSoon.join(', ')}.
      </p>
    </div>
  );
}
