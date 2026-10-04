# Batch 4 fact check: the 12 snippet-only facts, 2026-10-04

Branch `preview/facts-batch4`, by Atlas (research and fact-check, team TireDrop). Item: docs/LAUNCH-CHECKLIST.md "12 facts were snippet-only" (prompt pack #A19).

## Result

**0 FOUND, 0 NOT FOUND, 12 BLOCKED, 0 contradicted. No blog copy changed.**

Every primary host is blocked by this sandbox's egress proxy (WebFetch returns EGRESS_BLOCKED; curl gets a 403 on CONNECT, including archive and mirror sites), so no page text could be read. Atlas then ran official-domain searches. Those return a search summary, not the page, so by the rules they stay SNIPPET-ONLY and are not marked FOUND. They did **corroborate** all 12 claims, and none of them conflicted with the wording in the posts. Because nothing was read and nothing conflicted, the wording is left as is. All 12 go to Justin's Chrome prompt below.

Status key: BLOCKED = host unreachable, page not read. "Search corroborates" = an official-domain search summary agrees with the claim (SNIPPET-ONLY, not a read).

## Ledger

| # | Claim (posts) | Source URL | Status | Note |
|---|---|---|---|---|
| 1 | Civic manual: replace with same size, load, speed and pressure rating; a different size can upset ABS and VSA; replace all four or in pairs; summer tires not for winter (`honda-civic-tires-guide`) | techinfo.honda.com/rjanisis/pubs/OM/AH/AT202424IOM/enu/details/131229047-14857.html ("Tire and Wheel Replacement") | BLOCKED | Search corroborates: "same size, load range, speed rating, and maximum cold tire pressure rating", ABS and VSA, "replace all four tires at the same time... or the front or rear tires in pairs". Winter-tire line not seen. |
| 2 | Honda "Tire Rotation": Maintenance Minder; directional tires front-to-back only; calibrate TPMS after rotation (`honda-civic-tires-guide`, `tire-rotation-upsell-myth`) | techinfo.honda.com/rjanisis/pubs/om/ah/at202222iom/enu/details/131229047-14882.html | BLOCKED | Search corroborates all three points. |
| 3 | Toyota tire warranty guide: rotation is a condition of the treadwear warranty (`tire-rotation-upsell-myth`, `new-car-tires-wear-out-early`) | assets.sia.toyota.com/publications/en/omms-s/TL-MMS-20Tire/pdf/TL-MMS-20Tire.pdf | BLOCKED | Search corroborates: "rotated and inspected every 6,000-8,000 miles... or as specified by your vehicle manufacturer, whichever rotation period is less". The guide covers BFGoodrich original-equipment tires, which the posts do not say; Justin to confirm the wording still fits. |
| 4 | Wrangler manual: specified size, load, speed; different size gives false speedometer and odometer; Mopar: full-size spare can join rotation; rearward cross (`jeep-wrangler-tires-guide`) | vehicleinfo.mopar.com/.../Jeep/2022/Wrangler/5690672_22_JL_OM_EN_USC_DIGITAL_E3.pdf; mopar.com/en-us/blog/tire-rotation-balancing-and-alignment-the-basics.html | BLOCKED | Search corroborates "false speedometer and odometer readings", "full-size spare like on a Jeep Wrangler... include that in the tire rotation", "rearward cross". The manual PDF itself was not in the results (a 2021 manual was). |
| 5 | Chevrolet trailering guide: tongue weight 10-15%; 2019 Silverado manual: label location; label pressure is the minimum cold pressure for maximum load (`silverado-boat-towing-tires`) | chevrolet.com 2024 Trailering Guide PDF; chevrolet.com/ownercenter/.../2019-chevrolet-silverado-1500-owners-manual.pdf | BLOCKED | Search corroborates "10% to 15% of the loaded trailer weight" (the guide notes boat trailers can fall outside the range) and the door-frame Tire and Loading Information label. The "minimum air pressure... maximum load" sentence was not seen. |
| 6 | 49 CFR 393.75: 4/32 front, 2/32 other; 390.5: 10,001 lb; 396.13: driver pre-trip check (`small-fleet-tire-checklist`) | ecfr.gov/current/title-49/.../part-393/subpart-G/section-393.75 (and 390.5, 396.13) | BLOCKED | Search corroborates 393.75 ("front wheels of a bus, truck, or truck tractor... 4/32"; "2/32" otherwise) and the 390.5 10,001 lb definition. 396.13: "driver shall be satisfied that the motor vehicle is in safe operating condition". The posts say "steering-axle"; the rule says "front wheels". |
| 7 | Correct pressure improves mileage 0.6% on average, up to 3%; 0.2% per psi (`low-rolling-resistance-hybrids`) | fueleconomy.gov/feg/maintain.jsp | BLOCKED | Search corroborates, near-verbatim: "0.6% on average, up to 3%... about 0.2% for every 1 psi drop in the average pressure of all tires". |
| 8 | Consumer Reports: rolling resistance as the tie-breaker (`low-rolling-resistance-hybrids`) | consumerreports.org/cars/tires/low-rolling-resistance-tires-can-save-you-money-at-pump-a1547901110/ | BLOCKED | Search corroborates: braking, handling, hydroplaning first, then "rolling resistance as a tie-breaker". |
| 9 | AAA pothole: one in 10 drivers needed a repair; alignment, noise and vibration advice (`curb-pothole-tire-alignment-signs`) | newsroom.aaa.com/2022/03/aaa-potholes-pack-a-punch-as-drivers-pay-26-5-billion-in-related-vehicle-repairs/ | BLOCKED | Search corroborates "1 in 10 drivers sustained vehicle damage significant enough to warrant a repair". The "previous year" in the post was not seen in the summary. |
| 10 | AAA Thanksgiving 2025: 81.8 million travelers, about 73 million by car (`thanksgiving-road-trip-tire-check`) | newsroom.aaa.com/2025/11/aaa-thanksgiving-travel-forecast-2025/ | BLOCKED | Search corroborates: "81.8 million... at least 50 miles", "at least 73 million... by car... nearly 90 percent". |
| 11 | Michelin: follow the vehicle maker; front tires on front-wheel-drive cars; cool, dry, dark storage away from ozone (`tire-rotation-upsell-myth`, `unused-tires-still-age-myth`) | michelinman.com/auto/auto-tips-and-advice/tire-maintenance/tire-rotation; .../storing-my-tires | BLOCKED | Search corroborates the storage advice (cool, dark, dry, away from ozone sources) and "follow the schedule in your vehicle owner's manual". The front-wheel-drive wear sentence and "heavy loads" line were not seen. |
| 12 | NHTSA Summer Driving Tips: check pressure before trips, heavy loads and towing (`thanksgiving-road-trip-tire-check`) | nhtsa.gov/summer-driving-tips | BLOCKED | Search corroborates "before long road trips" and load limits. "Before carrying heavy loads" and towing-pressure advice not seen; the towing line the summary showed was about trailer lights. |

## Chrome prompt for Justin (all 12 still need a read)

Paste the HEADER from docs/prompts/2026-10-02-justin-remaining.md first, then:

```
HARD STOPS (these override anything in the task below):
- STOP and ask me before ANY Save, Publish, Turn on, Pay, Refund, Send
  invoice, Delete, Remove, Upgrade or DNS change. Say exactly what is
  ready and wait; I click it myself and reply "done".
- Never publish a Shopify theme. The only theme you may edit is the
  UNPUBLISHED theme "EDIT HERE " (ID 188753510552); check its role says
  unpublished before you touch it. Never edit the live theme.
- Never type, paste, read out or screenshot a password, API key, token or
  secret in this chat. If a step needs one, stop and let me type it.
- If a page does not match what the task expects, stop and describe what
  you see. Do not guess a substitute.

TASK: Open each source below. For each one, reply FOUND, NOT FOUND or PAGE MISSING, and quote the line you found. Read only; change nothing.
1. https://techinfo.honda.com/rjanisis/pubs/OM/AH/AT202424IOM/enu/details/131229047-14857.html (Civic manual, "Tire and Wheel Replacement"; also find "Winter Tires"): same size, load, speed and pressure rating; ABS/VSA warning; replace all four or in pairs; summer tires not for winter
2. https://techinfo.honda.com/rjanisis/pubs/om/ah/at202222iom/enu/details/131229047-14882.html (Honda "Tire Rotation"): Maintenance Minder line; directional tires front-to-back only; TPMS calibration after rotation
3. https://assets.sia.toyota.com/publications/en/omms-s/TL-MMS-20Tire/pdf/TL-MMS-20Tire.pdf: rotation is a condition of the treadwear warranty (also say which tire brand the guide covers)
4. 2022 Jeep Wrangler owner's manual PDF (https://vehicleinfo.mopar.com/assets/publications/en-us/Jeep/2022/Wrangler/5690672_22_JL_OM_EN_USC_DIGITAL_E3.pdf) and https://www.mopar.com/en-us/blog/tire-rotation-balancing-and-alignment-the-basics.html: specified size, load and speed; a different size gives false speedometer and odometer readings; the spare can join the rotation; rearward cross
5. Chevrolet 2024 Trailering Guide (chevrolet.com, search "2024 Trailering Guide") and the 2019 Silverado 1500 owner's manual (chevrolet.com/ownercenter): tongue weight 10-15%; where the tire label is; the label pressure is the minimum cold pressure for maximum load
6. https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-393/subpart-G/section-393.75 and sections 390.5 and 396.13: 4/32 on front (steer) tires and 2/32 on others; the 10,001 lb definition; the driver pre-trip inspection rule
7. https://www.fueleconomy.gov/feg/maintain.jsp: 0.6% average, up to 3%; 0.2% per psi
8. https://www.consumerreports.org/cars/tires/low-rolling-resistance-tires-can-save-you-money-at-pump-a1547901110/: rolling resistance as the tie-breaker
9. https://newsroom.aaa.com/2022/03/aaa-potholes-pack-a-punch-as-drivers-pay-26-5-billion-in-related-vehicle-repairs/ and AAA's pothole tips: one in 10 drivers (say what period it covers); alignment, noise and vibration advice
10. https://newsroom.aaa.com/2025/11/aaa-thanksgiving-travel-forecast-2025/: 81.8 million travelers, about 73 million by car
11. https://www.michelinman.com/auto/auto-tips-and-advice/tire-maintenance/tire-rotation and https://www.michelinman.com/auto/auto-tips-and-advice/tire-maintenance/storing-my-tires: follow the vehicle maker; front tires on front-wheel-drive cars; heavy loads as a reason to rotate sooner; cool, dry, dark storage away from ozone
12. https://www.nhtsa.gov/summer-driving-tips: check pressure before trips, heavy loads and towing

Reply with the list.
```

Next step: paste the reply into Claude. Claude fixes or cuts any NOT FOUND line. The Thanksgiving post uses AAA's 2025 figures; update it when AAA publishes the 2026 forecast (mid-November).
