// verify-all: one command that runs every gate and prints a pass/fail table.
//   npm run verify          fast gates (lint, unit tests, build, static checks)
//   npm run verify -- --full  adds the browser checks (slow: prerender alone takes minutes)
// Exit code 0 only when every gate passes. Failures keep going so one run lists everything.
import { spawnSync } from "node:child_process";

const full = process.argv.includes("--full");
const fast = [
  ["lint", "lint"], ["test:api", "test:api"], ["test:content", "test:content"], ["test:lib", "test:lib"],
  ["test:sources", "test:sources"], ["test:data", "test:data"], ["test:fitment", "test:fitment"],
  ["build", "build"], ["check:docs", "check:docs"], ["check:schema", "check:schema"],
  ["check:sources", "check:sources"], ["check:links", "check:links"],
];
const browser = [
  ["check:prerender", "check:prerender"], ["check:a11y", "check:a11y"], ["check:scanner", "check:scanner"],
  ["check:home", "check:home"], ["check:footer", "check:footer"], ["check:ga", "check:ga"],
  ["check:search", "check:search"], ["check:translate", "check:translate"], ["check:newsletter", "check:newsletter"],
  ["check:forms", "check:forms"], ["check:remember", "check:remember"],
];
const gates = full ? [...fast, ...browser] : fast;
const rows = [];
for (const [name, script] of gates) {
  const t0 = Date.now();
  process.stdout.write(`running ${name} ... `);
  const r = spawnSync("npm", ["run", "-s", script], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  const ok = r.status === 0, secs = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`${ok ? "PASS" : "FAIL"} (${secs}s)`);
  rows.push({ name, ok, secs, tail: ok ? "" : `${r.stdout || ""}${r.stderr || ""}`.trim().split("\n").slice(-6).join("\n") });
}
console.log("\n=== verify summary ===");
for (const r of rows) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}`);
const bad = rows.filter((r) => !r.ok);
for (const r of bad) console.log(`\n--- ${r.name} (last lines) ---\n${r.tail}`);
console.log(`\n${rows.length - bad.length}/${rows.length} gates passed${full ? "" : " (fast set; add --full for the browser checks)"}`);
process.exit(bad.length ? 1 : 0);
