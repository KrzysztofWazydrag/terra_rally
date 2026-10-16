# C7 — AI competition evidence

**Status:** TECHNICALLY COMPLETE — OWNER VERIFICATION REQUIRED
**Source/baseline:** `fd6e5595d72f16f38c1201eb2b89ac622e427f64`
**Resulting implementation commit:** recorded in the ADR after the implementation/evidence commit.

## Conditions

- Track #2, CANYON CIRCUIT, 60 Hz fixed game step, six laps, five cars, zero upgrades.
- Three full multi-car runs used AI seeds 311, 1907 and 8191. All five cars were driven through the production `aiInput`, `Game.update`, `updateCar`, `updateProgress`, collision, cone, pickup and `TerraPhysics` paths. There was no human-controlled car in these matrices.
- A temporary copy under `/tmp/terra-rally-c7-verify` exposed the game instance and selected the existing Track #2 directly for repeatable runs. The Canyon route, game rules and production gameplay source were unchanged by the harness. UI/audio, camera and particle updates were suppressed during the numerical matrix; collision, physics, surface, hazard, pickup and progress updates remained active.
- A separate 25-second automated AI runtime sample used the normal renderer and current Track #2. Its 1600×900 screenshot is [`c7-live-race.png`](../evidence/c7-runtime/c7-live-race.png). The test-only caption reports the live HUD values at capture: position 5/5, lap 1/6, 55 km/h, 0:24.99. The five visible vehicles and course were drawn by the production renderer.

## Race times

Finish time is game-clock time from the common start. All runs finished in the same order; four stable lead changes were observed during each run.

| Run seed | Finish order | Car 1 | Car 2 | Car 3 | Car 4 | Car 5 | Last finisher |
|---:|---|---:|---:|---:|---:|---:|---:|
| 311 | 4, 1, 3, 5, 2 | 180.70 s | 190.97 s | 185.62 s | 177.93 s | 185.72 s | 190.97 s |
| 1907 | 4, 1, 3, 5, 2 | 180.70 s | 190.97 s | 185.62 s | 177.93 s | 185.72 s | 190.97 s |
| 8191 | 4, 1, 3, 5, 2 | 188.57 s | 191.03 s | 189.35 s | 175.87 s | 189.48 s | 191.03 s |

Across 90 completed six-lap splits, the lap-time median was **30.36 s** (range **27.61–33.87 s**). Per-car median and range across the three runs:

| Car | Median lap | Range |
|---:|---:|---:|
| 1 | 29.47 s | 29.13–33.87 s |
| 2 | 31.60 s | 31.12–32.29 s |
| 3 | 30.50 s | 29.90–32.73 s |
| 4 | 29.18 s | 27.61–30.21 s |
| 5 | 30.72 s | 29.34–32.91 s |

The pre-C7 production-AI matrix used seeds 311, 727, 1907, 4099 and 8191; all-five-finish times were 287.75, 301.08, 288.05, 290.20 and 284.60 seconds. Its median was 288.05 seconds. The C7 median last-finisher time was 190.97 seconds, a **1.51× faster** full-race pace. This aligns with the requested approximately 1.5× stronger AI pace target. The lap target is a controller target; it does not raise the shared physics cap.

## Competition and fairness observations

- **Overtaking/defense:** four stable race-lead changes per run; controller telemetry recorded 11,133–19,257 defense-condition samples and 7,679–11,514 nearby-overtake-condition samples per run. These counters describe controller states, not a count of completed passes.
- **Hazards:** oil-control timer activations were 14, 14 and 20 across the field in the three runs. Cone down-state transitions were 17, 17 and 19.
- **Pickups:** shared-pool collection awarded cash totals of $1,100, $1,100 and $1,200 across the five racers. Other pickup rewards were active in the same production collection path; these totals count cash rewards only.
- **Mistakes:** the seeded short throttle/lane hesitation occurred once across the three runs. No catch-up speed/grip bonus or position-based rubber-banding exists in the controller.
- **Shared physics:** all racers used the same buggy profile and `TerraPhysics.step`; the AI's 1.5× target is capped using the same surface, damage and temporary-speed limit as production physics. Steering demand is multiplied by 1.25 before the normal `[-1, 1]` input clamp. The shared physics core, grip, acceleration, top-speed constants, track geometry, pickups, rendering and audio were not changed in C7.
- **Off-road samples:** per-car grass/mud frame share ranged 5.7–13.7% of the common race-clock sample. This is recorded for review; the figure is normalized to the full shared race duration, not each car's finish time.

## Checks

Passed: `node --check game.js`; `node scripts/ai-competition-check.js`; `node scripts/canyon-course-check.js`; `node scripts/handling-check.js`; `node scripts/pickup-system-check.js`; `git diff --check`.

## Review notes and limitations

- Car 4 won all three seeded runs. Its victory margin ranged from 2.77 to 15.16 seconds; the field had position changes, but the same car won each time. Owner review should judge whether that dominance feels fair.
- The complete-race lap pace is substantially faster than the earlier AI run and the 45–55-second competent-lap target. The owner specifically requested roughly 1.5× faster AI; the measured full-race pace is approximately 1.51× faster than the previous AI matrix. Please assess the resulting pace in play.
- These are production-controller automated runs, not human-driving evidence. The screenshot's caption is test-harness-only; the race scene comes from the production renderer.
