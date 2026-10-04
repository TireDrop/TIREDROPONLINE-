# Install photo habit: crew card

For the Sunrise shop and the mobile van crew. One card, one minute per job.

Why: the site has no real photos or reviews yet, so the Gallery is off. Every
install is a chance to fix that. Real photos of real work, with the owner's
OK, are what bring the Gallery back (see `docs/ops/gallery-return-plan.md`).

## What to photograph (every install)

Take these 6 shots on every job. Wheel jobs get a 7th.

| # | Shot | What it shows |
|---|------|---------------|
| 1 | Before: the wheel | The worn or old wheel and tire, on the car, before you touch it |
| 2 | After: the wheel | The new tire on the car, same angle as shot 1 |
| 3 | Full side view | The whole vehicle from the side, wheels straight, shop or driveway behind it |
| 4 | Sidewall size | The size text on the new tire (for example 245/40R18), sharp enough to read |
| 5 | Tread | Close shot of the new tread, a coin or a pen for scale is optional |
| 6 | Valve stem or TPMS sensor | The new stem or sensor in the wheel |
| 7 | Wheel jobs only: close fitment shot | Gap between wheel and fender, and the wheel behind the spokes, so fit is visible |

## Phone tips

- Wipe the lens. It is the number one fix.
- Shoot in daylight when you can. Stand with the sun behind you or to your side, never in front of the wheel.
- In the shop, use the bay lights and keep the flash off.
- Landscape for the full side view, portrait for wheel close-ups.
- Wheel shots: crouch to wheel height, 3 to 4 feet back, wheel centered.
- Full side view: stand back 15 to 20 feet, camera at hip height, whole car in frame.
- Tap the screen on the tire to lock focus. Take two and keep the sharper one.
- Never use filters or edits. The photo should look like the job.

## The 60-second routine

1. Before you start (10 sec): shot 1 and a quick look for plates and faces in the background.
2. While the tire is off (10 sec): shot 5 if you are mounting a new set, and shot 6 as the stem or sensor goes in.
3. When done (25 sec): shots 2, 4 and, for wheel jobs, 7.
4. Walk to the back of the car (10 sec): shot 3, the full side view.
5. Consent (5 sec): ask the owner, then log it.

## Ask first: consent script

Say it plainly before the photos go anywhere:

> "Is it OK if we use photos of your vehicle on our website? No plates, no faces."

- If yes: write "yes" in the log (see the tracking table in `docs/ops/gallery-return-plan.md`).
- If no, or unsure: keep the photos off the shared folder or delete them. Never post "just in case".
- Take the photos either way if it helps the job record, but only photos with a "yes" move on.

## Blur or avoid

- License plates (frame the shot so they are out, or blur before upload)
- House numbers and street signs
- Faces and people, including reflections in glass or paint
- Customer paperwork, phones, and keys in frame
- Other customers' vehicles

## File naming

`YYYYMMDD_city_vehicle_service_n.jpg`

Lowercase, underscores, no spaces. `n` is the shot number from the table above.

Examples:
- `20261015_sunrise_f150_tire-install_2.jpg`
- `20261015_hollywood_model3_wheel-install_7.jpg`
- `20261016_miami_civic_tpms-sensor_6.jpg`

Service words to use: `tire-install`, `wheel-install`, `tpms-sensor`, `rotation`, `mobile-van`.

## Where the files go (proposal, needs Justin's answer)

I do not know which storage tool the shop uses, so no tool is chosen here.
Whatever it is, use this simple structure:

```
install-photos/
  2026-10/
    20261015_sunrise_f150_tire-install/
      20261015_sunrise_f150_tire-install_1.jpg
      ...
      consent.txt        (one line: yes or no, who asked, date)
  gallery-ready/         (only jobs with consent = yes, plates blurred)
  tracking.csv           (the table in the gallery return plan)
```

One folder per job, one folder per month. Nothing leaves `gallery-ready/` for the website unless consent is "yes".

## Questions for Justin

1. Which tool should hold the photos (a shared drive folder, a cloud folder, a messaging group, something else)?
2. Who on the crew takes the photos at the shop, and who on the van?
3. Who blurs plates, and who owns the tracking table?
