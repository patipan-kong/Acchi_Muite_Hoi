let ctx = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

function beep(frequency, duration, type = 'sine', gain = 0.3) {
  const ac = getCtx();
  const osc = ac.createOscillator();
  const gainNode = ac.createGain();
  osc.connect(gainNode);
  gainNode.connect(ac.destination);
  osc.type = type;
  osc.frequency.value = frequency;
  gainNode.gain.setValueAtTime(gain, ac.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + duration);
}

export function playCountdownBeep() {
  beep(440, 0.15);
}

export function playGoBeep() {
  beep(880, 0.3, 'square', 0.25);
}

export function playWinSound() {
  beep(523, 0.1);
  setTimeout(() => beep(659, 0.1), 120);
  setTimeout(() => beep(784, 0.25), 240);
}

export function playLoseSound() {
  beep(300, 0.2, 'sawtooth', 0.2);
  setTimeout(() => beep(220, 0.3, 'sawtooth', 0.2), 200);
}

export function playDrawSound() {
  beep(350, 0.2);
}

export function playMatchSound() {
  beep(1000, 0.1);
  setTimeout(() => beep(800, 0.1), 120);
  setTimeout(() => beep(600, 0.3), 240);
}
