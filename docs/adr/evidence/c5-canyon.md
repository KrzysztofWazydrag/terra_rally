# C5 — Canyon track rebuild evidence

**Status:** OWNER VERIFIED
**Baseline:** `0c29e1fcb65b6488554d680388839cab074304cd`
**Implementation commit:** `f399ea10515e261bf6f47b9a8323d38157b31347` (`feat: rebuild championship track two as canyon`)
**Scope:** Track #2 and its Canyon-specific presentation only

## Implementation

Track #2 is now **CANYON CIRCUIT**, with a 7,996-unit route composed of a fast mesa straight, sweeping section, braking corner, hairpin, S bend, gravel/dirt shortcut, bridge over water, tunnel passage, and off-road risk. Its driving surface includes tarmac, gravel, dirt, and mud zones. The standard road is 320 units wide against a 62-unit buggy (5.16 buggy widths). The tunnel walls leave a 272-unit visual gap (4.4 buggy widths), while the physical road width remains constant.

The reusable art kit adds original 512×512 asphalt, dirt, and gravel textures; racing-line wear; red/white kerbs; edge barriers; canyon rock walls and boulders; palms; signs and boards; barrels; tyre stacks; a marshal hut; a gantry; bridge/water treatment; and repeated race props. Track #1 and Track #3 definitions are unchanged. No vehicle physics, AI tuning, audio, or performance systems were changed.

## Measurements and verification

- A deterministic route-following controller using the shared production physics core completed a lap in **47.4 seconds**, with **0.0% off-road time** and **20.9° peak slip**. This is a synthetic route/tuning estimate, not a human or production-AI lap.
- Production AI was visible in the live five-car race captures. Per-AI lap timing is not exposed in the captured HUD and was not measured as a C5 result.
- The course check verified route length, 5.16-car standard width, visual passable tunnel gap, complete surface-zone coverage, route-feature placement, untouched Track #1/#3 names, Canyon texture/render wiring, AI oil avoidance, shared oil handling, and shared physical-cone update wiring.
- Supplementary shared handling check passed; its cone displacement and other synthetic physics outputs are not live C5 Canyon measurements.

Commands run:

```text
node --check game.js
node scripts/canyon-course-check.js
node scripts/handling-check.js
git diff --check
```

All passed. Captured output is in [c5-course-check.txt](c5-runtime/c5-course-check.txt) and [c5-handling-check.txt](c5-runtime/c5-handling-check.txt).

## Live runtime capture and temporary bypass

The committed runtime was copied to `/tmp/terra-rally-c5-current` and served over local HTTP at `http://127.0.0.1:8794/`. To avoid completing Track #1 solely to unlock Track #2, the disposable copy received one flow-only edit in `newChampionship()`: its initial `this.trackIndex` was changed from `0` to `1`. The production checkout, Track #2 definition, physics, AI, rendering, audio, and race rules were otherwise unchanged. This temporary bypass was not committed and the temporary harness was removed after capture.

The captures show a normal six-lap, five-car race in the production renderer, including the HUD, opponents, player vehicle and wheels, Canyon road edges, modular props, and the bridge/water section:

- [Start grid and Canyon race screenshot](c5-runtime/c5-start-grid.png)
- [Bridge, road edge, props, and hazards screenshot](c5-runtime/c5-bridge-hazards.png)
- [Full-course route overview](c5-runtime/c5-full-course.svg) (diagram rendered from the committed Track #2 route and feature data; not a live renderer screenshot)

The screenshots were taken from the temporary direct-start copy at 2560×1440 desktop resolution. They are live runtime captures, not mockups. No performance range was measured in C5; performance profiling remains in C9.

## Owner review and limitations

## Owner verification

On 2026-10-16, the owner reported playing CANYON CIRCUIT and approved C5. The owner confirmed that the track reads clearly as a race circuit at speed; the Canyon scenery and repeated modular assets feel coherent; road width is comfortable enough for racing; and the tunnel/narrow section is acceptable. C5 is OWNER VERIFIED.

The 47.4-second result is not a competent-human lap. A production AI lap-time result was not captured. The tunnel is a visual wall-to-wall pinch; road physics width is constant. These limitations remain recorded for later iteration and do not change the owner approval.
