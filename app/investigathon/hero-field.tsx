"use client";

import { useEffect, useRef } from "react";

/* Hero background, drawn with WebGPU through vgpu: a scatter plot of
   observations around a slowly moving fitted curve. The curve is the
   prediction, the Ŷ of the brand. The canvas stays transparent when WebGPU
   is missing or the user asked for reduced motion, so the flat navy
   background is the fallback. */

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

const CELL_CSS_PX = 36;

export default function HeroField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (typeof navigator === "undefined" || !("gpu" in navigator)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let disposed = false;
    let teardown: (() => void) | undefined;

    (async () => {
      try {
        const { init, surface, effect, clock, frameLoop } = await import("vgpu");
        const gpu = await init({ powerPreference: "low-power" });
        if (disposed) {
          gpu.dispose();
          return;
        }
        const surf = surface(gpu, canvas, {
          dpr: [1, 2],
          alphaMode: "premultiplied",
          clearColor: [0, 0, 0, 0],
        });
        const cellPx = () =>
          CELL_CSS_PX * Math.min(2, Math.max(1, window.devicePixelRatio || 1));
        const field = effect(gpu, SHADER, {
          set: { params: { time: 0, cell: cellPx(), texel: surf.texelSize } },
        });
        surf.onResize(() => {
          field.set({ params: { texel: surf.texelSize, cell: cellPx() } });
        });
        const time = clock(gpu);

        let loop: { stop(): void } | null = null;
        const start = () => {
          if (loop || disposed) return;
          loop = frameLoop(
            gpu,
            (frame) => {
              field.set({ params: { time: time.time } });
              frame.pass(surf, field);
            },
            { fps: 30 }
          );
        };
        const stop = () => {
          loop?.stop();
          loop = null;
        };

        // Only render while the hero is on screen.
        const io = new IntersectionObserver(
          (entries) => {
            if (entries.some((e) => e.isIntersecting)) start();
            else stop();
          },
          { threshold: 0.05 }
        );
        io.observe(canvas);
        start();
        canvas.classList.add("on");

        teardown = () => {
          io.disconnect();
          stop();
          gpu.dispose();
        };
      } catch (err) {
        // No adapter, lost device, or shader failure: leave the flat background.
        console.warn("[investigathon] hero field disabled:", err);
      }
    })();

    return () => {
      disposed = true;
      teardown?.();
    };
  }, []);

  return <canvas ref={ref} className="hero-field" aria-hidden="true" />;
}
