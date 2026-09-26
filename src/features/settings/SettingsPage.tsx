import { useRef, useState } from 'react';
import { SettingsIcon } from '../../components/icons';
import { Button, Card, Checkbox, HelpTip, Notice, PageHeader } from '../../components/ui';
import { defaultData, exportFileName, exportJson, parseImport, type AppData } from '../../lib/storage';
import { replaceAppData, updateAppData, updateSettings, useAppData } from '../../lib/useAppData';

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
  'w-full max-w-sm rounded-lg border-2 border-slate-400 bg-white px-4 py-2.5 text-lg ' +
  'focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-200';

export default function SettingsPage() {
  const data = useAppData();
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
        ? { kind: 'success', text: '✓ Naibalik na ang progress mo mula sa backup.' }
        : { kind: 'warning', text: 'Nabasa ang backup, pero hindi ito ma-save ng browser. Subukan sa ibang browser.' },
    );
  }

  function resetAll() {
    replaceAppData(defaultData());
    setResetText('');
    setMessage({ kind: 'success', text: '✓ Nabura na ang lahat. Parang bago ulit ang EncoDojo.' });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<SettingsIcon className="h-8 w-8" />}
        title="Settings"
        description="Dito mo maaayos ang pangalan, laki ng text, at backup ng progress mo."
      />

      {message && <Notice kind={message.kind}>{message.text}</Notice>}

      <Card title="Ikaw at ang itsura ng app">
        <div className="space-y-6">
          <div>
            <label htmlFor="display-name" className="mb-2 block text-lg font-semibold text-slate-900">
              Pangalan mo
            </label>
            <input
              id="display-name"
              type="text"
              maxLength={40}
              placeholder="Hal. Juan"
              value={data.profile.displayName}
              onChange={(e) =>
                updateAppData((d) => ({ ...d, profile: { ...d.profile, displayName: e.target.value } }))
              }
              className={inputClass}
            />
            <p className="mt-1 text-sm text-slate-600">Para batiin ka sa Home page. Hindi ito ipinapadala kahit saan.</p>
          </div>

          <Checkbox
            label="Mas malaking text"
            description="Palakihin ang lahat ng sulat at button. Makakatulong kung malabo ang mata o maliit ang screen."
            checked={data.settings.largeText}
            onChange={(v) => updateSettings({ largeText: v })}
          />
          <Checkbox
            label="Ipakita ang score habang nagpa-practice"
            description="Makikita ang bilis at accuracy habang tumatakbo ang oras. (Sa Assessment, laging nakatago ito.)"
            checked={data.settings.showLiveStats}
            onChange={(v) => updateSettings({ showLiveStats: v })}
          />
          <Checkbox
            label="Tunog kapag nagkamali"
            description="Maikling 'beep' tuwing may maling pindot."
            checked={data.settings.sound}
            onChange={(v) => updateSettings({ sound: v })}
          />
        </div>
      </Card>

      <Card title="Backup ng progress">
        <p className="mb-2 text-slate-800">
          Ang progress mo ay naka-save <strong>sa browser na ito lang</strong>. Kapag nag-clear ka ng browser data o
          lumipat ng computer, mawawala ito — kaya mag-backup paminsan-minsan.
        </p>
        <HelpTip label="Paano mag-backup?">
          Pindutin ang &quot;I-download ang backup&quot;. May file na mase-save sa computer mo (hal. sa Downloads). Kapag
          kailangan mo nang ibalik, pindutin ang &quot;Ibalik mula sa backup&quot; at piliin ang file na iyon.
        </HelpTip>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={() => downloadText(exportFileName(), exportJson(data))}>I-download ang backup</Button>
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
            className="mt-5 rounded-xl border-2 border-amber-400 bg-amber-50 p-5"
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
      </Card>

      <Card title="Burahin lahat" className="border-red-200">
        <p className="mb-4 text-slate-800">
          Buburahin nito ang <strong>lahat</strong> ng session, assessment, at settings. Mag-backup muna kung gusto mo
          pang itago ang mga ito.
        </p>
        <label htmlFor="reset-confirm" className="mb-2 block font-semibold text-slate-900">
          Para sigurado, i-type ang salitang <span className="font-mono text-red-700">{RESET_WORD}</span>
        </label>
        <div className="flex flex-wrap gap-3">
          <input
            id="reset-confirm"
            type="text"
            autoComplete="off"
            value={resetText}
            onChange={(e) => setResetText(e.target.value)}
            className="w-56 rounded-lg border-2 border-slate-400 px-4 py-2.5 font-mono text-lg focus:border-red-600 focus:outline-none focus:ring-4 focus:ring-red-200"
          />
          <Button variant="danger" disabled={resetText.trim().toUpperCase() !== RESET_WORD} onClick={resetAll}>
            Burahin ang lahat
          </Button>
        </div>
      </Card>
    </div>
  );
}
