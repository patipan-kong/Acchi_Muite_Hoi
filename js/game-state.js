export const State = Object.freeze({
  IDLE: 'IDLE',
  JANKEN_COUNTDOWN: 'JANKEN_COUNTDOWN',
  JANKEN_DETECTION: 'JANKEN_DETECTION',
  JANKEN_RESULT: 'JANKEN_RESULT',
  ACCHI_MUITE_HOI: 'ACCHI_MUITE_HOI',
  CHECK_DIRECTION_MATCH: 'CHECK_DIRECTION_MATCH',
  GAME_OVER: 'GAME_OVER',
});

export const Gesture = Object.freeze({
  ROCK: 'rock',
  PAPER: 'paper',
  SCISSORS: 'scissors',
});

export const Direction = Object.freeze({
  UP: 'UP',
  DOWN: 'DOWN',
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
});

export const GESTURE_EMOJI = {
  [Gesture.ROCK]: '✊',
  [Gesture.PAPER]: '✋',
  [Gesture.SCISSORS]: '✌️',
};

export const DIRECTION_ARROW = {
  [Direction.UP]: '⬆️',
  [Direction.DOWN]: '⬇️',
  [Direction.LEFT]: '⬅️',
  [Direction.RIGHT]: '➡️',
};

export function createGameState() {
  return {
    state: State.IDLE,
    playerGesture: null,
    cpuGesture: null,
    jankenWinner: null,   // 'player' | 'cpu' | 'draw'
    pointer: null,        // 'player' | 'cpu'  — who points finger
    cpuDirection: null,   // Direction chosen by cpu when cpu points
    scorePlayer: 0,
    scoreCpu: 0,
    round: 1,
  };
}

// Returns 'player' | 'cpu' | 'draw'
export function resolveJanken(playerGesture, cpuGesture) {
  if (playerGesture === cpuGesture) return 'draw';
  const wins = {
    [Gesture.ROCK]: Gesture.SCISSORS,
    [Gesture.SCISSORS]: Gesture.PAPER,
    [Gesture.PAPER]: Gesture.ROCK,
  };
  return wins[playerGesture] === cpuGesture ? 'player' : 'cpu';
}

export function randomGesture() {
  const all = Object.values(Gesture);
  return all[Math.floor(Math.random() * all.length)];
}

export function randomDirection() {
  const all = Object.values(Direction);
  return all[Math.floor(Math.random() * all.length)];
}
