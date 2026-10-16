# C1 — Vehicle pace evidence

Date: 2026-10-16  
Source/baseline commit: `b113eaeff56b2dea26e48dba27650afba75a84eb`  
Phase result: technically complete; owner verification is pending.

## Changes

- Default VANGUARD BUGGY acceleration changed from 205 to 120. Top speed, braking, steering, and the other vehicle profiles were not changed.
- Grass resistance changed from 125 to 70. Its lower grip, lower acceleration scale, and low speed limit remain; this keeps a short excursion recoverable while mud stays much more punishing.
- Engine frequency and gain now respond to vehicle speed and player throttle. Slip load still raises pitch and level, and airborne pitch remains reduced. With no slip, the formula spans approximately 63 Hz at zero speed/lift to 346 Hz at maximum speed/full throttle; gain spans 0.032 at idle to 0.062 at maximum speed/full throttle. These are source-calculated values, not an acoustic loudness measurement.

## Repeatable handling-check measurements

Ran `node scripts/handling-check.js` against the production pace values. The script passed all handling, wheel, cone, track-fit, bounded-effects, and six-lap AI checks. Its default straight-line pace run recorded:

| Full-throttle time | Speed |
|---:|---:|
| 1 s | 99.5 km/h |
| 2 s | 179.2 km/h |
| 3 s | 239.8 km/h |
| 4 s | 284.5 km/h |
| 5 s | 316.9 km/h |
| 6 s | 326.0 km/h |

The same run reached 95% of maximum at 4.75 s, 99% at 5.23 s, and the 326 km/h cap at 5.37 s. Synthetic results are repeatable core measurements, not represented as a human or live controlled lap.

Surface checks using the same pace values recorded settled full-throttle speeds of 225.0 km/h on grass (69% of top speed) and 139.1 km/h on mud (43%). Starting at 300 km/h, the one-second measurements were 239.8 km/h on grass and 209.6 km/h on mud. Mud remains the more punishing surface.

Other regression results: clean-corner slip 5.0°, aggressive-corner slip 11.7°, countersteer recovery 4.7° to 2.7° in 0.67 s, flat-out synthetic lap 17.1 s, skilled synthetic lap 19.4 s, and six-lap AI simulation 112.0 s with no off-road frames. These synthetic lap times are not player lap claims.

## Live runtime / owner review

Served the current repository at `http://127.0.0.1:8767/`, started the normal Track 1 race and used browser controls. The operator run lost the racing line during acceleration. One HUD sample read 216 km/h at race time 0:05.74 while already on grass; later samples included water/grass and are not a controlled acceleration result. The browser confirmed the modified game loads and the race starts, but it did not provide a reliable live 0-to-speed measurement or a competent lap. No screenshot is claimed as durable C1 evidence.

The browser screenshot path displays the current game but does not provide a durable PNG write mechanism here, and the browser tool cannot listen to or assess the synthesized audio. Owner review should focus on whether the launch feels progressive, whether top speed arrives at a satisfying pace, and whether the engine is sufficiently loud and responds to throttle/speed. No subjective audio judgment is inferred.

## Deviations and limitations

- The acceptance timing is supported by repeatable physics-core measurement; controlled live acceleration evidence is inconclusive and explicitly remains supplementary.
- Audio response is verified structurally in the production runtime path, but subjective loudness and race feel remain for owner listening.
- No track geometry, AI, handling tuning, rendering, or C2 work was changed.
