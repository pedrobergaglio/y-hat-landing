"use client";

import { useEffect, useRef } from "react";

/* Hero background: a scatter plot of observations around a slowly moving
   fitted curve. The curve is the prediction, the Ŷ of the brand.

   Two renderers draw the same scene:
   - WebGPU through vgpu when a hardware adapter is available.
   - Canvas 2D otherwise (no WebGPU, or a software adapter such as
     SwiftShader, which would render the shader on the CPU).
   With prefers-reduced-motion the 2D path draws one static frame. */

const CELL_CSS_PX = 36;
const FPS = 30;

/* ---------- shared scene parameters (kept identical in WGSL and JS) ---------- */

const SHADER = /* wgsl */ `
struct Params {
  time: f32,
  cell: f32,
  texel: vec2f,
}
@group(0) @binding(0) var<uniform> params: Params;

fn hash2(p: vec2f) -> vec2f {
  let q = vec2f(dot(p, vec2f(127.1, 311.7)), dot(p, vec2f(269.5, 183.3)));
  return fract(sin(q) * 43758.5453);
}

// The fitted model: a slow-moving curve across the hero, in normalized y.
fn model(x: f32, t: f32) -> f32 {
  return 0.6
    + 0.13 * sin(x * 2.9 + t * 0.11)
    + 0.06 * sin(x * 6.3 - t * 0.08)
    + 0.025 * sin(x * 13.0 + t * 0.17);
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let res = 1.0 / params.texel;
  let px = uv * res;

  // Regression line, about one device pixel wide.
  let yLine = model(uv.x, params.time) * res.y;
  let dLine = abs(px.y - yLine) / params.cell * 36.0;
  let line = 1.0 - smoothstep(0.5, 1.8, dLine);

  // Observations: three samples per column, scattered around the model with
  // a roughly bell-shaped residual, each drifting slowly on its own phase.
  let colw = params.cell * 0.8;
  let ci = floor(px.x / colw);
  var pts = 0.0;
  for (var j = -1; j <= 1; j++) {
    for (var k = 0; k < 3; k++) {
      let id = vec2f(ci + f32(j), f32(k));
      let h = hash2(id);
      let h2 = hash2(id + vec2f(31.7, 7.3));
      let xp = (ci + f32(j) + h.x) * colw;
      let resid = (h.y + h2.x + h2.y - 1.5) * params.cell * 2.1;
      let wobble = params.cell * 0.3 * sin(params.time * 0.28 + h.x * 6.2831);
      let yp = model(xp / res.x, params.time) * res.y + resid + wobble;
      let d = length(px - vec2f(xp, yp)) / params.cell * 36.0;
      let r = 1.3 + h2.x * 0.8;
      let dotv = 1.0 - smoothstep(r - 0.8, r + 0.8, d);
      let fade = 0.45 + 0.55 * (0.5 + 0.5 * sin(params.time * 0.4 + h2.y * 6.2831));
      pts += dotv * fade;
    }
  }

  // Readability: nearly silent under the title column, full strength right.
  let horiz = 0.14 + 0.86 * smoothstep(0.18, 0.72, uv.x);
  let edge = 1.0 - smoothstep(0.78, 1.0, abs(uv.y - 0.5) * 2.0);
  let mask = horiz * edge;

  let cream = vec3f(0.98, 0.98, 0.98);
  let goldc = vec3f(0.878, 0.71, 0.455);
  let aPts = clamp(pts, 0.0, 1.0) * 0.6 * mask;
  let aLine = line * 0.75 * mask;
  let a = clamp(aPts + aLine, 0.0, 1.0);
  let col = (cream * aPts + goldc * aLine) / max(a, 0.0001);
  return vec4f(col * a, a);
}
`;

const TAU = 6.2831;
const fract = (v: number) => v - Math.floor(v);
const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
function hash2(x: number, y: number): [number, number] {
  const qx = x * 127.1 + y * 311.7;
  const qy = x * 269.5 + y * 183.3;
  return [fract(Math.sin(qx) * 43758.5453), fract(Math.sin(qy) * 43758.5453)];
}
const model = (x: number, t: number) =>
  0.6 +
  0.13 * Math.sin(x * 2.9 + t * 0.11) +
  0.06 * Math.sin(x * 6.3 - t * 0.08) +
  0.025 * Math.sin(x * 13.0 + t * 0.17);
const mask = (u: number, v: number) =>
  (0.14 + 0.86 * smoothstep(0.18, 0.72, u)) *
  (1 - smoothstep(0.78, 1.0, Math.abs(v - 0.5) * 2));

const dprNow = () => Math.min(2, Math.max(1, window.devicePixelRatio || 1));

type Renderer = { start(): void; stop(): void; dispose(): void };

/* ---------- renderer 1: WebGPU via vgpu ---------- */

async function startWebGPU(
  canvas: HTMLCanvasElement,
  isAlive: () => boolean
): Promise<Renderer> {
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) throw new Error("no WebGPU adapter");
  // A software adapter (SwiftShader, llvmpipe) rasterizes the fragment shader
  // on the CPU and stalls the page; Canvas 2D is far cheaper there.
  const info = adapter.info as
    | (GPUAdapterInfo & { isFallbackAdapter?: boolean })
    | undefined;
  const soft =
    Boolean((adapter as { isFallbackAdapter?: boolean }).isFallbackAdapter) ||
    Boolean(info?.isFallbackAdapter) ||
    /swiftshader|llvmpipe|software|lavapipe/i.test(
      `${info?.architecture ?? ""} ${info?.description ?? ""} ${info?.device ?? ""}`
    );
  if (soft) throw new Error(`software WebGPU adapter (${info?.architecture || "fallback"})`);
  const { init, surface, effect, clock, frameLoop } = await import("vgpu");
  const gpu = await init({ powerPreference: "low-power" });
  if (!isAlive()) {
    gpu.dispose();
    throw new Error("unmounted");
  }
  const surf = surface(gpu, canvas, {
    dpr: [1, 2],
    alphaMode: "premultiplied",
    clearColor: [0, 0, 0, 0],
  });
  const cellPx = () => CELL_CSS_PX * dprNow();
  const field = effect(gpu, SHADER, {
    set: { params: { time: 0, cell: cellPx(), texel: surf.texelSize } },
  });
  surf.onResize(() => {
    field.set({ params: { texel: surf.texelSize, cell: cellPx() } });
  });
  const time = clock(gpu);
  let loop: { stop(): void } | null = null;
  const stop = () => {
    loop?.stop();
    loop = null;
  };
  return {
    start() {
      if (loop) return;
      loop = frameLoop(
        gpu,
        (frame) => {
          field.set({ params: { time: time.time } });
          frame.pass(surf, field);
        },
        { fps: FPS }
      );
    },
    stop,
    dispose() {
      stop();
      gpu.dispose();
    },
  };
}

/* ---------- renderer 2: Canvas 2D ---------- */

function start2D(canvas: HTMLCanvasElement, animate: boolean): Renderer {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d context");

  let w = 0;
  let h = 0;
  const fit = () => {
    const dpr = dprNow();
    w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
  };

  const draw = (t: number) => {
    fit();
    const cell = CELL_CSS_PX * dprNow();
    ctx.clearRect(0, 0, w, h);

    // Regression line: short segments so the alpha can follow the mask.
    ctx.lineWidth = Math.max(1, cell / 36);
    ctx.strokeStyle = "rgb(224,181,116)";
    ctx.lineCap = "round";
    const step = Math.max(4, cell / 6);
    let px = 0;
    let py = model(0, t) * h;
    for (let x = step; x <= w + step; x += step) {
      const y = model(x / w, t) * h;
      ctx.globalAlpha = 0.75 * mask((x - step / 2) / w, (y + py) / 2 / h);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(x, y);
      ctx.stroke();
      px = x;
      py = y;
    }

    // Observations.
    ctx.fillStyle = "rgb(250,250,250)";
    const colw = cell * 0.8;
    const cols = Math.ceil(w / colw) + 1;
    for (let ci = -1; ci < cols; ci++) {
      for (let k = 0; k < 3; k++) {
        const [hx, hy] = hash2(ci, k);
        const [h2x, h2y] = hash2(ci + 31.7, k + 7.3);
        const xp = (ci + hx) * colw;
        const resid = (hy + h2x + h2y - 1.5) * cell * 2.1;
        const wobble = cell * 0.3 * Math.sin(t * 0.28 + hx * TAU);
        const yp = model(xp / w, t) * h + resid + wobble;
        const r = (1.3 + h2x * 0.8) * (cell / 36);
        const fade = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * 0.4 + h2y * TAU));
        ctx.globalAlpha = 0.6 * fade * mask(xp / w, yp / h);
        ctx.beginPath();
        ctx.arc(xp, yp, r, 0, TAU);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  };

  let raf = 0;
  let last = 0;
  const t0 = performance.now();
  const tick = (now: number) => {
    raf = requestAnimationFrame(tick);
    if (now - last < 1000 / FPS) return;
    last = now;
    draw((now - t0) / 1000);
  };

  const ro = new ResizeObserver(() => {
    if (!animate) draw(3);
  });
  ro.observe(canvas);

  const stop = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };
  return {
    start() {
      if (!animate) {
        draw(3);
        return;
      }
      if (!raf) raf = requestAnimationFrame(tick);
    },
    stop,
    dispose() {
      stop();
      ro.disconnect();
    },
  };
}

/* ---------- component ---------- */

export default function HeroField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    let alive = true;
    let renderer: Renderer | null = null;
    let io: IntersectionObserver | null = null;

    (async () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!reduce && "gpu" in navigator) {
        try {
          renderer = await startWebGPU(canvas, () => alive);
        } catch (err) {
          if (!alive) return;
          console.info(
            "[investigathon] hero field: WebGPU unavailable, using Canvas 2D.",
            err
          );
        }
      }
      if (!alive) return;
      if (!renderer) {
        try {
          renderer = start2D(canvas, !reduce);
        } catch {
          return;
        }
      }

      // Only render while the hero is on screen.
      const r = renderer;
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) r.start();
          else r.stop();
        },
        { threshold: 0.05 }
      );
      io.observe(canvas);
      r.start();
      canvas.classList.add("on");
    })();

    return () => {
      alive = false;
      io?.disconnect();
      renderer?.dispose();
    };
  }, []);

  return <canvas ref={ref} className="hero-field" aria-hidden="true" />;
}
