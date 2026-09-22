/**
 * Registers the hero's hand-traced linework to whatever crop of the entrance
 * render the admin has uploaded.
 *
 * The bronze tracing lives in the coordinate space of the original render
 * (2200×1100). Admins upload their own exports of that render (tighter crops,
 * different sizes), so at runtime we locate the uploaded photograph inside a
 * tiny grayscale copy of the original (normalised cross-correlation, coarse
 * grid → local refinement) and return the matching window in trace units.
 * Unrelated photographs score low and get no linework at all.
 */

export type Gray = { w: number; h: number; px: Float32Array };
export type Window = { x: number; y: number; w: number; h: number; score: number };

const MIN_SCORE = 0.8;

/** Nearest-neighbour downsample by an integer factor (box mean). */
function shrink(g: Gray, f: number): Gray {
  if (f <= 1) return g;
  const w = Math.floor(g.w / f);
  const h = Math.floor(g.h / f);
  const px = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let j = 0; j < f; j++) for (let i = 0; i < f; i++) s += g.px[(y * f + j) * g.w + x * f + i];
      px[y * w + x] = s / (f * f);
    }
  }
  return { w, h, px };
}

/** Bilinear sample of `g` at continuous (x, y) in pixel units. */
function sample(g: Gray, x: number, y: number): number {
  const x0 = Math.max(0, Math.min(g.w - 1, Math.floor(x)));
  const y0 = Math.max(0, Math.min(g.h - 1, Math.floor(y)));
  const x1 = Math.min(g.w - 1, x0 + 1);
  const y1 = Math.min(g.h - 1, y0 + 1);
  const fx = Math.max(0, Math.min(1, x - x0));
  const fy = Math.max(0, Math.min(1, y - y0));
  const a = g.px[y0 * g.w + x0];
  const b = g.px[y0 * g.w + x1];
  const c = g.px[y1 * g.w + x0];
  const d = g.px[y1 * g.w + x1];
  return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
}

/**
 * NCC between `img` and the reference window (u, v, fw, fh) given in normalised
 * reference coordinates (0..1). Returns -1 when the window leaves the reference.
 */
function ncc(ref: Gray, img: Gray, u: number, v: number, fw: number, fh: number): number {
  if (u < -0.002 || v < -0.002 || u + fw > 1.002 || v + fh > 1.002) return -1;
  const n = img.w * img.h;
  let sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0;
  for (let y = 0; y < img.h; y++) {
    const ry = (v + (fh * (y + 0.5)) / img.h) * ref.h - 0.5;
    for (let x = 0; x < img.w; x++) {
      const rx = (u + (fw * (x + 0.5)) / img.w) * ref.w - 0.5;
      const a = img.px[y * img.w + x];
      const b = sample(ref, rx, ry);
      sa += a; sb += b; saa += a * a; sbb += b * b; sab += a * b;
    }
  }
  const va = saa - (sa * sa) / n;
  const vb = sbb - (sb * sb) / n;
  if (va <= 1e-6 || vb <= 1e-6) return -1;
  return (sab - (sa * sb) / n) / Math.sqrt(va * vb);
}

/**
 * Find the window of `ref` that the photograph `img` shows.
 * `traceW/traceH` is the trace coordinate space (the reference's full frame).
 */
export function registerCrop(ref: Gray, img: Gray, traceW: number, traceH: number): Window | null {
  // The photo's height in reference-normalised units follows from its aspect ratio (uniform crop).
  const aspect = (img.h / img.w) * (ref.w / ref.h); // fh = fw * aspect
  const maxFw = Math.min(1, 1 / aspect);
  if (maxFw < 0.3) return null;

  // 1 — coarse grid on small copies
  const refC = shrink(ref, 4);
  const imgC = shrink(img, 4);
  type C = { u: number; v: number; fw: number; s: number };
  const top: C[] = [];
  const push = (c: C) => {
    top.push(c);
    top.sort((a, b) => b.s - a.s);
    if (top.length > 4) top.length = 4;
  };
  for (let fw = maxFw; fw >= 0.35; fw -= 0.04) {
    const fh = fw * aspect;
    const du = Math.max(1 / refC.w, (1 - fw) / 12);
    const dv = Math.max(1 / refC.h, (1 - fh) / 12);
    for (let u = 0; u <= 1 - fw + 1e-9; u += du) {
      for (let v = 0; v <= 1 - fh + 1e-9; v += dv) {
        push({ u, v, fw, s: ncc(refC, imgC, u, v, fw, fh) });
      }
      if (1 - fw < 1e-9) break;
    }
  }
  if (!top.length) return null;

  // 2 — local hill-climb at growing resolution around the best coarse candidates
  const levels: Array<[Gray, Gray, number]> = [
    [shrink(ref, 2), shrink(img, 2), 0.02],
    [ref, img, 0.006],
  ];
  let best: C = top[0];
  for (const cand of top.slice(0, 3)) {
    let c = { ...cand };
    for (const [r, i, step0] of levels) {
      let step = step0;
      c.s = ncc(r, i, c.u, c.v, c.fw, c.fw * aspect);
      while (step > 0.0004) {
        let improved = false;
        for (const [du, dv, dfw] of [[step, 0, 0], [-step, 0, 0], [0, step, 0], [0, -step, 0], [0, 0, step], [0, 0, -step], [step / 2, step / 2, -step], [-step / 2, -step / 2, step]]) {
          const fw = c.fw + dfw;
          if (fw < 0.3 || fw > maxFw + 1e-9) continue;
          const s = ncc(r, i, c.u + du, c.v + dv, fw, fw * aspect);
          if (s > c.s + 1e-6) { c = { u: c.u + du, v: c.v + dv, fw, s }; improved = true; }
        }
        if (!improved) step /= 2;
      }
    }
    if (c.s > best.s) best = c;
  }
  if (best.s < MIN_SCORE) return null;
  return { x: best.u * traceW, y: best.v * traceH, w: best.fw * traceW, h: best.fw * aspect * traceH, score: best.s };
}

/** Grayscale pixels of an element drawable on a canvas, `w` px wide (aspect preserved). */
export function toGray(source: CanvasImageSource, sw: number, sh: number, w: number): Gray | null {
  const h = Math.max(4, Math.round((w * sh) / sw));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, w, h);
  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, w, h).data; // throws for cross-origin images without CORS
  } catch {
    return null;
  }
  const px = new Float32Array(w * h);
  for (let i = 0; i < px.length; i++) px[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
  return { w, h, px };
}

/** Decode a data-URI / URL into a Gray of the given width. */
export function loadGray(src: string, w: number): Promise<Gray | null> {
  return new Promise((resolve) => {
    const im = new Image();
    im.onload = () => resolve(toGray(im, im.naturalWidth, im.naturalHeight, w));
    im.onerror = () => resolve(null);
    im.src = src;
  });
}
