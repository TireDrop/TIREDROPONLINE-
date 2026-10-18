/**
 * Plain-English copy for /wheel-fitment (src/pages/shop/WheelFitmentPage.jsx).
 *
 * Generic, accurate wheel facts only: no per-vehicle specs live here (those
 * come from the catalog and from us checking your vehicle). House rules apply:
 * no prices, deals, delivery dates or claims about specific brands.
 *
 * `links` use {to, label} and render as inline router links under the text.
 */
export const FITMENT_TOPICS = [
  {
    id: "bolt-pattern",
    title: "Bolt pattern: the one number that must match",
    paras: [
      "The bolt pattern is the number of lug holes times the diameter of the circle they sit on, written like 5x114.3. That reads as five lugs on a 114.3 mm circle (the same as 5x4.5 inches). Both numbers must match your hub: a 5x114.3 wheel will not fit a 5x120 hub even though both have five lugs.",
      "To measure a four-, six- or eight-lug wheel, take the distance between the centers of two studs directly across from each other. A five-lug wheel has no opposite stud, so measure from the center of one stud to the far edge of the stud two places over. Common patterns include 4x100, 5x114.3, 5x120, 5x127, 6x139.7 and 8x170, but your owner's manual is a better guide than memory.",
    ],
  },
  {
    id: "diameter-width",
    title: "Diameter, width and tire size together",
    paras: [
      "A 20x9 wheel is 20 inches in diameter and 9 inches wide. Every tire size has a range of rim widths it is built for, usually about two inches wide in total. Check the tire's listed rim range before you choose a width.",
      "When you go up in wheel diameter, the tire sidewall gets shorter. Keep the overall tire height within about three percent of stock so the speedometer and ABS stay accurate and nothing rubs at full steering lock.",
    ],
  },
  {
    id: "offset",
    title: "Offset, with a worked example",
    paras: [
      "Offset (written ET, in millimeters) is the distance from the wheel's mounting face to its centerline. A positive number means the mounting face sits toward the street side of the centerline, and a lower number pushes the whole wheel outward.",
      "Example: you move from an 8-inch wheel at +35 to a 9-inch wheel at +20. The extra inch adds about 12.7 mm on each side of the centerline, and the 15 mm drop in offset shifts the whole wheel outward by 15 mm. The outer edge ends up roughly 28 mm closer to the fender, while the inner edge moves only about 2 mm toward the outside, so suspension clearance barely changes but fender clearance shrinks a lot.",
    ],
    links: [{ to: "/wheel-offset-calculator", label: "Use the wheel offset calculator" }],
  },
  {
    id: "center-bore",
    title: "Center bore and hub-centric rings",
    paras: [
      "The center bore is the large hole in the middle of the wheel. It should sit snugly on the hub so the hub, not just the lug nuts, centers the wheel. A wheel bore smaller than your hub will not go on at all. A wheel bore larger than your hub needs a hub-centric ring, a thin spacer that fills the gap. We include the right size when a wheel needs them.",
    ],
  },
  {
    id: "load-rating",
    title: "Load rating",
    paras: [
      "Every wheel has a maximum load per wheel, stamped on the back or listed in its specs. It has to be at least what your vehicle puts on that corner, with margin if you tow or haul. Trucks, vans and three-row SUVs are where this matters most.",
    ],
  },
  {
    id: "lug-nuts-tpms",
    title: "Lug nut seats and TPMS sensors",
    paras: [
      "Lug nuts must match the seat shape of the wheel: conical (tapered), ball (rounded) or flat (a washer seat). A wrong seat can look tight and still loosen on the road. Your factory nuts may not suit new wheels. Tighten to the torque in your owner's manual.",
      "Tire pressure monitoring (TPMS) sensors sit inside each wheel at the valve. They can often move from your old wheels to the new ones, or be replaced, and the car then needs to relearn them.",
    ],
  },
];

export const FITMENT_CHECKLIST = [
  "Year, make, model and trim of the vehicle",
  "Current wheel and tire sizes, printed on the tire sidewall",
  "A photo of the back of your current wheel if it is aftermarket",
  "Whether the vehicle is lifted, lowered, or has big-brake or performance calipers",
  "How you use it: daily driving, towing, hauling or off-road",
  "Where it is going: your address, or our South Florida shop for installation",
];

export const FITMENT_FAQ = [
  {
    q: "Can I use wheel spacers to make a wheel fit?",
    a: "Spacers change offset and add another part that can fail, so we treat them as a last resort. Choosing the right offset to begin with is better.",
  },
  {
    q: "Do I need new lug nuts with new wheels?",
    a: "Often yes. The nuts must match the wheel's seat type and your studs' thread size, and a different seat is a common reason to replace them.",
  },
  {
    q: "Where does installation happen?",
    a: "Installation is available at our South Florida shop only. Wheels and tires ship free to the 48 contiguous states and DC, so elsewhere a local shop can fit them.",
  },
];
