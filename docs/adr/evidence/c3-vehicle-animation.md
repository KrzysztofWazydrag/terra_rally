# C3 — Vehicle animation pipeline evidence

Date: 2026-10-16  
Source/baseline commit: `2f631a7d9c99a73c9fd4084e578706db9e800aa6`  
Phase result: technically complete.

## Changes

- Confirmed `assets/player-buggy-topdown.png` already has the front and rear wheels integrated into the original top-down buggy sprite.
- Removed the four separately drawn tyre overlays from `DirectionalVehicleAtlas.draw()`. The 32 directional frames now rotate/tint one integrated car-and-wheel image, avoiding duplicated tread marks and wheel seams.
- Disabled smoothing while building the directional atlas to preserve the crisp pixel edges of the original art.
- Kept the sprite's existing rise/compression offset (`car.y - car.z - suspension × 3`). Moved the contact and wheel shadow to a ground-relative position (`car.x + 3`, `car.y + 5`) independent of jump height; its opacity still softens while airborne.

## Verification

- Captured a durable normal-race screenshot at [`c3-track1-race-vehicle.png`](c3-runtime/c3-track1-race-vehicle.png). It shows the player and production opponents at race scale from multiple headings, with the HUD and surrounding race surface visible.
- Visual inspection found the integrated wheels remain aligned with the car body and no separate tread overlay remains. The whole vehicle remains top-down with the existing mild perspective.
- Ran `node scripts/handling-check.js`; all checks passed, including new source assertions that the integrated wheel atlas is used, the overlay is absent, directional frames retain crisp edges, and the ground shadow stays separate from the lifted body.
- Live localhost startup/race smoke test passed on Track 1. No track definitions were edited.

## Limitations

No hop screenshot was captured. C4 owns the hop/suspension evidence. No new vehicle art or Canyon track content was added in C3.
