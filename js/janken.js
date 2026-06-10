import { detectGesture } from './mediapipe/gesture.js';
import { Gesture } from './game-state.js';

// Collect gesture samples during detection window and return the most frequent.
const SAMPLE_WINDOW_MS = 1200;
const SAMPLE_INTERVAL_MS = 80;

let samples = [];
let collecting = false;
let intervalId = null;

export function startGestureCollection(videoEl) {
  samples = [];
  collecting = true;
  intervalId = setInterval(() => {
    const g = detectGesture(videoEl, performance.now());
    if (g) samples.push(g);
  }, SAMPLE_INTERVAL_MS);
}

export function stopGestureCollection() {
  collecting = false;
  clearInterval(intervalId);
  intervalId = null;
}

// Returns the most frequent gesture from collected samples, or null.
export function getMajorityGesture() {
  if (samples.length === 0) return null;
  const counts = {};
  for (const g of samples) counts[g] = (counts[g] ?? 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

export { detectGesture };
