# DREAM TEAM bug audit (Sweep, 2026-10-02)

Every bug below was reproduced in headless Chromium against `audit/dreamteam.html` (a copy of the live version, 1790906097-553f). Line numbers refer to that file. The repro scripts are in this folder; run any of them with `NODE_PATH=$(npm root -g) node <script>`.

## Summary
17 bugs: **1 P0, 7 P1, 9 P2**.

What held up:
- There were no JS errors, unhandled rejections or NaN/undefined text at 0, 30 or 120 workers, with bad documents, with every Threads error code, or over a compressed 5-minute churn.
- Robots always reached their seats.
- Every visible control is at least 44px.

| # | Sev | Bug | Lines |
|---|---|---|---|
| 1 | P0 | After `user_changed`, the previous account's threads stay in the list, on the floor, in the counts and in an open card | 2765 |
| 2 | P1 | Door queues have no limit, so robots walk off the map (44/120 targets fall outside the world) | 686-692, 738 |
| 3 | P1 | Lunch overflow and the Next-up overflow use the same door spots, so robots stack | 724-739 |
| 4 | P1 | A 5th or 6th manager gets an overlapping or identical team zone | 703-708 |
| 5 | P1 | A big team's roster chips spill out of its zone into the next one | 712 |
| 6 | P1 | Phone: the Today row in the Now sheet is shifted 178px off screen and clipped | CSS 287-288 vs 315-316 |
| 7 | P1 | Keyboard focus drops to BODY on every update, on Enter on a card, and on Escape from a panel | 2319, 2355, 2501, 2409 |
| 8 | P1 | A long unbroken name pushes the status pill out of the Crew card | CSS 168 |
| 9 | P2 | The 5th temp on a team is drawn 24px under the 1st | 747-748 |
| 10 | P2 | The 6th and later done or failed shells stack 14px apart | 762-764 |
| 11 | P2 | A doc's `data.id` overrides the doc id, so two docs merge into one robot | 2785 |
| 12 | P2 | Shells that finished before page load reappear for 60 or 120 s | 2640 |
| 13 | P2 | The Terminal Bay card shows "1/8 in use" and "Nobody is in this room" together | 2523 |
| 14 | P2 | When a temp walks out, its card stays open and "agents on the floor" still counts it | 719, 2289, 2545 |
| 15 | P2 | "Events in the last hour" never goes above 40 (the query limit) | 2391, 2786 |
| 16 | P2 | `seenEv`, `said`, `chat` and `chatOk` grow without limit | 2589, 1819-1821, 1625 |
| 17 | P2 | Keyboard users press Tab 44 times before reaching the panel toggles | 374 |

## P0
**1. `user_changed` keeps the previous account's threads** (`t3-threads.mjs`)
- **Repro:** Open the Threads panel with 3 sessions, open the `th:session_a` card, then emit `{type:'error', error:{code:'user_changed'}}`.
- **Observed:** 1.5 s later the list, the counts, the badge, the thread robots, the top stats and the open card are all unchanged.
- **Cause:** Line 2765 clears `threads` and `threadWorkers`, then `return`s. That skips `pushWorkers()` and `renderThreads()`, and leaves `thAt` set.
- **Fix:**
  - Remove the `return`.
  - Set `threads=[]; thAt=0; thMore=false; thState={kind:'connecting',text:'Switching accounts…'}`.
  - Fall through to `threadWorkers=threadsToWorkers(); pushWorkers(); renderThreads();`. The card then closes through `renderDetail`.

## P1
**2. Door queues have no limit** (`t2-layout.mjs` A, `shot-n120-1440.png`)
- **Observed:** With 60 idle, 20 queued and 40 working workers, 44 targets are outside the 2400×1770 world; for example `i14` is at (528, −1023).
- **Fix:**
  - Give door spots to at most 6 people per room; the rest fade out behind the "+N waiting" sign.
  - Clamp every target to the world.

**3. Lunch and Next-up overflow share spots** (`t2` B)
- **Observed:** With 8 idle and 5 queued, `i6` and `q3` get the same target, and so do `i7` and `q4`.
- **Cause:** Both lists call `doorQueue(r, i, n)` starting at 0.
- **Fix:** Merge the two lists, queued first, and call `doorQueue` once.

**4. Five or more managers get overlapping zones** (`t2` C, `shot-zones-5.png`)
- **Cause:**
  - `ZONE_AT` has only 5 anchors, and the 5th sits only 129px above zones 0 and 1.
  - `Math.min(quad, 4)` puts every manager after the 5th on the same anchor.
- **Fix:** Lay zones out by count (2×2 for up to 4, 3×2 for 5 or 6) with smaller zones, and fold any further managers into "Other teams".

**5. A big team's roster overflows its zone** (`t2` D)
- **Observed:** With 30 agents under one manager, the chips end at y=1084 while the zone ends at 835.
- **Fix:** Show as many rows as fit (about 2) plus a "+N more" chip.

**6. Phone: the Today row is pushed off screen** (`t5-phone.mjs`, `shot-390-now.png`)
- **Cause:** The unscoped `transform:translateX(-50%)` and `height:var(--btn)` (315-316) still apply after `placeChip()` moves the row into the sheet.
- **Fix:** Add `transform:none;left:auto;top:auto` to `.p-body .chiprow` and `height:auto` to `.p-body .today`.

**7. Keyboard focus is lost** (`t4-a11y-panels.mjs`)
- **Cause:**
  - Any change replaces the whole `innerHTML` of the Now and Crew panels.
  - `openDetail` clears `cardsHtml`.
  - `setPanel` makes the panel `inert` while focus is still inside it.
  - The dialog is never focused.
- **Fix:**
  - Save and restore the focused `[data-id]` around each swap.
  - Focus `#detailX` when a card opens, and return focus when it closes.
  - Move focus to the panel's toggle before setting `inert`.

**8. A long name hides the status pill** (`t9-crew-cards.mjs`)
- **Fix:** Use `.w-top b{min-width:0;overflow:hidden;text-overflow:ellipsis}` and `.w-top .pill{flex:none}`, and add a `title` with the full name.

## P2
- **9. Temps overlap.** 6 temps under one manager overlap. **Fix:** space rows at least 70px apart, or add a second ring of seats.
- **10. Shells overlap.** 12 done shells end up 14px apart. **Fix:** show at most one shell per spot, newest first.
- **11. Duplicate ids.** Two docs with `data.id:'dup'` become one robot. **Fix:** build docs as `{...d.data(), id: d.id}` (lines 2785, 2786, 2788).
- **12. Old shells come back.** Shells that finished before load reappear. **Fix:** on the first snapshot, stamp them as `wall - SHELL_FAIL_MS`.
- **13. The Terminal Bay card contradicts itself.** **Fix:** for the Terminal Bay, build the "Here now" list from `L.shells` whose target room is `term`.
- **14. A temp that has left keeps its card.** **Fix:** in `renderDetail`, `closeDetail()` when the worker has no target, and count `tFloor` from agents that have a target.
- **15. The events count is capped at 40.** **Fix:** show "40+" when the window is full, or keep a counter in `hq/status`.
- **16. Maps grow without limit.** After 300 ticks `seenEv` is at 300, `said` 79, `chat` 80 and `chatOk` 82. **Fix:** after each ticker push, keep only the keys of current events in `seenEv`, and drop chat maps for workers that are gone.
- **17. Tab order.** It takes 44 Tab presses to reach the toggles. **Fix:** move `#hits` after the ticker and panels in the markup (it's absolutely positioned, so nothing visible changes), and optionally add a "Skip to map" link.

## Suspicions
Not proven:
- **The LIVE pill stays on DISCONNECTED.** After one listener error it never turns back, even while snapshots keep arriving (line 2784).
- **Worker links aren't checked.** `w.link` is rendered as an `href` without a scheme check (line 2560). Allow only `https:`.
- **The phone sheet is see-through.** Ticker text shows through the bottom sheet (`shot-390-threads.png`).
- **Bad field types fail silently.** A string `startedAt` or `progress` is ignored without a warning.
- **Possible small leak in `tempDone`.** Temps deleted while done are never removed (line 2628).
- **Threads "needs you" counts as "in review".** Blocked threads count in the top "in review" stat. This may be intended.

## Repro scripts

| Script | Bugs |
|---|---|
| `lib.mjs` | Shared harness: stubs the db and the thread connector (`__set`, `__err`, `__thEmit`) |
| `dt-instr.html` | A page copy that exposes the internal maps as `window.__int` |
| `t1-edge-data.mjs` | 2, 5, 8 |
| `t2-layout.mjs` | 2, 3, 4, 5, 9, 10, 11 |
| `t3-threads.mjs` | 1 |
| `t4-a11y-panels.mjs` | 7 |
| `t5-phone.mjs` | 6 |
| `t6-churn-leaks.mjs` | 16 |
| `t7-transitions-detail.mjs` | 12, 13, 14, 15 |
| `t8-keyboard-link.mjs` | 17, plus the suspicions |
| `t9-crew-cards.mjs` | 8, 11 |
