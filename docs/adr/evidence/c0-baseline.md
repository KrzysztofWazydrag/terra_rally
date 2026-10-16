# C0 baseline evidence — QUARRY SWITCHBACK

- **Captured:** 2026-10-16 (Europe/London)
- **Source/baseline commit:** `a1a6345d42f89d5e405cb259f7baf857d29abe78` (`baseline: import existing Terra Rally project`; rebased onto the remote MIT license commit before publication)
- **Build:** source at the baseline commit; no gameplay files changed during C0. The local commits were rebased onto the remote's pre-existing `LICENSE` commit before publication; author email uses the account's GitHub noreply address.
- **Target:** Championship Track #2, source name `QUARRY SWITCHBACK`.

## Live HTTP observations (partial, 2026-10-16)

- **Source/build commit:** `93b9c1ec2997b93d57201dae15c2f00bd3e4bb29` (`docs: refresh C0 provenance after GitHub rebase`); the working tree was clean at launch. No gameplay files were changed for this run.
- **Runtime method:** served the existing static project with Python's standard-library server: `python3 -m http.server 8765 --bind 127.0.0.1 --directory /home/robot/Projects/antoni_game`; opened `http://127.0.0.1:8765/`.
- **Viewport:** in-app browser at 1920×1080 CSS pixels, `devicePixelRatio=1`.
- **Live event and player/AI timing:** entered the actual five-car championship race, with the player and four production AI opponents. The championship UI starts at Track #1, PINE RIDGE RUN; it presents no Track #2 selector. Progressing to Event 2 requires completing all six Track #1 laps. This trial remained on lap 1/6 and did not record a completed player or AI lap. Therefore it provides no accepted QUARRY SWITCHBACK player lap time or production-AI timing. Synthetic handling-check route times remain supplementary only.
- **Live speed observation:** during a full-throttle live Track #1 start, the HUD showed 249 km/h at displayed race time 0:01.93; a later live sample showed 254 km/h. These are uncontrolled Track #1 observations, do not establish 0-to-maximum timing or maximum usable speed, and are not accepted as the requested C0 acceleration result. The physics-core measurements above remain supplementary only.
- **Performance instrumentation:** F2 overlay snapshots during this short live race at 1920×1080 reported 144 FPS and 7.0 ms frame time; update was approximately 0.1–0.2 ms and render 0.4–0.7 ms. These intermittent snapshots are not a sustained/full-race stability measurement. Earlier readings from a separate browser tab were erratic and are excluded.
- **Engine audio:** the game showed SOUND ON and the live race activated the game's audio. The available browser interface did not provide audio output capture or a way to listen to it, so launch, acceleration, sustained high-speed, and lift-off behavior could not be assessed audibly. The existing source inspection above remains the only audio evidence.
- **Screenshots:** representative live frames were visible during browser inspection, including the race, opponents, HUD, vehicle, and F2 overlay. The available screenshot API returned an in-memory image and exposed no supported method to save it under this repository's evidence directory. No durable screenshot files were produced. Track #2 environment screenshots were also unavailable because the actual race could not advance to that event.

## Outstanding required evidence and blocker

- Competent-player lap time on QUARRY SWITCHBACK and its test conditions.
- Production-AI lap/race timing on QUARRY SWITCHBACK.
- Controlled live-game 0-to-maximum-usable-speed timing and observed maximum speed.
- Sustained performance observation during normal racing.
- Audible engine behavior at launch, acceleration, sustained high speed, and lift-off.
- Durable screenshots of normal racing, player/wheel rendering, HUD, Track #2 environment, and opponents.

The original `file://` blocker is resolved by serving the project over localhost. C0 remains blocked because the existing championship flow gates Track #2 behind a six-lap Track #1 event, and the available browser tooling cannot persist screenshots or capture audio. No hidden game-state changes or event skips were used. Do not treat Track #1 observations or synthetic checks as substitutes for the requested Track #2 baseline.

## Conditions and available measurements

- **Automated check:** `node scripts/handling-check.js`, Node `v24.18.0`; result `PASS`. Full stdout is in [c0-handling-check.txt](c0-handling-check.txt).
- **Acceleration / maximum speed:** the check's controlled 60 Hz physics simulation, using the buggy's source configuration (`acceleration=205`, `maxSpeed=326`), reports 162.9 / 274.7 / 326.0 game units/s after 1 / 2 / 3 seconds from rest. It reaches the configured 326 cap by 3 seconds. This is a deterministic physics-core measurement, not an observed live game run.
- **Road-to-vehicle width:** source values are 320 world units for the road and 62 world units for the buggy draw width, or 5.16 buggy widths. This is a source measurement; it does not establish the complete rendered width of all road sections (including the bridge).
- **Current engine behavior (source inspection only):** during racing the engine is a sawtooth oscillator with frequency `(58 + speed × 0.62) × load`, where load can rise with squeal and airborne state reduces frequency to 84%. Engine gain is set to a fixed 0.014 while racing. Squeal is a separate sawtooth whose gain is driven by the supplied squeal value and surface. The check does not measure perceived loudness or provide an audio capture.
- **Diagnostic route results:** the handling check's separate synthetic Catmull–Rom test loop reports 19.4 seconds for its skilled one-lap controller and 112.0 seconds for six laps, with 0% off-road time. This route and controller are generated inside the test script and are not the game's QUARRY SWITCHBACK course or its production AI; these values are not accepted as C0 track/AI lap times.

## Supplementary evidence from source and synthetic checks

- **Competent-player lap time on QUARRY SWITCHBACK:** not captured. The live attempt was Track 1 only; see Live HTTP observations.
- **Production AI lap times on QUARRY SWITCHBACK:** not captured. Live AI presence was observed on Track 1, without a completed lap time.
- **Live 0-to-top-speed timing:** not captured; the physics-core result above is a controlled simulation only.
- **Road-to-vehicle width:** source values are 320 / 62 = 5.16; not a live screenshot measurement.
- **Engine audio:** source behavior was inspected, but no audible assessment was possible.

## Result

C0 has reproducible source and physics-check evidence plus partial live HTTP observations, but it does not satisfy the required Track #2 live-race measurements, audible assessment, or durable screenshots. It is recorded as **BLOCKED**, not technically complete. Complete the outstanding evidence and request owner verification before C1.
