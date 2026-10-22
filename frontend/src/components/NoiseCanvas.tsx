"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { scrollState } from "@/lib/scrollState";

/*
 * Un solo canvas fijo. Cada partícula es un carácter (atlas de glifos). `scrollState.s` indica en qué
 * "formación" estamos: 0 caos · 1 columnas de skills · 2 riel · 3 cuadrícula de dataset · 4 heatmap ·
 * 5 paquetes del pipeline · 6 columna ordenada · 7 nada. Entre dos formaciones las partículas viajan
 * con retardo propio (efecto "caen y se apilan") y el ruido (jitter, opacidad) baja con el scroll.
 */

const GLYPHS = "01{}[]<>/\\|#%&@$*+=-_:;.,?!ABCDEFGHJKMNPRSTUVWXYZ".split("");
const GCOLS = 8;
const GROWS = Math.ceil(GLYPHS.length / GCOLS);
const CELL = 64;

const VERT = /* glsl */ `
  attribute float aGlyph;
  attribute float aAlpha;
  attribute float aSize;
  attribute vec3 aColor;
  uniform float uPx;
  varying float vGlyph;
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    vGlyph = aGlyph;
    vAlpha = aAlpha;
    vColor = aColor;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uPx;
  }
`;

const FRAG = /* glsl */ `
  precision mediump float;
  uniform sampler2D uAtlas;
  uniform vec2 uGrid;
  varying float vGlyph;
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    float g = floor(vGlyph + 0.5);
    float col = mod(g, uGrid.x);
    float row = floor(g / uGrid.x);
    vec2 uv = (vec2(col, row) + gl_PointCoord) / uGrid;
    float a = texture2D(uAtlas, uv).a * vAlpha;
    if (a < 0.02) discard;
    gl_FragColor = vec4(vColor, a);
  }
`;

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

type Rect = { left: number; top: number; width: number; height: number };

function makeAtlas(fontFamily: string) {
  const c = document.createElement("canvas");
  c.width = GCOLS * CELL;
  c.height = GROWS * CELL;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${CELL * 0.78}px ${fontFamily}`;
  GLYPHS.forEach((g, i) => {
    ctx.fillText(g, (i % GCOLS) * CELL + CELL / 2, Math.floor(i / GCOLS) * CELL + CELL / 2 + 2);
  });
  const tex = new THREE.CanvasTexture(c);
  tex.flipY = false;
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

function createParticles(count: number) {
  const sim = {
    u0: new Float32Array(count),
    v0: new Float32Array(count),
    u1: new Float32Array(count),
    v1: new Float32Array(count),
    phase: new Float32Array(count),
    delay: new Float32Array(count),
    ox: new Float32Array(count),
    oy: new Float32Array(count),
    vx: new Float32Array(count),
    vy: new Float32Array(count),
  };
  const glyph = new Float32Array(count);
  const sizes = new Float32Array(count);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    sim.u0[i] = hash(i + 1);
    sim.v0[i] = hash(i + 1000);
    sim.u1[i] = hash(i + 2000);
    sim.v1[i] = hash(i + 3000);
    sim.phase[i] = hash(i + 4000) * Math.PI * 2;
    sim.delay[i] = hash(i + 5000);
    glyph[i] = Math.floor(hash(i + 6000) * GLYPHS.length);
    sizes[i] = 11 + hash(i + 7000) * 11;
    // Casi todo en gris cálido; ~9 % acento; ~4 % rosa/cian (el glitch solo vive en efectos).
    const r = hash(i + 8000);
    let c: [number, number, number] = [0xcf / 255, 0xc9 / 255, 0xbe / 255];
    if (r > 0.96) c = [0xff / 255, 0x2e / 255, 0x88 / 255];
    else if (r > 0.92) c = [0x2e / 255, 0xe6 / 255, 0xff / 255];
    else if (r > 0.83) c = [0xc6 / 255, 0xff / 255, 0x3d / 255];
    colors.set(c, i * 3);
  }

  const geometry = new THREE.BufferGeometry();
  const pos = new THREE.BufferAttribute(new Float32Array(count * 3), 3);
  pos.setUsage(THREE.DynamicDrawUsage);
  const alpha = new THREE.BufferAttribute(new Float32Array(count), 1);
  alpha.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute("position", pos);
  geometry.setAttribute("aAlpha", alpha);
  geometry.setAttribute("aGlyph", new THREE.BufferAttribute(glyph, 1));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uAtlas: { value: makeAtlas(getComputedStyle(document.body).fontFamily) },
      uGrid: { value: new THREE.Vector2(GCOLS, GROWS) },
      uPx: { value: 1 },
    },
  });
  return { sim, geometry, material };
}

function Particles({ count }: { count: number }) {
  const { size, gl } = useThree();
  const pointsRef = useRef<THREE.Points>(null);
  const [parts] = useState(() => createParticles(count));
  const simRef = useRef(parts.sim);

  useEffect(() => {
    // Si la fuente aún no cargó al construir el atlas, se rehace al estar lista.
    let alive = true;
    const pts = pointsRef.current;
    document.fonts.ready.then(() => {
      if (!alive || !pts) return;
      const mat = pts.material as THREE.ShaderMaterial;
      const old = mat.uniforms.uAtlas.value as THREE.Texture;
      mat.uniforms.uAtlas.value = makeAtlas(getComputedStyle(document.body).fontFamily);
      old.dispose();
    });
    return () => {
      alive = false;
      if (!pts) return;
      pts.geometry.dispose();
      const mat = pts.material as THREE.ShaderMaterial;
      (mat.uniforms.uAtlas.value as THREE.Texture).dispose();
      mat.dispose();
    };
  }, []);
  // Cachés por frame
  const cols = useRef<Element[]>([]);
  const colRects = useRef<Rect[]>([]);
  const heat = useRef<Rect | null>(null);
  const pipe = useRef<Rect | null>(null);

  useFrame((state) => {
    const pts = pointsRef.current;
    if (!pts) return;
    const geometry = pts.geometry;
    const material = pts.material as THREE.ShaderMaterial;
    const data = simRef.current;
    const st = scrollState;
    const w = size.width;
    const h = size.height;
    const time = state.clock.elapsedTime;
    const s = Math.min(7, Math.max(0, st.s));
    const k = Math.min(6, Math.floor(s));
    const t = s - k;
    const noise = st.noise / 100;
    material.uniforms.uPx.value = gl.getPixelRatio();

    // Rectángulos del DOM a los que se pegan las formaciones 1, 4 y 5.
    if (s < 2.2) {
      if (!cols.current.length) cols.current = Array.from(document.querySelectorAll("[data-skill-col]"));
      colRects.current = cols.current.map((el) => {
        const r = el.getBoundingClientRect();
        return { left: r.left, top: r.top, width: r.width, height: r.height };
      });
    }
    if (s > 2.8 && s < 5.2) {
      const el = document.querySelector("[data-heatmap]");
      if (el) {
        const r = el.getBoundingClientRect();
        heat.current = { left: r.left, top: r.top, width: r.width, height: r.height };
      }
    }
    if (s > 3.8 && s < 6.2) {
      const el = document.querySelector("[data-pipeline-diagram]");
      if (el) {
        const r = el.getBoundingClientRect();
        pipe.current = { left: r.left, top: r.top, width: r.width, height: r.height };
      }
    }

    const rects = colRects.current;
    let totalH = 0;
    for (const r of rects) totalH += r.height;

    // Formación `f` de la partícula i → (x, y, a) en píxeles de ventana.
    const out = { x: 0, y: 0, a: 0 };
    const form = (f: number, i: number) => {
      const { u0, v0, u1, v1, phase } = data;
      switch (f) {
        case 0: {
          out.x = u0[i] * w + Math.sin(time * 0.18 + phase[i]) * 26;
          out.y = v0[i] * h + Math.cos(time * 0.15 + phase[i] * 1.3) * 26;
          out.a = 0.55;
          break;
        }
        case 1: {
          if (rects.length && totalH > 0) {
            let target = u1[i] * totalH;
            let c = 0;
            while (c < rects.length - 1 && target > rects[c].height) {
              target -= rects[c].height;
              c++;
            }
            const r = rects[c];
            out.x = r.left + u0[i] * r.width;
            out.y = r.top + v1[i] * r.height;
            out.a = i % 5 < 4 ? 0.42 : 0;
          } else {
            out.x = u0[i] * w;
            out.y = v0[i] * h;
            out.a = 0;
          }
          break;
        }
        case 2: {
          // Riel de línea de tiempo: ~1 de cada 40 partículas, a intervalos regulares en el margen izquierdo.
          const rail = Math.max(1, Math.floor(count / 40));
          out.x = 20;
          out.y = ((Math.floor(i / 40) + 0.5) / rail) * h;
          out.a = i % 40 === 0 ? 0.6 : 0;
          break;
        }
        case 3: {
          const gc = Math.max(8, Math.round(Math.sqrt((count * w) / h)));
          const gr = Math.ceil(count / gc);
          out.x = ((i % gc) + 0.5) * (w / gc);
          out.y = (Math.floor(i / gc) + 0.5) * (h / gr);
          out.a = 0.16;
          break;
        }
        case 4: {
          const r = heat.current;
          if (r && i < 371) {
            const col = Math.floor(i / 7);
            const row = i % 7;
            out.x = r.left + (col + 0.5) * (r.width / 53);
            out.y = r.top + (row + 0.5) * (r.height / 7);
            out.a = 0.5;
          } else {
            out.x = w * 0.5;
            out.y = h * 0.5;
            out.a = 0;
          }
          break;
        }
        case 5: {
          const r = pipe.current;
          if (r && i % 4 === 0) {
            out.x = r.left + ((u0[i] + time * 0.045 * (0.5 + v0[i])) % 1) * r.width;
            out.y = r.top + r.height * 0.5 + (v1[i] - 0.5) * r.height * 0.5;
            out.a = 0.5;
          } else {
            out.x = w * 0.5;
            out.y = h * 0.5;
            out.a = 0;
          }
          break;
        }
        case 6: {
          out.x = w - 16 - (i % 2) * 8;
          out.y = ((i * 7) % count) / count * h;
          out.a = i % 5 === 0 ? 0.22 : 0;
          break;
        }
        default: {
          out.x = w - 16;
          out.y = (i / count) * h;
          out.a = 0;
        }
      }
    };

    const pos = geometry.attributes.position as THREE.BufferAttribute;
    const alpha = geometry.attributes.aAlpha as THREE.BufferAttribute;
    const P = pos.array as Float32Array;
    const A = alpha.array as Float32Array;
    const { delay, phase, ox, oy, vx, vy } = data;

    const mx = st.mouseX;
    const my = st.mouseY;
    const R = 140;
    const R2 = R * R;
    const push = 0.25 + 0.75 * noise; // con menos ruido el mouse casi no perturba
    const jitter = noise * 9;
    const globalA = 0.2 + 0.8 * noise;

    for (let i = 0; i < count; i++) {
      form(k, i);
      const ax = out.x;
      const ay = out.y;
      const aa = out.a;
      let x = ax;
      let y = ay;
      let a = aa;
      if (t > 0) {
        form(k + 1, i);
        const d = delay[i] * 0.5;
        const ti = clamp01((t - d) / (1 - 0.5));
        const te = easeOutCubic(ti);
        // Al caer hacia las columnas, el eje Y acelera (gravedad); el resto va con ease-out.
        const ty = k === 0 ? ti * ti * (3 - 2 * ti) * 0.4 + te * 0.6 : te;
        x = ax + (out.x - ax) * te;
        y = ay + (out.y - ay) * ty;
        a = aa + (out.a - aa) * te;
      }

      // Jitter de "ruido" y empuje del mouse con resorte de vuelta.
      x += Math.sin(time * 2.1 + phase[i] * 3) * jitter;
      y += Math.cos(time * 1.7 + phase[i] * 2) * jitter;

      const dx = x + ox[i] - mx;
      const dy = y + oy[i] - my;
      const d2 = dx * dx + dy * dy;
      if (d2 < R2 && d2 > 1) {
        const dist = Math.sqrt(d2);
        const f = (1 - dist / R) * (1 - dist / R) * 14 * push;
        vx[i] += (dx / dist) * f;
        vy[i] += (dy / dist) * f;
      }
      vx[i] += -ox[i] * 0.05;
      vy[i] += -oy[i] * 0.05;
      vx[i] *= 0.86;
      vy[i] *= 0.86;
      ox[i] += vx[i];
      oy[i] += vy[i];

      P[i * 3] = x + ox[i] - w / 2;
      P[i * 3 + 1] = h / 2 - (y + oy[i]);
      P[i * 3 + 2] = 0;
      A[i] = a * globalA;
    }
    pos.needsUpdate = true;
    alpha.needsUpdate = true;
  });

  return <points ref={pointsRef} geometry={parts.geometry} material={parts.material} frustumCulled={false} />;
}

export default function NoiseCanvas() {
  const count = typeof window !== "undefined" && window.innerWidth < 768 ? 500 : 1500;
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
      <Canvas
        orthographic
        camera={{ position: [0, 0, 10], near: 0.1, far: 100 }}
        dpr={[1, 1.75]}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
      >
        <Particles count={count} />
      </Canvas>
    </div>
  );
}
