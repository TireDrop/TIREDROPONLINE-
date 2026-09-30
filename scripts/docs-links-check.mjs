/**
 * Docs links check. Reads every Markdown file under docs/, plus the root
 * README.md and CLAUDE.md and the READMEs in scripts/ and shopify/, and fails
 * on any link that points at a file that is not in the repo:
 *
 *   1. Markdown links, [text](target), resolved relative to the file they
 *      are in. Web links (http:, https:, mailto:), same-page anchors (#x)
 *      and site routes (/learn/...) are skipped; a #fragment on a file link
 *      is ignored, only the file is checked.
 *   2. Repo paths in inline code that name a doc, such as
 *      `docs/integrations/webhooks.md` or `docs/ops/`, resolved from the repo
 *      root. This is how most of these docs point at each other, so a moved
 *      doc cannot leave a stale mention behind.
 *
 * Fenced code blocks are skipped (they hold copy-paste prompts and shell
 * sessions, not links). Files in docs/archive/ are checked for (1) only:
 * they are historical records and may name paths that no longer exist.
 *
 *   npm run check:docs
 *
 * Exit code 1 and one line per broken link when anything is broken.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function markdownFilesUnder(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...markdownFilesUnder(full));
    else if (name.endsWith(".md")) out.push(full);
  }
  return out;
}

const files = [
  ...markdownFilesUnder(join(ROOT, "docs")),
  ...["README.md", "CLAUDE.md", "scripts/README.md", "shopify/README.md"]
    .map((f) => join(ROOT, f))
    .filter((f) => existsSync(f)),
];

// Blank out fenced code blocks but keep line numbers.
function withoutFences(text) {
  let inFence = false;
  return text.split("\n").map((line) => {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      return "";
    }
    return inFence ? "" : line;
  });
}

const broken = [];
let checked = 0;

for (const file of files) {
  const rel = relative(ROOT, file);
  const archived = rel.startsWith("docs/archive/");
  const lines = withoutFences(readFileSync(file, "utf8"));

  lines.forEach((line, i) => {
    const where = `${rel}:${i + 1}`;

    // 1. Markdown links. Inline code is removed first so `[a](b)` examples
    //    are not read as links.
    const prose = line.replace(/`[^`]*`/g, "");
    for (const m of prose.matchAll(/\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g)) {
      const target = m[1];
      if (/^[a-z][a-z0-9+.-]*:/i.test(target)) continue; // http:, mailto:, ...
      if (target.startsWith("#") || target.startsWith("/")) continue;
      const path = decodeURIComponent(target.split("#")[0]);
      checked++;
      if (!existsSync(resolve(dirname(file), path))) {
        broken.push(`${where}  [link] ${target}`);
      }
    }

    // 2. Doc paths in inline code, from the repo root.
    if (archived) return;
    for (const m of line.matchAll(/`(docs\/[^`\s]*)`/g)) {
      const path = m[1].replace(/[.,;:]+$/, "");
      if (/[*{}<>]/.test(path)) continue; // globs and placeholders
      checked++;
      if (!existsSync(join(ROOT, path))) {
        broken.push(`${where}  [path] ${path}`);
      }
    }
  });
}

if (broken.length) {
  console.error(`docs links: ${broken.length} broken of ${checked} checked in ${files.length} files`);
  for (const b of broken) console.error(`  ${b}`);
  process.exit(1);
}
console.log(`docs links: 0 broken, ${checked} checked in ${files.length} files`);
