import { detectHandDirection, resetHandStability } from './mediapipe/hand-direction.js';
import { detectFaceDirection, resetFaceStability }  from './mediapipe/face-direction.js';

export function resetDirectionDetectors() {
  resetHandStability();
  resetFaceStability();
}

// Returns stable hand direction or null
export function getPlayerPointDirection(videoEl) {
  return detectHandDirection(videoEl, performance.now());
}

// Returns stable face direction or null
export function getPlayerFaceDirection(videoEl) {
  return detectFaceDirection(videoEl, performance.now());
}
