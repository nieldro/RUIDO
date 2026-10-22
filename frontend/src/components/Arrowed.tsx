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

const NUM = /(\d+(?:[.,]\d+)?)/g;

/** Texto con cada número envuelto en <span data-num> para poder animarlo (contador ruido → señal). */
function Numbers({ text }: { text: string }) {
  return (
    <>
      {text.split(NUM).map((piece, i) =>
        i % 2 === 1 ? (
          <span key={i} data-num data-text={piece}>
            {piece}
          </span>
        ) : (
          <Fragment key={i}>{piece}</Fragment>
        ),
      )}
    </>
  );
}

/**
 * Reemplaza cada «→» del texto por la flecha SVG. La flecha se pega a la palabra anterior
 * (nowrap) para que nunca quede huérfana al inicio de una línea. Con `numbers`, los números
 * quedan marcados con data-num para animarlos.
 */
export function Arrowed({ text, numbers = false }: { text: string; numbers?: boolean }) {
  const parts = text.split("→").map((p) => p.trim());
  const render = (s: string) => (numbers ? <Numbers text={s} /> : s);
  return (
    <>
      {parts.map((part, i) => {
        const last = i === parts.length - 1;
        const words = part.split(" ");
        const tail = words.pop() ?? "";
        const head = words.join(" ");
        return (
          <Fragment key={i}>
            {head && <>{render(head)} </>}
            <span className="whitespace-nowrap">
              {render(tail)}
              {!last && <Arrow className="mx-[0.12em]" />}
            </span>
            {!last && " "}
          </Fragment>
        );
      })}
    </>
  );
}
