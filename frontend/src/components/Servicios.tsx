"use client";

import { useId, useState } from "react";
import services from "@/content/services.json";
import { useLocale, type Locale } from "@/lib/locale";

type Currency = "COP" | "USD";
type L10n = { es: string; en: string };
type Item = (typeof services.items)[number];

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
  onToggle,
  onQuote,
}: {
  item: Item;
  currency: Currency;
  open: boolean;
  onToggle: () => void;
  onQuote: () => void;
}) {
  const { locale, t } = useLocale();
  const s = t.servicios;
  const panelId = useId();
  const price = formatPrice(item.price, currency, locale, s.quote);

  return (
    <li className="border-t border-line">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="grid w-full gap-x-6 gap-y-1 px-0 py-5 text-left hover:bg-surface md:grid-cols-[7rem_minmax(0,1fr)_15rem_8rem] md:items-baseline md:px-3"
        >
          <span className="text-xs text-mute md:text-sm">{pick(item.category, locale)}</span>
          <span className="text-fg">{pick(item.name, locale)}</span>
          <span className="display text-2xl leading-none md:whitespace-nowrap md:text-right md:text-[1.75rem]">
            {price}
            {item.price !== null && item.priceSuffix && (
              <span className="ml-2 font-[family-name:var(--font-mono)] text-xs normal-case text-mute">
                {pick(item.priceSuffix, locale)}
              </span>
            )}
          </span>
          <span className="text-sm text-fg2 md:text-right">{pick(item.delivery, locale)}</span>
        </button>
      </h3>

      {open && (
        <div id={panelId} className="grid gap-8 border-t border-line bg-surface px-4 py-6 md:grid-cols-3 md:px-6">
          <div>
            <h4 className="mb-2 text-xs text-mute">{s.includes}</h4>
            <ul className="space-y-1 text-sm text-fg2">
              {item.includes[locale].map((x) => (
                <li key={x}>+ {x}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-2 text-xs text-mute">{s.excludes}</h4>
            <ul className="space-y-1 text-sm text-fg2">
              {item.excludes[locale].map((x) => (
                <li key={x}>– {x}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-2 text-xs text-mute">{s.example}</h4>
            <p className="text-sm text-fg2">{item.example ? pick(item.example, locale) : s.noExample}</p>
            <button
              type="button"
              onClick={onQuote}
              className="mt-5 min-h-11 bg-acid px-5 font-bold text-bg hover:bg-fg"
            >
              {s.cta}
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

type Status = "idle" | "sending" | "ok" | "error";

function QuoteForm({ serviceId, onServiceChange }: { serviceId: string; onServiceChange: (id: string) => void }) {
  const { locale, t } = useLocale();
  const s = t.servicios;
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<{ service?: boolean; contact?: boolean }>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const service = String(data.get("service") ?? "");
    const contact = String(data.get("contact") ?? "").trim();
    const next = { service: !service, contact: !contact };
    setErrors(next);
    if (next.service || next.contact) return;

    const base = process.env.NEXT_PUBLIC_API_URL;
    if (!base) {
      setStatus("error");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch(`${base}/api/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service,
          budget: String(data.get("budget") ?? ""),
          deadline: String(data.get("deadline") ?? ""),
          contact,
          message: String(data.get("message") ?? ""),
          lang: locale,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("ok");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  const field = "mt-1.5 block min-h-11 w-full border border-line2 bg-bg px-3 py-2";
  const label = "block text-sm text-fg2";

  return (
    <form onSubmit={onSubmit} noValidate className="border border-line2 bg-surface p-5 sm:p-8">
      <h3 className="display text-[clamp(2rem,3.6vw,3.25rem)]">{s.formTitle}</h3>
      <p className="mt-3 max-w-[60ch] text-sm text-fg2">{s.formIntro}</p>
      <p className="mt-2 text-xs text-mute">{s.formN8nPlaceholder}</p>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <label htmlFor="q-service" className={label}>
            {s.fService}
          </label>
          <select
            id="q-service"
            name="service"
            value={serviceId}
            onChange={(e) => onServiceChange(e.target.value)}
            aria-invalid={errors.service || undefined}
            aria-describedby={errors.service ? "q-service-err" : undefined}
            className={field}
          >
            <option value="">{s.choose}</option>
            {services.items.map((it) => (
              <option key={it.id} value={it.id}>
                {pick(it.name, locale)}
              </option>
            ))}
          </select>
          {errors.service && (
            <p id="q-service-err" className="mt-1 text-xs font-bold text-fg">
              {s.required}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="q-budget" className={label}>
            {s.fBudget}
          </label>
          <input id="q-budget" name="budget" type="text" autoComplete="off" className={field} />
        </div>
        <div>
          <label htmlFor="q-deadline" className={label}>
            {s.fDeadline}
          </label>
          <input id="q-deadline" name="deadline" type="text" autoComplete="off" className={field} />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="q-contact" className={label}>
            {s.fContact} <span className="text-mute">· {s.fContactHint}</span>
          </label>
          <input
            id="q-contact"
            name="contact"
            type="text"
            autoComplete="email"
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

        <div className="md:col-span-2">
          <label htmlFor="q-message" className={label}>
            {s.fMessage}
          </label>
          <textarea id="q-message" name="message" rows={3} className={`${field} resize-y`} />
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
          {status === "ok" && <span className="text-acid">{s.ok}</span>}
          {status === "error" && <span className="font-bold text-fg">{s.error}</span>}
        </p>
      </div>
    </form>
  );
}

export function Servicios() {
  const { t } = useLocale();
  const s = t.servicios;
  const [currency, setCurrency] = useState<Currency>("COP");
  const [openId, setOpenId] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState("");

  function quote(id: string) {
    setServiceId(id);
    document.getElementById("cotizar")?.scrollIntoView({ block: "center" });
  }

  return (
    <section
      id="servicios"
      data-section="servicios"
      aria-labelledby="servicios-title"
      className="border-t border-line py-20 sm:py-32"
    >
      <div className="container-x">
        <h2 id="servicios-title" className="display h-section max-w-[16ch]">
          {s.title}
        </h2>

        <div className="mt-12 flex flex-wrap items-end justify-between gap-6 sm:mt-16">
          <p className="text-sm text-fg2 sm:text-base">
            <span className="text-acid" aria-hidden="true">
              &gt;{" "}
            </span>
            <code>{s.query}</code>
          </p>
          <div role="group" aria-label={s.currency} className="flex items-center gap-1 text-xs">
            {(["COP", "USD"] as const).map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={currency === c}
                onClick={() => setCurrency(c)}
                className={`min-h-9 min-w-12 px-2 ${currency === c ? "bg-acid text-bg" : "text-mute hover:text-fg"}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div
          aria-hidden="true"
          className="mt-8 hidden grid-cols-[7rem_minmax(0,1fr)_15rem_8rem] gap-x-6 border-t border-line2 px-3 pt-3 pb-2 text-xs text-mute md:grid"
        >
          <span>{s.cols.category}</span>
          <span>{s.cols.service}</span>
          <span className="text-right">{s.cols.from}</span>
          <span className="text-right">{s.cols.delivery}</span>
        </div>

        <ul className="border-b border-line md:border-t-0">
          {services.items.map((item) => (
            <ServiceRow
              key={item.id}
              item={item}
              currency={currency}
              open={openId === item.id}
              onToggle={() => setOpenId(openId === item.id ? null : item.id)}
              onQuote={() => quote(item.id)}
            />
          ))}
        </ul>
        <p className="mt-4 text-xs text-mute">{s.refPrice}</p>

        <div id="cotizar" className="mt-16 sm:mt-24">
          <QuoteForm serviceId={serviceId} onServiceChange={setServiceId} />
        </div>
      </div>
    </section>
  );
}
