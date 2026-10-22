"use client";

import { useLocale } from "@/lib/locale";

/* ---------- Piezas comunes ---------- */

function Card({
  file,
  shape,
  synthetic,
  title,
  text,
  className = "",
  children,
}: {
  file: string;
  shape: string;
  synthetic?: string;
  title: string;
  text: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <article className={`flex min-w-0 flex-col border border-line2 bg-surface ${className}`}>
      <header className="flex items-center justify-between gap-4 border-b border-line2 bg-bg px-4 py-2 text-xs">
        <p className="min-w-0 truncate text-fg2">
          {file} <span className="text-mute">· {shape}</span>
        </p>
        {synthetic && <p className="shrink-0 border border-line2 px-1.5 text-mute">{synthetic}</p>}
      </header>
      <div className="flex flex-1 flex-col gap-6 p-5 sm:p-7">
        <div>
          <h3 className="display text-[clamp(2rem,3.6vw,3.25rem)]">{title}</h3>
          <p className="mt-3 max-w-[56ch] text-[0.9375rem] text-fg2">{text}</p>
        </div>
        <div className="mt-auto">{children}</div>
      </div>
    </article>
  );
}

/** Conector vertical con punta de flecha dibujada con bordes. */
function Connector() {
  return (
    <div aria-hidden="true" className="flex flex-col items-center">
      <div className="h-4 w-px bg-line2" />
      <div className="h-0 w-0 border-x-[5px] border-t-[7px] border-x-transparent border-t-line2" />
    </div>
  );
}

function Node({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <div
      className={`border px-3 py-2 text-center text-sm ${
        accent ? "border-acid text-fg" : "border-line2 text-fg2"
      }`}
    >
      {children}
    </div>
  );
}

/* ---------- a) El indicador que mentía ---------- */

// Datos sintéticos que representan el problema (índice, base 100). No son datos de ninguna empresa.
const REAL = [92, 98, 101, 95, 104, 99, 103, 100];
const REPORTED = [236, 255, 248, 240, 262, 247, 258, 250];

function IndicatorChart({ reported, real, axis }: { reported: string; real: string; axis: string }) {
  const W = 480;
  const H = 220;
  const pad = { l: 36, r: 8, t: 10, b: 26 };
  const max = 280;
  const x = (i: number) => pad.l + (i * (W - pad.l - pad.r)) / (REAL.length - 1);
  const y = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  const line = (a: number[]) => a.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${reported}: ~250. ${real}: ~100.`}
        className="h-auto w-full"
      >
        {[0, 100, 250].map((g) => (
          <g key={g}>
            <line x1={pad.l} x2={W - pad.r} y1={y(g)} y2={y(g)} stroke="var(--line-2)" strokeWidth="1" />
            <text x={pad.l - 6} y={y(g) + 4} textAnchor="end" fontSize="11" fill="var(--mute)">
              {g}
            </text>
          </g>
        ))}
        <path d={line(REPORTED)} fill="none" stroke="var(--fg-2)" strokeWidth="2" strokeDasharray="5 4" />
        <path d={line(REAL)} fill="none" stroke="var(--acid)" strokeWidth="3" />
        <text x={W - pad.r} y={y(250) - 8} textAnchor="end" fontSize="12" fill="var(--fg-2)">
          {reported} ×2.5
        </text>
        <text x={W - pad.r} y={y(100) - 8} textAnchor="end" fontSize="12" fill="var(--acid)">
          {real} ×1
        </text>
        <text x={pad.l} y={H - 6} fontSize="11" fill="var(--mute)">
          {axis}
        </text>
      </svg>
    </div>
  );
}

function CsvPreview({ cols }: { cols: string[] }) {
  return (
    <div className="mt-5 overflow-x-auto border border-line2 bg-bg text-xs">
      <table className="w-full min-w-[18rem] border-collapse text-left">
        <thead>
          <tr className="text-mute">
            {cols.map((c) => (
              <th key={c} scope="col" className="border-b border-line2 px-3 py-1.5 font-normal">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-fg2">
          {[0, 1, 2].map((i) => (
            <tr key={i}>
              <td className="px-3 py-1">{`P${i + 1}`}</td>
              <td className="px-3 py-1">{REPORTED[i]}</td>
              <td className="px-3 py-1">{REAL[i]}</td>
            </tr>
          ))}
          <tr className="text-mute">
            <td className="px-3 py-1" colSpan={3}>
              …
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/* ---------- d) Extractor de facturas ---------- */

// Datos sintéticos.
const INVOICES = [
  ["FAC-0410", "2025-03-14", "$980.000"],
  ["FAC-0411", "2025-03-15", "$2.140.000"],
  ["FAC-0412", "2025-03-18", "$1.250.000"],
];

function InvoiceDemo({ pdf, xlsx, cols }: { pdf: string; xlsx: string; cols: string[] }) {
  const hit = "bg-acid text-bg px-0.5";
  return (
    <div className="grid items-stretch gap-3 sm:grid-cols-[1fr_auto_1.1fr] sm:gap-4">
      <div className="border border-line2 bg-bg p-3 text-xs leading-relaxed text-mute">
        <p className="mb-2 text-fg2">{pdf}</p>
        <p>
          FACTURA N.º <span className={hit}>FAC-0412</span>
        </p>
        <p>
          Fecha: <span className={hit}>2025-03-18</span>
        </p>
        <p>Cliente: ········</p>
        <p>
          Total: <span className={hit}>$1.250.000</span>
        </p>
      </div>

      <div aria-hidden="true" className="flex items-center justify-center text-mute sm:flex-col">
        <div className="h-px w-6 bg-line2 sm:h-6 sm:w-px sm:rotate-0" />
        <div className="h-0 w-0 rotate-90 border-x-[5px] border-t-[7px] border-x-transparent border-t-line2 sm:-rotate-90" />
      </div>

      <div className="overflow-x-auto border border-line2 bg-bg text-xs">
        <p className="border-b border-line2 px-3 py-1.5 text-fg2">{xlsx}</p>
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="text-mute">
              {cols.map((c) => (
                <th key={c} scope="col" className="px-3 py-1 font-normal">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-fg2">
            {INVOICES.map((r, i) => (
              <tr key={r[0]} className={i === INVOICES.length - 1 ? "text-fg" : ""}>
                {r.map((c) => (
                  <td key={c} className="whitespace-nowrap px-3 py-1">
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- Sección ---------- */

export function Modelo() {
  const { t } = useLocale();
  const m = t.modelo;
  const c = m.cards;

  return (
    <section
      id="modelo"
      data-section="modelo"
      aria-labelledby="modelo-title"
      className="border-t border-line py-20 sm:py-32"
    >
      <div className="container-x">
        <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:gap-20">
          <h2 id="modelo-title" className="display h-section">
            {m.title}
          </h2>
          <p className="max-w-[48ch] self-end text-fg2">{m.intro}</p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:mt-20 lg:grid-cols-12 lg:gap-6">
          {/* a) El indicador que mentía — ancho, el caso estrella */}
          <Card
            className="lg:col-span-7"
            file={c.indicador.file}
            shape={c.indicador.shape}
            synthetic={m.synthetic}
            title={c.indicador.title}
            text={c.indicador.text}
          >
            <IndicatorChart reported={c.indicador.reported} real={c.indicador.real} axis={c.indicador.axis} />
            <CsvPreview cols={[c.indicador.axis, c.indicador.reported, c.indicador.real]} />
            <p className="mt-3 text-xs text-mute">{m.syntheticNote}</p>
          </Card>

          {/* b) Pipeline multi-fuente */}
          <Card
            className="lg:col-span-5"
            file={c.pipeline.file}
            shape={c.pipeline.shape}
            title={c.pipeline.title}
            text={c.pipeline.text}
          >
            <div className="mx-auto max-w-sm">
              <div className="grid gap-2">
                {c.pipeline.sources.map((s) => (
                  <Node key={s}>{s}</Node>
                ))}
              </div>
              <Connector />
              <Node accent>{c.pipeline.etl}</Node>
              <Connector />
              <Node>{c.pipeline.db}</Node>
              <Connector />
              <Node accent>{c.pipeline.bi}</Node>
            </div>
          </Card>

          {/* c) Chatbot */}
          <Card
            className="lg:col-span-5"
            file={c.chatbot.file}
            shape={c.chatbot.shape}
            title={c.chatbot.title}
            text={c.chatbot.text}
          >
            <ol className="relative ml-2 border-l border-line2 pl-6">
              {c.chatbot.nodes.map((n, i) => {
                const branch = i === 2;
                return (
                  <li key={n} className={`relative py-2 ${branch ? "ml-6" : ""}`}>
                    <span
                      aria-hidden="true"
                      className={`absolute top-1/2 size-2.5 -translate-y-1/2 ${
                        branch ? "-left-[2.4rem]" : "-left-[1.7rem]"
                      } ${i === 3 ? "bg-acid" : "bg-line2"}`}
                    />
                    {branch && (
                      <span aria-hidden="true" className="absolute top-1/2 -left-[2rem] h-px w-8 bg-line2" />
                    )}
                    <span className={i === 3 ? "text-fg" : "text-fg2"}>{n}</span>
                  </li>
                );
              })}
            </ol>
          </Card>

          {/* d) Extractor de facturas — demo PDF → tabla */}
          <Card
            className="lg:col-span-7"
            file={c.facturas.file}
            shape={c.facturas.shape}
            synthetic={m.synthetic}
            title={c.facturas.title}
            text={c.facturas.text}
          >
            <InvoiceDemo pdf={c.facturas.pdfLabel} xlsx={c.facturas.xlsxLabel} cols={c.facturas.cols} />
          </Card>

          {/* e) Dashboard E-commerce — franja a todo el ancho */}
          <Card
            className="lg:col-span-12"
            file={c.ecommerce.file}
            shape={c.ecommerce.shape}
            title={c.ecommerce.title}
            text={c.ecommerce.text}
          >
            <ol className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
              {c.ecommerce.chain.map((s, i, arr) => (
                <li key={s} className="flex items-center gap-3">
                  <span
                    className={`border px-3 py-2 ${i === arr.length - 1 ? "border-acid text-fg" : "border-line2 text-fg2"}`}
                  >
                    {s}
                  </span>
                  {i < arr.length - 1 && (
                    <span aria-hidden="true" className="h-px w-6 bg-line2 sm:w-10" />
                  )}
                </li>
              ))}
            </ol>
            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
              <ul aria-hidden="true" className="flex gap-1 sm:gap-1.5">
                {Array.from({ length: 13 }).map((_, i) => (
                  <li
                    key={i}
                    className={`size-3.5 border sm:size-4 ${i === 12 ? "border-acid bg-acid" : "border-line2"}`}
                  />
                ))}
              </ul>
              <p className="text-sm text-fg2">{c.ecommerce.kpis}</p>
            </div>
          </Card>
        </div>

        <div className="mt-8 flex flex-col gap-1 border-t border-line pt-6 text-sm sm:flex-row sm:items-baseline sm:gap-6">
          <p className="text-mute">{m.freelance.file}</p>
          <p className="text-fg">{m.freelance.title}</p>
          <p className="text-fg2">{m.freelance.text}</p>
        </div>
        <p className="mt-4 text-xs text-mute">{m.linkPlaceholder}</p>
      </div>
    </section>
  );
}
