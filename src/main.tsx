import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { useLocale } from './i18n/locale';
import { startCloudSync } from './services/cloudSync';
import { startHabitEvents } from './services/habitEventsEmitter';
import './styles/global.css';
import './styles/layout.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root not found');

startCloudSync();
startHabitEvents();

/** Remount on a language change so every screen re-reads its text. */
function Root() {
  const locale = useLocale();
  return <App key={locale} />;
}

createRoot(root).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
