# DREAM TEAM fixes: handoff to the Swarm HQ thread

Justin decided (2026-10-02): **the Swarm HQ thread owns DREAM TEAM's code.** The TireDrop thread (`session_01JCAzfYHTcoqdHhaeWHfcG5`) audited the page and is handing these fixes over. It will not publish DREAM TEAM code itself.

This branch is a handoff package only. It has no site code and must never be merged into main.

Target artifact: https://claude.ai/artifact/BvzYNVbkpUYW4SNMjGRfze

## 1. Speed patch (Turbo): ready to apply
- **`speed/fast-v2.diff`:** a unified diff against live version **1790910859-9107** (3,590 lines, with the 3D view and the floater).
- **`speed/dreamteam.fast-v2.html`:** that version with the patch already applied.
- **If the page has changed since 1790910859-9107:** apply the diff by hand.
- **The patch, measured at 20 workers and 1440px:**
  - CPU per frame −33%
  - script per frame −49%
  - idle CPU −57%
  - median walk arrival 8.6 s → 5.7 s
  - the 3D view still renders
- **What it does:**
  - draws the backdrop on its own `#bgc` layer
  - caches the static world, the room signs, text widths and the trail strips
  - caps idle drawing at 20 fps and pauses in hidden tabs
  - retunes walking: v2's road routing went from 170–330 to 240–520 px/s
- **Same look:** about 0.075% of pixels differ, all anti-aliasing.
- **Full report:** `speed/REPORT.md` (risks, method, and the v1 numbers).
- **Not fixed, recommended next:**
  - `frame3D()` re-renders every frame (about 32 fps) even when idle, costing 1–2.4 extra CPU cores while 3D is open. Render it only on change, or apply the 20 fps idle cap.
  - Phones with 80 robots: the per-change panel rebuild plus the forced layout in `applyLayout()`.

## 2. Bugs (Sweep): 17 reproduced on the PREVIOUS version (1790906097-553f)
- **`bugs/REPORT.md`** has every bug with its repro, the line at fault and the fix.
- **`bugs/*.mjs`** are the repro scripts (`lib.mjs` is the shared harness; run with `NODE_PATH=$(npm root -g) node bugs/<t>.mjs`). They load `dreamteam.html` from the auditor's scratchpad, so point their path at your copy of the page.
- **Re-check each bug on the current version before fixing it.** Line numbers refer to the older file.

Most important:
- **P0, `user_changed`:** after an account switch, the old account's Claude Code threads stay in the list, on the floor and in the counts. The handler `return`s before `pushWorkers()` and `renderThreads()`.
- **P1, door queues:** they have no cap, so robots walk off the map with 60+ robots. Lunch and Next-up overflow share the same spots.
- **P1, 5th and 6th team zones:** they overlap other zones, and big rosters spill into the next zone.
- **P1, phone Today row:** pushed 178px off screen inside the Now sheet.
- **P1, keyboard focus:** lost to BODY on every update, on Enter on a card, and on Escape from a panel.
- **P1, long names:** push the status pill out of the Crew card.
- **P2, duplicate ids:** a doc's `data.id` overrides the doc id, so build docs as `{...d.data(), id: d.id}`.

## Floor conventions the TireDrop thread follows (no change needed)
- **Progress:** measured milestones (7 per code task, 100% only when the contract passes).
- **Who posts:** workers on the `TireDrop` team (manager `mgr-tiredrop`, `thread: "tiredrop-site"`) are posted by the TireDrop thread.
