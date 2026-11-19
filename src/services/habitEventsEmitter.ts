import { toDayKey } from '../utils/date';
import { currentUserId, onLocalChange } from './cloudSync';
import { firebaseEnabled, loadedFirebase } from './firebase';
import { detectEvents, eventId } from './habitEvents';

/**
 * Write events to Firestore `events/` while signed in. A repeat write of the same event is
 * refused by the rules (events are immutable); that refusal is expected and ignored.
 * Firestore queues writes made offline and sends them when the connection returns.
 */
export function startHabitEvents(): void {
  if (!firebaseEnabled) return;
  onLocalChange((prev, next) => {
    const uid = currentUserId();
    const fb = loadedFirebase();
    if (!uid || !fb) return;
    const { doc, setDoc } = fb.firestoreSdk;
    for (const event of detectEvents(prev, next, toDayKey(new Date()))) {
      setDoc(doc(fb.db, 'events', eventId(uid, event)), {
        ...event,
        userId: uid,
        occurredAt: Date.now(),
        source: 'language',
      }).catch(() => {
        // Already sent (immutable) or offline write rejected: nothing else to do.
      });
    }
  });
}
