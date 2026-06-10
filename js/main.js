import { initGestureRecognizer } from './mediapipe/gesture.js';
import { initHandLandmarker }    from './mediapipe/hand-direction.js';
import { initFaceLandmarker }    from './mediapipe/face-direction.js';
import {
  State, createGameState, resolveJanken, randomGesture, randomDirection,
  DIRECTION_ARROW,
} from './game-state.js';
import {
  startGestureCollection, stopGestureCollection, getMajorityGesture,
} from './janken.js';
import {
  resetDirectionDetectors, getPlayerPointDirection, getPlayerFaceDirection,
} from './acchi-muite-hoi.js';
import {
  showScreen, setCountdown, setDetectedGesture, showJankenResult,
  setAcchiAnnounce, showAcchiDirections, revealRobotArrow,
  updatePlayerArrow, setAcchiResult, showGameOver, updateScore,
  setDirectionIndicator,
} from './ui.js';
import {
  playCountdownBeep, playGoBeep, playWinSound, playLoseSound,
  playDrawSound, playMatchSound,
} from './audio.js';

// ── DOM refs ─────────────────────────────────────────────────────────────────
const videoEl   = document.getElementById('webcam');
const overlayEl = document.getElementById('overlay');
const btnStart  = document.getElementById('btn-start');
const btnRetry  = document.getElementById('btn-retry');

// ── State ────────────────────────────────────────────────────────────────────
let game = createGameState();
let rafId = null;
let overlayCtx = null;

// ── Boot ─────────────────────────────────────────────────────────────────────
async function boot() {
  // Camera requires HTTPS or localhost — file:// won't work
  if (!window.isSecureContext) {
    showError('Serve over HTTP (not file://) — open a terminal and run: npx serve .');
    return;
  }

  try {
    await startCamera();
  } catch (err) {
    const msg = err.name === 'NotAllowedError'
      ? 'Camera permission denied — allow camera access and reload'
      : err.name === 'NotReadableError'
      ? 'Camera is in use by another app (Teams, Zoom…) — close it and reload'
      : `Camera error: ${err.message}`;
    showError(msg);
    console.error(err);
    return;
  }

  try {
    btnStart.textContent = 'Loading AI models...';
    await Promise.all([
      initGestureRecognizer(),
      initHandLandmarker(),
      initFaceLandmarker(),
    ]);
    btnStart.disabled = false;
    btnStart.textContent = 'Start';
  } catch (err) {
    showError(`Model load error: ${err.message}`);
    console.error(err);
  }
}

function showError(msg) {
  btnStart.textContent = '⚠ Error';
  btnStart.disabled = true;
  const p = document.createElement('p');
  p.style.cssText = 'color:#f85149;font-size:.9rem;margin-top:8px;max-width:280px;text-align:center';
  p.textContent = msg;
  btnStart.insertAdjacentElement('afterend', p);
  console.error(msg);
}

async function startCamera() {
  let stream;
  try {
    // Try preferred constraints first
    stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: 'user' },
      audio: false,
    });
  } catch (e) {
    if (e.name === 'NotReadableError' || e.name === 'OverconstrainedError') {
      // Camera busy or constraints unsupported — retry with no constraints
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    } else {
      throw e;
    }
  }
  videoEl.srcObject = stream;
  await new Promise(res => videoEl.onloadedmetadata = res);
  overlayEl.width  = videoEl.videoWidth;
  overlayEl.height = videoEl.videoHeight;
  overlayCtx = overlayEl.getContext('2d');
}

// ── Button handlers ───────────────────────────────────────────────────────────
btnStart.addEventListener('click', () => {
  btnStart.disabled = true;
  game = createGameState();
  updateScore(0, 0, 1);
  transitionTo(State.JANKEN_COUNTDOWN);
});

btnRetry.addEventListener('click', () => {
  game = createGameState();
  updateScore(0, 0, 1);
  transitionTo(State.JANKEN_COUNTDOWN);
});

// ── State machine ─────────────────────────────────────────────────────────────
function transitionTo(newState) {
  game.state = newState;
  showScreen(newState);

  if (newState === State.JANKEN_COUNTDOWN) {
    runCountdown();
  } else if (newState === State.JANKEN_DETECTION) {
    runDetection();
  } else if (newState === State.JANKEN_RESULT) {
    runJankenResult();
  } else if (newState === State.ACCHI_MUITE_HOI) {
    runAcchi();
  } else if (newState === State.GAME_OVER) {
    runGameOver();
  }
}

// ── Janken countdown: 3 → 2 → 1 → Go ────────────────────────────────────────
async function runCountdown() {
  for (const n of [3, 2, 1]) {
    setCountdown(n);
    playCountdownBeep();
    await wait(900);
  }
  setCountdown('Go!');
  playGoBeep();
  await wait(300);
  transitionTo(State.JANKEN_DETECTION);
}

// ── Gesture detection window ─────────────────────────────────────────────────
async function runDetection() {
  setDetectedGesture(null);
  startGestureCollection(videoEl);

  const WINDOW_MS = 1200;
  const start = performance.now();

  await new Promise(res => {
    const tick = () => {
      if (performance.now() - start >= WINDOW_MS) { res(); return; }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  stopGestureCollection();

  const playerGesture = getMajorityGesture();
  const cpuGesture    = randomGesture();

  game.playerGesture = playerGesture;
  game.cpuGesture    = cpuGesture;

  setDetectedGesture(playerGesture);
  await wait(400);

  if (!playerGesture) {
    // No gesture detected — redo
    setCountdown('Try again!');
    await wait(1000);
    transitionTo(State.JANKEN_COUNTDOWN);
    return;
  }

  game.jankenWinner = resolveJanken(playerGesture, cpuGesture);
  transitionTo(State.JANKEN_RESULT);
}

// ── Janken result display ─────────────────────────────────────────────────────
async function runJankenResult() {
  showJankenResult(game.playerGesture, game.cpuGesture, game.jankenWinner);

  if (game.jankenWinner === 'draw') {
    playDrawSound();
    await wait(1800);
    transitionTo(State.JANKEN_COUNTDOWN);
    return;
  }

  if (game.jankenWinner === 'player') playWinSound();
  else playLoseSound();

  await wait(2000);
  transitionTo(State.ACCHI_MUITE_HOI);
}

// ── Acchi Muite Hoi ───────────────────────────────────────────────────────────
async function runAcchi() {
  resetDirectionDetectors();
  if (game.jankenWinner === 'player') {
    await runPlayerPointsPhase();
  } else {
    await runCpuPointsPhase();
  }
}

// Player won Janken → player points, robot turns its face, compare
async function runPlayerPointsPhase() {
  game.pointer = 'player';

  // Announce
  setAcchiAnnounce('YOU WON! 🎉', 'Point your finger in any direction!');
  await wait(1200);
  setAcchiAnnounce('Point your finger!', 'Hold it steady — it will lock in automatically...');

  // Detect player pointing direction
  const playerDir = await waitForStableDirection('hand');
  if (!playerDir) { await handleAcchiTimeout(); return; }

  // Confirmed — show player's locked direction, then reveal robot
  setDirectionIndicator(DIRECTION_ARROW[playerDir]);
  setAcchiAnnounce('Locked! ' + DIRECTION_ARROW[playerDir], 'What will the Robot do...?');
  showAcchiDirections(DIRECTION_ARROW[playerDir], '🤔', 'Your point', 'Robot turns');
  await wait(1000);

  // Reveal robot face direction with pop-in animation
  game.cpuDirection = randomDirection();
  revealRobotArrow(game.cpuDirection);
  await wait(900);

  // Compare
  if (playerDir === game.cpuDirection) {
    setAcchiResult('MATCH! YOU WIN! 🎉', 'win');
    playWinSound();
    await wait(2200);
    game.scorePlayer++;
    updateScore(game.scorePlayer, game.scoreCpu, game.round);
    showGameOver('player');
    showScreen(State.GAME_OVER);
  } else {
    setAcchiResult('No Match! Back to Janken!', 'draw');
    playDrawSound();
    await wait(1600);
    game.round++;
    updateScore(game.scorePlayer, game.scoreCpu, game.round);
    transitionTo(State.JANKEN_COUNTDOWN);
  }
}

// CPU won Janken → robot points visibly, player must look away, compare
async function runCpuPointsPhase() {
  game.pointer      = 'cpu';
  game.cpuDirection = randomDirection();

  // Show what the robot is pointing at — no hidden information
  setAcchiAnnounce('ROBOT WON!', `Robot points: ${DIRECTION_ARROW[game.cpuDirection]}`);
  await wait(1400);

  setAcchiAnnounce('Look the other way!', `Do NOT turn toward ${DIRECTION_ARROW[game.cpuDirection]}`);
  showAcchiDirections('?', DIRECTION_ARROW[game.cpuDirection], 'You look', 'Robot points');
  await wait(600);

  // Detect player face direction
  const playerDir = await waitForStableDirection('face');
  if (!playerDir) { await handleAcchiTimeout(); return; }

  // Reveal player face direction with pop-in animation
  updatePlayerArrow(playerDir);
  await wait(600);

  // Compare
  if (playerDir === game.cpuDirection) {
    setAcchiResult('MATCH! YOU LOSE! 💥', 'lose');
    playMatchSound();
    await wait(2200);
    game.scoreCpu++;
    updateScore(game.scorePlayer, game.scoreCpu, game.round);
    showGameOver('cpu');
    showScreen(State.GAME_OVER);
  } else {
    setAcchiResult('Safe! Back to Janken! 😅', 'win');
    playDrawSound();
    await wait(1600);
    game.round++;
    updateScore(game.scorePlayer, game.scoreCpu, game.round);
    transitionTo(State.JANKEN_COUNTDOWN);
  }
}

// Poll until a stable direction is detected or timeout
async function waitForStableDirection(type, timeoutMs = 10000) {
  const start = performance.now();
  while (true) {
    await animFrame();
    if (performance.now() - start > timeoutMs) return null;
    const dir = type === 'hand'
      ? getPlayerPointDirection(videoEl)
      : getPlayerFaceDirection(videoEl);
    setDirectionIndicator(dir ? DIRECTION_ARROW[dir] : '');
    if (dir) return dir;
  }
}

async function handleAcchiTimeout() {
  setAcchiAnnounce('Time up!', 'Next round...');
  await wait(1200);
  game.round++;
  updateScore(game.scorePlayer, game.scoreCpu, game.round);
  transitionTo(State.JANKEN_COUNTDOWN);
}

function runGameOver() {
  // Screen and score already set inside each phase function
  btnStart.disabled = false;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function wait(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function animFrame() {
  return new Promise(res => requestAnimationFrame(res));
}

// ── Init ──────────────────────────────────────────────────────────────────────
btnStart.disabled = true;
btnStart.textContent = 'Loading...';
boot();
