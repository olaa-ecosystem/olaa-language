/**
 * Entry point: the interface (Olaa Note / Habits glass style) plus the data services —
 * account sync and the events sent to Olaa Habits.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { startTheme } from './app/theme';
import { startCloudSync } from './services/cloudSync';
import { startHabitEvents } from './services/habitEventsEmitter';
import './styles/fonts.css';
import './styles/app.css';

startTheme();
startCloudSync();
startHabitEvents();

const root = document.getElementById('root');
if (root)
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
