import { test } from "node:test";
import assert from "node:assert/strict";

import { pickHomeReading } from "./homeReading.js";
import { loadContent } from "../content/node.js";

const article = (over) => ({
  public: true,
  draft: false,
  description: "d",
  date: "2026-09-01",
  updated: "2026-09-01",
  readingMinutes: 4,
  ...over,
});

const fakeStore = ({ learn = [], blog = [] }) => ({
  getLearnHubs: () => [
    { slug: "tread", title: "Tread & Wear" },
    { slug: "age", title: "Tire Age" },
  ],
  getLearnArticles: () => learn,
  getBlogPosts: () => blog,
});

test("alternates guides and posts, newest first, one per hub first", () => {
  const store = fakeStore({
    learn: [
      article({ title: "A", path: "/learn/tread/a", hub: "tread", updated: "2026-09-03" }),
      article({ title: "B", path: "/learn/tread/b", hub: "tread", updated: "2026-09-05" }),
      article({ title: "C", path: "/learn/age/c", hub: "age", updated: "2026-09-02" }),
    ],
    blog: [
      article({ title: "P", path: "/blog/p", category: { slug: "local", label: "Local" } }),
    ],
  });
  const cards = pickHomeReading(store, { learn: 2, blog: 2 });
  assert.deepEqual(
    cards.map((c) => c.path),
    ["/learn/tread/b", "/blog/p", "/learn/age/c"],
  );
  assert.equal(cards[0].topic, "Tread & Wear");
  assert.equal(cards[0].kind, "guide");
  assert.equal(cards[1].topic, "Local");
  assert.equal(cards[1].minutes, 4);
});

test("never includes drafts or samples", () => {
  const store = fakeStore({
    learn: [article({ title: "D", path: "/learn/tread/d", hub: "tread", draft: true, public: false })],
    blog: [article({ title: "S", path: "/blog/_s", public: false })],
  });
  assert.deepEqual(pickHomeReading(store), []);
});

test("the real content yields 3-6 published cards, without article bodies", () => {
  const store = loadContent();
  const cards = pickHomeReading(store);
  assert.ok(cards.length >= 3 && cards.length <= 6, `${cards.length} cards`);
  const live = new Set(store.contentRoutes());
  for (const c of cards) {
    assert.ok(live.has(c.path), `${c.path} is published`);
    assert.ok(c.title && c.topic, `${c.path} has a title and topic`);
    assert.deepEqual(
      Object.keys(c).sort(),
      ["description", "kind", "minutes", "path", "title", "topic"],
    );
  }
});
