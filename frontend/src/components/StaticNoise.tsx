// Campo de ruido ESTÁTICO del hero: un solo elemento con un SVG (≈110 glifos) que ya viene en el HTML.
// Hace dos trabajos: el primer viewport nunca se ve «frío» mientras Three.js se carga aparte, y es el
// equivalente quieto de las partículas cuando el visitante pide menos movimiento. En cuanto el canvas
// vivo monta, este campo se desvanece (ver .noise-live en globals.css).

// Sin «\» ni «"»: dentro de url("...") en CSS romperían la cadena.
const GLYPHS = "01{}[]<>/|#%&@$*+=-_:;.,?!ABCDEFGHJKMNPRSTUVWXYZ";
const W = 1000;
const H = 640;
const N = 110;

const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

function buildSvg() {
  const parts: string[] = [];
  for (let i = 0; i < N; i++) {
    const g = GLYPHS[Math.floor(hash(i + 1) * GLYPHS.length)];
    const x = Math.round(hash(i + 100) * W);
    const y = Math.round(hash(i + 200) * H);
    const r = hash(i + 300);
    const fill = r > 0.96 ? "%23ff2e88" : r > 0.92 ? "%232ee6ff" : r > 0.83 ? "%23c6ff3d" : "%23cfc9be";
    const size = 10 + Math.round(hash(i + 400) * 12);
    const op = (0.25 + hash(i + 500) * 0.45).toFixed(2);
    const esc = g === "<" ? "&lt;" : g === ">" ? "&gt;" : g === "&" ? "&amp;" : g === "%" ? "%25" : g === "#" ? "%23" : g;
    parts.push(`<text x='${x}' y='${y}' font-size='${size}' fill='${fill}' fill-opacity='${op}'>${esc}</text>`);
  }
  return (
    `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${W} ${H}' ` +
    `preserveAspectRatio='xMidYMid slice' font-family='monospace' font-weight='700'%3E` +
    parts.join("").replace(/</g, "%3C").replace(/>/g, "%3E") +
    `%3C/svg%3E")`
  );
}

const BG = buildSvg();

export function StaticNoise() {
  return (
    <div
      aria-hidden="true"
      className="static-noise pointer-events-none absolute inset-0 z-0"
      style={{ backgroundImage: BG, backgroundSize: "cover", backgroundPosition: "center" }}
    />
  );
}
