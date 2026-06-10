import { Direction } from '../game-state.js';

const MEDIAPIPE_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';

let landmarker = null;

const H_THRESHOLD = 0.04;
const V_THRESHOLD = 0.03;
const STABLE_FRAMES = 5;

let stableCount = 0;
let lastCandidate = null;

export async function initFaceLandmarker() {
  const { FaceLandmarker, FilesetResolver } = await import(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/+esm'
  );

  const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_CDN);

  landmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numFaces: 1,
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: false,
  });
}

export function detectFaceDirection(videoElement, timestampMs) {
  if (!landmarker) return null;

  const results = landmarker.detectForVideo(videoElement, timestampMs);
  if (!results.faceLandmarks || results.faceLandmarks.length === 0) {
    stableCount = 0;
    lastCandidate = null;
    return null;
  }

  const face = results.faceLandmarks[0];

  // Landmark indices
  const nose      = face[4];
  const leftEye   = face[33];
  const rightEye  = face[263];

  const eyeMidX = (leftEye.x + rightEye.x) / 2;
  const eyeMidY = (leftEye.y + rightEye.y) / 2;

  // dx: positive → nose to the right of eye-mid → face turned RIGHT (mirrored)
  const dx = -(nose.x - eyeMidX);
  const dy = nose.y - eyeMidY;

  // Calibrate vertical: nose should be below eye-mid center when looking straight
  // We compare nose Y relative to the expected neutral Y (eye-mid + some offset)
  const eyeSpan = Math.abs(rightEye.x - leftEye.x);
  const neutralOffsetY = eyeSpan * 0.5;
  const dyCal = dy - neutralOffsetY;

  const absH = Math.abs(dx);
  const absV = Math.abs(dyCal);

  if (absH < H_THRESHOLD && absV < V_THRESHOLD) {
    stableCount = 0;
    lastCandidate = null;
    return null;
  }

  let candidate;
  if (absH >= absV) {
    candidate = dx > 0 ? Direction.RIGHT : Direction.LEFT;
  } else {
    candidate = dyCal < 0 ? Direction.UP : Direction.DOWN;
  }

  if (candidate === lastCandidate) {
    stableCount++;
  } else {
    lastCandidate = candidate;
    stableCount = 1;
  }

  return stableCount >= STABLE_FRAMES ? candidate : null;
}

export function resetFaceStability() {
  stableCount = 0;
  lastCandidate = null;
}
