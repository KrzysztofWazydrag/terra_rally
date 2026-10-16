# C4 — Hop and suspension evidence

Date: 2026-10-16  
Status: TECHNICALLY COMPLETE  
Source/baseline commit: `ae4d3f50ff4dd0e055334b1ec251816ddeedf5d2` (C3 provenance record)

## Implementation

- Production jump points now launch at 105 vertical units/s under 420 units/s² gravity. The smaller existing bump points launch at 55 units/s.
- Both use `TerraPhysics.stepVertical`, which integrates height independently of horizontal velocity. The airborne handling flag continues to reduce steering authority to 3.5% and suspends tyre grip correction until landing.
- A landing with impact above 35 units/s compresses the body by 1.15 suspension units. A damped spring returns it through a small rebound and settles to rest. The vehicle shadow stays at the ground point as established in C3.
- The large stunt-like ramp graphic was replaced by a low-profile road step treatment. Track route definitions and jump/bump locations were not changed.
- Existing restrained jump/land tone effects are triggered for the player. No subjective loudness claim is made.

## Measurements and checks

`node scripts/handling-check.js` passes. Full output is retained in [`c4-handling-check.txt`](c4-handling-check.txt).

- Repeatable vertical-helper trajectory at 60 Hz: powered hop duration 0.53 s, peak rise 14.0 units, landing speed 105 units/s.
- Smaller road bump duration 0.28 s, peak rise 4.1 units, landing speed 55 units/s.
- Both preserve horizontal velocity in the vertical integration step. The production physics test continues to report airborne yaw authority 0.012 versus 0.941 in a high-speed corner.
- Spring check from 1.15 units of compression: 0.10 units rebound peak, settled to 0 after 2.5 seconds.
- Regression checks for C1–C3 handling, vehicle rendering, AI route loop, and existing hazards also pass in the same suite.

## Live runtime check and limitations

- Served the current checkout with Python's standard-library server bound to `127.0.0.1:8791`; no dependency was added. Entered the production Track 1 event and race in the browser. The live HUD showed the five-car race, six-lap counter, speed, surface, and race timer; the race accepted throttle/steering input.
- A brief operator-controlled throttle sample reached 113 km/h but left the road onto grass. It is recorded only as a smoke check, not a lap, handling calibration, or hop measurement.
- The controlled run did not produce a reliable in-air screenshot. Therefore no airborne frame is claimed. The quantitative trajectory is from the same vertical integration and suspension helpers used by production, and source checks verify the game calls them at the existing hop/bump points. A race-scale airborne visual review can be made during normal play and must not block the programme.
- Browser tooling confirms the game race runs with SOUND ON, and the production path calls the jump/land effects; the capture path cannot judge the sound. Subjective impact level and race feel remain owner observations for normal iteration.

## Evidence paths

- [`handling-check output`](c4-handling-check.txt)
- [`production source`](../../../game.js)
- [`vertical and suspension helpers`](../../../physics-core.js)
