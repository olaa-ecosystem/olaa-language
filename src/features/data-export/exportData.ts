/**
 * "Download my data" (Ecosystem PRD v1.0 §12, user data export): everything the app stores
 * about the learner, as a readable JSON file. Nothing is sent anywhere; the file is made in
 * the browser.
 */
import type { AppState } from '../../stores/appState';

export const EXPORT_FORMAT = 'olaa-language-export';
export const EXPORT_VERSION = 1;

export function buildExport(state: AppState, now: Date, accountEmail: string | null) {
  return {
    format: EXPORT_FORMAT,
    formatVersion: EXPORT_VERSION,
    exportedAt: now.toISOString(),
    account: accountEmail ? { email: accountEmail } : null,
    data: state,
  };
}

export function exportFileName(now: Date): string {
  return `olaa-language-${now.toISOString().slice(0, 10)}.json`;
}

/** Save the export as a file (browser only). */
export function downloadExport(state: AppState, accountEmail: string | null): void {
  const now = new Date();
  const blob = new Blob([JSON.stringify(buildExport(state, now, accountEmail), null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = exportFileName(now);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
