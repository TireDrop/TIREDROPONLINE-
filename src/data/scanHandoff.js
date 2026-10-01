/**
 * One photo handed from a page's Scan button (the home hero, /tires) to the
 * Tire Size Finder, which reads it. In memory only: the File object lives
 * in this module for the moment between the camera closing and the finder
 * mounting, and the finder takes it (so a reload or Back never re-sends it).
 * Nothing is written to storage, the URL or history state.
 */

let pending = null;

/** Keeps the photo for the finder to pick up. */
export function handOffPhoto(file) {
  pending = file ?? null;
}

/** The photo handed off, once: the next call returns null. */
export function takeHandedOffPhoto() {
  const file = pending;
  pending = null;
  return file;
}
