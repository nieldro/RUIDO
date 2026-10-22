// Campo de ruido ESTÁTICO del hero: una imagen PNG (≈110 glifos, generada una vez con el mismo diseño que
// las partículas) puesta como fondo. Hace dos trabajos: el primer viewport nunca se ve «frío» mientras
// Three.js se carga aparte, y es el equivalente quieto de las partículas cuando el visitante pide menos
// movimiento. En cuanto el canvas vivo monta, este campo se desvanece (ver .noise-live en globals.css).
//
// Antes era un SVG con 110 <text> incrustado en el CSS: en móvil costaba ~1,2 s de layout y ~0,4 s de
// pintado (medido con la CPU 4× más lenta). Como imagen cuesta casi nada.

export function StaticNoise() {
  return (
    <div
      aria-hidden="true"
      className="static-noise pointer-events-none absolute inset-0 z-0"
      style={{ backgroundImage: "url(/static-noise.png)", backgroundSize: "cover", backgroundPosition: "center" }}
    />
  );
}
