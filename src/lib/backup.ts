/**
 * Download the backup file (encodojo-progress-YYYY-MM-DD.json) and remember when, for
 * "Huling backup: ..." and the reminders. Used by Settings, the Home reminder, and the
 * Assessment report (so the user never has to go looking for it).
 */
import { exportFileName, exportJson, type AppData } from './storage';
import { updateSettings } from './useAppData';

export function downloadBackup(data: AppData) {
  const blob = new Blob([exportJson(data)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = exportFileName();
  link.click();
  URL.revokeObjectURL(url);
  updateSettings({ lastBackupAt: new Date().toISOString(), backupSnoozeUntil: undefined });
}
