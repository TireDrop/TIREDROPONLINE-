# TireDrop home (/) usability audit

Build: dist/ in the homeaudit worktree, served with `vite preview` on port 4622. Chromium via Playwright, third-party hosts blocked, /api/status mocked as specified and other /api calls 404. Shots: `/tmp/claude-0/-home-user-cannavibe/d34449fb-614b-55e4-9ef0-ecf19b08a954/scratchpad/audit-shots2/` (45 files). Scripts are in `.../scratchpad/aud/`. Nothing in the repo was edited.

## Verdict

Solid on the basics: the page is prerendered, works with JS off, has no horizontal overflow at 320 px, a good skip link, a clean tab order and a visible focus ring. It breaks down in three places.

1. The floating "Ask TireDrop" chat launcher sits on top of real content on every phone size.
2. Large text and 400% zoom are not handled well: the H1 clips and the mobile menu becomes nearly unusable.
3. The search form does nothing, and silently drops the typed query, until JS hydrates. That is about 5 s longer than first paint on Slow 4G with 4x CPU.

## Findings

| ID | Severity | Condition tested | What happens | Evidence | Suggested fix | Effort |
|---|---|---|---|---|---|---|
| U1 | High | 400% zoom (320x256 viewport), open the mobile menu | The menu's scroll area (`nav.overflow-y-auto`) is only 32 px tall for 1984 px of content. The fixed bottom call bar (68 px) and the drawer header leave no room. Escape works, but the links are effectively unreachable. | `t2-zoom400-320-menu.png`; measured 1984 > 32 | Make the drawer header and footer non-fixed or collapsible at small heights. Give the nav `min-h-0 flex-1` plus a `max-h` that excludes the call bar, or hide the call bar while the drawer is open. | M |
| U2 | High | Pre-hydration search (Slow 4G, 4x CPU) and JS off | The mobile search field is visible and typeable at about 2.9 s (FCP). Hydration lands at about 7.8 s. Pressing Enter before then does a native submit of a form with no action and an unnamed input, so the page reloads at `/?` and the typed query is lost. With JS off it behaves the same. | Measured on `t3b.js`: Enter at 2.9 s, hydration (React props on the input) at 7.8 s, final URL `/?` | Give the form `action="/search" method="get"` and `name="q"` on the input, so the prerendered HTML works without JS and before hydration. | S |
| U3 | High | Phones 320x568 and 360x640, chat launcher | The fixed chat launcher (161x48) covers content. At 320 wide it covers the H1's last line ("them to you") and the "Find Tires" button label; at 844x390 landscape it covers the "Shop by Tire Size" tab. At 400% zoom it covers the cart and menu buttons in the header, so the cart is unreachable by touch until you scroll. | `t1-320x568-top.png`, `t1-320x568-s1.png`, `t1-844x390-land-s1.png`, `t2-zoom400-320-top.png` | Collapse the launcher to an icon-only 48 px circle below about 400 px width or short heights. Dock it above the call bar on the right with a safe offset, and hide it while the hero form is in view. | S |
| U4 | Med | Browser font size 200% (root 32px), 390 wide | The page widens to 498 px (horizontal overflow). The hero H1 is clipped by the section's `overflow-hidden` ("Order tire…"), and the hero section's content is 488 px wide in a 390 px box. The search placeholder shows only "Sea". Header icons and the search button stay at small px sizes while the body text scales. | `t2-fs200-390-top.png`; sw 498 | Use `overflow-wrap:anywhere` or `hyphens` on the H1 and smaller `clamp()` sizes. Switch the search placeholder to a shorter string (or `aria-label` only) at narrow widths. Use rem for the header controls. | M |
| U5 | Med | Font 200%, desktop 1440 | The header search placeholder is cut to "Search s". Hero H1 wraps to one word per line and takes most of the first screen (hero content 2335 px tall in a 2015 px box, so some text is clipped). No overlap of nav items. | `t2-fs200-1440-top.png` | Allow the header search to grow (`min-w` in rem) and shorten the placeholder. | S |
| U6 | Med | Landscape phone 844x390 | Header (89 px) plus fixed call bar (68 px) leave about 233 px (60%) for content when scrolled. On first load the top bar, header and search take 304 px, so the H1 starts at y=304 and is hidden behind the call bar, and the hero shows only its eyebrow line. | `t1-844x390-land-top.png`, `t1-844x390-land-s1.png` | In short landscape (`max-height:500px`), stop the sticky header and the fixed call bar from both being sticky (for example, make the call bar static). | S |
| U7 | Med | Long query on the home search, then submit | The home field handles 773 characters with no overflow (`maxlength` is not set). The submitted URL is 963 characters. On `/search?q=<120 'a's>` at 390 wide the results H1 and the "No matches" text overflow, and the page layout becomes 1365 px wide (horizontal scroll). | `t7-long-390.png`, `t7-long-390-result.png`; sw 1365 vs vw 390 | Set `maxlength` (about 80) on the input. Add `overflow-wrap:anywhere` to the results heading and the no-match text. | S |
| U8 | Med | Phone first screens, primary action | On 360x640 and 320x568 the primary hero action ("Find Tires") is below the fold. The first screen is utility bar plus header plus search (304 px) plus H1, with the form starting at about y=480. At 390x844 "Find Tires" is at y=929, below the fold. The fixed call bar covers the bottom 68 px. | `t1-320x568-top.png`, `t1-320x568-s1.png`; tab-stop data (Find Tires top 929 at 390x844) | Consider a shorter mobile top bar (drop the 2-line promo) or move the first form field up. | M |
| U9 | Low | Two tap targets within 8 px | Cart and menu buttons are 6 px apart (45 and 46 px wide). Tabs "Shop by Vehicle" and "Shop by Tire Size" abut with 0 gap, which is by design. The input and its Search button also touch. | measured in `t6.js` | Increase the gap between cart and menu to 8 px or more. | S |
| U10 | Low | Tap target size, first 3 phone screens | Only one element is under 44 px: the footer phone link (131x36 at y=1980). Everything else is 44 px or larger. | `t6.js` output | Add `min-h-[44px]`. | S |
| U11 | Low | Spanish visitor | There is no Spanish home page. The Spanish twin routes cover only `/es/instalacion-movil` and Hialeah. A browser set to es-US still gets `lang="en"` and the English H1. The Spanish page shows Spanish body copy and a Spanish call bar, but the header is English (search placeholder, "Track Order", "Account", nav labels), and the page is `noindex` by design. The English home shows no "Español" link (the guard is off). | `t7-es-page.png`; `html lang` es on the Spanish page, en on home | Expected given the guard. Later: translate the header on Spanish routes. | M |
| U12 | Low | Forced-colors (`forced-colors: active`) | Mostly fine (screenshots show readable text, borders and focus). Two small issues: the translucent sticky nav lets scrolled text show faintly behind it, and the "Shop Tires" nav button loses its button shape (plain text). My first screenshot taken mid-fade showed ghosted text, but the settled shot did not, so that was an animation in progress, not a defect. | `t5-forced-1440-s1-settled.png` | Add `background: Canvas` and a border in forced colors for the nav and the nav CTA. | S |
| U13 | Low | `/api/status` unreachable | Chat launcher and newsletter section are simply absent, with no message and no layout shift. The page is 319 px shorter at 390 wide. The "Scan" button still shows (the scanner flag is not respected while status is unknown, and I did not test what the scanner does on click). | `t8.js`: height 14584 vs 14903; `t8-offline-390.png` | Fine. Optionally hide the scan button when status is unknown (guess: it would then fail only on click). | S |

## Measurements

- **Slow 4G (400 kbps, 400 ms RTT) plus 4x CPU, home**
  - First paint (FCP) and LCP are 2.9 s at 390 wide and 3.3 s at 1440. The LCP element is the H1's second line (`span.block.text-volt`).
  - The h1 element exists in the DOM at about 0.7 s, but nothing is painted until the CSS arrives.
  - Hydration at about 7.8 s (390) and 7.9 s (1440). Load event 7.8 s. 33 requests, 309 KB transferred.
  - CLS 0 at 390 and 0.0006 at 1440 (one 0.0005 shift in the product cards, at 7.4 s).
- **Prerendered HTML** (dist/index.html, 210 KB): the H1 "Order tires online. We ship them to you.", the "Shop Tires" CTA (`/tires`) and the search form are all in the HTML. There is no `<noscript>` block, but none is needed.
- **JS disabled**: the full page renders (height 14491 at 390), including the hero, search field, Shop by Vehicle form and sections. The vehicle form and search do not work without JS (see U2).
- **/api/status**: with the mock, delayed 3 s, and aborted, CLS is 0 to 0.0008 in all six runs. The chat launcher is fixed-position and the newsletter is below the fold, so nothing shifts.

## Passes

- No horizontal overflow at 320x568, 360x640 and 844x390 (scrollWidth equals the viewport). The only off-screen element is the skip link, which is deliberately off-screen until focused.
- Skip link is the first Tab stop, visible, and moves focus to `main`.
- Tab order at 1440 and 390 is logical for all 25 stops: skip link, phone, logo, search, search button, Language, Track Order, Account, cart, nav (desktop); at 390: skip, phone, logo, cart, menu, search, Search, tabs, year, make, Find Tires, Scan, quiz. The chat launcher is last in DOM order (index 186 of 191 at 390), so it does not interrupt the order.
- Focus indicator is a 2 px white plus blue ring (box-shadow) on every stop, with a transparent outline as the forced-colors fallback. It was not hidden by the sticky header or call bar in the first 16 mobile stops (checked with elementFromPoint).
- Hero search by keyboard: it is a combobox with 3 suggestions for a size query. Escape closes the list and keeps the text. Enter submits to `/tires?size=225-45r17`. No keyboard trap.
- Chat dialog traps focus correctly and Escape returns focus to the launcher. The mobile menu keeps focus inside (40 of 40 stops), and Escape returns focus to the menu button.
- `prefers-reduced-motion: reduce`: no running CSS or JS animations at load, and none with no-preference either. Nothing to suppress.
- `prefers-color-scheme: dark`: the page looks identical (it is a fixed dark-hero/light-body design), so there is nothing unreadable. My automated contrast check was unreliable on image/gradient backgrounds, so I rely on the screenshot.
- Forced colors: text and borders readable, focus visible (see U12 for the small leftovers).
- Tap targets: all but one element in the first 3 phone screens are at least 44 px.
- Chat and call bar do not cover the search field when the viewport shrinks to 390x420 (keyboard emulation): the field stays at y 163 to 207 and the call bar sits at the bottom. Only 145 px remain for suggestions between the field and the call bar, which I did not test with real suggestions.
- Offline `/api/status`: no errors or layout shift (see U13).

## Not tested or guesses

- A real on-screen keyboard was not emulated; I only resized the viewport.
- The U2 time gap depends on the throttle profile you gave; hydration time on real phones may differ.
- U13's remark about the scan button is a guess.
