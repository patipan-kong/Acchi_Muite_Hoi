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

// Set the headline + subtitle; hides the directions row and result
export function setAcchiAnnounce(title, subtitle) {
  document.getElementById('acchi-instruction').textContent = title;
  document.getElementById('acchi-subtext').textContent = subtitle;
  document.getElementById('acchi-directions').hidden = true;
  const r = document.getElementById('acchi-result');
  r.hidden = true;
  r.className = 'result-text';
}

// Show the side-by-side VS row with given arrow text (emoji or '?')
export function showAcchiDirections(playerArrow, robotArrow, playerLabel, robotLabel) {
  document.getElementById('acchi-player-label').textContent = playerLabel;
  document.getElementById('acchi-robot-label').textContent  = robotLabel;
  document.getElementById('acchi-player-arrow').textContent = playerArrow;
  document.getElementById('acchi-robot-arrow').textContent  = robotArrow;
  document.getElementById('acchi-directions').hidden = false;
}

// Animate the robot arrow from '?' → real direction
export function revealRobotArrow(dir) {
  const el = document.getElementById('acchi-robot-arrow');
  el.textContent = DIRECTION_ARROW[dir];
  el.classList.remove('pop-in');
  void el.offsetWidth;
  el.classList.add('pop-in');
}

// Animate the player arrow from '?' → locked direction
export function updatePlayerArrow(dir) {
  const el = document.getElementById('acchi-player-arrow');
  el.textContent = DIRECTION_ARROW[dir];
  el.classList.remove('pop-in');
  void el.offsetWidth;
  el.classList.add('pop-in');
}

// Show the match/no-match result text and flash the panel background
export function setAcchiResult(text, type) {
  const el = document.getElementById('acchi-result');
  el.textContent = text;
  el.className = 'result-text ' + type;
  el.hidden = false;
  const panel = document.getElementById('game-panel');
  panel.classList.remove('flash-win', 'flash-lose');
  void panel.offsetWidth;
  if (type === 'win')  panel.classList.add('flash-win');
  if (type === 'lose') panel.classList.add('flash-lose');
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
