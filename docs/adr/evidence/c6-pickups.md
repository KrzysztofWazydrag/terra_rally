# C6 — Shared pickup system evidence

**Status:** OWNER VERIFIED
**Baseline/source commit:** `e5a5ed488f878d6b0df99e7dd4b7cac33eb7040f` (C5 owner verification)
**Implementation/result commit:** `1c8afa6246fc095f1ae1deaabcaf872b38ccb414` (`feat: add shared competitive pickup system`)
**Scope:** shared pickup behavior and presentation across the existing game; no track, vehicle physics, race rules, or audio mix changes.

## Changes

All racers now collect from the same pickup objects. The production update selects the closest eligible racer within 42 world units; equal-distance claims resolve to the lower racer number. The synchronous claim deactivates the pickup before reward handling, preventing a second racer from receiving the same object. Finished and substantially airborne racers are ineligible.

AI steering targets the route center when an active pickup is within 72 route samples. Existing oil and cone avoidance runs afterward and can override that target. Existing pickup rewards are applied to the actual claimant. Player cash contributes to race earnings; AI cash is tracked on that racer. Player toast and rival-specific toast identify who received a pickup. Existing cash/repair/pickup audio effects are invoked, and a bounded eight-particle burst marks collection.

Each pickup returns only after its own collector completes one further lap. Another racer crossing the start cannot trigger it. For example, an AI pickup won at lap 0 returns when that AI reaches lap 1. This keeps one shared item contested and prevents same-frame repeat awards. A pickup won by a racer that never completes another lap remains absent until the race ends.

Pickup art is drawn as a colored, labeled, faceted prism with a separate stationary ground shadow and a sinusoidal vertical bob. The shadow is not translated with the bob. Particles use the existing bounded pool/cap.

## Runtime evidence

A disposable copy of the runtime was served locally over HTTP at `127.0.0.1:8795`. The temporary harness lived under `/tmp/terra-rally-c6-runtime`; no harness code was added to the repository. It selected Track #2 by setting the temporary copy's initial event index to 1, positioned the production player and AI around the first existing pickup point, then called the production `updatePickups()` and render path. The harness did not change the Track #2 definition, pickup rules, reward code, physics, AI code, renderer, or audio code. The source and temporary copy were verified for the same Canyon definition and C6 production systems before capture. The temporary server/copy were shut down/removed after collection.

The captures are at 1280×720 and show the Canyon course and race HUD. Player-first and AI-first states are deliberately positioned runtime claims, not human-driven collection or a measurement of autonomous AI navigation. They demonstrate the production shared claim/reward/feedback path under controlled ordering. Separate helper and source-integration checks cover single-winner selection, deterministic ties, eligibility, and lap respawn.

- [Active pickup state](c6-runtime/c6-active-pickup.png)
- [Player-first claim](c6-runtime/c6-player-claim.png)
- [AI-first/rival claim](c6-runtime/c6-rival-claim.png)

## Checks and measurements

Commands run:

```text
node --check game.js
node --check pickup-core.js
node scripts/pickup-system-check.js
node scripts/canyon-course-check.js
node scripts/handling-check.js
git diff --check
```

All passed. `pickup-system-check.js` covers player-first and AI-first results; one award only; equal-distance tie-break; airborne and finished-racer exclusion; respawn only on the collector's next lap and only once; and production source wiring for AI targeting, reward routing, feedback, shadow, and bobbing prism. Canyon route and existing handling regression checks also passed. The existing handling-check results are supplementary synthetic checks, not live pickup performance measurements.

The browser showed the race's sound indicator enabled, and the production collection path invokes the existing `cash`, `repair`, or `pickup` effect. This browser capture does not establish subjective loudness or audio quality; C8 remains responsible for race-audio balance.

## Limitations

The controlled AI-first capture places an AI racer at the pickup to verify the production claim path; it does not prove that autonomous AI reliably takes the pickup during an uncontrolled race. AI attraction logic is present and its ordering relative to hazard avoidance is verified in source. A naturally driven human collection was not captured. These are runtime-driver limitations, not synthetic substitutes for a lap measurement.

The controlled captures do not evaluate pickup readability or competition during an ordinary player-driven race. This limitation does not alter the owner's approval.

## Owner verification

On 2026-10-16, the owner explicitly approved C6. C6 is OWNER VERIFIED.
