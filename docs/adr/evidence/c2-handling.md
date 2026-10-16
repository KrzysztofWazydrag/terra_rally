# C2 — Handling / grip-limit evidence

Date: 2026-10-16  
Source/baseline commit: `03ef0a272e2efeac7412f4343d89518f1c8a26ef`  
Phase result: technically complete.

## Implementation

- Squeal now ramps from zero at 0.10 rad of slip to full intensity at 0.26 rad, then scales by speed above 75 km/h. Steering input contributes no direct squeal amount.
- Raised squeal gain from 0.026 to 0.055 times grip/slip intensity, with the existing gravel/grass mix reduction retained. This brings slip feedback closer to the engine's output level when the car reaches the grip limit.
- Increased the sprite's visual slip posture from 0.18 to 0.40 radians per radian of slip, capped at 0.18 radians (about 10.3°), so yaw remains visible at normal race scale.
- Did not change steering authority, grip correction, C1 acceleration, oil behavior, track definitions, or C3/C4 rendering and suspension work.

## Repeatable physics-core measurements

Ran `node scripts/handling-check.js` after the changes; all checks passed. Existing low-speed steering, cornering, lift, recovery, wheel, oil, cone, track-fit, bounded-effects, acceleration, surface-response and six-lap AI checks remained green.

| Maneuver | Result |
|---|---|
| Mild steering at speed | 0.7° slip, 0.00 squeal |
| Clean corner | 5.0° max slip, 0.00 squeal |
| Aggressive high-speed turn | 11.7° max slip, 0.65 squeal, 0.941 peak yaw velocity |
| Full-throttle S-bend | 0.282 rad max slip, 1.00 squeal |
| Lift from high-speed turn | 0.155 rad max slip; lower than the aggressive throttle-on turn |
| Countersteer recovery | 4.7° to 2.7° in 0.67 s |
| Low-speed steering | 2.660 yaw response after 0.55 s |
| Existing oil response | 0.728 rad slip vs 0.204 rad aggressive normal-road turn; oil implementation itself unchanged |

The game loads and enters the normal Track 1 race on the live localhost build. Browser-controlled steering and throttle were exercised, but the operator run left the racing line; its speed samples are not presented as calibrated handling results. The repeatable core measurements above are the quantitative evidence for this phase.

## Limitations

The browser capture path cannot listen to or measure synthesized audio loudness. The audio code path now provides a stronger slip-only squeal signal, but subjective race feel can be evaluated during normal play and is not a programme blocker. No durable C2 screenshot is claimed.
