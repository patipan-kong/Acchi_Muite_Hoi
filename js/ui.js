import { State, GESTURE_EMOJI, DIRECTION_ARROW } from './game-state.js';

const screens = {
  [State.IDLE]:            document.getElementById('screen-idle'),
  [State.JANKEN_COUNTDOWN]:document.getElementById('screen-countdown'),
  [State.JANKEN_DETECTION]:document.getElementById('screen-detection'),
  [State.JANKEN_RESULT]:   document.getElementById('screen-result'),
  [State.ACCHI_MUITE_HOI]: document.getElementById('screen-acchi'),
  [State.GAME_OVER]:       document.getElementById('screen-gameover'),
};

export function showScreen(state) {
  for (const [key, el] of Object.entries(screens)) {
    if (el) el.classList.toggle('active', key === state);
  }
}

export function setCountdown(n) {
  document.getElementById('countdown-display').textContent = n;
}

export function setDetectedGesture(gesture) {
  document.getElementById('detected-gesture').textContent =
    gesture ? GESTURE_EMOJI[gesture] : '?';
}

export function showJankenResult(playerGesture, cpuGesture, winner) {
  document.getElementById('player-choice').textContent =
    playerGesture ? GESTURE_EMOJI[playerGesture] : '?';
  document.getElementById('cpu-choice').textContent =
    cpuGesture ? GESTURE_EMOJI[cpuGesture] : '?';

  const el = document.getElementById('janken-result-text');
  if (winner === 'player') {
    el.textContent = 'You win!';
    el.className = 'result-text win';
  } else if (winner === 'cpu') {
    el.textContent = 'AI Robot wins!';
    el.className = 'result-text lose';
  } else {
    el.textContent = 'Draw!';
    el.className = 'result-text draw';
  }
}

export function setAcchiInstruction(pointer, cpuDirection) {
  const instruction = document.getElementById('acchi-instruction');
  const subtext     = document.getElementById('acchi-subtext');
  const arrowEl     = document.getElementById('cpu-arrow');
  const statusEl    = document.getElementById('acchi-status');

  if (pointer === 'cpu') {
    instruction.textContent = 'Look Away!';
    subtext.textContent = 'Turn your face to a DIFFERENT direction than AI Robot points!';
    arrowEl.textContent = cpuDirection ? DIRECTION_ARROW[cpuDirection] : '';
    statusEl.textContent = 'Move your face!';
  } else {
    instruction.textContent = 'Point the Way!';
    subtext.textContent = 'Point your finger in the SAME direction AI Robot turns!';
    arrowEl.textContent = '';
    statusEl.textContent = 'Show your pointing direction!';
  }
}

export function setAcchiStatus(text) {
  document.getElementById('acchi-status').textContent = text;
}

export function showGameOver(winner) {
  const el = document.getElementById('gameover-text');
  if (winner === 'player') {
    el.textContent = '🎉 You Win!';
    el.style.color = '#3fb950';
  } else {
    el.textContent = '💥 AI Robot Wins!';
    el.style.color = '#f85149';
  }
}

export function updateScore(scorePlayer, scoreCpu, round) {
  document.getElementById('score-player').textContent = scorePlayer;
  document.getElementById('score-cpu').textContent = scoreCpu;
  document.getElementById('round-count').textContent = round;
}

export function setDirectionIndicator(text) {
  document.getElementById('direction-indicator').textContent = text ?? '';
}
