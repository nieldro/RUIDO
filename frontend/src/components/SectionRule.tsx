/** Línea de acento en el borde superior de una sección; ScrollFx la dibuja de izquierda a derecha al entrar. */
export function SectionRule({ ink = false }: { ink?: boolean }) {
  return (
    <span
      aria-hidden="true"
      data-rule
      className={`pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5 origin-left ${ink ? "bg-ink" : "bg-acid"}`}
    />
  );
}
