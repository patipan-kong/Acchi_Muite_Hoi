import { initGestureRecognizer } from './mediapipe/gesture.js';
import { initHandLandmarker }    from './mediapipe/hand-direction.js';
import { initFaceLandmarker }    from './mediapipe/face-direction.js';
import {
  State, createGameState, resolveJanken, randomGesture, randomDirection,
  DIRECTION_ARROW, GESTURE_EMOJI,
} from './game-state.js';
import {
  startGestureCollection, stopGestureCollection, getMajorityGesture,
} from './janken.js';
import {
  resetDirectionDetectors, getPlayerPointDirection, getPlayerFaceDirection,
} from './acchi-muite-hoi.js';
import {
  showScreen, setCountdown, setDetectedGesture, showJankenResult,
  setAcchiInstruction, setAcchiStatus, showGameOver, updateScore,
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
  try {
    await startCamera();
    await Promise.all([
      initGestureRecognizer(),
      initHandLandmarker(),
      initFaceLandmarker(),
    ]);
    btnStart.disabled = false;
    btnStart.textContent = 'スタート';
  } catch (err) {
    btnStart.textContent = 'カメラエラー';
    console.error(err);
  }
}

async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: 640, height: 480, facingMode: 'user' },
    audio: false,
  });
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

// ── Janken countdown: 3 → 2 → 1 → ポン ──────────────────────────────────────
async function runCountdown() {
  for (const n of [3, 2, 1]) {
    setCountdown(n);
    playCountdownBeep();
    await wait(900);
  }
  setCountdown('ポン！');
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
    setCountdown('もう一度！');
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

  const pointer = game.jankenWinner;  // 'player' or 'cpu'
  game.pointer  = pointer;

  if (pointer === 'cpu') {
    // CPU points → player must turn face to a DIFFERENT direction
    game.cpuDirection = randomDirection();
    setAcchiInstruction('cpu', game.cpuDirection);
    setAcchiStatus('顔を ' + DIRECTION_ARROW[game.cpuDirection] + ' 以外の方向に向けて！');
    await runFaceDetectionLoop();
  } else {
    // Player points → player must point to the SAME direction as cpu turns
    game.cpuDirection = randomDirection();
    setAcchiInstruction('player', game.cpuDirection);
    setAcchiStatus(`AIロボが ${DIRECTION_ARROW[game.cpuDirection]} を向く！指で同じ方向を指せ！`);
    await runHandDetectionLoop();
  }
}

// Player turns face: must NOT match cpuDirection → if it matches, player loses
async function runFaceDetectionLoop() {
  const TIMEOUT_MS = 8000;
  const start = performance.now();

  while (true) {
    await animFrame();
    if (performance.now() - start > TIMEOUT_MS) {
      // Timeout — no match, go back to janken
      setAcchiStatus('時間切れ！もう一回！');
      await wait(1200);
      game.round++;
      updateScore(game.scorePlayer, game.scoreCpu, game.round);
      transitionTo(State.JANKEN_COUNTDOWN);
      return;
    }

    const face = getPlayerFaceDirection(videoEl);
    setDirectionIndicator(face ? DIRECTION_ARROW[face] : '');

    if (face) {
      if (face === game.cpuDirection) {
        // Match — player LOSES this round (cpu wins)
        playMatchSound();
        setAcchiStatus('一致！AIロボの勝ち！');
        await wait(1500);
        game.scoreCpu++;
        updateScore(game.scorePlayer, game.scoreCpu, game.round);
        showGameOver('cpu');
        showScreen(State.GAME_OVER);
      } else {
        // No match — player avoids → back to janken
        setAcchiStatus('よけた！もう一回！');
        playDrawSound();
        await wait(1200);
        game.round++;
        updateScore(game.scorePlayer, game.scoreCpu, game.round);
        transitionTo(State.JANKEN_COUNTDOWN);
      }
      return;
    }
  }
}

// Player points finger: must match cpuDirection → if it matches, player wins
async function runHandDetectionLoop() {
  const TIMEOUT_MS = 8000;
  const start = performance.now();

  while (true) {
    await animFrame();
    if (performance.now() - start > TIMEOUT_MS) {
      setAcchiStatus('時間切れ！もう一回！');
      await wait(1200);
      game.round++;
      updateScore(game.scorePlayer, game.scoreCpu, game.round);
      transitionTo(State.JANKEN_COUNTDOWN);
      return;
    }

    const dir = getPlayerPointDirection(videoEl);
    setDirectionIndicator(dir ? DIRECTION_ARROW[dir] : '');

    if (dir) {
      if (dir === game.cpuDirection) {
        // Match — player WINS
        playWinSound();
        setAcchiStatus('一致！あなたの勝ち！');
        await wait(1500);
        game.scorePlayer++;
        updateScore(game.scorePlayer, game.scoreCpu, game.round);
        showGameOver('player');
        showScreen(State.GAME_OVER);
      } else {
        // No match — cpu avoids → back to janken
        setAcchiStatus('外れた！もう一回！');
        playDrawSound();
        await wait(1200);
        game.round++;
        updateScore(game.scorePlayer, game.scoreCpu, game.round);
        transitionTo(State.JANKEN_COUNTDOWN);
      }
      return;
    }
  }
}

function runGameOver() {
  // Score and screen already set inside runFaceDetectionLoop/runHandDetectionLoop
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
btnStart.textContent = '読み込み中…';
boot();
