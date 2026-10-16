# C8 — Race presentation evidence

**Date:** 2026-10-16
**Status:** TECHNICALLY COMPLETE — OWNER VERIFICATION REQUIRED
**Source/baseline:** `e2821b9708be9bd3dc51a8a2c08aa98569393508` (C7 owner approval record)
**Implementation/result:** `8608a29d8fb43af5bd775811c1c3258162f5f5e4` (`feat: polish race presentation for C8`).

## Implemented

- Rebuilt the race HUD hierarchy around a large ordinal position badge (1ST–5TH), with lap progress, prominent speed, readable timer, and clearer damage/turbo meters. Speed color and emphasis change at two presentation thresholds; these do not affect vehicle behavior.
- Strengthened the race countdown/GO and lap banners, pickup toast, surface indicator, and race-results finish panel.
- Adjusted only camera follow/zoom presentation to lead farther ahead and widen the view as speed rises. No movement, steering, grip, or collision values changed.
- Raised the engine, tyre-squeal, and surface-audio gains while keeping their existing speed/throttle/slip/surface dependencies. The live game displayed SOUND ON and exercised its racing audio update path. Browser capture tooling cannot audition sound; subjective loudness and race feel remain for owner review.
- Refined the cached Canyon racing line, red/white kerbs, red/white barriers and reflector posts, plus the reusable billboard sprite. This changes static presentation only; Track #2 route data, widths, hazards, props placement, and race rules are unchanged.

## Runtime capture

- Served a disposable runtime copy using Python's standard-library HTTP server on `http://127.0.0.1:8798/`.
- The temporary copy changed exactly one production-flow expression: `newChampionship()`'s initial `trackIndex` from `0` to `1`, to expose the already-existing CANYON CIRCUIT event. This bypassed the Track #1 championship unlock without changing Track #2 or any race system. `style.css`, `physics-core.js`, `pickup-core.js`, and all assets matched the source checkout at capture time; after reverting that one index change, `game.js` matched byte-for-byte too. `index.html` only had the added test-only recorder script reference; the recorder and evidence buttons lived exclusively in the disposable `/tmp` copy.
- Started the normal event through its briefing and race start, then drove a short operator-controlled segment. The real race HUD showed all five entries and live speed samples from 28–82 km/h at race timer 0:01–0:02. Four AI opponents were visible in the race captures. This short interaction is a presentation smoke check, not lap-time or pace evidence.
- Browser viewport was 2560×1313 CSS pixels at DPR 1. The durable capture contains the production game canvas and HUD values rasterized from the live DOM geometry/text at capture time. The capture control panel was excluded. Browser console had no errors or warnings.

## Durable screenshots

- [Normal Canyon race with cars, position, lap, speed, timer and GO cue](c8-runtime/c8-race-presentation.png)
- [Player vehicle and integrated wheel rendering with race HUD](c8-runtime/c8-vehicle-hud.png)
- [Canyon course surface, signs, kerbs, barriers, bridge and props](c8-runtime/c8-canyon-environment.png)

The source PNGs are 2560×1313. They show the production renderer, live race state, and the DOM HUD composed into the captured image; they are not mockups. The check output is [C8 validation](c8-runtime/c8-validation.txt).

## Validation and boundaries

- `node --check game.js` — PASS.
- `node scripts/ai-competition-check.js` — PASS (regression check only; no AI changes).
- `node scripts/canyon-course-check.js` — PASS (regression check; course geometry unchanged).
- `node scripts/handling-check.js` — PASS. Updated its source assertion for the new C8 engine/squeal gain formulas; the synthetic handling values are supplementary and are not presented as live audio evidence.
- `node scripts/pickup-system-check.js` — PASS (regression check; pickup rules unchanged).
- `git diff --check` — PASS.
- No `physics-core.js`, AI controller, Track #2 definition, pickup rules, collision rules, or race progression changes. No C9 performance profile was attempted.

## Owner verification

Please review the screenshots in play and confirm whether:

1. Current position is immediately obvious during racing.
2. Countdown/GO, lap, pickup, and finish feedback feel sufficiently arcade-like.
3. Camera follow and high-speed feedback improve the sense of pace without hiding the road.
4. Engine and tyre feedback are prominent and balanced in actual listening.

Subjective audio cannot be verified by the available browser capture path; this is an owner gameplay/listening check, not an implementation or test blocker. C9 has not started.
