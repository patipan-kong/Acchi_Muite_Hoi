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
    el.textContent = 'あなたの勝ち！';
    el.className = 'result-text win';
  } else if (winner === 'cpu') {
    el.textContent = 'AIロボの勝ち！';
    el.className = 'result-text lose';
  } else {
    el.textContent = 'あいこ！';
    el.className = 'result-text draw';
  }
}

export function setAcchiInstruction(pointer, cpuDirection) {
  const instruction = document.getElementById('acchi-instruction');
  const subtext     = document.getElementById('acchi-subtext');
  const arrowEl     = document.getElementById('cpu-arrow');
  const statusEl    = document.getElementById('acchi-status');

  if (pointer === 'cpu') {
    instruction.textContent = 'あっち向いて ホイ！';
    subtext.textContent = 'AIロボが指差す方向と違う方向を向こう！';
    arrowEl.textContent = cpuDirection ? DIRECTION_ARROW[cpuDirection] : '';
    statusEl.textContent = '顔を動かして！';
  } else {
    instruction.textContent = 'あっち向いて ホイ！';
    subtext.textContent = '指でAIロボと同じ方向を指さそう！';
    arrowEl.textContent = '';
    statusEl.textContent = '指の方向を見せて！';
  }
}

export function setAcchiStatus(text) {
  document.getElementById('acchi-status').textContent = text;
}

export function showGameOver(winner) {
  const el = document.getElementById('gameover-text');
  if (winner === 'player') {
    el.textContent = '🎉 あなたの勝ち！';
    el.style.color = '#3fb950';
  } else {
    el.textContent = '💥 AIロボの勝ち！';
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
