import { Gesture } from '../game-state.js';

const MEDIAPIPE_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';

let recognizer = null;
let lastResult = null;

const GESTURE_MAP = {
  'Closed_Fist': Gesture.ROCK,
  'Open_Palm': Gesture.PAPER,
  'Victory': Gesture.SCISSORS,
};

export async function initGestureRecognizer() {
  const { GestureRecognizer, FilesetResolver } = await import(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/+esm'
  );

  const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_CDN);

  recognizer = await GestureRecognizer.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numHands: 1,
  });
}

export function detectGesture(videoElement, timestampMs) {
  if (!recognizer) return null;
  const results = recognizer.recognizeForVideo(videoElement, timestampMs);
  if (!results.gestures || results.gestures.length === 0) {
    lastResult = null;
    return null;
  }
  const topGesture = results.gestures[0][0];
  const mapped = GESTURE_MAP[topGesture.categoryName] ?? null;
  lastResult = mapped;
  return mapped;
}

export function getLastGesture() {
  return lastResult;
}
