# Installed price on by default for local visitors

Competitor gap 4: leading sellers show an installed ("out the door") price up
front. TireDrop has the "Show installed price" toggle on /tires, the tire
cards and tire pages, but it starts off. This is the option to start it ON for
visitors inside Miami-Dade, Broward and Palm Beach. **It is built and OFF in
production. Turning it on is Justin's call, after he sees the preview.**

## The switch (one place)

`src/data/installedDefault.js`:

```js
export const INSTALLED_DEFAULT_FOR_LOCAL = false;
```

- `false` (today): everyone starts with the bare tire price.
- `true`: a visitor who has not made a choice starts with the toggle on, but
  only when the site knows they are in the install area. The area is the ZIP
  from `/api/geo` (Vercel's IP headers: no location prompt, no third party)
  checked with `isInServiceArea()` (`src/data/serviceArea.js`). Location
  unknown (no ZIP, outside the U.S., lookup failed or slow): off.
- A visitor's own choice always wins, on or off. With the switch on, pressing
  the toggle off is remembered as an explicit "off"
  (`tiredrop.installed.v1` = `{"v":1,"on":false}`), so the default never comes
  back over it. With the switch off the old behaviour is unchanged (off
  removes the key).
- The prerendered HTML and the hydration render are always off. The on state
  arrives straight after hydration, the same way a remembered "on" does.
- The ZIP lookup runs once, only when the switch is on, the visitor has not
  chosen and no preview flag is set. The answer ("in" or "out", nothing else)
  is kept in `sessionStorage` (`tiredrop.area.v1`) for the tab, so later pages
  need no second call. Nothing is logged or sent anywhere.

Turn it on: change `false` to `true`, build, deploy. Turn it off: change it
back. Nothing else to clean up; remembered choices keep working either way.

## Preview flag (to look at it without flipping the switch)

Add to the address of `/tires` or any tire page:

| Flag | Behaviour |
| --- | --- |
| `?installed=local` | As if the switch were on AND the visitor were in the area. On straight after hydration, no location lookup. |
| `?installed=off` | Forced off (even over a remembered "on"). |

Both hold until the visitor presses the toggle, and what they press is not
stored. Nothing is written to `localStorage` or `sessionStorage` for the flag
itself. The flag is read once when the page loads, so it lasts through
in-site links (Details, Back) but not a fresh load of a URL without it.

Indexing: the flag is only read in the browser. The prerendered HTML is
byte-identical with and without it, its canonical is the clean URL
(`https://tiredroponline.com/tires`, never `?installed=`), the canonical in
the hydrated page stays clean, and `sitemap.xml` lists no flagged URL.
`npm run check:installed` proves all of that.

## Analytics (GA4)

| Event | When | Parameters |
| --- | --- | --- |
| `installed_price_toggle` (existing) | the visitor presses the toggle: they chose | `toggle_state`, `placement` |
| `installed_price_default` (new) | the switch turned it on for a visitor in the area, once per page view | `default_source` (`local`), `placement` (`results` / `product`) |

Not key events. A later A/B read: sessions with `installed_price_default` are
the default-on group; `installed_price_toggle` after it with `off` is a
visitor turning the default off. The preview flag sends neither default nor a
different toggle event.

## Layout shift

Measured by `check:installed` with `?installed=local` (the on state arrives
at hydration, so it is the same shape as the default):

- `/tires`: CLS 0.000 at 390px and 0.001 at 1440px.
- A tire page: 0.085 at 390px and 0.14 at 1440px, **identical to a visitor who
  turned it on earlier today**. The prerendered tire page is off, so any on
  state grows the buy box after hydration. The flag adds nothing to that, but
  it does not remove it. Before switching the default on for everyone, either
  accept that or fix it properly: the state has to be known before the first
  paint (a tiny script in the page head that marks `<html>`, which needs a CSP
  hash, or reserving the lines' height in the buy box). Not done here because
  it changes every tire page's HTML.
- Screen readers: the toggle is a button with `aria-pressed`, which changes
  silently. There is no live region, so nothing is announced on its own.

## Copy and rules

Unchanged: "Installed from" labels, the "(Miami-Dade, Broward, Palm Beach)"
note and the out-of-area line stay as they are. The install price is still
`services.js`'s; the cart and checkout are never touched.
