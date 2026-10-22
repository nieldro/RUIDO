"use client";

import { useId, useRef, useState } from "react";
import services from "@/content/services.json";
import { useLocale, type Locale } from "@/lib/locale";
import { MOTION_OK, gsap, prefersReducedMotion, useGSAP, whenIdle } from "@/lib/motion";
import { API_URL, apiEnabled } from "@/lib/api";
import { scrollToEl } from "@/lib/scrollState";

type Currency = "COP" | "USD";
type L10n = { es: string; en: string };
type Item = (typeof services.items)[number];

const COLS = "md:grid-cols-[minmax(0,1fr)_13rem_9rem_7rem]";

function pick(v: L10n, locale: Locale) {
  return v[locale];
}

function formatPrice(price: number | null, currency: Currency, locale: Locale, quote: string) {
  if (price === null) return quote;
  if (currency === "COP") {
    return new Intl.NumberFormat(locale === "es" ? "es-CO" : "en-US", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(price);
  }
  // Tasa de referencia de services.json, redondeada a múltiplos de 5.
  const usd = Math.round(price / services.copPerUsd / 5) * 5;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(usd);
}

function ServiceRow({
  item,
  currency,
  open,
  mounted,
  onToggle,
  onQuote,
}: {
  item: Item;
  currency: Currency;
  open: boolean;
  /** El detalle se monta la primera vez que se abre (11 paneles ocultos eran ~250 nodos al cargar). */
  mounted: boolean;
  onToggle: () => void;
  onQuote: () => void;
}) {
  const { locale, t } = useLocale();
  const s = t.servicios;
  const panelId = useId();
  const hasPrice = item.price !== null;
  const price = formatPrice(item.price, currency, locale, s.quote);

  return (
    <li data-row className="border-t border-line">
      <h4>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          data-no-press
          className={`grid w-full gap-x-6 gap-y-3 px-0 py-5 text-left transition-colors duration-150 ease-out hover:bg-surface md:items-baseline md:px-3 ${COLS}`}
        >
          {/* Lo primero es qué recibes, en palabras llanas; el término técnico queda debajo para quien lo busca. */}
          <span>
            <span className="block text-base leading-snug text-fg sm:text-lg">{pick(item.name, locale)}</span>
            <span className="mt-1 block text-xs text-mute">{pick(item.tech, locale)}</span>
          </span>

          {/* En móvil: «desde $ 900.000 COP · 1 semana» en una línea. En escritorio, cada dato en su columna. */}
          <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1 md:contents">
            <span
              className={
                hasPrice
                  ? "display text-xl leading-none md:text-right md:text-2xl"
                  : "text-sm leading-snug text-fg md:text-right"
              }
            >
              <span className="sr-only">{s.cols.from}: </span>
              {hasPrice && (
                <span className="mr-2 font-[family-name:var(--font-mono)] text-xs normal-case text-mute md:hidden">
                  {s.cols.from}
                </span>
              )}
              {price}
              {hasPrice && currency === "COP" && (
                <span className="ml-1 font-[family-name:var(--font-mono)] text-xs normal-case text-mute md:hidden">
                  COP
                </span>
              )}
              {hasPrice && item.priceSuffix && (
                <span className="ml-2 font-[family-name:var(--font-mono)] text-xs normal-case text-mute md:whitespace-nowrap">
                  {pick(item.priceSuffix, locale)}
                </span>
              )}
            </span>
            <span className="text-sm text-fg2 md:text-right">
              <span className="sr-only">{s.cols.delivery}: </span>
              <span aria-hidden="true" className="mr-3 text-mute md:hidden">
                ·
              </span>
              {pick(item.delivery, locale)}
            </span>
            <span aria-hidden="true" className="ml-auto flex items-center justify-end gap-2 md:ml-0">
              <span className="hidden text-xs text-mute sm:inline">{open ? "" : s.details}</span>
              <span className="text-lg leading-none text-acid">{open ? "–" : "+"}</span>
            </span>
          </span>
        </button>
      </h4>

      {/* Se expande con grid-template-rows (0fr → 1fr): entra en 220 ms y sale más rápido, en 160 ms. */}
      <div
        id={panelId}
        aria-hidden={!open}
        inert={!open}
        className={`grid transition-[grid-template-rows,opacity,visibility] ease-[var(--ease-out)] ${
          open ? "visible grid-rows-[1fr] opacity-100 duration-[220ms]" : "invisible grid-rows-[0fr] opacity-0 duration-[160ms]"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          {mounted && (
          <div className="grid gap-8 border-t border-line bg-surface px-4 py-6 md:grid-cols-3 md:px-6">
            <div>
              <h5 className="mb-2 text-xs text-mute">{s.includes}</h5>
              <ul className="space-y-1 text-sm text-fg2">
                {item.includes[locale].map((x) => (
                  <li key={x}>+ {x}</li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="mb-2 text-xs text-mute">{s.excludes}</h5>
              <ul className="space-y-1 text-sm text-fg2">
                {item.excludes[locale].map((x) => (
                  <li key={x}>– {x}</li>
                ))}
              </ul>
              {item.recurring && <p className="mt-3 text-sm text-fg">{s.recurring}</p>}
            </div>
            <div className="flex flex-col items-start">
              {item.example && (
                <>
                  <h5 className="mb-2 text-xs text-mute">{s.example}</h5>
                  <p className="text-sm text-fg2">{pick(item.example, locale)}</p>
                </>
              )}
              <button
                type="button"
                onClick={onQuote}
                className={`min-h-11 bg-acid px-5 font-bold text-bg hover:bg-fg ${item.example ? "mt-5" : ""}`}
              >
                {s.cta}
              </button>
            </div>
          </div>
          )}
        </div>
      </div>
    </li>
  );
}

type Status = "idle" | "sending" | "ok" | "mail" | "error";

function QuoteForm({
  serviceId,
  onServiceChange,
}: {
  serviceId: string;
  onServiceChange: (id: string) => void;
}) {
  const { locale, t } = useLocale();
  const s = t.servicios;
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<{ service?: boolean; contact?: boolean }>({});
  const [changing, setChanging] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const chosen = services.items.find((it) => it.id === serviceId);
  const chosenName = serviceId === "unsure" ? s.unsureOption : chosen ? pick(chosen.name, locale) : "";
  const showSelect = !serviceId || changing;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const service = String(data.get("service") ?? "") || serviceId;
    const contact = String(data.get("contact") ?? "").trim();
    const next = { service: !service, contact: !contact };
    setErrors(next);
    if (next.service || next.contact) {
      // Lleva el foco al primer dato que falta.
      const first = next.service ? "q-service" : "q-contact";
      (form.querySelector(`#${first}`) as HTMLElement | null)?.focus();
      return;
    }
    const payload = {
      service,
      budget: String(data.get("budget") ?? ""),
      deadline: String(data.get("deadline") ?? ""),
      contact,
      message: String(data.get("message") ?? ""),
      lang: locale,
    };

    // Sin backend, el formulario sigue siendo útil: abre el correo con todo ya escrito.
    if (!apiEnabled) {
      const subject = `${locale === "es" ? "Cotización" : "Quote"}: ${chosenName || service}`;
      const body = [
        `${s.fService}: ${chosenName || service}`,
        `${s.fContact} ${payload.contact}`,
        payload.message && `${s.fMessage}: ${payload.message}`,
        payload.budget && `${s.fBudget} ${payload.budget}`,
        payload.deadline && `${s.fDeadline} ${payload.deadline}`,
      ]
        .filter(Boolean)
        .join("\n");
      window.location.href = `mailto:${t.senal.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      setStatus("mail");
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch(`${API_URL}/api/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("ok");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  const field =
    "mt-1.5 block min-h-11 w-full border border-line2 bg-bg px-3 py-2 transition-colors duration-150 ease-out focus:border-acid focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2";
  const label = "block text-sm text-fg2";
  const hint = "text-mute";

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="border border-line2 bg-surface p-5 sm:p-8">
      <h3 id="cotizar-title" tabIndex={-1} className="display text-[clamp(2rem,3.6vw,3.25rem)] outline-none">
        {s.formTitle}
      </h3>
      <p className="mt-3 max-w-[60ch] text-fg2">{s.formIntro}</p>
      {process.env.NEXT_PUBLIC_N8N_ENABLED === "true" && <p className="mt-2 text-xs text-mute">{s.n8nNote}</p>}

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          {showSelect ? (
            <>
              <label htmlFor="q-service" className={label}>
                {s.fService}
              </label>
              <select
                id="q-service"
                name="service"
                value={serviceId}
                onChange={(e) => {
                  onServiceChange(e.target.value);
                  if (e.target.value) setChanging(false);
                }}
                aria-invalid={errors.service || undefined}
                aria-describedby={errors.service ? "q-service-err" : undefined}
                className={field}
              >
                <option value="">{s.choose}</option>
                <option value="unsure">{s.unsureOption}</option>
                {services.groups.map((g) => (
                  <optgroup key={g.id} label={pick(g.name, locale)}>
                    {services.items
                      .filter((it) => it.group === g.id)
                      .map((it) => (
                        <option key={it.id} value={it.id}>
                          {pick(it.tech, locale)}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
              {errors.service && (
                <p id="q-service-err" className="mt-1 text-xs font-bold text-fg">
                  {s.required}
                </p>
              )}
            </>
          ) : (
            <>
              <input type="hidden" name="service" value={serviceId} />
              <p className="text-sm text-fg2">
                {s.quoting} <strong className="font-bold text-fg">{chosenName}</strong>{" "}
                <button
                  type="button"
                  onClick={() => setChanging(true)}
                  className="ml-1 min-h-8 px-2 text-acid underline underline-offset-4 hover:text-fg"
                >
                  {s.change}
                </button>
              </p>
            </>
          )}
        </div>

        <div className="md:col-span-2">
          <label htmlFor="q-message" className={label}>
            {s.fMessage}
          </label>
          <textarea id="q-message" name="message" rows={4} className={`${field} resize-y`} />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="q-contact" className={label}>
            {s.fContact} <span className={hint}>· {s.fContactHint}</span>
          </label>
          <input
            id="q-contact"
            name="contact"
            type="text"
            autoComplete="off"
            aria-invalid={errors.contact || undefined}
            aria-describedby={errors.contact ? "q-contact-err" : undefined}
            className={field}
          />
          {errors.contact && (
            <p id="q-contact-err" className="mt-1 text-xs font-bold text-fg">
              {s.required}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="q-budget" className={label}>
            {s.fBudget}
          </label>
          <input id="q-budget" name="budget" type="text" autoComplete="off" placeholder={s.budgetPh} className={field} />
        </div>
        <div>
          <label htmlFor="q-deadline" className={label}>
            {s.fDeadline}
          </label>
          <input
            id="q-deadline"
            name="deadline"
            type="text"
            autoComplete="off"
            placeholder={s.deadlinePh}
            className={field}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={status === "sending"}
          className="min-h-11 bg-acid px-6 font-bold text-bg hover:bg-fg disabled:bg-line2 disabled:text-mute"
        >
          {status === "sending" ? s.sending : s.send}
        </button>
        <p role="status" className="text-sm">
          {status === "ok" && <span className="fade-in text-acid">{s.ok}</span>}
          {status === "mail" && <span className="fade-in text-acid">{s.okMail}</span>}
          {status === "error" && (
            <span className="fade-in font-bold text-fg">
              {s.error}{" "}
              <a className="underline underline-offset-4" href={`mailto:${t.senal.email}`}>
                {t.senal.email}
              </a>
            </span>
          )}
        </p>
      </div>
    </form>
  );
}

export function Servicios() {
  const { locale, t } = useLocale();
  const s = t.servicios;
  const [currency, setCurrency] = useState<Currency>("COP");
  const [openId, setOpenId] = useState<string | null>(null);
  const [opened, setOpened] = useState<string[]>([]);
  const [serviceId, setServiceId] = useState("");
  const root = useRef<HTMLElement>(null);

  useGSAP(
    (_ctx, contextSafe) => {
      const setup = contextSafe!(() => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        // La consulta "se ejecuta": las filas del resultado aparecen una tras otra, una sola vez.
        gsap.from("[data-row]", {
          opacity: 0,
          y: 10,
          duration: 0.5,
          stagger: 0.055,
          ease: "expo.out",
          scrollTrigger: { trigger: "[data-rows]", start: "top 82%", toggleActions: "play none none none" },
        });
        gsap.from("[data-fx=title]", {
          opacity: 0,
          y: 24,
          duration: 0.9,
          ease: "expo.out",
          scrollTrigger: { trigger: "[data-fx=title]", start: "top 88%", toggleActions: "play none none none" },
        });
      });
      });
      return whenIdle(setup);
    },
    { scope: root, dependencies: [], revertOnUpdate: true },
  );

  /** Lleva al formulario con el servicio ya elegido y deja el foco en su título. */
  function quote(id: string) {
    setServiceId(id);
    const el = document.getElementById("cotizar");
    if (el) scrollToEl(el);
    window.setTimeout(
      () => document.getElementById("cotizar-title")?.focus({ preventScroll: true }),
      prefersReducedMotion() ? 0 : 600,
    );
  }

  const rate = new Intl.NumberFormat(locale === "es" ? "es-CO" : "en-US").format(services.copPerUsd);

  return (
    <section
      ref={root}
      id="servicios"
      data-section="servicios"
      aria-labelledby="servicios-title"
      className="border-t border-line py-20 sm:py-32"
    >
      <div className="container-x">
        <h2 id="servicios-title" data-fx="title" className="display h-section max-w-[16ch]">
          {s.title}
        </h2>

        <div className="mt-12 flex flex-wrap items-end justify-between gap-6 sm:mt-16">
          <p className="text-sm text-fg2 sm:text-base">
            <span className="sr-only">{s.listLabel}</span>
            <span aria-hidden="true">
              <span className="text-acid">&gt; </span>
              <code>{s.query}</code>
            </span>
          </p>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-mute" id="currency-label">
              {s.currencyLabel}
            </span>
            <div role="group" aria-labelledby="currency-label" className="flex items-center gap-1">
              {(["COP", "USD"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={currency === c}
                  onClick={() => setCurrency(c)}
                  className={`min-h-11 min-w-14 px-2 ${currency === c ? "bg-acid text-bg" : "text-mute hover:text-fg"}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div
          aria-hidden="true"
          className={`mt-6 hidden gap-x-6 border-t border-line2 px-3 pt-3 pb-1 text-xs text-mute md:grid ${COLS}`}
        >
          <span />
          <span className="text-right">{s.cols.from}</span>
          <span className="text-right">{s.cols.delivery}</span>
          <span />
        </div>

        <ul data-rows>
          {services.groups.map((g) => (
            <li key={g.id}>
              <h3 className="display mt-14 border-b border-line2 pb-3 text-2xl text-fg first:mt-0 sm:text-3xl">{pick(g.name, locale)}</h3>
              <ul>
                {services.items
                  .filter((it) => it.group === g.id)
                  .map((item) => (
                    <ServiceRow
                      key={item.id}
                      item={item}
                      currency={currency}
                      open={openId === item.id}
                      mounted={opened.includes(item.id)}
                      onToggle={() => {
                        const next = openId === item.id ? null : item.id;
                        setOpenId(next);
                        if (next) setOpened((prev) => (prev.includes(next) ? prev : [...prev, next]));
                      }}
                      onQuote={() => quote(item.id)}
                    />
                  ))}
              </ul>
            </li>
          ))}
        </ul>

        <p className="mt-6 max-w-[70ch] text-sm text-fg2">
          <button
            type="button"
            onClick={() => quote("unsure")}
            className="min-h-11 text-left text-fg underline underline-offset-4 hover:text-acid"
          >
            {s.unsure}
          </button>
        </p>
        <p className="mt-2 max-w-[70ch] text-xs text-mute">
          {s.refPrice}
          {currency === "USD" && <> {s.usdNote.replace("{rate}", rate)}</>}
        </p>

        <div id="cotizar" className="mt-16 scroll-mt-16 sm:mt-24">
          <QuoteForm serviceId={serviceId} onServiceChange={setServiceId} />
        </div>
      </div>
    </section>
  );
}
