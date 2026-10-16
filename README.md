# Terra Rally 2.0

A dependency-free HTML5 Canvas arcade racer inspired by the pace, clarity, terrain response, and championship rhythm of classic 16-bit top-down racing games. All names, circuits, presentation, code, and generated art are original.

## Play

Open `index.html` directly, or serve the directory with any static file server.

- Arrow keys or WASD: accelerate, brake, and steer
- Space: turbo
- R: reset to the racing line
- H: hide/show the racing HUD
- F2: heading, velocity, slip, yaw, FPS, frame/update/render time, particles, and visible object counts
- Fullscreen and sound controls sit in the lower-right corner

## Version 2.0 scope

- Three-event Forest World championship
- Five racers and six laps per event
- Deterministic 60 Hz arcade simulation with separate heading, velocity, angular velocity, and lateral slip
- Dirt, tarmac, gravel, mud, water, and grass handling
- Slip-limited cornering where lifting and braking matter
- 32-direction vehicle presentation with yaw, body roll, suspension movement, and paired skid trails
- Speed-driven wheel tread animation, visible front-wheel steering, braking lockup, and driven-wheel slip
- Dynamic tyre squeal driven by speed, steering load, surface grip, and slip angle
- Oil slicks, physical respawning cones, tunnels, jumps, bumps, bridge sections, collisions, and damage
- Money and performance pickups
- Post-race results, cash rewards, and a four-part upgrade shop
- Stable world-oriented camera with speed-sensitive lead and zoom
- Layered road shoulders, embankments, recessed water, elevated bridges, and true tunnel occlusion
- Competitive AI with corner-entry speed planning, braking, passing lines, and hazard avoidance
- Original Web Audio synth music, engine tone, and effects
- No backend, external framework, or runtime dependency

The handling core lives in `physics-core.js`; track, AI, camera, race, UI, audio, and rendering systems live in `game.js`. Both remain compatible with direct local launch.

## Handling verification

Run `node scripts/handling-check.js` to check controlled corner slip, counter-steer recovery, surface speed, acceleration progression, five-car track fit, bounded effects, and a six-lap AI run.
