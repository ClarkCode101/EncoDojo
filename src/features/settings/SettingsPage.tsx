import { useRef, useState } from 'react';
import { Button, Card, PageHeader } from '../../components/ui';
import { defaultData, exportFileName, exportJson, parseImport, type AppData } from '../../lib/storage';
import { replaceAppData, updateAppData, updateSettings, useAppData } from '../../lib/useAppData';

const RESET_WORD = 'RESET';

function downloadText(fileName: string, text: string) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3">
      <input
        type="checkbox"
        className="mt-1 h-4 w-4"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        <span className="block font-medium text-slate-800">{label}</span>
        <span className="block text-sm text-slate-600">{description}</span>
      </span>
    </label>
  );
}

export default function SettingsPage() {
  const data = useAppData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pendingImport, setPendingImport] = useState<AppData | null>(null);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [resetText, setResetText] = useState('');

  async function handleFile(file: File | undefined) {
    setMessage(null);
    setPendingImport(null);
    if (!file) return;
    const result = parseImport(await file.text());
    if (result.ok) {
      setPendingImport(result.data);
    } else {
      setMessage({ kind: 'error', text: result.error });
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
        ? { kind: 'ok', text: 'Progress imported.' }
        : { kind: 'error', text: 'Imported, but the browser could not save it. Check storage settings.' },
    );
  }

  function resetAll() {
    replaceAppData(defaultData());
    setResetText('');
    setMessage({ kind: 'ok', text: 'All data has been reset.' });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Everything is saved in this browser only." />

      {message && (
        <div
          role="status"
          className={
            'rounded-md border px-4 py-3 text-sm ' +
            (message.kind === 'ok'
              ? 'border-green-300 bg-green-50 text-green-900'
              : 'border-red-300 bg-red-50 text-red-900')
          }
        >
          {message.text}
        </div>
      )}

      <Card title="Profile & practice">
        <div className="space-y-5">
          <div>
            <label htmlFor="display-name" className="mb-1 block font-medium text-slate-800">
              Display name
            </label>
            <input
              id="display-name"
              type="text"
              maxLength={40}
              value={data.profile.displayName}
              onChange={(e) =>
                updateAppData((d) => ({ ...d, profile: { ...d.profile, displayName: e.target.value } }))
              }
              className="w-full max-w-sm rounded-md border border-slate-300 px-3 py-2 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <p className="text-sm text-slate-600">
            Difficulty is now chosen on each training page (Typing Test and Numpad Drill).
          </p>

          <Toggle
            label="Show live stats"
            description="Show WPM / KPH and accuracy while you train. The timer is always shown. (The Assessment never shows live stats.)"
            checked={data.settings.showLiveStats}
            onChange={(v) => updateSettings({ showLiveStats: v })}
          />
          <Toggle
            label="Sound"
            description="Play a short beep when you make a mistake."
            checked={data.settings.sound}
            onChange={(v) => updateSettings({ sound: v })}
          />
        </div>
      </Card>

      <Card title="Backup your progress">
        <p className="mb-4 text-sm text-slate-700">
          Your progress is stored only in this browser. Export a backup file regularly, especially
          before clearing your browser data or switching computers.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => downloadText(exportFileName(), exportJson(data))}>Export progress</Button>
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
            Import progress…
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            aria-label="Choose a progress file to import"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>

        {pendingImport && (
          <div role="alertdialog" aria-labelledby="import-title" className="mt-4 rounded-md border border-amber-300 bg-amber-50 p-4">
            <h3 id="import-title" className="font-semibold text-amber-900">
              Replace your current progress?
            </h3>
            <p className="mt-1 text-sm text-amber-900">
              This file has {pendingImport.sessions.length} sessions. Your current{' '}
              {data.sessions.length} sessions and settings will be replaced. This cannot be undone.
            </p>
            <div className="mt-3 flex gap-3">
              <Button onClick={confirmImport}>Yes, replace</Button>
              <Button variant="secondary" onClick={() => setPendingImport(null)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Card title="Danger zone">
        <p className="mb-3 text-sm text-slate-700">
          Delete all sessions and settings. Export first if you want to keep a copy.
        </p>
        <label htmlFor="reset-confirm" className="mb-1 block text-sm font-medium text-slate-800">
          Type <span className="font-mono font-bold">{RESET_WORD}</span> to confirm
        </label>
        <div className="flex flex-wrap gap-3">
          <input
            id="reset-confirm"
            type="text"
            autoComplete="off"
            value={resetText}
            onChange={(e) => setResetText(e.target.value)}
            className="w-48 rounded-md border border-slate-300 px-3 py-2 font-mono focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600"
          />
          <Button variant="danger" disabled={resetText !== RESET_WORD} onClick={resetAll}>
            Reset all data
          </Button>
        </div>
      </Card>
    </div>
  );
}
