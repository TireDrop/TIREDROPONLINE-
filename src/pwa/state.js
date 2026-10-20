// Shared, tiny store between the code that runs at page load (register.js
// catches beforeinstallprompt and service worker updates, which can fire
// before React mounts) and the React pieces that show them
// (UpdateToast.jsx, src/components/app/InstallPrompt.jsx).
//
// Read it with useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot).
// The snapshot object is replaced, never mutated, on every change.

const SERVER = Object.freeze({ installEvent: null, updateReady: false, installed: false });

let snapshot = { installEvent: null, updateReady: false, installed: false };
const listeners = new Set();

export const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
export const getSnapshot = () => snapshot;
export const getServerSnapshot = () => SERVER;

export function setState(patch) {
  snapshot = { ...snapshot, ...patch };
  for (const listener of [...listeners]) listener();
}

// The registration whose waiting worker the update toast would activate.
let registration = null;
export const setRegistration = (reg) => {
  registration = reg;
};
export const getRegistration = () => registration;
