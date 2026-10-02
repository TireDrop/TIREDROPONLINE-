/**
 * The home page's "Learn" cards: a few real guides and blog posts, picked in
 * Node at build time and served to the browser as the small
 * "virtual:home-reading" module (vite.config.js). The home page is in the
 * main bundle, so it must never import src/content/index.js, which carries
 * a summary of every article; this hands it titles, paths and reading times
 * for the few it shows only.
 *
 * Picks the most recently updated published Learn guides (one per hub, so the
 * row shows range) and blog posts (one per category where it can), then
 * alternates guide, post, guide... A new article shows up on the next build.
 *
 * Plain JavaScript with no imports, so homeReading.test.mjs runs it in Node.
 */

const byUpdated = (a, b) =>
  (b.updated ?? "").localeCompare(a.updated ?? "") ||
  (b.date ?? "").localeCompare(a.date ?? "") ||
  a.title.localeCompare(b.title);

/** Newest first, the first of each `groupOf` value, then the rest. */
function spread(list, groupOf, count) {
  const sorted = [...list].sort(byUpdated);
  const seen = new Set();
  const first = [];
  const rest = [];
  for (const item of sorted) {
    const key = groupOf(item);
    if (key && !seen.has(key)) {
      seen.add(key);
      first.push(item);
    } else rest.push(item);
  }
  return [...first, ...rest].slice(0, count);
}

/**
 * `store` is a content store (src/content/node.js loadContent()). Returns up
 * to `learn + blog` cards: `{ kind, title, description, path, topic, minutes }`.
 */
export function pickHomeReading(store, { learn = 3, blog = 3 } = {}) {
  const published = (list) => list.filter((a) => a.public !== false && !a.draft);
  const hubTitle = new Map(store.getLearnHubs().map((h) => [h.slug, h.title]));

  const guides = spread(published(store.getLearnArticles()), (a) => a.hub, learn).map(
    (a) => ({
      kind: "guide",
      title: a.title,
      description: a.description,
      path: a.path,
      topic: hubTitle.get(a.hub) ?? "Learn",
      minutes: a.readingMinutes ?? null,
    }),
  );

  const posts = spread(published(store.getBlogPosts()), (a) => a.category?.slug, blog).map(
    (a) => ({
      kind: "post",
      title: a.title,
      description: a.description,
      path: a.path,
      topic: a.category?.label ?? "Blog",
      minutes: a.readingMinutes ?? null,
    }),
  );

  // Interleave so neither kind fills a whole row on its own.
  const out = [];
  for (let i = 0; i < Math.max(guides.length, posts.length); i++) {
    if (guides[i]) out.push(guides[i]);
    if (posts[i]) out.push(posts[i]);
  }
  return out;
}
