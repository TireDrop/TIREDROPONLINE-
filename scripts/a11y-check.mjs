/**
 * axe-core over the built site's key routes, at phone and desktop width.
 *
 *   npm run build && npm run check:a11y
 *
 * Fails on any serious or critical violation; moderate and minor ones are
 * listed but do not fail the run. Also checks that the skip link is the first
 * thing Tab reaches and that it moves focus to <main id="main">.
 *
 * Starts `vite preview` on A11Y_PORT (default 4320), or tests A11Y_BASE when
 * that is set to an already running server. Every /api call is mocked and
 * third-party hosts are answered empty, as in prerender-check.mjs.
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const AXE = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

const CHROME =
  process.env.AUDIT_CHROME ??
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const PORT = Number(process.env.A11Y_PORT ?? 4320);
const WIDTHS = [390, 1280];

/** The first prerendered page in a dist/ folder, as a route. */
function firstIn(dir) {
  const file = readdirSync(`dist/${dir}`)
    .filter((f) => f.endsWith(".html"))
    .sort()[0];
  if (!file) throw new Error(`no prerendered page in dist/${dir}`);
  return `/${dir}/${file.replace(/\.html$/, "")}`;
}

/* ------------------------------ preview ------------------------------ */

let server = null;
let BASE = process.env.A11Y_BASE;
if (!BASE) {
  if (!existsSync("dist/tires.html")) {
    console.error("No prerendered build in dist/. Run `npm run build` first.");
    process.exit(1);
  }
  BASE = `http://localhost:${PORT}`;
  server = spawn(
    "npx",
    ["vite", "preview", "--port", String(PORT), "--strictPort"],
    { stdio: "ignore", detached: true },
  );
  const deadline = Date.now() + 20000;
  for (;;) {
    try {
      if ((await fetch(BASE)).ok) break;
    } catch {
      /* not up yet */
    }
    if (Date.now() > deadline) {
      console.error(`vite preview did not come up on ${BASE}`);
      process.kill(-server.pid);
      process.exit(1);
    }
    await new Promise((r) => setTimeout(r, 200));
  }
}
const stopServer = () => {
  try {
    if (server) process.kill(-server.pid);
  } catch {
    /* already gone */
  }
};

const learnHub = readdirSync("dist/learn", { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort()[0];

const ROUTES = [
  "/",
  "/tires",
  firstIn("tires"),
  "/cart",
  "/checkout",
  "/track",
  "/schedule",
  "/mobile-service",
  firstIn("mobile-service"),
  firstIn(`learn/${learnHub}`),
  "/tire-size",
  "/contact",
];

/* ------------------------------ harness ------------------------------ */

const browser = await chromium.launch({
  executablePath: existsSync(CHROME) ? CHROME : undefined,
});
const local = new URL(BASE).host;

async function newPage(width) {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  await page.route(
    (url) => url.host !== local,
    (route) => route.fulfill({ status: 200, body: "" }),
  );
  await page.route("**/api/status", (route) =>
    route.fulfill({
      json: {
        atd: "sample",
        shopify: "live",
        checkout: "request",
        newsletter: "on",
        forms: "on",
        version: "test",
      },
    }),
  );
  await page.route("**/api/tires**", (route) =>
    route.fulfill({ status: 404, body: "" }),
  );
  return { context, page };
}

const isMounted = () =>
  Object.keys(document.getElementById("root")).some((k) =>
    k.startsWith("__reactContainer"),
  );

let failures = 0;
const report = [];

try {
  for (const width of WIDTHS) {
    const { context, page } = await newPage(width);
    for (const route of ROUTES) {
      await page.goto(BASE + route, { waitUntil: "load" });
      await page.waitForFunction(isMounted);
      await page.waitForLoadState("networkidle");
      // Let colour transitions settle, or axe measures a half-faded state.
      await page.waitForTimeout(300);
      if (!(await page.evaluate(() => Boolean(window.axe))))
        await page.addScriptTag({ content: AXE });
      const result = await page.evaluate(() =>
        window.axe.run(document, {
          runOnly: {
            type: "tag",
            values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"],
          },
        }),
      );
      const blocking = result.violations.filter((v) =>
        ["serious", "critical"].includes(v.impact),
      );
      for (const v of result.violations) {
        report.push({ route, width, ...v });
        const where = v.nodes
          .slice(0, 3)
          .map((n) => n.target.join(" "))
          .join(" | ");
        console.log(
          `${blocking.includes(v) ? "FAIL" : "note"} ${route} @${width}: ${v.id} [${v.impact}] x${v.nodes.length} ${where}`,
        );
      }
      if (blocking.length) failures += blocking.length;
      else console.log(`ok   ${route} @${width}: no serious or critical issues`);
    }

    // The skip link: first Tab stop, and it lands focus on <main>.
    await page.goto(BASE + "/", { waitUntil: "load" });
    await page.waitForFunction(isMounted);
    await page.keyboard.press("Tab");
    const first = await page.evaluate(() => ({
      text: document.activeElement?.textContent.trim(),
      href: document.activeElement?.getAttribute("href"),
    }));
    await page.keyboard.press("Enter");
    const landed = await page.evaluate(() => document.activeElement?.id);
    if (first.text === "Skip to main content" && first.href === "#main" && landed === "main")
      console.log(`ok   skip link @${width}: first Tab stop, focus moves to <main>`);
    else {
      failures += 1;
      console.log(
        `FAIL skip link @${width}: first Tab stop "${first.text}" (${first.href}), focus after Enter on #${landed}`,
      );
    }
    await context.close();
  }
} finally {
  await browser.close();
  stopServer();
}

const notes = report.filter((v) => !["serious", "critical"].includes(v.impact));
console.log(
  `\n${ROUTES.length} routes x ${WIDTHS.length} widths: ${failures} serious/critical, ${notes.length} moderate/minor noted`,
);
process.exit(failures ? 1 : 0);
