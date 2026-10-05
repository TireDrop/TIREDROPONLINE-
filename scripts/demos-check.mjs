/**
 * Learn demos check.
 *
 * 1. Prerender safety: renders every built demo with react-dom/server through
 *    Vite's SSR loader. A demo that touches window/document during render
 *    throws here.
 * 2. Browser: mounts each demo from the dev gallery in Chromium at 390px and
 *    1440px, drives it into a second state with the keyboard or a click, and
 *    asserts: no console errors, no banned words ("safe", "fine", "OK",
 *    "guaranteed"), 44px targets, a Source line, no sideways scroll, and the
 *    flashing TPMS light stops under reduced motion.
 * 3. axe-core, when AXE_PATH points at axe.min.js (not a repo dependency):
 *    WCAG 2.x A/AA rules on each demo, in both states.
 *
 *   npx vite --port 5173 &
 *   node scripts/demos-check.mjs
 *
 * Env: DEMOS_BASE (default http://localhost:5173), DEMOS_SHOTS (default
 * /tmp/demos-check), AXE_PATH, AUDIT_CHROME.
 */
import { chromium } from "playwright";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { createServer } from "vite";

const BASE = process.env.DEMOS_BASE ?? "http://localhost:5173";
const SHOTS = process.env.DEMOS_SHOTS ?? "/tmp/demos-check";
const AXE_PATH = process.env.AXE_PATH;
const CHROME =
  process.env.AUDIT_CHROME ??
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const GALLERY = "/src/components/demos/dev/gallery.html";
const BANNED = /\b(safe|safer|safely|fine|guaranteed?|OK)\b/i;
mkdirSync(SHOTS, { recursive: true });

let failures = 0;
async function check(name, fn) {
  try {
    await fn();
    console.log(`ok   ${name}`);
  } catch (err) {
    failures += 1;
    console.log(`FAIL ${name}\n     ${err.message.split("\n").join("\n     ")}`);
  }
}

/* ---------------- 1. Prerender safety ---------------- */

const FILES = {
  "tread-gauge": "TreadGauge.jsx",
  "dot-date-reader": "DotDateReader.jsx",
  "size-decoder": "SizeDecoder.jsx",
  "tpms-light": "TpmsLight.jsx",
  "utqg-explainer": "UtqgExplainer.jsx",
  "load-speed-check": "LoadSpeedCheck.jsx",
  "plus-size-speedo": "PlusSizeSpeedo.jsx",
  "pressure-temp": "PressureTemp.jsx",
  "damage-map": "RepairabilityMap.jsx",
  "noise-vibration": "NoiseVibration.jsx",
  "rotation-pattern": "RotationPattern.jsx",
  "wheel-offset": "WheelOffsetCalculator.jsx",
};

const vite = await createServer({
  server: { middlewareMode: true, hmr: false },
  appType: "custom",
  logLevel: "error",
});
try {
  for (const [id, file] of Object.entries(FILES)) {
    await check(`ssr  ${id} renders to HTML without a DOM`, async () => {
      const mod = await vite.ssrLoadModule(`/src/components/demos/${file}`);
      const html = renderToString(React.createElement(mod.default));
      assert.match(html, new RegExp(`data-demo="${id}"`));
      const text = html.replace(/<[^>]+>/g, " ");
      const hit = text.match(BANNED);
      assert.ok(!hit, `banned word "${hit?.[0]}" in SSR output`);
    });
  }
} finally {
  await vite.close();
}

/* ---------------- 2. Browser ---------------- */

const browser = await chromium.launch({
  executablePath: existsSync(CHROME) ? CHROME : undefined,
});
const axeSource = AXE_PATH && existsSync(AXE_PATH) ? readFileSync(AXE_PATH, "utf8") : null;
const axeReport = [];

/** Each demo's second state, driven the way a user would. */
const STATES = {
  "tread-gauge": {
    async drive(page) {
      const slider = page.getByRole("slider", { name: "Tread depth" });
      await slider.focus();
      for (let i = 0; i < 4; i += 1) await slider.press("ArrowLeft");
      await expectText(page, "Replace");
      assert.equal(await slider.getAttribute("aria-valuetext"), "2/32 inch, 1.6 millimeters");
    },
    initial: "Keep checking monthly",
  },
  "dot-date-reader": {
    async drive(page) {
      const input = page.getByLabel("Last 4 digits of the DOT code");
      await input.fill("5419");
      await expectText(page, "isn't a week");
      assert.equal(await input.getAttribute("aria-invalid"), "true");
      await input.fill("0716");
      await expectText(page, "Manufacturers recommend replacing");
    },
    initial: "Week 23 of 2019",
  },
  "size-decoder": {
    async drive(page) {
      await page.getByRole("button", { name: "Try 33x12.50R20LT 114Q" }).click();
      await expectText(page, "Overall diameter");
      await page.getByRole("button", { name: /^12\.50/ }).click();
      await expectText(page, "12.50 is the section width in inches");
    },
    initial: "225 is the section width",
  },
  "tpms-light": {
    async drive(page) {
      const solid = page.getByRole("radio", { name: /Solid on/ });
      await solid.focus();
      await solid.press("ArrowDown");
      await expectText(page, "System malfunction");
      assert.ok(await page.getByRole("radio", { name: /Flashes, then stays on/ }).isChecked());
    },
    initial: "Low-pressure warning",
  },
  "utqg-explainer": {
    async drive(page) {
      await page.getByRole("button", { name: "Try 300 A B" }).click();
      const c = page.getByRole("radio", { name: "C" }).first();
      await c.focus();
      await c.check();
      await expectText(page, "C is the lowest traction grade");
      await expectText(page, "3 times as long");
    },
    initial: "5 times as long",
  },
  "load-speed-check": {
    async drive(page) {
      const demo = page.locator('[data-demo="load-speed-check"]');
      await demo.getByRole("textbox", { name: "Type it from the sidewall" }).nth(1).fill("97W");
      await expectText(page, "Meets or exceeds your current tire on load index and speed rating");
      const speed = demo.getByRole("combobox", { name: "Speed rating" }).nth(1);
      await speed.focus();
      await speed.selectOption("T");
      await expectText(page, "T is tested to 118 mph");
    },
    initial: "Below your current tire on load index and speed rating",
  },
  "plus-size-speedo": {
    async drive(page) {
      const demo = page.locator('[data-demo="plus-size-speedo"]');
      await demo.getByRole("textbox", { name: "New size" }).fill("255/55R18");
      await expectText(page, "Outside the common 3% guideline");
      await demo.getByRole("button", { name: /^Plus two/ }).click();
      await expectText(page, "205/55R16 → 225/40R18");
    },
    initial: "Within the common 3% guideline",
  },
  "pressure-temp": {
    async drive(page) {
      await page.getByRole("button", { name: "Cold-front morning" }).click();
      await expectText(page, "31.9 PSI by the gas law");
      const slider = page.getByRole("slider", { name: "Temperature now" });
      await slider.focus();
      for (let i = 0; i < 2; i += 1) await slider.press("ArrowRight");
      assert.equal(await slider.inputValue(), "50");
    },
    initial: "about 36.6 PSI by the gas law",
  },
  "damage-map": {
    async drive(page) {
      await page.getByRole("combobox", { name: "Where is it?" }).selectOption("sidewall");
      await expectText(page, "Not repairable under industry practice");
      await page.getByRole("combobox", { name: "What is it?" }).selectOption("bulge");
      await expectText(page, "Replace this tire");
    },
    initial: "May be repairable, only after an inside inspection",
  },
  "noise-vibration": {
    async drive(page) {
      const braking = page.getByRole("radio", { name: "When braking" });
      await braking.focus();
      await braking.check();
      await page.getByRole("radio", { name: "Brake pedal" }).check();
      await expectText(page, "felt in the brake pedal (+3)");
    },
    initial: "Wheel out of balance",
  },
  "rotation-pattern": {
    async drive(page) {
      await page.getByRole("radio", { name: /Rear-wheel drive/ }).check();
      await expectText(page, "Rears go straight forward");
      await page.getByRole("button", { name: "Show the move" }).click();
      await expectText(page, "where each tire ends up");
    },
    initial: "Fronts go straight back",
  },
  "wheel-offset": {
    async drive(page) {
      const demo = page.locator('[data-demo="wheel-offset"]');
      await demo.getByRole("button", { name: "Example: Truck, big swing" }).click();
      await expectText(page, "Large change: call us before you order");
      await demo.getByRole("textbox", { name: /Tire size/ }).first().fill("banana");
      await expectText(page, "doesn't read as a tire size");
      await demo.getByRole("spinbutton", { name: /Width/ }).first().fill("-9");
      await expectText(page, "has to be more than zero");
      await demo.getByRole("button", { name: "Example: SUV, small change" }).click();
      await expectText(page, "Close to your current setup");
    },
    initial: "Noticeably different: have the fit checked",
  },
};

async function expectText(page, text) {
  await page.locator(`[data-demo]`).getByText(text, { exact: false }).first().waitFor({ timeout: 5000 });
}

async function open(width, id, { reducedMotion = "no-preference" } = {}) {
  const context = await browser.newContext({
    viewport: { width, height: width < 768 ? 844 : 900 },
    reducedMotion,
    hasTouch: width < 768,
  });
  // Google Fonts is unreachable from CI sandboxes; don't wait on it.
  await context.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error" && !/fonts\.g|ERR_FAILED/.test(m.text())) errors.push(m.text());
  });
  await page.goto(`${BASE}${GALLERY}${id ? `?demo=${id}` : ""}`, { waitUntil: "domcontentloaded" });
  await page.locator(id ? `[data-demo="${id}"]` : "[data-demo]").first().waitFor();
  return { context, page, errors };
}

async function audit(page, id, width, state) {
  const demo = page.locator(`[data-demo="${id}"]`);
  // Let 150ms color transitions settle, or axe measures a half-faded chip.
  await page.waitForTimeout(300);

  const text = await demo.innerText();
  const hit = text.match(BANNED);
  assert.ok(!hit, `banned word "${hit?.[0]}"`);

  const small = await demo.evaluate((root) =>
    [...root.querySelectorAll("button, input:not([type=radio]), label:has(input[type=radio])")]
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { tag: el.tagName, label: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 30), w: Math.round(r.width), h: Math.round(r.height) };
      })
      .filter((t) => t.w < 44 || t.h < 44),
  );
  assert.deepEqual(small, [], "targets under 44px");

  const sources = await demo.locator("p:has-text('Source') a[href^='https://']").count();
  assert.ok(sources >= 1, "no Source links");

  const overflow = await page.evaluate(() => {
    const el = document.scrollingElement;
    return el.scrollWidth - el.clientWidth;
  });
  assert.ok(overflow <= 0, `page scrolls sideways by ${overflow}px`);

  const svgs = await demo.evaluate((root) =>
    [...root.querySelectorAll("svg[role=img]")].filter(
      (s) => !s.querySelector("title"),
    ).length,
  );
  assert.equal(svgs, 0, "svg[role=img] without <title>");

  if (axeSource) {
    if (!(await page.evaluate(() => Boolean(window.axe)))) {
      await page.addScriptTag({ content: axeSource });
    }
    const result = await page.evaluate(
      async (sel) =>
        window.axe.run(document.querySelector(sel), {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
        }),
      `[data-demo="${id}"]`,
    );
    for (const v of result.violations) {
      axeReport.push({ id, width, state, rule: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help, target: v.nodes[0]?.target?.join(" ") });
    }
    assert.equal(result.violations.length, 0, `axe: ${result.violations.map((v) => `${v.id} (${v.nodes.length})`).join(", ")}`);
  }

  await demo.screenshot({ path: `${SHOTS}/${id}-${width}-${state}.png` });
}

for (const id of Object.keys(FILES)) {
  for (const width of [390, 1440]) {
    await check(`${id} @${width}: mounts, audits, drives, audits`, async () => {
      const { context, page, errors } = await open(width, id);
      try {
        await expectText(page, STATES[id].initial);
        await audit(page, id, width, "a");
        await STATES[id].drive(page);
        await audit(page, id, width, "b");
        assert.deepEqual(errors, [], "console errors");
      } finally {
        await context.close();
      }
    });
  }
}

await check("tpms-light: flashing stops under prefers-reduced-motion", async () => {
  for (const [motion, expected] of [["reduce", "none"], ["no-preference", "tdxTpmsBlink"]]) {
    const { context, page } = await open(390, "tpms-light", { reducedMotion: motion });
    try {
      await page.getByRole("radio", { name: /Flashes, then stays on/ }).check();
      const name = await page.locator(".tdx-tpms-blink").evaluate((el) => getComputedStyle(el).animationName);
      assert.equal(name, expected, motion);
    } finally {
      await context.close();
    }
  }
});

await check("gallery: all demos and reserved ids render together", async () => {
  const { context, page, errors } = await open(1440, "");
  try {
    for (const id of Object.keys(FILES)) await page.locator(`[data-demo="${id}"]`).waitFor();
    assert.equal(await page.locator("[data-gallery-reserved]").count(), 3);
    assert.deepEqual(errors, []);
  } finally {
    await context.close();
  }
});

await browser.close();

if (axeSource) {
  console.log(`\naxe-core: ${axeReport.length} violation(s)`);
  for (const v of axeReport) console.log(`  ${v.id} @${v.width}/${v.state}: ${v.rule} [${v.impact}] ×${v.nodes} ${v.target} — ${v.help}`);
} else {
  console.log("\naxe-core: skipped (set AXE_PATH to axe.min.js to run it)");
}
console.log(`\nScreenshots: ${SHOTS}`);
console.log(failures ? `\n${failures} check(s) failed` : "\nall checks passed");
process.exit(failures ? 1 : 0);
