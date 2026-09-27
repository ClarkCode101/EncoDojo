/**
 * Settings, reorganized 2026-09-27 (owner: "hindi nakaka-overwhelm"): short
 * ruled rows (name + one line on the left, the control on the right) in a few
 * groups; the "delete everything" part is folded away.
 */
import { useRef, useState, type ReactNode } from 'react';
import { SettingsIcon } from '../../components/icons';
import { Button, HelpTip, Notice, PageHeader, Section, SegmentedPicker, Toggle } from '../../components/ui';
import { backupStatusText, needsBackup } from '../../lib/reminders';
import { DAILY_GOALS, defaultData, exportFileName, exportJson, parseImport, type AppData } from '../../lib/storage';
import { replaceAppData, updateAppData, updateSettings, useAppData } from '../../lib/useAppData';

type DailyGoal = (typeof DAILY_GOALS)[number];

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

/** The word to type before everything is deleted. */
const RESET_WORD = 'BURAHIN';

function downloadText(fileName: string, text: string) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

const inputClass =
  'w-full md:w-72 rounded-lg border-[1.5px] border-stone-500 bg-white px-4 py-2.5 text-lg ' +
  'focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-200';

export default function SettingsPage() {
  const data = useAppData();
  const s = data.settings;
  const backupDue = needsBackup(s.lastBackupAt, data.sessions);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pendingImport, setPendingImport] = useState<AppData | null>(null);
  const [message, setMessage] = useState<{ kind: 'success' | 'warning'; text: string } | null>(null);
  const [resetText, setResetText] = useState('');

  async function handleFile(file: File | undefined) {
    setMessage(null);
    setPendingImport(null);
    if (!file) return;
    const result = parseImport(await file.text());
    if (result.ok) {
      setPendingImport(result.data);
    } else {
      setMessage({ kind: 'warning', text: result.error });
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
        ? { kind: 'success', text: 'Naibalik na ang progress mo mula sa backup.' }
        : { kind: 'warning', text: 'Nabasa ang backup, pero hindi ito ma-save ng browser. Subukan sa ibang browser.' },
    );
  }

  function downloadBackup() {
    downloadText(exportFileName(), exportJson(data));
    // Remember when, for "Huling backup: ..." and the reminder.
    updateSettings({ lastBackupAt: new Date().toISOString() });
  }

  function resetAll() {
    replaceAppData(defaultData());
    setResetText('');
    setMessage({ kind: 'success', text: 'Nabura na ang lahat. Parang bago ulit ang EncoDojo.' });
  }

  return (
    <div>
      <PageHeader
        icon={<SettingsIcon className="h-8 w-8" />}
        title="Settings"
        description="Ayusin ang app ayon sa gusto mo. Automatic na nase-save ang bawat pagbabago."
      />

      {message && (
        <Notice kind={message.kind} className="mb-8">
          {message.text}
        </Notice>
      )}

      <Section title="Ikaw" className="mb-12">
        <div className="-mt-4">
          <SettingRow
            id="display-name"
            label="Pangalan mo"
            description="Para batiin ka sa Home. Hindi ito ipinapadala kahit saan."
          >
            <input
              id="display-name"
              type="text"
              maxLength={40}
              placeholder="Hal. Juan"
              value={data.profile.displayName}
              onChange={(e) => updateAppData((d) => ({ ...d, profile: { ...d.profile, displayName: e.target.value } }))}
              className={inputClass}
            />
          </SettingRow>
          <SettingRow
            label="Araw-araw na target"
            description="Ilang practice ang gusto mong gawin bawat araw. Makikita sa sidebar."
          >
            <SegmentedPicker
              label="Araw-araw na target"
              hideLabel
              options={DAILY_GOALS}
              value={
                (DAILY_GOALS as readonly number[]).includes(s.dailyGoal ?? 0) ? ((s.dailyGoal ?? 0) as DailyGoal) : 0
              }
              format={(n) => (n === 0 ? 'Wala' : String(n))}
              onChange={(n) => updateSettings({ dailyGoal: n })}
            />
          </SettingRow>
        </div>
      </Section>

      <Section title="Pagbasa at itsura" className="mb-12">
        <div className="-mt-4">
          <SettingRow label="Mas malaking text" description="Palakihin ang lahat ng sulat at button.">
            <Toggle
              label="Mas malaking text"
              checked={s.largeText}
              onChange={(v) => updateSettings({ largeText: v })}
            />
          </SettingRow>
          <SettingRow
            label="Mas malaking babasahin"
            description="Ang text, numero o dokumentong kokopyahin lang ang lalaki. Kasya pa rin sa screen."
          >
            <Toggle
              label="Mas malaking babasahin"
              checked={s.bigSource === true}
              onChange={(v) => updateSettings({ bigSource: v })}
            />
          </SettingRow>
          <SettingRow
            label="Bawasan ang galaw"
            description="Walang animation, at hindi kusang lalabas ang sinasabi ni Sensei."
          >
            <Toggle
              label="Bawasan ang galaw"
              checked={s.reduceMotion === true}
              onChange={(v) => updateSettings({ reduceMotion: v })}
            />
          </SettingRow>
          <SettingRow label="Si Sensei" description="Mga tip sa kanang-ibaba. Tahimik siya habang nag-eensayo.">
            <SegmentedPicker
              label="Si Sensei"
              hideLabel
              options={['on', 'small', 'off'] as const}
              value={s.sensei ?? 'on'}
              format={(m) => (m === 'on' ? 'Ipakita' : m === 'small' ? 'Maliit' : 'Wala')}
              onChange={(m) => updateSettings({ sensei: m })}
            />
          </SettingRow>
        </div>
      </Section>

      <Section title="Practice at tunog" className="mb-12">
        <div className="-mt-4">
          <SettingRow
            label="English lang"
            description='Walang Tagalog sa tabi ng mga label sa loob ng test (hal. "Name" lang), gaya sa totoong hiring test.'
          >
            <Toggle
              label="English lang"
              checked={s.englishOnly === true}
              onChange={(v) => updateSettings({ englishOnly: v })}
            />
          </SettingRow>
          <SettingRow label="Tunog kapag nagkamali" description="Mahinang beep tuwing may mali.">
            <Toggle label="Tunog kapag nagkamali" checked={s.sound} onChange={(v) => updateSettings({ sound: v })} />
          </SettingRow>
          <SettingRow
            label="Tunog kapag tama"
            description="Mahinang tik tuwing tama ang isang numero, record o dokumento."
          >
            <Toggle
              label="Tunog kapag tama"
              checked={s.soundCorrect === true}
              onChange={(v) => updateSettings({ soundCorrect: v })}
            />
          </SettingRow>
        </div>
      </Section>

      <Section title="Backup ng progress" className="mb-12">
        <p className="text-stone-800">
          Naka-save ang progress mo <strong>sa browser na ito lang</strong>. Mag-backup para hindi ito mawala kapag
          nag-clear ng browser data o lumipat ng computer.
        </p>
        {/* The backup reminder: amber when it's time (5+ results and no backup for a week). */}
        <p className={'mt-2 font-semibold ' + (backupDue ? 'text-amber-800' : 'text-stone-700')}>
          {backupStatusText(s.lastBackupAt)}
          {backupDue && ' Mag-backup na ngayon.'}
        </p>
        <HelpTip label="Paano mag-backup?">
          Pindutin ang &quot;I-download ang backup&quot;. May file na mase-save sa computer mo (hal. sa Downloads).
          Kapag kailangan mo nang ibalik, pindutin ang &quot;Ibalik mula sa backup&quot; at piliin ang file na iyon.
        </HelpTip>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={downloadBackup}>I-download ang backup</Button>
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
            Ibalik mula sa backup…
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            aria-label="Piliin ang backup file"
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
              Palitan ang kasalukuyang progress?
            </h3>
            <p className="mt-1 text-amber-950">
              May {pendingImport.sessions.length} session ang backup file. Papalitan nito ang kasalukuyan mong{' '}
              {data.sessions.length} session at settings. Hindi na ito maibabalik.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button onClick={confirmImport}>Oo, palitan</Button>
              <Button variant="secondary" onClick={() => setPendingImport(null)}>
                Huwag na
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
          Burahin ang lahat ng data
        </summary>
        <div className="mt-4 border-l-4 border-red-300 pl-5">
          <p className="mb-4 text-stone-800">
            Buburahin nito ang <strong>lahat</strong> ng session, assessment, at settings. Mag-backup muna kung gusto mo
            pang itago ang mga ito.
          </p>
          <label htmlFor="reset-confirm" className="mb-2 block font-semibold text-stone-900">
            Para sigurado, i-type ang salitang <span className="font-mono text-red-700">{RESET_WORD}</span>
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
            <Button variant="danger" disabled={resetText.trim().toUpperCase() !== RESET_WORD} onClick={resetAll}>
              Burahin ang lahat
            </Button>
          </div>
        </div>
      </details>
    </div>
  );
}
