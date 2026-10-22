import React, { useEffect, useSyncExternalStore } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ClipboardList,
  Phone,
  Printer,
  Smartphone,
  WifiOff,
} from "lucide-react";

import { BUSINESS } from "../data/business.js";
import { trackEvent } from "../lib/analytics.js";
import AddToHomeButton from "../components/app/AddToHomeButton.jsx";
import { deviceKind } from "../lib/installHelp.js";
import { isStandalone } from "../lib/appMode.js";
import { getServerSnapshot, getSnapshot, subscribe } from "../pwa/state.js";
import {
  Breadcrumbs,
  PageHero,
  Section,
  SectionHead,
  Seo,
} from "../components/ui/index.jsx";

/**
 * /app: "Add TireDrop to your phone". The site is already an installable web
 * app (manifest, service worker, install prompt: src/pwa/), so there is no
 * store app to download. This page explains, in plain steps, how to put it on
 * a home screen, and carries a QR code for the shop counter
 * (public/brand/app-qr.svg points at /app?source=qr; `source` is ignored as
 * page content in src/main.jsx).
 *
 * Nothing here claims more than the app does: it opens full screen, has a
 * bottom tab bar, remembers orders only when the customer ticks the box, and
 * shows an offline page with the shop phone. No prices, dates or store claims.
 */

const BENEFITS = [
  {
    Icon: Smartphone,
    title: "Opens like an app",
    copy: "Its own icon on your home screen and no browser bar, with Shop, Size, My Orders and Call along the bottom.",
  },
  {
    Icon: ClipboardList,
    title: "Your order, one tap away",
    copy: "Tick \"Remember this order on this device\" on the tracking page and it is waiting in My Orders, with each step of its progress.",
  },
  {
    Icon: Phone,
    title: "The shop in one tap",
    copy: `Call ${BUSINESS.shop.city} straight from the app, ${BUSINESS.phone}.`,
  },
  {
    Icon: WifiOff,
    title: "A plan for a bad signal",
    copy: "If the connection drops, you get a simple page with the shop's phone number instead of an error.",
  },
];

const IPHONE = [
  "Open tiredroponline.com in Safari. It has to be Safari, not a link inside another app.",
  "Tap the Share button, the square with an arrow pointing up, at the bottom of the screen.",
  "Scroll down and tap Add to Home Screen.",
  "Tap Add. TireDrop appears with your other apps.",
];

const ANDROID = [
  "Open tiredroponline.com in Chrome.",
  "Tap the menu, the three dots at the top right.",
  "Tap Install app. On some phones it reads Add to Home screen.",
  "Tap Install. TireDrop appears with your other apps.",
];

function Steps({ steps }) {
  return (
    <ol className="mt-4 space-y-3">
      {steps.map((text, i) => (
        <li key={text} className="flex gap-3">
          <span
            aria-hidden
            className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-drop font-display text-sm font-bold text-bone"
          >
            {i + 1}
          </span>
          <span className="text-[15px] leading-relaxed text-ink">{text}</span>
        </li>
      ))}
    </ol>
  );
}

function DeviceCard({ id, title, steps, mine }) {
  return (
    <section
      id={id}
      data-mine={mine ? "true" : undefined}
      className={`rounded-card border bg-bone p-6 shadow-card ${
        mine ? "border-drop ring-2 ring-drop/25" : "border-ink/[0.07]"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="h3">{title}</h3>
        {mine && (
          <span className="rounded-sm bg-sky px-2 py-0.5 font-display text-xs font-bold uppercase tracking-[0.06em] text-drop">
            Your phone
          </span>
        )}
      </div>
      <Steps steps={steps} />
    </section>
  );
}

// What this device is, read once in the browser. The server and the first
// render get "unknown", so the prerendered HTML never depends on the visitor.
const UNKNOWN = Object.freeze({ device: null, installed: false });
let clientInfo = null;
const noSubscribe = () => () => {};
const getClient = () => {
  if (!clientInfo) {
    const kind = deviceKind();
    clientInfo = {
      device: kind.platform === "ios" ? "iphone" : kind.platform === "android" ? "android" : null,
      installed: isStandalone(),
    };
  }
  return clientInfo;
};

export default function AppPage() {
  const store = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const { device, installed } = useSyncExternalStore(noSubscribe, getClient, () => UNKNOWN);
  const navigate = useNavigate();
  const usingApp = installed || store.installed;

  // Adding from this page on an iPhone saves THIS address, so the app can open
  // here. Inside the app there is nothing to add: go straight to the shop.
  useEffect(() => {
    if (installed && window.history.length <= 2) navigate("/?source=app", { replace: true });
  }, [installed, navigate]);

  return (
    <>
      <Seo
        title="Add TireDrop to Your Phone"
        description="TireDrop works like an app with nothing to download from a store. Add it to your iPhone or Android home screen in four taps, and keep your order one tap away."
      />

      <PageHero
        eyebrow="The TireDrop app"
        title="Add TireDrop to your phone"
        lede="No app store and no download. Put TireDrop on your home screen and open it like an app: shop tires, check your order and call the shop in one tap."
      >
        <div className="flex flex-wrap gap-3">
          {usingApp ? (
            <p className="inline-flex min-h-[48px] items-center rounded-card border border-volt/40 bg-volt/10 px-4 font-display text-sm font-bold text-volt">
              You are using the app now
            </p>
          ) : (
            <AddToHomeButton placement="app_page_hero" />
          )}
          <a href={BUSINESS.phoneHref} className="btn-ghost-light min-h-[48px]">
            <Phone size={18} aria-hidden />
            {BUSINESS.phone}
          </a>
        </div>
      </PageHero>

      <Breadcrumbs trail={[{ label: "Get the app" }]} />

      <Section className="bg-fog">
        <SectionHead
          eyebrow="What you get"
          title="The shop, on your home screen"
          lede="It is the same TireDrop website, set up to live next to your other apps."
        />
        <ul className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {BENEFITS.map(({ Icon, title, copy }, i) => (
            <li
              key={title}
              data-reveal
              style={{ "--rv-i": i }}
              className="rounded-card border border-ink/[0.07] bg-bone p-5 shadow-card"
            >
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-card bg-sky text-drop">
                <Icon size={22} aria-hidden />
              </span>
              <h3 className="h3">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-smoke">{copy}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="how" className="bg-bone">
        <SectionHead
          eyebrow="How to add it"
          title="Four taps, on any phone"
          lede="Pick the one that matches your phone. On a computer, Chrome and Edge show an install icon at the right end of the address bar."
        />
        {!usingApp && (
          <div className="mb-6">
            <AddToHomeButton placement="app_page_steps" />
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <DeviceCard
            id="iphone"
            title="iPhone and iPad"
            steps={IPHONE}
            mine={device === "iphone"}
          />
          <DeviceCard
            id="android"
            title="Android"
            steps={ANDROID}
            mine={device === "android"}
          />
        </div>
        <p className="mt-6 max-w-[68ch] text-sm leading-relaxed text-smoke">
          The app saves only what you choose to save. Your order is remembered on
          your phone only if you tick the box on the tracking page, and
          &quot;Forget&quot; clears it. Details are in the{" "}
          <Link to="/privacy" className="font-semibold text-drop hover:text-dive">
            Privacy Policy
          </Link>
          .
        </p>
      </Section>

      <Section className="bg-fog">
        <div className="grid items-center gap-8 md:grid-cols-[auto_1fr] md:gap-12">
          <img
            src="/brand/app-qr.svg"
            alt="QR code that opens tiredroponline.com/app on your phone"
            width={220}
            height={220}
            className="mx-auto h-[220px] w-[220px] rounded-card border border-ink/[0.07] bg-white p-2 shadow-card md:mx-0"
          />
          <div>
            <SectionHead
              eyebrow="At the shop"
              title="Scan to add it"
              lede="Point your phone camera at the code and this page opens on your phone."
            />
            <button
              type="button"
              onClick={() => window.print()}
              className="btn-outline min-h-[44px] print:hidden"
            >
              <Printer size={17} aria-hidden />
              Print this page for the counter
            </button>
          </div>
        </div>
      </Section>
    </>
  );
}
