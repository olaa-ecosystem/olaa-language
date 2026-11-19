import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { startCloudSync } from './services/cloudSync';
import { startHabitEvents } from './services/habitEventsEmitter';
import './styles/global.css';
import './styles/layout.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root not found');

startCloudSync();
startHabitEvents();

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
