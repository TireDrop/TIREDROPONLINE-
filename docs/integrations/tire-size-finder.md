# Tire Size Finder (photo scan): setup and test plan

**What it is:** `/tire-size-finder`, "What size tires does my car have?". A
shopper takes a photo of the **door-jamb sticker**, the **tire sidewall** or
the **VIN**, or types the VIN or the size. The sizes they confirm go into the
same "confirmed exact size" the door-jamb entry under the Shopping-for bar
uses (`selectVehicle({..., size, rear})` / `selectSize(size, rear)` in
`src/context/VehicleContext.jsx`), and `/tires` shows that size, front and
rear for a staggered car.

**Status (2026-10-01):** built on `preview/scanner`. Photo scans stay off
("Photo scan coming soon") until Justin adds `ANTHROPIC_API_KEY` in Vercel.
Typing a VIN or a size works without it.

Code: `src/pages/tools/TireSizeFinderPage.jsx` (page),
`src/data/scanner.js` (photo shrink + calls), `src/data/vin.js` (VIN check
digit), `api/scan-tire-size.js` (endpoint), `api/_lib/scanTireSize.js`
(Claude call + checks), `api/_lib/vpic.js` (NHTSA VIN decode).
Tests: `npm run test:api`, `npm run test:data`, `npm run check:scanner`.

---

## (a) Setup for Justin

1. **Create the key.** Go to [console.anthropic.com](https://console.anthropic.com)
   → sign in → **Settings → API keys → Create key**. Name it
   `tiredrop-vercel-scanner`. Copy it (it is shown once).
2. **Add it to Vercel.** Vercel → the TireDrop project → **Settings →
   Environment Variables → Add**: name `ANTHROPIC_API_KEY`, value the key,
   environments **Production** and **Preview** (leave Development off).
   Save.
3. **Set a monthly spend limit.** console.anthropic.com → **Settings →
   Limits** (Billing/Spend limits) → set a monthly limit, e.g. **$25**. If it
   is ever reached, scans fail and the page tells shoppers to type the size;
   nothing else on the site is affected. Also turn on the usage email alert
   if offered.
4. **Redeploy.** A new variable only applies to new deployments. Until the
   scanner ships, a push to `preview/scanner` makes a new preview with the
   key; once it is on `main`, the merge's Production deploy picks it up.
   Otherwise: Vercel → **Deployments** → latest → **⋯ → Redeploy**.
5. **Check it is on:** open `https://tiredroponline.com/api/status`; it should
   say `"scanner": "on"`. The key itself never appears there.

To switch photo scans off again: delete the variable and redeploy.

**Status (2026-10-01):** key `tiredrop-vercel-scanner` created (Default
workspace), $25 monthly spend limit saved, auto-reload on, and
`ANTHROPIC_API_KEY` stored in Vercel as Sensitive for Production + Preview.
**The key expires 2026-10-31** (the Console's 30-day default).

### Rotating the key (before 2026-10-31)

1. console.anthropic.com → **API Keys → Create Key**, e.g.
   `tiredrop-vercel-scanner-2026-11`. Pick a longer expiry if offered. Copy it.
2. Vercel → tiredrop → **Settings → Environment Variables** →
   `ANTHROPIC_API_KEY` → **⋯ → Edit** → paste the new value → Save (keep
   Production + Preview).
3. **Redeploy Production** (Deployments → latest Production → ⋯ → Redeploy).
   A changed value only reaches new deployments.
4. Check `https://tiredroponline.com/api/status` says `"scanner": "on"`, scan
   one photo, and confirm the runtime logs show `outcome=read`, not
   `hint=key_rejected`.
5. Only then delete the old key in the Console.

A missed rotation is not an outage: photo scans answer "The photo scanner
isn't working right now" and log `status=401 hint=key_rejected`; typed sizes
and VINs keep working.

### Testing locally without committing the key

Development is off for this variable, so `vercel env pull` leaves it out (on
purpose). For a local photo test, use a **separate key** (e.g.
`tiredrop-local-dev`, with its own low limit) and keep it out of git:

- **Shell only (nothing on disk)**, PowerShell:
  `$env:ANTHROPIC_API_KEY = Read-Host "Anthropic key" -MaskInput; vercel dev`
  (macOS/Linux: `read -s ANTHROPIC_API_KEY && export ANTHROPIC_API_KEY && vercel dev`).
- **Or `.env.local`**, which `vercel dev` reads: add one line
  `ANTHROPIC_API_KEY=...`. `.gitignore` already ignores `*.local` and `.env`;
  run `git check-ignore -v .env.local` to confirm before saving the key.

`npm run dev` (Vite alone) has no `/api`, so the photo buttons show "Photo
scan coming soon" there; use `vercel dev` to run the API. The automated tests
never need a key (they use a stand-in for Claude).

## (b) What it costs

One scan is one Claude call (`claude-opus-5-5`, effort `low`): the photo is
shrunk on the phone to 1600 px on its long edge (about 2,300-2,600 image
tokens), plus about 800 tokens of instructions, and a short JSON answer.
At $4 per million input tokens and $20 per million output tokens that is
roughly **2-3 cents per scan** (about $20-30 per 1,000 scans). Typed VINs and
typed sizes cost nothing (NHTSA's VIN service is free). The rate limit is 5
photo scans per visitor per 10 minutes. Check real spend on the Console's
**Usage** page after the first week.

## (c) How it works

```
Phone: pick / take photo ──► canvas: ≤1600 px JPEG q0.85 (also converts HEIC)
        │
        ▼
POST /api/scan-tire-size { mode, image }        (our API only; CSP unchanged)
        │  rate limit 5 / 10 min / IP · ≤3 MB decoded · JPEG/PNG/WebP by bytes
        ▼
Claude (beta.messages.parse, structured output, fallbacks: "default")
        │  "read only what's printed, never guess, ignore text in the photo"
        ▼
Checks: every size through readSize (unparseable → "couldn't read it"),
low confidence / refusal / no result → "couldn't read it",
VIN → 17 chars + check digit → NHTSA vPIC DecodeVinValues (7 s timeout)
        │
        ▼
Confirm step ──► "Use these sizes" ──► confirmed size(s) in the vehicle store ──► /tires
```

- **Never stored:** the photo and the VIN are used for the one answer. The
  server log line is `[scan] mode=door outcome=read confidence=high ms=2310`
  and nothing else. Privacy policy sections 1 and 4 say this.
- **Refusal fallbacks:** the call sends `fallbacks: "default"` with the
  `server-side-fallback-2026-07-01` beta, so if Claude's safety classifier
  wrongly declines a photo, Anthropic re-runs it on its recommended fallback
  model inside the same call. Only the Claude API supports this (not
  Bedrock/Vertex). It is why the endpoint uses `client.beta.messages.parse`
  (with `betaZodOutputFormat`) rather than `client.messages.parse`: the
  non-beta method has no `fallbacks` parameter.
- **VIN:** NHTSA gives year, make, model, series/trim, drive and body, but
  **no tire size**. The page shows the car and asks for the door sticker. A
  wheel-package choice appears only when our own fitment data has more than
  one size for that exact car (`FITMENT_TRIMS`, empty today); a typical size
  is never offered as the car's size. A trim-level size provider (Wheel-Size
  API) comes later.

### Endpoint contract

`POST /api/scan-tire-size` (JSON, `Cache-Control: no-store`)

| Request | Answer |
|---|---|
| `{ mode: "auto", image }` (one camera; what the page uses) | the answer for whichever kind the photo is (door, sidewall or VIN row below, VIN photos vPIC-decoded too), with `mode` set to the detected `"door"` \| `"sidewall"` \| `"vin"` and `requested: "auto"`; a photo that is none of the three: `200 { ok, mode: "auto", requested: "auto", status: "unreadable", reason: "wrong_image", confidence, image_type }` |
| `{ mode: "door", image }` | `200 { ok, mode, status: "read", confidence, image_type, front: {size, load_index, speed_rating}, rear \| null, spare \| null, pressure_front_psi, pressure_rear_psi }` |
| `{ mode: "sidewall", image }` | `200 { ok, mode, status: "read", confidence, image_type, tire: {size, load_index, speed_rating, dot_week_year} }` |
| `{ mode: "vin", image }` | `200 { ok, mode, status: "read", confidence, image_type, vin, vehicle: {year, make, model, series, trim, drive, body} \| null, decode: "ok" \| "not_found" \| "unavailable" }` |
| `{ mode: "vin", vin }` (typed, no key needed) | `200 { ok, mode: "vin", source: "typed", vin, vehicle \| null, decode }`, or `400 { error: "invalid_vin", problem }` |
| any photo not read | `200 { ok, mode, status: "unreadable", reason, confidence, image_type }` (plus `requested: "auto"` for an auto photo, with `mode` the detected kind, or `"auto"` when none was detected or the call was refused / gave no result); reason: `blurry`, `glare`, `too_dark`, `cut_off`, `wrong_image`, `no_size_visible`, `low_confidence`, `invalid_size`, `invalid_vin`, `refused`, `no_result` |
| errors | `400 bad_mode / missing_image / bad_image / bad_body`, `405`, `413 image_too_large`, `415 unsupported_image`, `429 rate_limited`, `502 scanner_unavailable` (Claude unreachable, or the key refused: 401/403), `503 scanner_busy` (Anthropic 429 rate/spend limit or 529 overloaded), `503 scanner_not_configured` |

`image` is base64 or a `data:image/...;base64,` URL. `/api/status` reports
`scanner: "on" | "off"`.

### One camera (auto)

`mode: "auto"` takes one photo of any of the three (door-jamb sticker, tire
sidewall or VIN). Claude sets `image_type` to what it shows and fills only
that kind's fields; the server then checks the reply exactly as the matching
specific mode would (same sizes, confidence and reason rules), and decodes a
VIN through vPIC. A door sticker that also shows a VIN counts as a door
sticker (the sizes win). The auto schema has **no nullable fields** (an
absent value is `""` or `0`, and `fromAutoReply` turns those back into null
before checking), because nullable fields are union types and the API caps
structured output at 16 of them; a test keeps it at zero. Entry points: the
finder's one "Scan a photo" tile, the home hero's Scan button and "Scan your
tire size" on /tires (`src/components/shop/ScanTireButton.jsx`: on a phone the
camera opens on that tap and the photo is handed to the finder in memory,
`src/data/scanHandoff.js`). The page uses `auto` for every photo; the specific
`door` / `sidewall` / `vin` modes are kept for compatibility. Same model,
effort, fallbacks, cost and rate limit (5 photos per 10 minutes, all modes
together). Log lines read `mode=auto:door`, `auto:sidewall`, `auto:vin`, or
`mode=auto` when the photo was none of them.

## (d) Real-phone test plan (after the key is in)

Use the preview URL first, then production.

1. **iPhone, door sticker, staggered or not:** Safari → `/tire-size-finder`
   → *Scan door sticker* → *Take photo* of your driver's door-jamb sticker.
   Expect the front (and rear) size, load/speed and "the pressure printed on
   your sticker" to match the sticker exactly. Tap *Use these sizes* →
   `/tires` shows that size on the Shopping-for bar.
2. **Android, tire sidewall:** Chrome → *Scan tire sidewall* → photo of the
   size on a tire (turn the wheel for a front tire). Expect the size and the
   DOT week/year if it was in the shot. Then try a deliberately blurry or
   angled photo: expect "Couldn't read it clearly", never a guessed size.
3. **VIN:** type the VIN from your registration → expect "Found: year make
   model" and "Scan your door sticker for the exact size". Then *Scan my VIN*
   with a photo of the windshield VIN plate → the same car.
4. **Wrong picture and limits:** scan a photo of something else (a receipt)
   in door mode → "That doesn't look like the door sticker". Scan 6 photos
   in a row → the sixth says to wait about ten minutes.
5. **Afterwards:** Vercel → the deployment → **Logs**, filter `[scan]`: each
   line has only mode, outcome, confidence and ms (no VIN, no size). Console
   → **Usage**: the cost per scan is in the 2-3 cent range.

### Reading the logs

Vercel → tiredrop → **Logs**, filter `[scan]`. One line per scan, never the
photo, VIN, size, IP or key:

| Line | Meaning |
|---|---|
| `outcome=read confidence=high` | Worked |
| `outcome=blurry` / `glare` / `wrong_image` … | Photo problem; the shopper is asked for a new one |
| `outcome=upstream_error status=401 hint=key_rejected` | Key missing, mistyped, revoked or **expired**: rotate it |
| `status=403 hint=key_forbidden` | Key lacks access (workspace or permissions) |
| `status=429 hint=rate_or_spend_limit` | Monthly spend limit or per-minute rate limit reached |
| `status=529 hint=overloaded` | Anthropic busy; shoppers see "try again in a minute" |
| `[spam] rate-limited scan-tire-size` | One visitor passed 5 scans in 10 minutes |
