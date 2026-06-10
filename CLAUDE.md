# CLAUDE.MD

## Project Overview

This project is a browser-based interactive game demo:

**AIロボと対決！あっちむいてホイ (Acchi Muite Hoi)**

The player competes against an AI robot in two phases:

1. Rock-Paper-Scissors (じゃんけん)
2. Acchi Muite Hoi (direction pointing game)

The entire application runs locally in the browser using HTML, CSS, and JavaScript.

No backend services are required.

---

## Technical Constraints

### MUST FOLLOW

* Use vanilla HTML, CSS, and JavaScript.
* Use ES modules.
* Keep the implementation simple and educational.
* Everything must run entirely in the browser.
* Webcam processing must happen client-side.
* Do not introduce backend APIs.
* Do not require Node.js servers for runtime.
* Do not use React, Vue, Angular, or other frontend frameworks.
* Do not introduce AI agents (Claude API, OpenAI API, Gemini API, etc.).
* Do not add databases.
* Avoid unnecessary dependencies.

### Allowed Libraries

* MediaPipe Tasks Vision
* Canvas API
* Web Audio API
* Browser APIs

OpenCV.js may be used only if absolutely necessary.

---

## Game Flow

IDLE
↓
START BUTTON
↓
JANKEN_COUNTDOWN
↓
JANKEN_DETECTION
↓
JANKEN_RESULT
↓
ACCHI_MUITE_HOI
↓
CHECK_DIRECTION_MATCH
├─ Match → GAME_OVER
└─ No Match → Return to JANKEN_COUNTDOWN

---

## Phase 1: Rock-Paper-Scissors

Use MediaPipe Gesture Recognizer.

Supported gestures:

* Closed_Fist → Rock
* Open_Palm → Paper
* Victory → Scissors

Requirements:

* Detect gesture continuously from webcam.
* Use countdown before locking the player's choice.
* CPU choice is randomly generated.
* Display both choices clearly.
* Determine winner according to standard Janken rules.

---

## Phase 2: Acchi Muite Hoi

The winner of Janken becomes the pointer.

If player wins:

* Player points.
* CPU turns.

If CPU wins:

* CPU points.
* Player turns.

If pointing direction matches face direction:

* Target loses.
* Game ends.

Otherwise:

* Return to Janken phase.

---

## Hand Direction Detection

Use MediaPipe Hand Landmarker.

Required landmarks:

* Index MCP: landmark 5
* Index Tip: landmark 8

Compute:

dx = tip.x - base.x
dy = tip.y - base.y

Determine direction:

* RIGHT
* LEFT
* UP
* DOWN

Requirements:

* Use thresholds to avoid noise.
* Ignore weak movements.
* Direction must remain stable for several frames before acceptance.

---

## Face Direction Detection

Preferred approach:

Use MediaPipe Face Landmarker.

Required landmarks:

* Nose Tip: 4
* Left Eye: 33
* Right Eye: 263

Determine:

* LEFT
* RIGHT
* UP
* DOWN

Requirements:

* Use simple landmark comparison.
* Avoid OpenCV solvePnP unless simple detection proves insufficient.
* Optimize for robustness and ease of maintenance.

---

## Performance Targets

Target devices:

* Standard Windows laptops
* ThinkPad-class hardware
* Chrome browser

Performance goals:

* Minimum: 20 FPS
* Preferred: 30 FPS

Optimization priorities:

1. Stable gameplay
2. Low latency
3. Maintainable code
4. Visual polish

---

## Project Structure

index.html

css/

* styles.css

js/

* main.js
* game-state.js
* janken.js
* acchi-muite-hoi.js
* mediapipe/

  * gesture.js
  * hand-direction.js
  * face-direction.js
* ui.js
* audio.js

assets/

* images/
* sounds/

---

## Coding Guidelines

* Keep functions small and focused.
* Avoid deeply nested conditions.
* Prefer state machines over boolean flags.
* Comment why, not what.
* Favor readability over clever implementations.
* Minimize global variables.
* Separate MediaPipe logic from game logic.
* Separate UI rendering from detection logic.

---

## Success Criteria

The demo is considered successful if:

* The webcam launches reliably.
* Janken gestures are recognized consistently.
* Finger pointing directions are detected correctly.
* Face directions are detected correctly.
* The full game loop can be played without restarting.
* Children can understand how to play within 30 seconds.
* The experience feels responsive and fun.
