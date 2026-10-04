import React from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  Check,
  Clock,
  Languages,
  LifeBuoy,
  MapPin,
  Phone,
  SearchX,
  ShoppingCart,
  Store,
  Truck,
  Wrench,
} from "lucide-react";

import {
  Accordion,
  Breadcrumbs,
  EmptyState,
  PageHero,
  Section,
  SectionHead,
  Seo,
} from "../../components/ui/index.jsx";
import MobilePriceStrip, {
  MOBILE_BOOK,
} from "../../components/services/MobilePriceStrip.jsx";
import ZipCheck from "../../components/ui/ZipCheck.jsx";
import { faqSchema } from "../../components/content/schema.js";
import { BUSINESS } from "../../data/business.js";
import {
  ES_CITY_PAGES,
  ES_HUB,
  ES_SHARED as SHARED,
  HOURS_ES,
  MOBILE_SERVICE_NAMES_ES,
  getEsCityPage,
} from "../../data/spanishPages.js";
import {
  SPANISH_PAGES_INDEXABLE,
  ES_HUB_PATH,
  twinPath,
} from "../../data/spanishRoutes.js";

const ROADSIDE_ICONS = [LifeBuoy, Wrench, LifeBuoy];

/** The way back to the English page (every Spanish page has one). */
function EnglishLink({ path }) {
  const to = twinPath(path);
  if (!to) return null;
  return (
    <Link
      to={to}
      lang="en"
      hrefLang="en-US"
      className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-bone underline underline-offset-4 hover:text-volt"
    >
      <Languages size={16} aria-hidden />
      English
    </Link>
  );
}

function Steps() {
  return (
    <Section className="bg-bone">
      <SectionHead eyebrow="Cómo funciona" title={ES_HUB.howTitle} />
      <ol className="grid gap-5 md:grid-cols-3">
        {SHARED.howItWorks.map((step, i) => (
          <li key={step.title} className="card p-6">
            <span
              aria-hidden
              className="font-display text-3xl leading-none text-ink/50"
            >
              0{i + 1}
            </span>
            <h3 className="h3 mt-3">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-smoke">
              {step.body}
            </p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

/** Roadside flat help: the lede, the three jobs, the shop's hours and the highway line. */
function Roadside({ title, lede, className }) {
  return (
    <Section className={className}>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)] lg:gap-14">
        <div>
          <p className="eyebrow mb-2.5 flex items-center gap-2.5">
            <span aria-hidden className="h-px w-6 bg-drop/45" />
            Ayuda con llantas ponchadas
          </p>
          <h2 className="h2 text-balance">{title}</h2>
          <p className="lede mt-4 max-w-xl">{lede}</p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-3">
            {SHARED.roadsideItems.map((item, i) => {
              const Icon = ROADSIDE_ICONS[i] ?? LifeBuoy;
              return (
                <li key={item.title} className="card p-5">
                  <Icon size={20} aria-hidden className="text-drop" />
                  <h3 className="mt-3 font-display text-[1.0625rem] font-bold text-ink">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-smoke">
                    {item.body}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>

        <aside className="card self-start p-6">
          <h3 className="flex items-center gap-2 font-display text-base font-bold text-ink">
            <Clock size={16} aria-hidden className="text-drop" />
            Durante el horario de la tienda
          </h3>
          <ul className="mt-3 space-y-1 text-sm text-smoke">
            {HOURS_ES.map((h) => (
              <li key={h.days}>
                <span className="text-ink">{h.days}:</span> {h.time}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm leading-relaxed text-smoke">
            Le confirmamos la ventana de llegada al reservar.
          </p>
          <a href={BUSINESS.phoneHref} className="btn-primary mt-5 w-full">
            <Phone size={18} aria-hidden />
            Llamar {BUSINESS.phone}
          </a>
          <p className="mt-5 flex items-start gap-2 border-t border-ink/10 pt-4 text-sm leading-relaxed text-ink">
            <AlertTriangle size={16} aria-hidden className="mt-0.5 shrink-0 text-amber" />
            <span>{SHARED.highwayLine}</span>
          </p>
        </aside>
      </div>
    </Section>
  );
}

function VanAndScope({ vanTitle, scopeTitle = "Qué esperar", className }) {
  return (
    <Section className={className}>
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <div>
          <SectionHead
            eyebrow="Con la camioneta"
            title={vanTitle}
            lede={SHARED.servicesLede}
          />
          <ul className="-mt-2 grid gap-2.5 sm:grid-cols-2 md:-mt-6">
            {MOBILE_SERVICE_NAMES_ES.map((name) => (
              <li
                key={name}
                className="card flex min-h-[48px] items-center gap-3 px-4 py-3 font-display text-[15px] font-bold text-ink"
              >
                <Check size={16} aria-hidden className="shrink-0 text-drop" />
                {name}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <SectionHead eyebrow="Alcance" title={scopeTitle} />
          <ul className="-mt-2 space-y-3 md:-mt-6">
            {SHARED.scope.map((line) => (
              <li
                key={line}
                className="flex items-start gap-3 text-[15px] leading-relaxed text-ink"
              >
                <Check size={18} aria-hidden className="mt-0.5 shrink-0 text-drop" />
                {line}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}

function Cta({ title, body }) {
  return (
    <Section className="bg-steel-wash text-bone">
      <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <h2 className="h2">{title}</h2>
          <p className="lede mt-3 text-bone/70">{body}</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap lg:w-auto">
          <Link to={MOBILE_BOOK} className="btn-primary">
            <CalendarCheck size={18} aria-hidden />
            Reservar instalación
          </Link>
          <Link to="/tires" className="btn-ghost-light">
            <ShoppingCart size={18} aria-hidden />
            Comprar llantas
          </Link>
          <a href={BUSINESS.phoneHref} className="btn-ghost-light">
            <Phone size={18} aria-hidden />
            Llamar {BUSINESS.phone}
          </a>
        </div>
      </div>
    </Section>
  );
}

/** Head for both pages: Spanish title and description, noindex while the switch is off. */
function Head({ page, path }) {
  return (
    <Seo
      title={page.seoTitle}
      description={page.description}
      noindex={!SPANISH_PAGES_INDEXABLE}
      crumbName={page.crumb ?? page.name}
      schema={[faqSchema(page.faq, path)]}
    />
  );
}

function Hub() {
  return (
    <>
      <Head page={ES_HUB} path={ES_HUB_PATH} />
      <Breadcrumbs lang="es" trail={[{ label: ES_HUB.crumb }]} />

      <PageHero
        eyebrow={ES_HUB.eyebrow}
        title={ES_HUB.h1}
        lede={ES_HUB.lede}
        lead={<MobilePriceStrip lang="es" />}
      >
        <EnglishLink path={ES_HUB_PATH} />
      </PageHero>

      <div className="border-b border-ink/10 bg-sky">
        <div className="wrap flex flex-wrap items-center gap-3 py-4 text-sm">
          <MapPin size={18} aria-hidden className="text-drop" />
          <p className="text-smoke">
            <span className="font-display font-bold text-ink">
              Solo Miami-Dade, Broward y Palm Beach.
            </span>{" "}
            Enviamos llantas a los 48 estados contiguos y DC, pero las
            camionetas trabajan solo en el sur de Florida.{" "}
            <Link to="/shipping" className="text-drop underline hover:text-dive">
              Cómo funciona el envío (en inglés)
            </Link>
            .
          </p>
        </div>
      </div>

      <Steps />
      <VanAndScope vanTitle={ES_HUB.vanTitle} className="bg-fog" />

      <Section className="bg-bone">
        <SectionHead
          eyebrow="Área de servicio"
          title={ES_HUB.areaTitle}
          lede={ES_HUB.areaLede}
        />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ES_CITY_PAGES.map((city) => (
            <li key={city.slug}>
              <Link
                to={city.path}
                className="card-hover group flex min-h-[64px] items-center justify-between gap-3 px-5 py-4"
              >
                <span>
                  <span className="block font-display text-[1.0625rem] font-bold text-ink group-hover:text-drop">
                    {city.name}
                  </span>
                  <span className="block text-xs text-smoke">
                    Instalación móvil · condado de {city.county}
                  </span>
                </span>
                <ArrowRight size={16} aria-hidden className="shrink-0 text-drop" />
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-10 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:items-start">
          <div>
            <h3 className="h3">¿Su ciudad no está? Verifique su código postal</h3>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-smoke">
              {ES_HUB.zipNote}
            </p>
          </div>
          <ZipCheck lang="es" />
        </div>
      </Section>

      <Roadside
        title={ES_HUB.roadsideTitle}
        lede={ES_HUB.roadsideLede}
        className="bg-fog"
      />

      <Section className="bg-bone">
        <SectionHead eyebrow="Preguntas" title="Antes de reservar" />
        <Accordion items={ES_HUB.faq} />
      </Section>

      <Cta title={ES_HUB.ctaTitle} body={ES_HUB.ctaBody} />
    </>
  );
}

function NotFoundPanel() {
  return (
    <>
      <Seo
        title="Página no encontrada"
        description="Esa página no existe. Vea las ciudades donde la camioneta instala llantas."
        noindex
      />
      <Section className="bg-fog">
        <EmptyState
          icon={SearchX}
          as="h1"
          title="No encontramos esa página"
          lede="Es posible que el enlace esté desactualizado. La página de instalación móvil revisa cualquier código postal."
          action={
            <Link to={ES_HUB_PATH} className="btn-primary btn-sm">
              Instalación móvil
              <ArrowRight size={16} aria-hidden />
            </Link>
          }
        />
      </Section>
    </>
  );
}

function City() {
  const { city: slug } = useParams();
  const city = getEsCityPage(slug);
  if (!city) return <NotFoundPanel />;

  return (
    <>
      <Head page={city} path={city.path} />
      <Breadcrumbs
        lang="es"
        trail={[
          { label: ES_HUB.crumb, to: ES_HUB_PATH },
          { label: city.name },
        ]}
      />

      <PageHero
        eyebrow={city.eyebrow}
        title={city.h1}
        lede={city.intro}
        lead={<MobilePriceStrip lang="es" place={city.name} county={city.county} />}
      >
        <EnglishLink path={city.path} />
      </PageHero>

      <Steps />

      <Section className="bg-fog">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:gap-14">
          <div>
            <SectionHead eyebrow="Área de servicio" title={city.whereTitle} />
            <div className="-mt-2 space-y-4 text-[15px] leading-relaxed text-ink md:-mt-6">
              {city.whereWeWork.map((p) => (
                <p key={p.slice(0, 40)}>{p}</p>
              ))}
            </div>
          </div>
          <div className="space-y-5 self-start">
            <ZipCheck lang="es" label={SHARED.zipLabel} />
            <p className="flex items-start gap-2 text-sm leading-relaxed text-smoke">
              <Truck size={16} aria-hidden className="mt-0.5 shrink-0 text-drop" />
              <span>{city.route}</span>
            </p>
            <p className="flex items-start gap-2 text-sm leading-relaxed text-smoke">
              <Store size={16} aria-hidden className="mt-0.5 shrink-0 text-drop" />
              <span>
                {SHARED.shopAddress} {SHARED.shopLine}{" "}
                <Link to="/install" className="text-drop underline hover:text-dive">
                  Envío a la tienda (en inglés)
                </Link>
              </span>
            </p>
          </div>
        </div>
      </Section>

      <Section className="bg-bone">
        <SectionHead eyebrow="Antes de la visita" title={city.beforeTitle} />
        <div className="-mt-2 max-w-3xl text-[15px] leading-relaxed text-ink md:-mt-6">
          <p>{city.beforeLede}</p>
          <ul className="mt-4 space-y-3">
            {city.beforePoints.map((line) => (
              <li key={line.slice(0, 40)} className="flex items-start gap-3">
                <Check size={18} aria-hidden className="mt-0.5 shrink-0 text-drop" />
                {line}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section className="bg-fog">
        <SectionHead eyebrow="Notas locales" title={city.notesTitle} />
        <div className="-mt-2 max-w-3xl space-y-4 text-[15px] leading-relaxed text-ink md:-mt-6">
          {city.notes.map((p) => (
            <p key={p.slice(0, 40)}>{p}</p>
          ))}
        </div>
      </Section>

      <Roadside
        title={city.roadsideTitle}
        lede={city.roadsideLede}
        className="bg-bone"
      />
      <VanAndScope
        vanTitle={city.vanTitle}
        scopeTitle={city.scopeTitle}
        className="bg-fog"
      />

      <Section className="bg-bone">
        <SectionHead eyebrow="Preguntas" title={city.faqTitle} />
        <Accordion items={city.faq} />
      </Section>

      <Cta title={city.ctaTitle} body={SHARED.ctaBody} />

      <Section className="bg-bone">
        <ul className="flex flex-wrap gap-2.5">
          <li>
            <Link to={ES_HUB_PATH} className="btn-outline btn-sm">
              Todas las zonas de servicio
              <ArrowRight size={14} aria-hidden />
            </Link>
          </li>
        </ul>
      </Section>
    </>
  );
}

/**
 * The two Spanish test pages: /es/instalacion-movil (kind "hub") and
 * /es/instalacion-movil/:city (kind "city"). Built from the same blocks and
 * the same data as the English mobile pages (the price strip, the ZIP check,
 * the shop's hours, the service catalog); only the words are Spanish
 * (src/data/spanishPages.js). Lean on purpose: this is a small test. While
 * SPANISH_PAGES_INDEXABLE is false (src/data/spanishRoutes.js) both pages
 * say noindex.
 */
export default function SpanishMobilePage({ kind }) {
  return kind === "hub" ? <Hub /> : <City />;
}
