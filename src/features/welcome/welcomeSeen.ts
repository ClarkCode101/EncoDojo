/**
 * The welcome screen shows every time the app is OPENED (owner's choice 2026-10-01), so it
 * remembers "already welcomed" only for this browser tab (sessionStorage): moving between pages
 * or reloading the same tab does not show it again; a new tab or a new visit does.
 */
const KEY = 'encodojo:welcomed';

export function shouldShowWelcome(): boolean {
  try {
    return window.sessionStorage.getItem(KEY) !== '1';
  } catch {
    return true; // storage blocked: show it once for this page load
  }
}

export function markWelcomeSeen() {
  try {
    window.sessionStorage.setItem(KEY, '1');
  } catch {
    // nothing to remember it in; the screen still closes
  }
}
