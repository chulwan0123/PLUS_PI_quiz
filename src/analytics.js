import { supabase } from './supabase';

// Fire-and-forget participation logging for the kiosk statistics in /admin.
// Logging must never block or break the quiz, so every failure is swallowed.

const DEVICE_KEY = 'plus-pi-quiz-device-id';

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function getDeviceId() {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = makeId();
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

const isAdminPath = () => typeof window !== 'undefined'
  && ['/admin', '/suri-review'].includes(window.location.pathname);

export function newRoundId() {
  return makeId();
}

export function trackQuizEvent(eventType, roundId, fields = {}) {
  if (!supabase || !roundId || isAdminPath()) return;
  const row = {
    event_type: eventType,
    round_id: roundId,
    device_id: getDeviceId(),
    client_at: new Date().toISOString(),
    ...fields,
  };
  try {
    supabase
      .from('quiz_events')
      .insert(row)
      .then(({ error }) => {
        if (error) console.warn('[quiz-stats]', error.message);
      }, () => {});
  } catch {
    // ignore
  }
}
