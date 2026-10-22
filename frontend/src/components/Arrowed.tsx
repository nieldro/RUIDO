import { Fragment } from "react";

/** Flecha dibujada en SVG con el grosor de Anton; la fuente no trae «→» y caía a una fuente de respaldo. */
export function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 40 24"
      className={`inline-block h-[0.62em] w-[1.05em] align-[0.08em] ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="5"
      strokeLinecap="butt"
      strokeLinejoin="miter"
    >
      <path d="M0 12H34" />
      <path d="M24 2L36 12L24 22" />
    </svg>
  );
}

/** Reemplaza cada «→» del texto por la flecha SVG, con un espacio fino a cada lado. */
export function Arrowed({ text }: { text: string }) {
  const parts = text.split("→");
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {i > 0 && <Arrow className="mx-[0.12em]" />}
          {part.trim() ? (i > 0 ? part.replace(/^\s+/, "") : part.replace(/\s+$/, "")) : null}
        </Fragment>
      ))}
    </>
  );
}
