/** Light / Dark / Device theme (UI/UX PRD question 6). Applied as `data-theme` on <html>. */
import { createLocalStore } from '../services/localStore';

export type Theme = 'light' | 'dark' | 'system';

export const themeStore = createLocalStore<Theme>(
  'olaa-language/theme',
  () => 'system',
  (v): v is Theme => v === 'light' || v === 'dark' || v === 'system',
);

function apply(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
}

export function startTheme(): void {
  apply(themeStore.get());
  themeStore.subscribe(() => apply(themeStore.get()));
}

export function nextTheme(theme: Theme): Theme {
  return theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system';
}
