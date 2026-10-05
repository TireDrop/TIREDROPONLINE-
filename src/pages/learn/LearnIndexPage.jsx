import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowLeftRight,
  Camera,
  CircleGauge,
  MoveHorizontal,
  Phone,
  RefreshCw,
  Ruler,
  Scale,
  Search,
  Thermometer,
  Vibrate,
  Wrench,
} from "lucide-react";
import { BUSINESS } from "../../data/business.js";
import {
  Breadcrumbs,
  PageHero,
  Section,
  SectionHead,
  Seo,
} from "../../components/ui/index.jsx";
import {
  ArticleCard,
  ContentCta,
  GuideLink,
  MonthlyCheck,
  plural,
} from "../../components/content/parts.jsx";
import {
  getBlogPosts,
  getLearnArticles,
  getLearnHubs,
} from "../../content/index.js";

const TOOLS = [
  {
    to: "/tire-size-finder",
    Icon: Camera,
    title: "Tire size finder",
    copy: "Scan your door sticker, tire or VIN to find your exact size.",
  },
  {
    to: "/tire-check",
    Icon: Ruler,
    title: "Do I need tires yet?",
    copy: "Tread depth by coin or gauge, plus the DOT date code.",
  },
  {
    to: "/tire-size",
    Icon: CircleGauge,
    title: "Tire size decoder",
    copy: "What every part of a size like 225/65R17 means.",
  },
  {
    to: "/find-my-tires",
    Icon: Search,
    title: "Find my tires",
    copy: "The sizes that fit your year, make and model.",
  },
  {
    to: "/load-speed-check",
    Icon: Scale,
    title: "Load and speed rating check",
    copy: "Does a new tire's load index and speed rating match the old one?",
  },
  {
    to: "/plus-size-calculator",
    Icon: ArrowLeftRight,
    title: "Plus size calculator",
    copy: "Bigger wheels? Overall diameter and speedometer change.",
  },
  {
    to: "/wheel-offset-calculator",
    Icon: MoveHorizontal,
    title: "Wheel offset check",
    copy: "How far does a new wheel move out or in? Offset, backspacing and tire change.",
  },
  {
    to: "/tire-pressure-temperature",
    Icon: Thermometer,
    title: "Pressure and temperature",
    copy: "How much tire pressure moves with the weather.",
  },
  {
    to: "/can-my-tire-be-repaired",
    Icon: Wrench,
    title: "Can my tire be repaired?",
    copy: "Where the damage is decides it. See what repair practice says.",
  },
  {
    to: "/car-shaking-checker",
    Icon: Vibrate,
    title: "Car shaking checker",
    copy: "Shake, hum or thump? Possible causes and who checks each.",
  },
  {
    to: "/tire-rotation-pattern",
    Icon: RefreshCw,
    title: "Tire rotation pattern",
    copy: "The rotation pattern for your drivetrain and tires.",
  },
];

function HubCard({ hub }) {
  const body = (
    <>
      <p className="eyebrow mb-2">
        {hub.count > 0 ? plural(hub.count, "guide") : "Guides coming soon"}
      </p>
      <h3 className="h3">{hub.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-smoke">
        {hub.description}
      </p>
    </>
  );

  if (hub.count === 0) {
    return (
      <li className="card flex h-full flex-col bg-fog/60 p-6">
        {body}
      </li>
    );
  }

  return (
    <li className="h-full">
      <Link to={hub.path} className="card-hover group flex h-full flex-col p-6">
        {body}
        <span className="mt-5 inline-flex items-center gap-1.5 font-display text-sm font-bold text-drop group-hover:text-dive">
          Browse {hub.title}
          <ArrowRight size={15} aria-hidden />
        </span>
      </Link>
    </li>
  );
}

/** /learn: the hub index. Replaces the old /tire-care page (301s here). */
export default function LearnIndexPage() {
  const hubs = getLearnHubs();
  const recent = [...getLearnArticles()]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);
  const posts = getBlogPosts().slice(0, 3);
  const total = hubs.reduce((n, h) => n + h.count, 0);

  // Sections alternate bone / fog whichever optional ones are present.
  let band = 0;
  const nextBand = () => (band++ % 2 === 0 ? "bg-bone" : "bg-fog");

  return (
    <>
      <Seo
        title="Learn: Tire Guides"
        description="Plain-English tire guides from a tire shop in Sunrise, FL: reading your sidewall, tread depth, pressure and TPMS, damage and repair, Florida weather and buying."
        crumbs={[]}
      />

      <PageHero
        eyebrow="Learn"
        title="Tire guides from a working tire shop"
        lede="The questions we answer every week, written out properly and sourced. Read it, check it yourself, or have us look at it."
      >
        <div className="flex flex-wrap gap-3">
          <a href="#hubs" className="btn-primary">
            Browse the guides
          </a>
          <a href={BUSINESS.phoneHref} className="btn-ghost-light">
            <Phone size={18} aria-hidden />
            Ask us: {BUSINESS.phone}
          </a>
        </div>
      </PageHero>

      <Breadcrumbs trail={[{ label: "Learn" }]} />

      <Section className={nextBand()} id="hubs">
        <SectionHead
          eyebrow="Topics"
          title="Start with the one that brought you here"
          lede={
            total > 0
              ? `${plural(total, "guide")} across ${plural(
                  hubs.filter((h) => h.count > 0).length,
                  "topic",
                )}, each one standing on its own.`
              : "Ten topics, each one standing on its own. The first guides are being written now."
          }
        />
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {hubs.map((hub) => (
            <HubCard key={hub.slug} hub={hub} />
          ))}
        </ul>
      </Section>

      {recent.length > 0 && (
        <Section className={nextBand()}>
          <SectionHead eyebrow="New" title="Recently added guides" />
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((article) => (
              <ArticleCard key={article.path} article={article} />
            ))}
          </ul>
        </Section>
      )}

      <Section className={nextBand()}>
        <SectionHead
          eyebrow="Start here"
          title="The five-minute monthly check"
          lede="If you only ever do one thing from these guides, do this: once a month, with the tires cold, walk around the car."
          align="center"
        />
        <MonthlyCheck />
        <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-relaxed text-smoke">
          Something look off? Have it inspected. The shop in{" "}
          {BUSINESS.shop.city} will look at it, or call {BUSINESS.phone} and
          describe it.
        </p>
      </Section>

      <Section className={nextBand()}>
        <SectionHead eyebrow="Free tools" title="Check your own tires" />
        <ul className="grid gap-5 md:grid-cols-3">
          {TOOLS.map(({ to, Icon, title, copy }) => (
            <li key={to}>
              <Link
                to={to}
                className="card-hover group flex h-full items-start gap-4 p-5"
              >
                <Icon
                  size={24}
                  aria-hidden
                  className="mt-0.5 shrink-0 text-drop"
                />
                <span>
                  <span className="block font-display text-[1.05rem] font-bold text-ink group-hover:text-drop">
                    {title}
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-smoke">
                    {copy}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {posts.length > 0 && (
        <Section className={nextBand()}>
          <SectionHead
            eyebrow="Blog"
            title="From the blog"
            action={<GuideLink to="/blog">All posts</GuideLink>}
          />
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <ArticleCard key={post.path} article={post} showDate />
            ))}
          </ul>
        </Section>
      )}

      <Section className={nextBand()}>
        <ContentCta title="Read it, then get the right ones" className="" />
      </Section>
    </>
  );
}
