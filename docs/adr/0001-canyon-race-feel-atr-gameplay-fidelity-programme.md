# ADR — Canyon Race Feel & ATR Gameplay Fidelity Programme

- **Status:** Accepted as the authoritative implementation plan; C0 is BLOCKED pending live-race evidence
- **Date:** 2026-10-16
- **Decision owners:** Game owner and implementation agent
- **Scope:** Championship Track #2 only, working name **CANYON**
- **Supersedes:** None

## Phase status

`Evidence` remains “Not captured” until the phase work produces a durable artifact or measured result. `Owner approved` means the owner has explicitly reviewed and accepted that phase's evidence.

| Phase | Description | Status | Evidence | Owner approved |
|---|---|---|---|---|
| C0 | Baseline / evidence | BLOCKED | Partial live HTTP observations plus source/synthetic evidence; [`C0 baseline evidence`](evidence/c0-baseline.md) and [handling-check output](evidence/c0-handling-check.txt). Required Track #2 evidence remains outstanding. | No |
| C1 | Vehicle pace | NOT STARTED | Not captured | No |
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

**Status: BLOCKED**

Capture a reproducible before-state for the existing Track #2 (currently named `QUARRY SWITCHBACK` in code), which is the programme's future CANYON reference.

- [ ] Record competent-player lap time and test conditions. *(Track #2 is gated behind the six-lap Track #1 event; no target lap was recorded.)*
- [ ] Measure live 0-to-top-speed time and current maximum usable speed. *(The controlled physics-core result is supplementary; live Track #1 speed samples did not establish acceleration time or maximum usable speed.)*
- [x] Measure road width relative to the rendered vehicle width. *(Source dimensions: 320 / 62 = 5.16.)*
- [ ] Record FPS and frame-time conditions, including viewport/resolution. *(Short F2 snapshots at 1920×1080 were 144 FPS / 7.0 ms; no sustained stability observation.)*
- [ ] Record AI lap times and race conditions. *(Production AI was seen in a live Track #1 race; no lap timing was captured. Synthetic test loop is explicitly not a substitute.)*
- [ ] Describe actual audible engine behavior across acceleration and sustained speed. *(SOUND ON in live game, but output was inaccessible for listening/capture; source inspection is supplementary.)*
- [ ] Capture durable screenshots of vehicle/wheel rendering and the track/HUD during a normal race. *(Frames were inspected live but the browser tool did not expose a supported local save path; no durable screenshots.)*
- [x] Store available evidence and identify the tested build/commit or source state. *(Source commit and evidence paths recorded below.)*

**Acceptance evidence:** all listed measurements or a clear note explaining unavailable measurements; baseline screenshots; reproducible test conditions. Do not change gameplay during C0.

**C0 evidence record (2026-10-16; updated after localhost trial):**

- **Status:** BLOCKED; no Track #2 live lap results, controlled live acceleration result, sustained performance record, audible engine assessment, or durable screenshots. Not technically complete and not owner verified.
- **Source/baseline commit for this live run:** `93b9c1ec2997b93d57201dae15c2f00bd3e4bb29` (`docs: refresh C0 provenance after GitHub rebase`); tree clean before measurement.
- **Resulting live-evidence report commit:** `9f0b912614ff21a864550ad55fa6df7c40ed880a` (`docs: record partial live C0 observations`).
- **Measurements/results:** served the existing project using Python's standard-library HTTP server at `http://127.0.0.1:8765/`; observed 1920×1080 CSS viewport at DPR 1. A real five-car race (player plus four production AI) was observed on Track #1, PINE RIDGE RUN. The interface offers no Track #2 selector, and Track #2 is gated behind all six Track #1 laps; the observed race did not complete a lap. Track #1 HUD samples included 249 km/h at displayed 0:01.93 and a later 254 km/h, but these uncontrolled samples do not establish 0-to-maximum timing or maximum usable speed. Short F2 snapshots were 144 FPS / 7.0 ms, with update 0.1–0.2 ms and render 0.4–0.7 ms; this is not a sustained stability measurement. Synthetic 60 Hz physics/route results remain supplementary and do not replace live Track #2 or production-AI timing.
- **Audio/screenshots:** SOUND ON was shown, but the browser interface offered neither audio listening/capture nor a supported way to persist its in-memory screenshots to the evidence directory. No durable screenshots were produced. The report records these limitations.
- **Evidence paths:** [`evidence/c0-baseline.md`](evidence/c0-baseline.md) (live method, partial observations, blockers); [`evidence/c0-handling-check.txt`](evidence/c0-handling-check.txt) (supplementary synthetic check).
- **Implementation notes:** localhost serving resolved the former `file://` access blocker. No game, gameplay, physics, AI, audio, rendering, or track files were changed. The live trial did not bypass championship progression or alter game state outside ordinary UI play.
- **Known limitations / blocker:** required evidence remains incomplete because normal UI progression gates Track #2 and the available browser tooling cannot save durable screenshots or capture/listen to game audio. C0 remains BLOCKED. Obtain an allowed way to complete the six-lap progression and persist/capture the missing evidence, then stop for owner verification.

### Phase C1 — Vehicle pace

**Status: NOT STARTED**

**Scope:** acceleration curve, top-speed buildup, engine speed feedback, and off-road penalty tuning. Track design is out of scope.

- [ ] Tune responsive launch followed by progressive acceleration.
- [ ] Target approximately 4–6 seconds to approach maximum usable speed, tuning by feel.
- [ ] Make engine pitch/level communicate speed and load.
- [ ] Keep grass recoverable and mud clearly more punishing.
- [ ] Compare results to C0 measurements.

**Acceptance evidence:** repeatable acceleration timing, surface behavior notes, audio comparison, and owner-observable gameplay capture. Stop for owner verification.

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

This ADR records decisions and the C0–C10 checklist. C0 has partial source/physics and live HTTP evidence and remains **BLOCKED** on Track #2 live-race measurements, durable screenshots, and audible engine assessment; no gameplay code was changed. Resume C0 and obtain owner verification before beginning C1.
