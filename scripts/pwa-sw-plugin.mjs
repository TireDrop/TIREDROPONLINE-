// Emits /sw.js (template: src/pwa/sw.js) with the build's real file names.
//
// The service worker precaches the app shell, and the shell's scripts,
// stylesheets and fonts have hashed names that change every build, so the
// list is filled in here, from the same bundle Vite just produced.
//
//   "__SW_PRECACHE__"  the URLs to precache
//   "__SW_VERSION__"   a hash of that list and of offline.html. Same inputs,
//                      same sw.js byte for byte, so a deploy that changed
//                      nothing the shell cares about does not trigger an
//                      update toast; one that did, does.
//
// Production builds only (not `vite dev`, not `--mode preview`, which is a
// relative-path hash-router build that cannot host a root-scoped worker).
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");

export function swPlugin() {
  return {
    name: "tiredrop-service-worker",
    apply: (config, { command, isSsrBuild }) =>
      command === "build" && !isSsrBuild && config.mode !== "preview",
    generateBundle(_options, bundle) {
      const urls = new Set(["/offline", "/brand/icon-192.png"]);
      const add = (file) => urls.add(`/${file}`);
      const seen = new Set();
      const walk = (chunk) => {
        if (!chunk || seen.has(chunk.fileName)) return;
        seen.add(chunk.fileName);
        add(chunk.fileName);
        for (const css of chunk.viteMetadata?.importedCss ?? []) add(css);
        for (const imported of chunk.imports ?? []) walk(bundle[imported]);
      };
      for (const item of Object.values(bundle)) {
        if (item.type === "chunk" && item.isEntry) walk(item);
        // Fonts the stylesheet pulls in: the shell's text would reflow
        // without them.
        if (item.type === "asset" && /\.woff2$/.test(item.fileName)) add(item.fileName);
      }
      const list = [...urls].sort();
      const offline = readFileSync(resolve(ROOT, "public/offline.html"));
      const version = createHash("sha256")
        .update(JSON.stringify(list))
        .update(offline)
        .digest("hex")
        .slice(0, 10);
      const template = readFileSync(resolve(ROOT, "src/pwa/sw.js"), "utf8");
      const source = template
        .replace('["__SW_PRECACHE__"]', JSON.stringify(list))
        .replace("__SW_VERSION__", version);
      if (source.includes("__SW_")) throw new Error("service worker: placeholder not replaced");
      this.emitFile({ type: "asset", fileName: "sw.js", source });
    },
  };
}
