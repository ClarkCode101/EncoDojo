/**
 * Home, in the "Dojo notebook" style (owner's choice, 2026-09-27): it should
 * feel made by a person, not generated. So: a real greeting, a ruled list
 * like a notebook or ledger (not a grid of identical cards), thin rules
 * instead of boxes, and no emoji. Each practice row shows your number AGAINST
 * the job-ready target ("38 / 40 WPM") with a small bar (owner's choice
 * 2026-09-30, option B), so how close you are is seen at a glance.
 *
 * Taglish or English (Settings -> "Wika / Language"). Until a language is
 * picked, a small question at the top asks once.
 */
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRightIcon,
  AssessmentIcon,
  CopyIcon,
  DocumentIcon,
  ExcelIcon,
  KeyboardIcon,
  NumpadIcon,
  QcIcon,
} from '../../components/icons';
import BeltCard from '../../components/BeltCard';
import { Button, ConfirmButton, HelpTip, Section } from '../../components/ui';
import { langOf, localeOf, translator, useT, type T } from '../../lib/i18n';
import { display } from '../../lib/scoring';
import { PRACTICE_TYPES, type Session } from '../../lib/storage';
import { clearSessions, removeSession, updateSettings, useAppData } from '../../lib/useAppData';
import {
  JOB_READY_COPY,
  JOB_READY_ENCODING,
  JOB_READY_NUMPAD,
  JOB_READY_QC,
  JOB_READY_TYPING,
} from '../../lib/targets';
import { formatClock } from '../../lib/useCountdown';
import { copyKphOf } from '../copy/scoreCopy';
import { DOC_INFO } from '../encoding/documents';
import { docTypeFromCode } from '../encoding/scoreEncoding';
import { passedLessons, readyLessons } from '../excel/lessons';
import {
  bestMetric,
  currentStreak,
  forNumpadBest,
  greeting,
  isBeginnerNumpad,
  latestMetric,
  recentSessions,
} from './stats';
import NextFocusCard from './NextFocusCard';

function summary(session: Session, t: T): string {
  const m = session.metrics;
  const k = (v: number) => display(v).toLocaleString();
  if (session.type === 'typing')
    return t(
      `${display(m.netWpm)} WPM, ${display(m.accuracy)}% tama`,
      `${display(m.netWpm)} WPM, ${display(m.accuracy)}% correct`,
    );
  if (session.type === 'assessment') {
    const verdict =
      m.jobReady === 1
        ? 'Job-ready'
        : t(`${m.targetsMet} sa ${m.targetsTotal} na target`, `${m.targetsMet} of ${m.targetsTotal} targets`);
    return `${verdict}, ${display(m.typingNetWpm)} WPM, ${k(m.numpadKph)} KPH`;
  }
  if (session.type === 'copy') {
    if (m.records === 0) return t('Walang natapos na record', 'No record finished');
    return t(
      `${display(m.fieldAccuracy)}% tamang field, ${k(copyKphOf(m))} KPH, ${m.records} record`,
      `${display(m.fieldAccuracy)}% correct fields, ${k(copyKphOf(m))} KPH, ${m.records} records`,
    );
  }
  if (session.type === 'encoding') {
    if (m.documents === 0) return t('Walang natapos na dokumento', 'No document finished');
    return t(
      `${display(m.fieldAccuracy)}% tamang field, ${k(m.kph)} KPH, ${m.documents} dokumento`,
      `${display(m.fieldAccuracy)}% correct fields, ${k(m.kph)} KPH, ${m.documents} documents`,
    );
  }
  if (session.type === 'excel') {
    // The Pagsusulit (with `passed`); the first timed rounds had no `passed`.
    if (typeof m.passed === 'number')
      return t(
        `Pagsusulit: ${m.tasksDone} sa ${m.tasksTotal}${m.passed ? ', pasado' : ''}`,
        `Quiz: ${m.tasksDone} of ${m.tasksTotal}${m.passed ? ', passed' : ''}`,
      );
    return t(
      `${m.tasksDone} sa ${m.tasksTotal} na task, ${m.tasksShortcut} gamit ang shortcut`,
      `${m.tasksDone} of ${m.tasksTotal} tasks, ${m.tasksShortcut} with the shortcut`,
    );
  }
  if (session.type === 'qc') {
    if (m.records === 0) return t('Walang na-check na record', 'No record checked');
    return t(
      `${display(m.decisionAccuracy)}% tamang check, ${m.records} record`,
      `${display(m.decisionAccuracy)}% correct checks, ${m.records} records`,
    );
  }
  return t(
    `${k(m.kph)} KPH, ${display(m.entryAccuracy)}% tama`,
    `${k(m.kph)} KPH, ${display(m.entryAccuracy)}% correct`,
  );
}

/** Small grey detail under the name in the log, e.g. "Sales Invoice, spreadsheet". */
function detail(session: Session, t: T): string | null {
  if (session.type === 'copy' && session.metrics.sheet === 1) return 'spreadsheet';
  if (isBeginnerNumpad(session)) return t('pang-baguhan', 'beginner');
  if (session.type === 'encoding') {
    const docType = docTypeFromCode(session.metrics.docType);
    const doc = docType ? DOC_INFO[docType].label : t('Halo-halo', 'Mixed');
    return session.metrics.sheet === 1 ? `${doc}, spreadsheet` : doc;
  }
  return null;
}

const typeLabel = (type: Session['type'], t: T): string =>
  ({
    typing: 'Typing Practice',
    numpad: 'Numpad Practice',
    copy: 'Copy Test',
    encoding: 'Document Encoding',
    qc: 'QC Check',
    excel: t('Excel (aralin)', 'Excel (lesson)'),
    assessment: 'Assessment',
  })[type];

/** Asked once on Home until a language is picked (Settings -> "Wika / Language" can change it later). */
function LanguageQuestion() {
  return (
    <section
      aria-label="Wika / Language"
      className="rounded-r-lg border-l-4 border-brand-500 bg-white px-5 py-4 shadow-sm"
    >
      <p className="text-lg font-bold text-stone-900">
        Anong wika ang gusto mo? <span className="font-normal text-stone-600">/ Which language do you prefer?</span>
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        <Button onClick={() => updateSettings({ language: 'tl' })}>Taglish</Button>
        <Button onClick={() => updateSettings({ language: 'en' })}>English</Button>
      </div>
      <p className="mt-2 text-sm text-stone-600">Puwede itong palitan sa Settings. / You can change it in Settings.</p>
    </section>
  );
}

/**
 * One ruled line of the "Ensayo" list: icon, name, a short line, your number against the target
 * with a small bar, arrow. The whole row is a link. The bar turns green once the target is reached
 * (green = correct, like everywhere in the app).
 */
function EnsayoRow({
  to,
  icon,
  title,
  text,
  value,
  target,
  unit,
}: {
  to: string;
  icon: ReactNode;
  title: string;
  text: string;
  /** null = not tried yet */
  value: number | null;
  /** The job-ready target (lib/targets.ts). */
  target: number;
  unit: string;
}) {
  const t = useT();
  const shown = value === null ? null : display(value);
  const reached = shown !== null && shown >= target;
  return (
    <li className="border-b border-stone-300">
      <Link
        to={to}
        className="group grid grid-cols-[2.5rem_1fr_auto] items-center gap-x-4 gap-y-1 py-4 pl-1 pr-2 transition-colors hover:bg-white focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-brand-600 sm:grid-cols-[2.5rem_1fr_auto_1.5rem]"
      >
        <span className="flex justify-center text-brand-700">{icon}</span>
        <span className="min-w-0">
          <span className="block text-lg font-bold text-stone-900">{title}</span>
          <span className="block text-stone-600">{text}</span>
        </span>
        <span className="text-right">
          {shown === null ? (
            <span className="text-sm text-stone-500">{t('hindi pa nasusubukan', 'not tried yet')}</span>
          ) : (
            <>
              <span className="font-display text-2xl font-bold tabular-nums text-stone-900">
                {shown.toLocaleString()}
              </span>
              <span className="ml-1 text-sm text-stone-600">
                / {target.toLocaleString()} {unit}
              </span>
              {/* How close to the target (the numbers say it too). */}
              <span
                aria-hidden="true"
                className="mt-1 ml-auto block h-1.5 w-28 overflow-hidden rounded-full bg-stone-200"
              >
                <span
                  className={'block h-full rounded-full ' + (reached ? 'bg-green-600' : 'bg-brand-600')}
                  style={{ width: `${Math.min(100, Math.round((shown / target) * 100))}%` }}
                />
              </span>
            </>
          )}
        </span>
        <ArrowRightIcon className="hidden h-5 w-5 text-stone-400 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-700 motion-reduce:transition-none sm:block" />
      </Link>
    </li>
  );
}

const comingSoon = ['Word', 'Progress Reports'];

export default function DashboardPage() {
  const { profile, sessions, settings } = useAppData();
  const lang = langOf(settings);
  const t = translator(lang);
  // The language question, until a language is picked (the old "English lang" counts as picked).
  const askLanguage = settings.language === undefined && !settings.englishOnly;
  const now = new Date();
  const training = sessions.filter((s) => s.type !== 'assessment');
  // Copy Test / Encoding / QC runs with nothing finished say "100%" or "0%": skip them.
  const withFinishedItems = sessions.filter(
    (s) =>
      !(s.type === 'copy' && s.metrics.records === 0) &&
      !(s.type === 'encoding' && s.metrics.documents === 0) &&
      !(s.type === 'qc' && s.metrics.records === 0),
  );
  const recent = recentSessions(sessions, sessions.length);
  const streak = currentStreak(sessions);
  const latestAssessment =
    recentSessions(
      sessions.filter((s) => s.type === 'assessment'),
      1,
    )[0] ?? null;

  const typingBest = bestMetric(sessions, 'typing', 'netWpm');
  const numpadBest = bestMetric(forNumpadBest(sessions), 'numpad', 'kph');
  const copyLatest = latestMetric(withFinishedItems, 'copy', 'fieldAccuracy');
  const encodingLatest = latestMetric(withFinishedItems, 'encoding', 'fieldAccuracy');
  const qcLatest = latestMetric(withFinishedItems, 'qc', 'decisionAccuracy');
  const excelRounds = sessions.filter((s) => s.type === 'excel').length;
  const excelLessons = readyLessons().length;
  const excelPassed = passedLessons(sessions).size;

  const today = now.toLocaleDateString(localeOf(lang), { weekday: 'long', month: 'long', day: 'numeric' });
  const hello = `${greeting(now, lang)}${profile.displayName ? `, ${profile.displayName}` : ''}.`;
  const subline =
    sessions.length === 0
      ? t('Bago ka rito. Maligayang pagdating sa dojo.', "You're new here. Welcome to the dojo.")
      : streak >= 2
        ? t(
            `${streak} araw ka nang sunod-sunod na nag-eensayo. Ituloy mo lang.`,
            `You've practiced ${streak} days in a row. Keep it up.`,
          )
        : t('Handa na ang dojo. Saan tayo mag-eensayo ngayon?', 'The dojo is ready. What will you practice today?');

  return (
    <div className="space-y-12">
      {askLanguage && <LanguageQuestion />}

      {/* Greeting */}
      <header>
        <p className="text-stone-600">{today}</p>
        <h1 className="mt-1 font-display text-4xl font-bold text-stone-900">{hello}</h1>
        <p className="mt-2 text-lg text-stone-700">{subline}</p>
        {/* What to do next and your belt (moved here from the sidebar, owner's choice 2026-10-01). */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <NextFocusCard />
          <BeltCard />
        </div>
      </header>

      {/* Ensayo: the five practices, then the Assessment */}
      <Section
        title={t('Ensayo', 'Practice')}
        aside={
          // One explanation for all the numbers (not one per row).
          <HelpTip label={t('Ano ang mga numerong ito?', 'What are these numbers?')}>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong>Typing:</strong> {t('ang pinakamabilis mong Net WPM.', 'your fastest Net WPM.')}
              </li>
              <li>
                <strong>Numpad:</strong>{' '}
                {t(
                  'ang pinakamabilis mong KPH (Halo-halo lang ang binibilang).',
                  'your fastest KPH (only Mixed numbers count).',
                )}
              </li>
              <li>
                <strong>{t('Copy Test at Document Encoding:', 'Copy Test and Document Encoding:')}</strong>{' '}
                {t(
                  'ilang porsyento ng field ang eksaktong tama sa huli mong practice.',
                  'the percent of fields exactly right in your last practice.',
                )}
              </li>
              <li>
                <strong>QC Check:</strong>{' '}
                {t(
                  'ilang porsyento ng check mo ang tama sa huli mong practice.',
                  'the percent of your checks that were right in your last practice.',
                )}
              </li>
            </ul>
            <p className="mt-1">
              {t(
                'Ang ikalawang numero ay ang target para maging job-ready.',
                'The second number is the target for being job-ready.',
              )}
            </p>
          </HelpTip>
        }
      >
        <ol className="-mt-4">
          <EnsayoRow
            to="/typing"
            icon={<KeyboardIcon className="h-7 w-7" />}
            title="Typing Practice"
            text={t('Bilis at tamang pagta-type', 'Fast and correct typing')}
            value={typingBest}
            target={JOB_READY_TYPING.netWpm}
            unit="WPM"
          />
          <EnsayoRow
            to="/numpad"
            icon={<NumpadIcon className="h-7 w-7" />}
            title="Numpad Practice"
            text={t('Mga numero gamit ang numpad', 'Numbers on the numpad')}
            value={numpadBest}
            target={JOB_READY_NUMPAD.kph}
            unit="KPH"
          />
          <EnsayoRow
            to="/copy"
            icon={<CopyIcon className="h-7 w-7" />}
            title="Copy Test"
            text={t('Kopyahin ang record nang eksakto', 'Copy records exactly')}
            value={copyLatest}
            target={JOB_READY_COPY.fieldAccuracy}
            unit={t('% tama', '% correct')}
          />
          <EnsayoRow
            to="/encoding"
            icon={<DocumentIcon className="h-7 w-7" />}
            title="Document Encoding"
            text={t('Mula sa invoice, resibo at form', 'From invoices, receipts and forms')}
            value={encodingLatest}
            target={JOB_READY_ENCODING.fieldAccuracy}
            unit={t('% tama', '% correct')}
          />
          <EnsayoRow
            to="/qc"
            icon={<QcIcon className="h-7 w-7" />}
            title="QC Check"
            text={t('Hanapin ang mali ng iba', "Find mistakes in others' work")}
            value={qcLatest}
            target={JOB_READY_QC.decisionAccuracy}
            unit={t('% tama', '% correct')}
          />
        </ol>

        {/* The Assessment, set apart like a seal on the page */}
        <div className="mt-6 grid grid-cols-[2.5rem_1fr] items-center gap-x-4 gap-y-3 border-l-4 border-belt-400 bg-belt-50 py-5 pl-3 pr-5 sm:grid-cols-[2.5rem_1fr_auto]">
          <span className="flex justify-center text-stone-800">
            <AssessmentIcon className="h-7 w-7" />
          </span>
          <div>
            <div className="text-lg font-bold text-stone-900">Assessment</div>
            <p className="text-stone-700">
              {latestAssessment
                ? latestAssessment.metrics.jobReady === 1
                  ? t(
                      'Job-ready ka na sa huli mong subok. Ulitin sa ibang araw para sa susunod na belt.',
                      'You were job-ready on your last try. Take it again on another day for the next belt.',
                    )
                  : t(
                      `Huling subok: ${latestAssessment.metrics.targetsMet} sa ${latestAssessment.metrics.targetsTotal} na target. Mga 10 hanggang 12 minuto.`,
                      `Last try: ${latestAssessment.metrics.targetsMet} of ${latestAssessment.metrics.targetsTotal} targets. About 10 to 12 minutes.`,
                    )
                : t(
                    'Lahat ng skill sa iisang exam. Mga 10 hanggang 12 minuto.',
                    'Every skill in one exam. About 10 to 12 minutes.',
                  )}
            </p>
          </div>
          <Link
            to="/assessment"
            className="col-start-2 inline-flex min-h-[2.75rem] items-center justify-center gap-2 justify-self-start rounded-lg bg-brand-700 px-5 py-2 font-semibold text-white shadow-sm transition-colors hover:bg-brand-800 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-brand-600 sm:col-start-auto"
          >
            {latestAssessment ? t('Subukan ulit', 'Try again') : t('Simulan', 'Start')}{' '}
            <ArrowRightIcon className="h-5 w-5" />
          </Link>
        </div>
      </Section>

      {/* Learning tracks: Microsoft Office skills (not part of the Assessment or the belt). */}
      <Section title={t('Matuto', 'Learn')}>
        <ul className="-mt-4">
          <li className="border-b border-stone-300">
            <Link
              to="/excel"
              className="group grid grid-cols-[2.5rem_1fr_auto] items-center gap-x-4 py-4 pl-1 pr-2 transition-colors hover:bg-white focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-brand-600 sm:grid-cols-[2.5rem_1fr_auto_1.5rem]"
            >
              <span className="flex justify-center text-brand-700">
                <ExcelIcon className="h-7 w-7" />
              </span>
              <span className="min-w-0">
                <span className="block text-lg font-bold text-stone-900">Excel</span>
                <span className="block text-stone-600">
                  {t(
                    'Mga shortcut, formatting at formulas, paisa-isang aralin',
                    'Shortcuts, formatting and formulas, one lesson at a time',
                  )}
                </span>
              </span>
              <span className="text-right text-sm text-stone-600">
                {excelRounds === 0 ? (
                  t('hindi pa nasisimulan', 'not started yet')
                ) : (
                  <>
                    <span className="font-display text-2xl font-bold tabular-nums text-stone-900">{excelPassed}</span>{' '}
                    {t(`sa ${excelLessons} aralin ang pasado`, `of ${excelLessons} lessons passed`)}
                  </>
                )}
              </span>
              <ArrowRightIcon className="hidden h-5 w-5 text-stone-400 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-700 motion-reduce:transition-none sm:block" />
            </Link>
          </li>
        </ul>
        <p className="mt-2 text-sm text-stone-600">
          {t(
            'Para matuto lang ito. Hindi kasama sa Assessment at sa belt.',
            'This is only for learning. It is not part of the Assessment or the belt.',
          )}
        </p>
      </Section>

      {/* The log */}
      <Section title={t('Mga huling ginawa', 'Recent activity')}>
        {recent.length === 0 ? (
          <p className="text-lg text-stone-700">
            {t(
              'Wala pa rito. Lalabas dito ang bawat practice at Assessment mo.',
              'Nothing here yet. Every practice and Assessment you do shows up here.',
            )}
          </p>
        ) : (
          // About 5 rows tall; more rows scroll inside the list (the header row stays put).
          <div className="-mt-4 max-h-[25rem] overflow-auto">
            <table className="w-full text-left text-base">
              <thead className="sticky top-0 z-[1] bg-paper text-sm text-stone-600">
                <tr className="border-b border-stone-300">
                  <th className="py-2 pr-4 font-semibold">{t('Kailan', 'When')}</th>
                  <th className="py-2 pr-4 font-semibold">{t('Ginawa', 'What')}</th>
                  <th className="py-2 pr-4 font-semibold">{t('Tagal', 'Time')}</th>
                  <th className="py-2 pr-4 font-semibold">{t('Resulta', 'Result')}</th>
                  <th className="py-2">
                    <span className="sr-only">{t('Burahin', 'Delete')}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {recent.map((s) => (
                  <tr key={s.id} className="border-b border-stone-200">
                    <td className="py-3 pr-4 text-stone-600">
                      {new Date(s.startedAt).toLocaleString(localeOf(lang), {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 pr-4 font-medium text-stone-900">
                      {typeLabel(s.type, t)}
                      {detail(s, t) && <span className="block text-sm font-normal text-stone-500">{detail(s, t)}</span>}
                    </td>
                    <td className="py-3 pr-4 tabular-nums text-stone-700">{formatClock(s.durationSec)}</td>
                    <td className="py-3 pr-4 tabular-nums text-stone-800">{summary(s, t)}</td>
                    <td className="py-3 text-right">
                      <ConfirmButton
                        size="sm"
                        label={t('Burahin', 'Delete')}
                        question={t('Burahin ito?', 'Delete this?')}
                        onConfirm={() => removeSession(s.id)}
                      />
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
              label={t('Burahin lahat ng practice', 'Delete all practice')}
              // The warning shows only when it matters: right before deleting. (Assessments stay.)
              question={t(
                `Burahin lahat ng ${training.length} practice? Magbabago rin ang best scores at streak.`,
                `Delete all ${training.length} practices? Your best scores and streak change too.`,
              )}
              confirmLabel={t('Oo, burahin lahat', 'Yes, delete all')}
              onConfirm={() => clearSessions(PRACTICE_TYPES)}
            />
          </div>
        )}
      </Section>

      <p className="border-t border-stone-300 pt-4 text-stone-600">
        <span className="font-semibold text-stone-700">{t('Parating pa:', 'Coming soon:')}</span>{' '}
        {comingSoon.join(', ')}.
      </p>
    </div>
  );
}
