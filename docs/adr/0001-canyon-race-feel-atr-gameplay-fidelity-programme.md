# ADR — Canyon Race Feel & ATR Gameplay Fidelity Programme

- **Status:** Accepted as the authoritative implementation plan; C0 is OWNER VERIFIED and C1 is TECHNICALLY COMPLETE pending owner verification
- **Date:** 2026-10-16
- **Decision owners:** Game owner and implementation agent
- **Scope:** Championship Track #2 only, working name **CANYON**
- **Supersedes:** None

## Phase status

`Evidence` remains “Not captured” until the phase work produces a durable artifact or measured result. `Owner approved` means the owner has explicitly reviewed and accepted that phase's evidence.

| Phase | Description | Status | Evidence | Owner approved |
|---|---|---|---|---|
| C0 | Baseline / evidence | OWNER VERIFIED | [C0 baseline evidence](evidence/c0-baseline.md), [runtime screenshots](evidence/c0-runtime/), and [supplementary handling-check output](evidence/c0-handling-check.txt). | Yes |
| C1 | Vehicle pace | TECHNICALLY COMPLETE — OWNER VERIFICATION REQUIRED | [C1 vehicle pace evidence](evidence/c1-vehicle-pace.md) | No |
| C2 | Handling / grip limit | NOT STARTED | Not captured | No |
| C3 | Vehicle animation pipeline | NOT STARTED | Not captured | No |
| C4 | Hop / suspension | NOT STARTED | Not captured | No |
| C5 | Canyon track rebuild | NOT STARTED | Not captured | No |
| C6 | Pickup system | NOT STARTED | Not captured | No |
| C7 | AI competition | NOT STARTED | Not captured | No |
| C8 | Race presentation | NOT STARTED | Not captured | No |
| C9 | Performance / polish gate | NOT STARTED | Not captured | No |
| C10 | Canyon golden baseline | NOT STARTED | Not captured | No |

## Context

Terra Rally is a dependency-free HTML5 Canvas arcade racer. The current game already has a 60 Hz simulation, a five-car championship, surface-dependent handling, directional vehicle presentation, hazards, pickups, layered track rendering, audio, AI, and an F2 performance overlay. The remaining priority is the quality and consistency of the race experience: pace, grip-limit handling, readable vehicle motion, track composition, opponent competition, audio feedback, and clear race information.

ATR is a reference for broad gameplay philosophy and race feel only. The project will use original names, tracks, art, audio, code, and presentation. It will not reproduce ATR's protected expression.

The repository currently identifies Championship Track #2 as **QUARRY SWITCHBACK** in `game.js`. This programme names the future reference course **CANYON**. C0 must record the current implementation under its current name before any changes; C5 is the only phase that may rebuild Track #2 into the Canyon reference. This ADR task does not rename or alter the track.

## Decision

Adopt the phased Canyon programme below as the source of truth for the next development stage. Work on Track 1 and Track 3 is deferred until C10 has been completed and the owner has approved Canyon as the golden baseline. Canyon's approved systems may then inform future tracks.

The target reaction is: **“This has the race feel I remember from ATR.”** The goal is an original game with classic Amiga top-down arcade racing feel, not a visual replica.

### Gameplay and presentation decisions

1. **Lap length and race pace:** Tune a competent Canyon lap toward approximately 45–55 seconds, with about 50 seconds as the baseline target. Keep six laps. Do not shorten the course artificially to create intensity; build intensity through speed, hazards, AI, cornering, obstacles, and overtaking.
2. **Acceleration:** Keep immediate response, then build speed progressively. Initial target is roughly 4–6 seconds to approach maximum usable speed. Top speed should feel earned; avoid rocket-like acceleration.
3. **Sense of speed:** Communicate speed with engine pitch and level, passing trackside assets, kerbs and barriers, road texture movement, tyre/skid audio, short reaction windows, AI proximity, and camera behavior. Do not rely on increasing the numerical top speed.
4. **Handling:** Keep the car agile, quick to steer, and planted at low and medium speeds. Normal high-speed corners may create slight slip. A sharp high-speed turn that exceeds grip must produce obvious squeal and visible yaw; the driver can lift or countersteer to recover. This is a grip-limit arcade racer, not a drift racer.
5. **Tyre squeal:** Make squeal clearly audible at the grip limit and scale it with lateral slip and speed. Steering input alone must not trigger it.
6. **Engine audio:** Make the engine one of the dominant gameplay sounds. Pitch and intensity communicate acceleration, speed, load, maximum speed, lift-off, and airborne moments. Original music is welcome as long as engine and tyre feedback remain clear.
7. **Vehicle character:** The buggy should feel agile, quick, light, springy, and mechanically alive, with readable momentum. It should not feel heavy, floaty, sluggish, or permanently sideways.
8. **Small hops:** Use small road steps or bumps, not giant stunt ramps. At speed, the car rises briefly, preserves momentum, has little or no steering while airborne, then lands with visible suspension compression, a small rebound, and a light impact sound.
9. **Off-road response:** Grass causes moderate speed decay, weaker acceleration, and reduced grip while remaining recoverable. Mud is significantly worse. A brief excursion should cost time without ending the race.
10. **Track width:** Normal racing width should be around five to six vehicle widths, allowing five cars to race, pass, and recover from a slide. Deliberately narrow sections are allowed. Do not shrink the vehicle to compensate for a narrow road.
11. **Canyon visual language:** Build a consistent original modular circuit kit. Reuse is desirable. The kit may include red/white kerbs, tyre stacks, barrels, cones, barriers, advertising boards, race signs, small buildings and marshal/control structures, occasional palms and canyon vegetation, rocks, water, fences, and a race gantry. Consistency and circuit readability take priority over unique asset count.
12. **Racing edges:** Use red/white kerbs or barrier edging where it clarifies corner geometry and speed, especially at sharp turns, track edges, chicanes, and dangerous sections. They need not run along every metre.
13. **Track composition:** Canyon must be a sequence of racing situations rather than a simple outer loop. Include a fast straight, sweeping turn, braking corner, hairpin, S bend, short off-road risk, oil, cones, small hop, bridge/water section, narrow passage, wider overtaking area, and a tunnel/underpass where suitable.
14. **Oil:** Oil sharply reduces lateral grip at speed and makes a memorable but recoverable slide. Its primary effect is control, not a large speed penalty. AI is affected too.
15. **Cones and light objects:** Cones are physical objects. Hits move and spin/tumble them, provide light impact feedback, and may cause slight speed loss. Other light objects may use the same system.
16. **Pickups:** A pickup point has one shared, valuable-looking object at its active location. It bobs above a visible ground shadow and reads as a 3D-like object within the 2D view. Only one racer collects it; it disappears and may respawn under defined rules. It must not look like a flat HUD icon placed on the road.
17. **Pickup competition:** AI racers can collect the same pickup. If an AI reaches it first, the player does not receive it. Pickups create competition for the racing line.
18. **Race position:** Make the current position immediately readable as 1st through 5th. Evaluate a large arcade-style indicator near a screen corner; do not bury position in a small technical HUD.
19. **AI quality:** AI must compete through racing lines, braking/lift points, corner speeds, strong straight-line acceleration, believable mistakes, overtaking, natural line defense, and interaction with hazards, collisions, and pickups. Avoid obvious extreme rubber-banding. Canyon is the AI tuning reference.
20. **Vehicle and wheel pipeline:** Replace the pasted-looking tyre treatment with an integrated solution: directional frames with wheel appearance built in, aligned separate wheel layers, or an equivalent clean pipeline. At normal viewing size there must be no seams, floating graphics, mismatched texture, or incorrect perspective.
21. **Vehicle view:** Keep the car predominantly top-down with roof, bonnet, rear, and wheels visible and only mild perspective depth. Do not return to a strongly isometric vehicle.
22. **Vehicle shadow:** Use a subtle contact shadow under the car that does not obscure its wheels or body and respects draw order. During a hop the car rises while the shadow stays at ground level.
23. **Environment depth:** Keep the game a 2D top-down arcade racer. Preserve depth with object shadows, layered terrain, bridge thickness, recessed water, barriers, and structural overlap. Race feel takes priority over environmental complexity.
24. **Performance:** Target stable 60 FPS at 1920×1080 on normal desktop hardware. Cache or pre-render static track art where sensible. Avoid rebuilding expensive paths every frame, dynamic blur for static scenery, unlimited particles or skid marks, and drawing scenery outside the camera view. A performance regression blocks release.

### Phase execution contract

- Every future implementation session starts by reading this ADR and working from a clean, phase-specific context.
- Work only on the current phase. Do not combine phases in one session unless the owner explicitly instructs it.
- Before implementation, confirm the phase scope and acceptance evidence. Do not silently expand scope.
- Update the phase status and attach evidence in this ADR when work is ready for review. Evidence may include measurements, screenshots, test output, or concise reproduction notes, as appropriate to the phase.
- `TECHNICALLY COMPLETE` means scoped implementation and its technical evidence are ready. It does not mean the phase is approved.
- Stop after presenting the phase evidence and request owner verification. Set `OWNER VERIFIED` only after explicit owner approval. Do not start the next phase before that approval.
- If a phase cannot proceed, mark it `BLOCKED`, record the reason and evidence, and stop for owner direction.
- The final phase C10 records the approved Canyon baseline. Only after C10 is `OWNER VERIFIED` may Canyon be treated as the reference implementation for other tracks.

## Implementation plan

Checkboxes are phase work items, not proof of completion. Each phase remains `NOT STARTED` until that phase is explicitly begun. For every phase, record the resulting evidence in the status table and stop for owner review.

### Phase C0 — Baseline / evidence

**Status: OWNER VERIFIED**

Capture a reproducible before-state for the existing Track #2 (currently named `QUARRY SWITCHBACK` in code), which is the programme's future CANYON reference.

- [ ] Record a competent-human lap time and test conditions. **Owner value not supplied**; the owner approval message contained the literal `[TIME]` placeholder. No automated/browser-driven run is being represented as a competent human lap.
- [x] Measure live acceleration from rest and record the highest usable speed observed. Live HUD reached 300 km/h on TARMAC 5.45 seconds of game-clock after a reset; throttle was held for 3.00 seconds. This is the highest live speed observed, not a confirmed plateau.
- [x] Record FPS and frame-time conditions at approximately 1920×1080. Repeated F2 snapshots over approximately 2:46 of live Track #2 race time: 144 FPS, 6.9–7.1 ms frame, 0.0–0.2 ms update, 0.3–1.0 ms render; no visible stutter/spikes.
- [x] Record a live production-AI race timing checkpoint and race conditions. At race clock 0:01.69 the player was 2/5 and all four AI were visible; at 1:20.14 the player was 5/5 with two AI visible. The normal HUD exposes no individual AI lap counters/times, so no per-AI lap time is claimed.
- [x] Verify engine audio implementation and that the live race audio path runs. Source/runtime presence is captured; subjective loudness and race-feel require owner listening.
- [x] Capture durable screenshots of normal racing, vehicle/wheels, HUD, Track #2 and production AI. See [`C0 runtime screenshots`](evidence/c0-runtime/).
- [x] Store evidence and identify the tested source state. Baseline commit is `a6628f31628f3ad339f4d524e6d2b549d9208653`.

**Acceptance evidence:** all listed measurements, or a clear note explaining measurements unavailable through the production UI; durable baseline screenshots; reproducible test conditions. Do not change gameplay during C0.

**C0 evidence record (2026-10-16; temporary Track #2 runtime capture):**

- **Status:** OWNER VERIFIED. The owner confirmed review of C0 evidence and screenshots and explicitly approved C0. The lap-time and subjective audio assessment fields were left as the literal `[TIME]` and `[MY ASSESSMENT]` placeholders, so no values are attributed to the owner.
- **Source/baseline commit:** `a6628f31628f3ad339f4d524e6d2b549d9208653`.
- **Resulting C0 evidence commit:** `506108b` (`docs: complete C0 Track 2 baseline evidence`).
- **Runtime method / temporary bypass:** copied only runtime files to `/tmp/antoni-game-c0.0Dp4qb`; changed only copied `game.js` `newChampionship()` flow from `trackIndex=0` to `trackIndex=1`, serving it using Python's standard-library server at `http://127.0.0.1:8766/`. This opened the existing `TRACK_DEFS[1]` / QUARRY SWITCHBACK through its normal event briefing and normal race start. `index.html`, `physics-core.js`, `style.css`, and all three assets matched the source checkout byte-for-byte; `game.js` had only the single flow-index difference. Temporary copy and server were removed after capture. No repository gameplay source or permanent dependency changed.
- **Live production AI:** the actual five-car Track #2 race ran with four production AI. At 0:01.69 HUD position was 2/5 and the start-grid screenshot showed all five cars; at 1:20.14 HUD position was 5/5 and two AI were visible in the race screenshot. These are race-clock checkpoints from the live production race, distinct from the synthetic handling-check route. The production HUD exposes no per-AI lap counter/time, so individual AI lap times remain unavailable and are not inferred.
- **Live acceleration / speed:** reset HUD read 0 km/h at race clock 4:25.60; Up was held 3.00 seconds; next HUD sample was 300 km/h on TARMAC at 4:31.05 (5.45 seconds of game-clock elapsed). Highest live sample: 300 km/h. The run did not establish a stable limiter plateau; source-configured 326 is supplementary only. A separate full-throttle probe reached 254 km/h before ending off-road on GRASS.
- **Performance conditions/results:** viewport override 1920×1080 CSS pixels, DPR 1, live Track #2 race with F2 overlay. Repeated F2 snapshots across approximately 2:46 of race time read 144 FPS, 6.9–7.1 ms frame time, 0.0–0.2 ms update, and 0.3–1.0 ms render. No visible spikes or stutter. These were repeated discrete readings, not a continuous trace or full six-lap profile; the player was stationary/off-line for some of that sample period.
- **Engine audio:** SOUND ON was displayed and the live race audio update ran. In `game.js` lines 197–212, `AudioSystem.ensure()` creates/resumes Web Audio; a sawtooth engine oscillator is started during racing; frequency is `(58 + speed × 0.62) × load × airborneFactor`, with squeal-dependent load and 0.84 airborne factor; gain is fixed at 0.014 while racing. The engine is speed-dependent, not throttle-dependent. The browser/capture path cannot genuinely listen to the output. Subjective launch, acceleration, sustained-speed and lift-off loudness/race-feel are **OWNER VERIFICATION REQUIRED**.
- **Player lap:** no competent-human or representative controlled completed player lap was captured. The owner did not supply the requested lap value/conditions; C0 is owner verified based on the owner's explicit approval of the evidence, without claiming a lap time.
- **Evidence paths:** [`C0 baseline evidence`](evidence/c0-baseline.md); [`runtime screenshots`](evidence/c0-runtime/); [`supplementary synthetic handling check`](evidence/c0-handling-check.txt).
- **Implementation notes:** no committed game, gameplay, physics, AI, audio, rendering, or track files were changed. No C1 work was started. The one-line bypass existed only in the disposable `/tmp` copy and was deleted.
- **Known limitations:** owner review was confirmed; subjective audio assessment and competent-human lap value were not supplied. Production UI does not show individual AI lap times, and the live highest speed sample did not verify a stable speed cap. The AI race-clock checkpoint, live speed reading, repeated F2 measurements, audio implementation/runtime observation, and screenshots are durable; synthetic values remain supplementary only.

### Phase C1 — Vehicle pace

**Status: TECHNICALLY COMPLETE — OWNER VERIFICATION REQUIRED**

**Scope:** acceleration curve, top-speed buildup, engine speed feedback, and off-road penalty tuning. Track design is out of scope.

- [ ] Tune responsive launch followed by progressive acceleration.
- [ ] Target approximately 4–6 seconds to approach maximum usable speed, tuning by feel.
- [ ] Make engine pitch/level communicate speed and load.
- [ ] Keep grass recoverable and mud clearly more punishing.
- [ ] Compare results to C0 measurements.

**Acceptance evidence:** repeatable acceleration timing, surface behavior notes, audio comparison, and owner-observable gameplay capture. Stop for owner verification.

**C1 evidence record (2026-10-16):**

- **Status:** TECHNICALLY COMPLETE — OWNER VERIFICATION REQUIRED.
- **Source/baseline commit:** `b113eaeff56b2dea26e48dba27650afba75a84eb` (C0 owner-verification record).
- **Result/evidence:** see [`C1 vehicle pace evidence`](evidence/c1-vehicle-pace.md); implementation and verification are in the resulting C1 commit.
- **Implementation:** reduced default buggy acceleration from 205 to 120; eased grass resistance from 125 to 70 so the reduced engine force does not turn grass into a near-terminal loss of momentum; made engine pitch and level respond to speed and player throttle, retaining slip load and airborne pitch effects. Mud values remain unchanged and substantially more punitive than grass.
- **Limitations:** controlled browser driving did not hold the racing line long enough for a reliable live acceleration measurement. The HUD samples from that operator run are recorded as inconclusive; they do not replace the repeatable physics-core measurement. The browser capture cannot evaluate audio loudness or subjective race feel, which need owner listening.

### Phase C2 — Handling / grip limit

**Status: NOT STARTED**

**Scope:** planted normal handling, high-speed sharp-turn skid, tyre squeal, lift-off behavior, recovery, and countersteer.

- [ ] Preserve quick steering response and direct low/medium-speed control.
- [ ] Keep ordinary high-speed corners mostly planted.
- [ ] Make sharp high-speed turns beyond grip visibly and audibly slide.
- [ ] Scale tyre squeal with speed and actual slip, not steering alone.
- [ ] Make throttle lift and countersteer settle the car in a readable, recoverable way.
- [ ] Keep oil's large grip loss for its later track integration; confirm its handling response if the existing surface model supports it without widening this phase.

**Acceptance evidence:** repeatable straight, clean-corner, grip-limit, lift, and countersteer captures/notes. Owner verifies the car is agile and slips only when pushed beyond grip.

### Phase C3 — Vehicle animation pipeline

**Status: NOT STARTED**

**Scope:** remove pasted-looking wheel animation, integrate wheel visuals, directional vehicle frames, suspension/hop presentation, and contact shadow.

- [ ] Select and implement an integrated wheel rendering approach.
- [ ] Keep directional frames visually coherent, predominantly top-down, and consistent in scale/perspective.
- [ ] Show suspension/body response without obscuring vehicle orientation.
- [ ] Keep a small contact shadow under the car and separate it from the body during a hop.
- [ ] Inspect the car at normal race scale for seams, floating layers, or mismatched perspective.

**Acceptance evidence:** screenshots/video across representative headings and steering states, including a hop if available; owner confirms visual coherence.

### Phase C4 — Hop / suspension

**Status: NOT STARTED**

**Scope:** small road bump, brief airborne state, momentum preservation, springy landing, and audio feedback. No stunt ramps.

- [ ] Add a small road step/bump interaction.
- [ ] Keep the airborne interval brief and preserve forward momentum.
- [ ] Reduce steering authority while airborne.
- [ ] Show soft compression and a small rebound on landing.
- [ ] Add a restrained impact sound and retain the ground shadow beneath the airborne vehicle.

**Acceptance evidence:** repeatable hop capture and handling/audio notes showing the short rise, limited steering, and immediate drive continuation. Owner verification required.

### Phase C5 — Canyon track rebuild

**Status: NOT STARTED**

**Scope:** rebuild Championship Track #2 only into the CANYON reference. Target approximately a 50-second competent lap, wider raceable surface, a clear sequence of racing situations, kerbs, hazards, bridge/water, hop, varied widths, and a coherent race scenery kit. Do not redesign Tracks 1 or 3.

- [ ] Establish a route layout that is not a simple outer loop and includes the required situations: fast straight, sweep, braking corner, hairpin, S bend, off-road risk, oil, cones, hop, bridge/water, narrow passage, overtaking area, and tunnel/underpass where appropriate.
- [ ] Tune normal width toward five to six vehicle widths; deliberate narrow sections must remain passable by design.
- [ ] Place red/white edge markers where they clarify high-risk geometry.
- [ ] Apply the modular original scenery kit consistently and keep the driving surface obvious at speed.
- [ ] Confirm oil hazards affect player and AI control.
- [ ] Confirm physical cones can be displaced and provide light feedback.
- [ ] Tune the route toward a 45–55 second competent lap, aiming near 50 seconds.

**Acceptance evidence:** full-course screenshots/capture; route and width review; measured lap time; notes showing hazards and racing situations; owner verifies this is the sole rebuilt championship track.

### Phase C6 — Pickup system

**Status: NOT STARTED**

**Scope:** shared floating/bobbing pickup, 3D-like readability, single-racer collection, AI collection, disappearance/respawn, and collection feedback.

- [ ] Show one active object at each pickup location with a ground shadow and clear vertical bob.
- [ ] Ensure a pickup can be awarded to only one racer.
- [ ] Allow player and AI to collect from the same pool.
- [ ] Define and implement disappearance and respawn behavior.
- [ ] Add readable collection sound/feedback without overwhelming the race.

**Acceptance evidence:** player-first and AI-first collection captures, single-winner result, respawn demonstration or documented rule, and owner verification.

### Phase C7 — AI competition

**Status: NOT STARTED**

**Scope:** racing line, braking/lift points, corner speed, overtaking, hazard interaction, pickup competition, and believable mistakes.

- [ ] Give the five racers varied, usable racing lines.
- [ ] Make AI choose appropriate braking/lift points and corner speeds for Canyon.
- [ ] Support overtaking and sensible line defense without identical-path convergence.
- [ ] Make AI react to oil, cones, collisions, and pickups.
- [ ] Allow occasional believable mistakes while avoiding obvious extreme rubber-banding.
- [ ] Measure AI lap times and race competitiveness against C0/C5 conditions.

**Acceptance evidence:** repeatable multi-car race captures and lap-time results showing competitive behavior, hazard/pickup interaction, and no obvious rubber-band jumps. Owner verification required.

### Phase C8 — Race presentation

**Status: NOT STARTED**

**Scope:** clear position indicator, lap/time if retained, race-start presentation, engine prominence, tyre/collision/pickup audio, and race-pace feedback.

- [ ] Make 1st–5th position unmistakable at a glance.
- [ ] Present lap and timer information if retained, without crowding the course.
- [ ] Review race-start presentation for clear launch timing.
- [ ] Balance engine, tyre, collision, and pickup sounds so speed and grip feedback remain audible.
- [ ] Ensure high-speed feedback supports reaction and course readability.

**Acceptance evidence:** normal-race screenshots/capture and audio review with HUD visible; owner verifies position and race feedback are immediately readable.

### Phase C9 — Performance / polish gate

**Status: NOT STARTED**

**Scope:** profiling, caching, culling, particle/skid limits, and a full six-lap performance run.

- [ ] Profile representative gameplay at 1920×1080 and identify material frame-time costs.
- [ ] Cache/pre-render static art and cull off-camera scenery where sensible.
- [ ] Bound particle and skid-mark history; check for retained objects and progressive memory growth.
- [ ] Run a full six-lap race and record frame rate/frame time over the run.
- [ ] Compare to C0 and investigate any material regression before completion.

**Acceptance evidence:** profiler results, six-lap run conditions and measurements, and a note on memory/effect bounds. Target stable near 60 FPS on normal desktop hardware; a material regression blocks release. Owner verification required.

### Phase C10 — Canyon golden baseline

**Status: NOT STARTED**

Final validation and approval of Canyon as the reference implementation.

- [ ] Record final competent lap time and race conditions.
- [ ] Record acceleration timing and maximum speed.
- [ ] Record handling and grip-limit observations.
- [ ] Record AI lap times and competitiveness notes.
- [ ] Record FPS/frame time from the six-lap test.
- [ ] Capture final vehicle, track, and HUD screenshots.
- [ ] List known limitations and attach all evidence to this ADR or clearly linked durable artifacts.
- [ ] Stop for explicit owner sign-off.

**Acceptance evidence:** complete before/after record against C0, final screenshots and measurements, known limitations, and explicit owner approval. Only then may Canyon serve as the approved baseline for future tracks.

## Status definitions

- **NOT STARTED:** no work for the phase has begun.
- **IN PROGRESS:** scoped work is actively underway.
- **BLOCKED:** a documented issue prevents safe or meaningful progress; record the reason and stop for owner direction.
- **TECHNICALLY COMPLETE:** phase scope is implemented and its acceptance evidence is ready for review. This status is not owner approval.
- **OWNER VERIFIED:** the owner has explicitly reviewed and approved the phase evidence.

Update the status table only when evidence supports the new status. A passing automated check by itself cannot mark a phase technically complete or owner verified.

## Change control

Do not silently change a decision when implementation evidence shows it may be wrong. Record a dated entry below with the original decision, observed problem, proposed change, reason, and resulting decision. Preserve earlier entries so the decision history remains reviewable.

| Date | Original decision | Observed problem | Proposed change | Reason | Resulting decision |
|---|---|---|---|---|---|
| — | — | — | — | — | No changes recorded. |

## Current session boundary

This ADR records decisions and the C0–C10 checklist. C0 is **OWNER VERIFIED** based on the owner's explicit approval of its evidence and screenshots. The competent-human lap value and subjective audio assessment were not supplied and remain unreported. C1 is **TECHNICALLY COMPLETE — OWNER VERIFICATION REQUIRED**; its engine loudness/feel and pace should be reviewed in a live race before C2.
