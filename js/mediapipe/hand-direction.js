import { Direction } from '../game-state.js';

const MEDIAPIPE_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';

let landmarker = null;

const THRESHOLD = 0.12;      // minimum displacement to register
const STABLE_FRAMES = 5;     // frames direction must hold before acceptance

let stableCount = 0;
let lastCandidate = null;

export async function initHandLandmarker() {
  const { HandLandmarker, FilesetResolver } = await import(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/+esm'
  );

  const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_CDN);

  landmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numHands: 1,
  });
}

export function detectHandDirection(videoElement, timestampMs) {
  if (!landmarker) return null;

  const results = landmarker.detectForVideo(videoElement, timestampMs);
  if (!results.landmarks || results.landmarks.length === 0) {
    stableCount = 0;
    lastCandidate = null;
    return null;
  }

  const hand = results.landmarks[0];
  const base = hand[5];  // Index MCP
  const tip  = hand[8];  // Index Tip

  // Video is mirrored in CSS — flip dx back to real-world direction
  const dx = -(tip.x - base.x);
  const dy = tip.y - base.y;

  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (absDx < THRESHOLD && absDy < THRESHOLD) {
    stableCount = 0;
    lastCandidate = null;
    return null;
  }

  let candidate;
  if (absDx >= absDy) {
    candidate = dx > 0 ? Direction.RIGHT : Direction.LEFT;
  } else {
    candidate = dy > 0 ? Direction.DOWN : Direction.UP;
  }

  if (candidate === lastCandidate) {
    stableCount++;
  } else {
    lastCandidate = candidate;
    stableCount = 1;
  }

  return stableCount >= STABLE_FRAMES ? candidate : null;
}

export function resetHandStability() {
  stableCount = 0;
  lastCandidate = null;
}
