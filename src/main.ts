/**
 * Entry point. The interface (frontend) has been removed and will be imported later; it
 * mounts into #root. Until then only the data services run: account sync and the events
 * sent to Olaa Habits.
 */
import { startCloudSync } from './services/cloudSync';
import { startHabitEvents } from './services/habitEventsEmitter';

startCloudSync();
startHabitEvents();
