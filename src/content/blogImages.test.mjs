/**
 * Blog hero image checks: node --test "src/content/*.test.mjs"
 * (npm run test:content).
 *
 * The manifest (src/data/blogImages.js) and public/brand/blog/ must agree, and
 * every key must be a real blog post. A post with no image is allowed (it just
 * renders without one), so that direction is not asserted.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, statSync } from "node:fs";

import {
  BLOG_IMAGES,
  blogImageAlt,
  blogImageSrc,
} from "../data/blogImages.js";

const IMAGE_DIR = new URL("../../public/brand/blog/", import.meta.url);
const POST_DIR = new URL("./blog/", import.meta.url);

const files = readdirSync(IMAGE_DIR).filter((f) => f.endsWith(".webp"));
const fileSlugs = files.map((f) => f.replace(/\.webp$/, ""));
const postSlugs = readdirSync(POST_DIR)
  .filter((f) => f.endsWith(".md") && !/^readme/i.test(f))
  .map((f) => f.replace(/\.md$/, ""));

test("every manifest entry has an image file", () => {
  const missing = Object.keys(BLOG_IMAGES).filter(
    (s) => !fileSlugs.includes(s),
  );
  assert.deepEqual(missing, []);
});

test("every image file has a manifest entry", () => {
  const orphans = fileSlugs.filter((s) => !Object.hasOwn(BLOG_IMAGES, s));
  assert.deepEqual(orphans, []);
});

test("every manifest key is a real blog post", () => {
  const unknown = Object.keys(BLOG_IMAGES).filter(
    (s) => !postSlugs.includes(s),
  );
  assert.deepEqual(unknown, []);
});

test("alt text is a real description, not empty or a filename", () => {
  for (const [slug, alt] of Object.entries(BLOG_IMAGES)) {
    assert.ok(alt.trim().length >= 20, `${slug}: alt too short`);
    assert.ok(!/\.(webp|png|jpe?g)/i.test(alt), `${slug}: alt looks like a file`);
  }
});

test("image files stay small enough for a fast page", () => {
  for (const f of files) {
    const size = statSync(new URL(f, IMAGE_DIR)).size;
    assert.ok(size < 400 * 1024, `${f} is ${Math.round(size / 1024)} KB`);
  }
});

test("helpers: path for known slugs, null/empty for unknown", () => {
  const slug = Object.keys(BLOG_IMAGES)[0];
  assert.equal(blogImageSrc(slug), `/brand/blog/${slug}.webp`);
  assert.equal(blogImageAlt(slug), BLOG_IMAGES[slug]);
  assert.equal(blogImageSrc("not-a-post"), null);
  assert.equal(blogImageAlt("not-a-post"), "");
  assert.equal(blogImageSrc("__proto__"), null);
});
