/**
 * Settings, reorganized 2026-09-27 (owner: "hindi nakaka-overwhelm"): short
 * ruled rows (name + one line on the left, the control on the right) in a few
 * groups; the "delete everything" part is folded away.
 *
 * 2026-09-30: "Wika / Language" (Taglish or English) is the first row; it
 * replaced the old "English lang" toggle.
 */
import { useRef, useState, type ReactNode } from 'react';
import { SettingsIcon } from '../../components/icons';
import { Button, HelpTip, Notice, PageHeader, Section, SegmentedPicker, Toggle } from '../../components/ui';
import { langOf, translator } from '../../lib/i18n';
import { backupStatusText, needsBackup } from '../../lib/reminders';
import { downloadBackup } from '../../lib/backup';
import { IMPORT_TOO_BIG, MAX_IMPORT_BYTES, defaultData, parseImport, type AppData } from '../../lib/storage';
import { replaceAppData, updateAppData, updateSettings, useAppData } from '../../lib/useAppData';

/** One ruled Settings row: the name and one short line on the left, the control on the right. */
function SettingRow({
  id,
  label,
  description,
  children,
}: {
  /** The control's id, when it is a plain input (so clicking the name focuses it). */
  id?: string;
  label: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="grid items-center gap-x-8 gap-y-2 border-b border-stone-300 py-4 md:grid-cols-[1fr_auto]">
      <div>
        {id ? (
          <label htmlFor={id} className="text-lg font-bold text-stone-900">
            {label}
          </label>
        ) : (
          <div className="text-lg font-bold text-stone-900">{label}</div>
        )}
        <p className="text-stone-600">{description}</p>
      </div>
      <div>{children}</div>
    </div>
  );
}

const inputClass =
  'w-full md:w-72 rounded-lg border-[1.5px] border-stone-500 bg-white px-4 py-2.5 text-lg ' +
  'focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-200';

export default function SettingsPage() {
  const data = useAppData();
  const s = data.settings;
  const lang = langOf(s);
  const t = translator(lang);
  const backupDue = needsBackup(s.lastBackupAt, data.sessions);
  const fileInputRef = useRef<HTMLInputElement>(null);
  /** The word to type before everything is deleted. */
  const resetWord = t('BURAHIN', 'DELETE');

  const [pendingImport, setPendingImport] = useState<AppData | null>(null);
  const [message, setMessage] = useState<{ kind: 'success' | 'warning'; text: string } | null>(null);
  const [resetText, setResetText] = useState('');

  async function handleFile(file: File | undefined) {
    setMessage(null);
    setPendingImport(null);
    if (!file) return;
    // Check the size first, so a huge file is never even read into the page.
    const result = file.size > MAX_IMPORT_BYTES ? IMPORT_TOO_BIG : parseImport(await file.text());
    if (result.ok) {
      setPendingImport(result.data);
    } else {
      setMessage({
        kind: 'warning',
        text:
          result.problem === 'unreadable'
            ? t(result.error, "This file can't be read. Make sure it is an EncoDojo backup file (.json).")
            : result.problem === 'tooBig'
              ? t(result.error, 'This file is too big to be an EncoDojo backup. Choose another file.')
              : t(result.error, 'This is not an EncoDojo backup file. Choose another file.'),
      });
    }
    // allow choosing the same file again later
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function confirmImport() {
    if (!pendingImport) return;
    const saved = replaceAppData(pendingImport);
    setPendingImport(null);
    setMessage(
      saved
        ? {
            kind: 'success',
            text: t('Naibalik na ang progress mo mula sa backup.', 'Your progress was restored from the backup.'),
          }
        : {
            kind: 'warning',
            text: t(
              'Nabasa ang backup, pero hindi ito ma-save ng browser. Subukan sa ibang browser.',
              "The backup was read, but this browser can't save it. Try another browser.",
            ),
          },
    );
  }

  function resetAll() {
    replaceAppData(defaultData());
    setResetText('');
    setMessage({
      kind: 'success',
      text: t(
        'Nabura na ang lahat. Parang bago ulit ang EncoDojo.',
        'Everything was deleted. EncoDojo is like new again.',
      ),
    });
  }

  return (
    <div>
      <PageHeader
        icon={<SettingsIcon className="h-8 w-8" />}
        title="Settings"
        description={t(
          'Ayusin ang app ayon sa gusto mo. Automatic na nase-save ang bawat pagbabago.',
          'Set up the app the way you like. Every change is saved automatically.',
        )}
      />

      {message && (
        <Notice kind={message.kind} className="mb-8">
          {message.text}
        </Notice>
      )}

      <Section title={t('Ikaw', 'You')} className="mb-12">
        <div className="-mt-4">
          <SettingRow
            label="Wika / Language"
            description={t(
              'Ang wika ng buong app. Sa English, English din ang mga label sa loob ng test.',
              'The language of the whole app. In English, the labels inside tests are English only.',
            )}
          >
            <SegmentedPicker
              label="Wika / Language"
              hideLabel
              options={['tl', 'en'] as const}
              value={lang}
              format={(l) => (l === 'en' ? 'English' : 'Taglish')}
              onChange={(l) => updateSettings({ language: l })}
            />
          </SettingRow>
          <SettingRow
            id="display-name"
            label={t('Pangalan mo', 'Your name')}
            description={t(
              'Para batiin ka sa Home. Hindi ito ipinapadala kahit saan.',
              'Used to greet you on Home. It is never sent anywhere.',
            )}
          >
            <input
              id="display-name"
              type="text"
              maxLength={40}
              placeholder={t('Hal. Juan', 'e.g. Juan')}
              value={data.profile.displayName}
              onChange={(e) => updateAppData((d) => ({ ...d, profile: { ...d.profile, displayName: e.target.value } }))}
              className={inputClass}
            />
          </SettingRow>
        </div>
      </Section>

      <Section title={t('Pagbasa at itsura', 'Reading and look')} className="mb-12">
        <div className="-mt-4">
          <SettingRow
            label={t('Madilim na itsura', 'Dark mode')}
            description={t(
              'Madilim na background, mas magaan sa mata sa gabi o sa matagal na practice.',
              'A dark background, easier on the eyes at night or in long practice.',
            )}
          >
            <Toggle
              label={t('Madilim na itsura', 'Dark mode')}
              checked={s.dark === true}
              onChange={(v) => updateSettings({ dark: v })}
            />
          </SettingRow>
          <SettingRow
            label={t('Mas malaking text', 'Larger text')}
            description={t('Palakihin ang lahat ng sulat at button.', 'Makes all text and buttons bigger.')}
          >
            <Toggle
              label={t('Mas malaking text', 'Larger text')}
              checked={s.largeText}
              onChange={(v) => updateSettings({ largeText: v })}
            />
          </SettingRow>
          <SettingRow
            label={t('Mas malaking babasahin', 'Larger reading text')}
            description={t(
              'Ang text, numero o dokumentong kokopyahin lang ang lalaki. Kasya pa rin sa screen.',
              'Only the text, number or document you copy from gets bigger. It still fits the screen.',
            )}
          >
            <Toggle
              label={t('Mas malaking babasahin', 'Larger reading text')}
              checked={s.bigSource === true}
              onChange={(v) => updateSettings({ bigSource: v })}
            />
          </SettingRow>
          <SettingRow
            label={t('Bawasan ang galaw', 'Reduce motion')}
            description={t(
              'Walang animation, at hindi kusang lalabas ang sinasabi ni Sensei.',
              "No animations, and Sensei doesn't pop up by himself.",
            )}
          >
            <Toggle
              label={t('Bawasan ang galaw', 'Reduce motion')}
              checked={s.reduceMotion === true}
              onChange={(v) => updateSettings({ reduceMotion: v })}
            />
          </SettingRow>
          <SettingRow
            label={t('Si Sensei', 'Sensei')}
            description={t(
              'Mga tip sa kanang-ibaba. Tahimik siya habang nag-eensayo.',
              'Tips in the lower-right corner. He stays quiet while you practice.',
            )}
          >
            <SegmentedPicker
              label={t('Si Sensei', 'Sensei')}
              hideLabel
              options={['on', 'small', 'off'] as const}
              value={s.sensei ?? 'on'}
              format={(m) =>
                m === 'on' ? t('Ipakita', 'Show') : m === 'small' ? t('Maliit', 'Small') : t('Wala', 'Off')
              }
              onChange={(m) => updateSettings({ sensei: m })}
            />
          </SettingRow>
        </div>
      </Section>

      <Section title={t('Practice at tunog', 'Practice and sound')} className="mb-12">
        <div className="-mt-4">
          <SettingRow
            label={t('Gabay sa keyboard', 'Keyboard guide')}
            description={t(
              'Para sa nagsisimula: may keyboard sa ilalim ng Typing at Numpad practice, umiilaw ang susunod na key at sinasabi kung aling daliri.',
              'For beginners: a keyboard under Typing and Numpad practice lights up the next key and says which finger to use.',
            )}
          >
            <Toggle
              label={t('Gabay sa keyboard', 'Keyboard guide')}
              checked={s.keyGuide === true}
              onChange={(v) => updateSettings({ keyGuide: v })}
            />
          </SettingRow>
          <SettingRow
            label={t('Tunog kapag nagkamali', 'Sound on a mistake')}
            description={t('Mahinang beep tuwing may mali.', 'A soft beep on every mistake.')}
          >
            <Toggle
              label={t('Tunog kapag nagkamali', 'Sound on a mistake')}
              checked={s.sound}
              onChange={(v) => updateSettings({ sound: v })}
            />
          </SettingRow>
          <SettingRow
            label={t('Tunog kapag tama', 'Sound when correct')}
            description={t(
              'Mahinang tik tuwing tama ang isang numero, record o dokumento.',
              'A soft tick when a number, record or document is correct.',
            )}
          >
            <Toggle
              label={t('Tunog kapag tama', 'Sound when correct')}
              checked={s.soundCorrect === true}
              onChange={(v) => updateSettings({ soundCorrect: v })}
            />
          </SettingRow>
        </div>
      </Section>

      <Section title={t('Backup ng progress', 'Backup of your progress')} className="mb-12">
        <p className="text-stone-800">
          {lang === 'en' ? (
            <>
              Your progress is saved <strong>in this browser only</strong>. Make a backup so it isn&apos;t lost when the
              browser data is cleared or you move to another computer.
            </>
          ) : (
            <>
              Naka-save ang progress mo <strong>sa browser na ito lang</strong>. Mag-backup para hindi ito mawala kapag
              nag-clear ng browser data o lumipat ng computer.
            </>
          )}
        </p>
        {/* The backup reminder: amber when it's time (5+ results and no backup for a week). */}
        <p className={'mt-2 font-semibold ' + (backupDue ? 'text-amber-800' : 'text-stone-700')}>
          {backupStatusText(s.lastBackupAt, new Date(), lang)}
          {backupDue && t(' Mag-backup na ngayon.', ' Make a backup now.')}
        </p>
        <HelpTip label={t('Paano mag-backup?', 'How do I make a backup?')}>
          {t(
            'Pindutin ang "I-download ang backup". May file na mase-save sa computer mo (hal. sa Downloads). Kapag kailangan mo nang ibalik, pindutin ang "Ibalik mula sa backup" at piliin ang file na iyon.',
            'Press "Download a backup". A file is saved on your computer (e.g. in Downloads). When you need it back, press "Restore from a backup" and choose that file.',
          )}
        </HelpTip>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={() => downloadBackup(data)}>{t('I-download ang backup', 'Download a backup')}</Button>
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
            {t('Ibalik mula sa backup…', 'Restore from a backup…')}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            aria-label={t('Piliin ang backup file', 'Choose the backup file')}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>

        {pendingImport && (
          <div
            role="alertdialog"
            aria-labelledby="import-title"
            className="mt-5 rounded-r-lg border-l-4 border-amber-500 bg-amber-50 p-5"
          >
            <h3 id="import-title" className="text-lg font-bold text-amber-950">
              {t('Palitan ang kasalukuyang progress?', 'Replace your current progress?')}
            </h3>
            <p className="mt-1 text-amber-950">
              {t(
                `May ${pendingImport.sessions.length} session ang backup file. Papalitan nito ang kasalukuyan mong ${data.sessions.length} session at settings. Hindi na ito maibabalik.`,
                `The backup file has ${pendingImport.sessions.length} sessions. It replaces your current ${data.sessions.length} sessions and settings. This can't be undone.`,
              )}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button onClick={confirmImport}>{t('Oo, palitan', 'Yes, replace')}</Button>
              <Button variant="secondary" onClick={() => setPendingImport(null)}>
                {t('Huwag na', 'Cancel')}
              </Button>
            </div>
          </div>
        )}
      </Section>

      {/* Folded, so the dangerous part doesn't take space (or attention) until it's needed. */}
      <details className="group border-t border-stone-300 pt-4">
        <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded font-semibold text-red-800 hover:text-red-900 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-brand-600 [&::-webkit-details-marker]:hidden">
          <span aria-hidden="true" className="inline-block transition-transform group-open:rotate-90">
            ›
          </span>
          {t('Burahin ang lahat ng data', 'Delete all data')}
        </summary>
        <div className="mt-4 border-l-4 border-red-300 pl-5">
          <p className="mb-4 text-stone-800">
            {lang === 'en' ? (
              <>
                This deletes <strong>all</strong> sessions, assessments and settings. Make a backup first if you want to
                keep them.
              </>
            ) : (
              <>
                Buburahin nito ang <strong>lahat</strong> ng session, assessment, at settings. Mag-backup muna kung
                gusto mo pang itago ang mga ito.
              </>
            )}
          </p>
          <label htmlFor="reset-confirm" className="mb-2 block font-semibold text-stone-900">
            {t('Para sigurado, i-type ang salitang', 'To be sure, type the word')}{' '}
            <span className="font-mono text-red-700">{resetWord}</span>
          </label>
          <div className="flex flex-wrap gap-3">
            <input
              id="reset-confirm"
              type="text"
              autoComplete="off"
              value={resetText}
              onChange={(e) => setResetText(e.target.value)}
              className="w-56 rounded-lg border-[1.5px] border-stone-500 px-4 py-2.5 font-mono text-lg focus:border-red-600 focus:outline-none focus:ring-4 focus:ring-red-200"
            />
            <Button variant="danger" disabled={resetText.trim().toUpperCase() !== resetWord} onClick={resetAll}>
              {t('Burahin ang lahat', 'Delete everything')}
            </Button>
          </div>
        </div>
      </details>
    </div>
  );
}
