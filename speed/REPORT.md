# DREAM TEAM speed audit (Turbo, 2026-10-02)

## Summary
About 70% of every frame went to repainting things that don't change: the scaled backdrop (37%), the static world (16%), room signs, text measuring and trails.

**The patch:**
- gives the backdrop its own layer and caches the rest as images
- remembers text widths
- caps idle drawing at 20 fps and pauses in hidden tabs
- retunes walks so robots start moving immediately

**Results:**
- desktop frame time: −48% to −56%
- phone frame time: −63%
- idle CPU: −59%
- long tasks (desktop, 20 workers): 7 → 0
- robots cross the map in 4.2 s (was 9 s) and visibly start moving in about 0.1 s (was about 0.6 s), at the same top speed
- the look is pixel-equivalent (0.075% of pixels differ, all anti-aliasing), and data handling is untouched

**Not fixed:** phones with 80 robots, and the v2 3D view, which re-renders every frame.

## Method
- **Rendering:** no GPU here, so the canvas is drawn in software. Absolute times are pessimistic, but the ranking holds.
- **Load:** the machine was shared (load 9 to 48). Base and fast runs were interleaved and CPU was measured as main-thread time. The table below is from the quietest pass.
- **Scenarios:**
  - 20 workers: 6 working, 3 reviewing, 8 done, 3 queued, 3 managers
  - 80 workers: stress test, 4 managers
  - 1440x900, and 390x844 at DPR 3 with a 4x CPU slowdown
  - one status change every 2 s

## Before / after

| Scenario | Metric | Before | After | Change |
|---|---|---:|---:|---:|
| Desktop, 20 workers | frame avg / p95 | 6.37 / 13.3 ms | 2.81 / 4.5 ms | −56% / −66% |
| | long tasks (15 s) | 7 | 0 | −100% |
| | CPU / script per frame | 22.6 / 5.2 ms | 14.8 / 2.5 ms | −35% / −52% |
| Desktop, 80 workers | frame avg / p95 | 22.1 / 62.7 ms | 11.5 / 39.9 ms | −48% / −36% |
| | long tasks (15 s) | 107 | 68 | −36% |
| Phone, 20 workers | frame avg / p95 | 32.5 / 53.3 ms | 12.1 / 27.2 ms | −63% / −49% |
| | frames drawn per second | 9.4 | 15.3 | +63% |
| Desktop, idle | main-thread CPU | 559 ms/s | 227 ms/s | −59% |
| Phone, 80 workers | CPU per frame | 140 ms | 139 ms | no change |
| Heap, 80 workers, 3 min | retained growth | +2.11 MB | +1.91 MB | no new growth |

## Robot responsiveness
A status change already reaches a robot on the next frame. The sluggishness came from walk tuning:
- trips longer than 1,064 px hit the 9 s cap
- slow-start easing covered only 5% of the distance in the first 23% of the trip time

| Measurement | Before | After |
|---|---:|---:|
| Desktop: first visible motion (median) | 656 ms | 324 ms |
| Desktop: arrival (median / worst) | 5.6 s / 10.8 s | 3.3 s / 6.4 s |
| Phone: first visible motion (median) | 827 ms | 292 ms |
| Phone: arrival (median / worst) | 4.5 s / 9.0 s | 3.5 s / 6.5 s |
| Cross-map trip (lunch → gate/studio) | 9.0 s (cap) | 4.2 s |

## Bottlenecks (desktop, 20 workers, share of frame time)
1. Backdrop redrawn every frame: 37%. Fixed (C1).
2. Static world repainted every frame: 16%. Fixed (C2).
3. Room signs measured and redrawn: 6%. Fixed (C3).
4. Name tags and pills measured each frame: 5%. Fixed (C4).
5. Ambient trails (164 fills per frame): 4%. Fixed (C5).
6. Always 32 fps, even when idle. Fixed (C7).
7. Walk tuning. Fixed (C9).
8. Panel rebuild plus forced layout on each status change. Not fixed; this is the main remaining long task on phones.
9. Robot bodies and furniture: 16%, already cached. Dominates on 80-robot phones.

## Changes (fast.diff; line numbers refer to dreamteam.fast.html)
- **C1:** backdrop moved to its own `#bgc` layer under the main canvas (CSS 32, 594-596, 1927).
- **C2:** `staticWorld()` / `paintStatic()` cache plates, roads, the Boss glow and zones (2172-2190). The cache is invalidated by size, zoom and pan changes and by `layoutVer`, and paints directly while the camera moves.
- **C3:** `roomSign()` / `paintSign()` cache the room signs (1587-1620).
- **C4:** `fit()` and `mw()` cache text widths (663-679). Both are capped at 3,000 entries and cleared when fonts load (816).
- **C5:** `trailStrip()` draws each trail strip once (850-870).
- **C7:** `busyFrame` throttles idle drawing to `IDLE_FRAME_MS`, 50 ms (1959-1960, 495, 2203). A data change still draws on the very next frame.
- **C8:** the draw loop and the 1 s timer pause while the tab is hidden (2201, 2212, 2444).
- **C9:** `WALK_SPEED` 130 → 240, `WALK_MAX_MS` 9,000 → 4,200, minimum 450 → 350 ms, with smoothstep walk easing (`easeWalk`).
- Reduced motion is unchanged, and 26% cheaper.

## Risks
1. Trail dots are very slightly softer.
2. About 5 MB more memory for the static layer.
3. Ambient motion runs at 20 fps when idle. Set `IDLE_FRAME_MS = 31` to revert.
4. Faster walks are a deliberate change. Tune with `WALK_SPEED`, `WALK_MAX_MS` and `easeWalk`.
5. There is a new `#bgc` canvas element.
6. If a browser never fires the font-loaded event, cached text widths can stay stale.
7. Expect smaller absolute times on real GPUs.

## v2 notes (the newer live page, 3,590 lines, with the 3D view)
- **Port:** `dreamteam.fast-v2.html` + `fast-v2.diff`. The patch applies as-is except walking: v2 routes walks over roads at 170-330 px/s, retuned to 240-520 px/s.
- **3D view:** frames there are never throttled, and `#bgc` is hidden in 3D. The 3D view still renders (`res/v2-grid.png`).
- **Results (20 workers, 1440):**

  | | Before | After |
  |---|---:|---:|
  | CPU per frame | 20.9 ms | 14.0 ms (−33%) |
  | Script per frame | 5.3 ms | 2.7 ms (−49%) |
  | Idle CPU | 494 ms/s | 211 ms/s (−57%) |
  | Walk arrival (median) | 8.6 s | 5.7 s |
  | Walk arrival (worst) | 13.6 s | 7.9 s |

- **New bottleneck, not fixed:** `frame3D()` re-renders every frame at about 32 fps with anti-aliasing at up to 1.5x DPR, costing 1-2.4 extra cores plus 8-11 ms of main-thread time per frame. It should render only when something changes.

## Follow-ups
1. Update only the changed rows and cards in the panels, and drop the forced layout in `applyLayout()`.
2. On 80-robot phones, skip details that are too small to see.
3. Render the 3D view only when something changes.
