/**
 * The backup reminder on Home (owner's request 2026-10-01: "pano malalaman ng user na need
 * i-save ang progress"): one amber line, only when it is time (lib/reminders.ts
 * `showBackupReminder`), with the backup button RIGHT THERE, and "Mamaya na" to hide it
 * for a week.
 */
import { downloadBackup } from '../lib/backup';
import { useT } from '../lib/i18n';
import { BACKUP_SNOOZE_DAYS, showBackupReminder } from '../lib/reminders';
import { updateSettings, useAppData } from '../lib/useAppData';
import { DownloadIcon } from './icons';
import { Button } from './ui';

export default function BackupBanner() {
  const data = useAppData();
  const t = useT();
  const { lastBackupAt, backupSnoozeUntil } = data.settings;
  if (!showBackupReminder(lastBackupAt, data.sessions, backupSnoozeUntil)) return null;

  function snooze() {
    const until = new Date(Date.now() + BACKUP_SNOOZE_DAYS * 24 * 60 * 60 * 1000);
    updateSettings({ backupSnoozeUntil: until.toISOString() });
  }

  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-r-lg border-l-4 border-amber-500 bg-amber-50 px-5 py-3 text-amber-950"
    >
      <p className="min-w-0 flex-1 basis-80">
        <strong>{t('I-backup ang progress mo.', 'Back up your progress.')}</strong>{' '}
        {t(
          'Sa browser na ito lang ito naka-save. Kapag binura ang browser data o lumipat ka ng computer, mawawala ito.',
          'It is saved only in this browser. If the browser data is cleared or you switch computers, it is lost.',
        )}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => downloadBackup(data)}>
          <DownloadIcon className="h-5 w-5" /> {t('I-download ang backup', 'Download a backup')}
        </Button>
        <button
          type="button"
          onClick={snooze}
          className="rounded text-sm text-amber-900 underline decoration-dotted underline-offset-2 hover:text-amber-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"
        >
          {t('Mamaya na', 'Later')}
        </button>
      </div>
    </div>
  );
}
