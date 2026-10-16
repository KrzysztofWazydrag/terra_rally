# C0 baseline evidence — QUARRY SWITCHBACK

- **Captured:** 2026-10-16 (Europe/London)
- **Status:** **TECHNICALLY COMPLETE — OWNER VERIFICATION REQUIRED**
- **Source/baseline commit:** `a6628f31628f3ad339f4d524e6d2b549d9208653`
- **Resulting evidence commit:** recorded in the ADR after the evidence commit is created.
- **Build:** production source at the baseline commit; no repository gameplay files were edited.
- **Target:** Championship Track #2, `QUARRY SWITCHBACK` (programme reference name: CANYON).

## Temporary direct-start harness

Track #2 is inaccessible through ordinary championship progression until all six laps of Track #1 are complete. To avoid spending the baseline session on that unlock, a disposable copy was made at `/tmp/antoni-game-c0.0Dp4qb`. The only change in the copy was the flow selection in `game.js`:

```diff
- newChampionship(){this.trackIndex=0;...}
+ newChampionship(){this.trackIndex=1;...}
```

This makes the existing `newChampionship()` flow present the existing `TRACK_DEFS[1]`, QUARRY SWITCHBACK, directly. It does not change the track definition or any race rules. The copy's `index.html`, `physics-core.js`, `style.css`, and three image assets were byte-identical to the baseline checkout; `game.js` differed only at that `trackIndex` assignment. The copy was served with Python's standard-library static server:

```sh
python3 -m http.server 8766 --bind 127.0.0.1 --directory /tmp/antoni-game-c0.0Dp4qb
```

The game was opened at `http://127.0.0.1:8766/`. The temporary copy and server were removed/stopped after evidence capture. Nothing from the bypass was committed. The repository's production source remains unchanged.

## Runtime conditions and measurements

- **Event confirmation:** the game's normal briefing showed `FOREST WORLD · EVENT 02/03`, `QUARRY SWITCHBACK`, 6 laps, 4 rivals, and GRAVEL / DIRT / TARMAC / MUD. The normal race countdown and five-car race then ran with the player and four production AI.
- **Production-AI race timing:** at displayed race time **0:01.69**, the HUD showed position **2/5** and the start-grid screenshot contains the player and all four AI. At **1:20.14**, a live F2 screenshot showed position **5/5** with two production AI cars visible on course. These are actual game race-clock checkpoints, not the synthetic route loop. The production HUD does not display AI lap counters or per-AI lap times, so no individual AI lap time is asserted.
- **Player lap:** no completed controlled player lap was recorded. No automated/browser-driven time is represented as a competent-human lap. A competent-human Track #2 lap remains for owner measurement.
- **Live acceleration / speed:** from a reset HUD speed of **0 km/h** at race clock **4:25.60**, Up was held for **3.00 seconds**. The next live HUD sample at **4:31.05** showed **300 km/h** on **TARMAC** (race-clock interval 5.45 seconds; tool-call latency means the displayed interval is the reproducible bound, not an instrumented exact acceleration duration). The highest live speed observed in this baseline was **300 km/h**. The run did not establish a stable limiter plateau; the source-configured `326` remains supplementary only. A separate 3-second full-throttle sample ended at 254 km/h on GRASS after leaving the road. These are live UI readings, not physics-core substitutes.
- **Performance:** browser viewport override **1920×1080 CSS pixels**, `devicePixelRatio=1`, with F2 instrumentation enabled. Repeated snapshots were taken across approximately **2:46 of live Track #2 race time** with the four AI running; the player was stationary or off-line for some samples, and this was not a continuous telemetry log. F2 reported **144 FPS**, **6.9–7.1 ms** frame time, **0.0–0.2 ms** update, and **0.3–1.0 ms** render. No visible spike or stutter was observed during the sampled normal race activity. The screenshot at 1:20.14 shows 144 FPS / 6.9 ms, update 0.2 ms, render 0.8 ms.
- **Audio runtime and implementation:** the race showed SOUND ON and the race path called the existing audio update. In `game.js`, `AudioSystem.ensure()` creates/resumes Web Audio; the race lazily starts a sawtooth engine oscillator. Engine frequency is `(58 + speed × 0.62) × load × airborneFactor`, where load can rise with squeal and airborne factor is 0.84. Engine gain is fixed at 0.014 while racing; the engine is speed-dependent, not throttle-dependent. Audio source/runtime presence is documented, but this browser capture setup cannot genuinely listen to or measure output. Subjective launch, acceleration, sustained-speed and lift-off loudness/race-feel remain **OWNER VERIFICATION REQUIRED**.

## Durable screenshots

Saved OS-level PNG captures, cropped to the game view, are under `docs/adr/evidence/c0-runtime/`:

- [`quarry-race-opponents.png`](c0-runtime/quarry-race-opponents.png) — Track #2 race at 0:01.69; all four production AI, player, HUD, start/finish area, scenery, and wheels visible.
- [`quarry-performance-f2.png`](c0-runtime/quarry-performance-f2.png) — live race at 1:20.14; F2 metrics, HUD, player/wheels, two production AI, and track environment visible.
- [`quarry-player-wheels-hud.png`](c0-runtime/quarry-player-wheels-hud.png) — player/wheel rendering, HUD, F2, and Quarry environment.
- [`quarry-track2-environment.png`](c0-runtime/quarry-track2-environment.png) — wider Track #2 road/environment view with player, HUD, and F2.
- [`quarry-live-race-frame-48s.png`](c0-runtime/quarry-live-race-frame-48s.png) and [`quarry-live-race-frame-1m27.png`](c0-runtime/quarry-live-race-frame-1m27.png) — additional live Track #2 race frames.

## Supplementary evidence and owner-only observations

- [`c0-handling-check.txt`](c0-handling-check.txt) is the synthetic physics/route check. Its controlled 60 Hz physics values (162.9 / 274.7 / 326.0 units/s at 1 / 2 / 3 seconds) and generated test-loop lap times are supplementary only; they do not replace the live speed sample or production-AI race checkpoints above.
- **Owner measurement:** competent-human lap time and test conditions on QUARRY SWITCHBACK.
- **Owner listening:** subjective engine loudness/race-feel during launch, acceleration, sustained high speed, and lift-off.
- **Known measurement limits:** the normal HUD has no per-AI lap time display; the recorded AI timing is the production race clock at visible field checkpoints. The live speed probe records the highest observed 300 km/h sample but did not confirm a speed plateau. The sampled F2 values are discrete readings over a live race, not a continuous trace or full six-lap run.

## Result

C0's objective baseline evidence is ready for owner review: Track #2 ran from the temporary flow-only harness, production AI were present in the live race and live race-clock checkpoints were recorded, live acceleration/speed readings were captured, performance was sampled repeatedly at 1920×1080, audio implementation/runtime presence was verified, and durable screenshots were saved. Competent-human lap timing and subjective audio judgement are explicitly owner-only. No product gameplay source changed. C0 is **TECHNICALLY COMPLETE — OWNER VERIFICATION REQUIRED**; do not mark it OWNER VERIFIED or begin C1 until the owner approves.
