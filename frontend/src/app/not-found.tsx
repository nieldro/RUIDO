import Link from "next/link";

// 404 con el mismo sistema: ruido al máximo y una salida clara hacia la señal.
export default function NotFound() {
  return (
    <main className="relative flex min-h-svh flex-col justify-between overflow-hidden py-10">
      <div className="container-x flex items-center justify-between text-xs sm:text-sm">
        <Link href="/" className="font-bold tracking-wider no-underline">
          ALEJO.DATA
        </Link>
        <p className="tabular-nums">
          [ RUIDO <span className="text-acid">100%</span> ]
        </p>
      </div>

      <div className="container-x">
        <h1 className="display whitespace-nowrap text-[clamp(5rem,32vw,34rem)] leading-[0.82]">404</h1>
        <div className="mt-8 grid gap-6 border-t border-line pt-6 md:grid-cols-2 md:gap-16">
          <div>
            <p className="max-w-[34ch] text-xl leading-snug sm:text-2xl">Esta ruta no existe. Vuelve a la señal.</p>
            <p className="mt-3 max-w-[34ch] text-mute">This route doesn&apos;t exist. Back to the signal.</p>
          </div>
          <p className="self-end">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center bg-acid px-6 font-bold text-bg no-underline transition-colors duration-150 ease-out hover:bg-fg"
            >
              Volver al inicio / Home
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
