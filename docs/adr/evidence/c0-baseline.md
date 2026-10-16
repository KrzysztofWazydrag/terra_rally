# C0 baseline evidence — QUARRY SWITCHBACK

- **Captured:** 2026-10-16 (Europe/London)
- **Source/baseline commit:** `35c989d7b206ce96f2c4bb5201259ad62ab5c60c` (`baseline: import existing Terra Rally project`)
- **Build:** source at the baseline commit; no gameplay files changed during C0.
- **Target:** Championship Track #2, source name `QUARRY SWITCHBACK`.

## Conditions and available measurements

- **Automated check:** `node scripts/handling-check.js`, Node `v24.18.0`; result `PASS`. Full stdout is in [c0-handling-check.txt](c0-handling-check.txt).
- **Acceleration / maximum speed:** the check's controlled 60 Hz physics simulation, using the buggy's source configuration (`acceleration=205`, `maxSpeed=326`), reports 162.9 / 274.7 / 326.0 game units/s after 1 / 2 / 3 seconds from rest. It reaches the configured 326 cap by 3 seconds. This is a deterministic physics-core measurement, not an observed live game run.
- **Road-to-vehicle width:** source values are 320 world units for the road and 62 world units for the buggy draw width, or 5.16 buggy widths. This is a source measurement; it does not establish the complete rendered width of all road sections (including the bridge).
- **Current engine behavior (source inspection only):** during racing the engine is a sawtooth oscillator with frequency `(58 + speed × 0.62) × load`, where load can rise with squeal and airborne state reduces frequency to 84%. Engine gain is set to a fixed 0.014 while racing. Squeal is a separate sawtooth whose gain is driven by the supplied squeal value and surface. The check does not measure perceived loudness or provide an audio capture.
- **Diagnostic route results:** the handling check's separate synthetic Catmull–Rom test loop reports 19.4 seconds for its skilled one-lap controller and 112.0 seconds for six laps, with 0% off-road time. This route and controller are generated inside the test script and are not the game's QUARRY SWITCHBACK course or its production AI; these values are not accepted as C0 track/AI lap times.

## Unavailable required evidence

- **Competent-player lap time on QUARRY SWITCHBACK:** not captured.
- **Production AI lap times and race conditions:** not captured.
- **Live 0-to-top-speed timing:** not captured; the physics-core result above is a controlled simulation only.
- **FPS / frame time, viewport and resolution:** not captured. The source contains an F2 overlay, but there is no runtime measurement for this baseline.
- **Vehicle/wheel and normal-race track/HUD screenshots:** not captured.
- **Audible engine behavior during acceleration and sustained speed:** not captured; only source behavior was inspected.

The existing game tab was a `file://` URL. The computer-use browser policy denied access to observe that page and explicitly prohibited alternate browser surfaces or workarounds. A local HTTP server could not be started in the restricted environment. Therefore the live-run and screenshot evidence cannot be completed in this session without access to an allowed game runtime. No gameplay or track behavior was changed.

## Result

C0 has reproducible source and physics-check evidence, but it does not satisfy the required live-race measurements and screenshots. It is recorded as **BLOCKED**, not technically complete. Resume C0 by capturing the unavailable evidence from an allowed runtime, then request owner verification before C1.
