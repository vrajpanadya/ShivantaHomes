import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Flip } from 'gsap/Flip';
import { gsap, lockScroll } from '../lib/smooth';
import type { GalleryItem } from '../lib/types';
import './PhotoWall.css';

gsap.registerPlugin(Flip);

/* ------------------------------------------------------------------ */
/* Composition                                                         */
/* ------------------------------------------------------------------ */

/** Desktop slots — percentages of the stage box (aspect 1180:640). The centre stays clear for the heading. */
interface Slot { left: number; top: number; w: number; ar: number; rot: number; depth: number; mAr: number }
const SLOTS: Slot[] = [
  { left: 7,  top: 5,  w: 23, ar: 4 / 3,   rot: -3.2, depth: 0.55, mAr: 4 / 5 }, // top-left
  { left: 58, top: 6,  w: 32, ar: 2 / 1,   rot: 2.4,  depth: 1.0,  mAr: 1 },     // top-right (wide)
  { left: 4,  top: 49, w: 16, ar: 4 / 5,   rot: 3.0,  depth: 0.8,  mAr: 1 },     // left (portrait)
  { left: 25, top: 70, w: 23, ar: 16 / 10, rot: -2.4, depth: 1.2,  mAr: 4 / 5 }, // bottom-left
  { left: 79, top: 44, w: 19, ar: 4 / 3,   rot: -3.4, depth: 0.7,  mAr: 4 / 5 }, // right
  { left: 52, top: 66, w: 24, ar: 16 / 10, rot: 3.6,  depth: 1.0,  mAr: 1 },     // bottom-right
];
/** Slots to use when fewer than six images exist (keeps the ring balanced). */
const SLOT_PRIORITY = [1, 3, 0, 5, 2, 4];
/** Fill the most aspect-constrained slots first. */
const FILL_ORDER = [2, 1, 3, 5, 0, 4];
const MAX_CANDIDATES = 12;
const MEASURE_TIMEOUT = 3000;

interface Measured { item: GalleryItem; ar: number }
interface WallItem extends Measured { slot: number }

/** Best-fit images to slots by aspect ratio (featured images get a small preference). */
function compose(measured: Measured[]): WallItem[] {
  const n = Math.min(measured.length, SLOTS.length);
  if (!n) return [];
  const use = new Set(SLOT_PRIORITY.slice(0, n));
  const pool = measured.slice();
  const out: WallItem[] = [];
  for (const slot of FILL_ORDER.filter((s) => use.has(s))) {
    const target = Math.log(SLOTS[slot].ar);
    let best = 0;
    let bestCost = Infinity;
    pool.forEach((m, i) => {
      const cost = Math.abs(Math.log(m.ar) - target) - (m.item.featured ? 0.12 : 0);
      if (cost < bestCost) { bestCost = cost; best = i; }
    });
    out.push({ slot, ...pool.splice(best, 1)[0] });
  }
  return out.sort((a, b) => a.slot - b.slot);
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

type Phase = 'closed' | 'opening' | 'open' | 'closing';

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function PhotoWall({ items }: { items: GalleryItem[] }) {
  const rootRef = useRef<HTMLElement>(null);
  const imgRefs = useRef<(HTMLImageElement | null)[]>([]);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  /* ---- candidates → measured (natural aspect) → composed wall ---- */
  const candidates = useMemo(() => {
    const list = items.filter((g) => g.active !== false && g.url);
    return [...list.filter((g) => g.featured), ...list.filter((g) => !g.featured)].slice(0, MAX_CANDIDATES);
  }, [items]);
  const candidatesKey = candidates.map((c) => c.url).join('|');

  const [measured, setMeasured] = useState<Measured[] | null>(null);
  const [broken, setBroken] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!candidates.length) { setMeasured([]); return; }
    let alive = true;
    const results: (Measured | null)[] = candidates.map(() => null);
    let pending = candidates.length;
    const finish = () => {
      if (!alive) return;
      alive = false;
      clearTimeout(timer);
      setMeasured(results.filter((r): r is Measured => !!r));
    };
    const timer = setTimeout(finish, MEASURE_TIMEOUT); // never wait forever — unloaded images are simply left out
    candidates.forEach((item, i) => {
      const im = new Image();
      im.onload = () => { results[i] = { item, ar: im.naturalWidth / Math.max(1, im.naturalHeight) }; if (--pending === 0) finish(); };
      im.onerror = () => { if (--pending === 0) finish(); };
      im.src = item.url;
    });
    return () => { alive = false; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidatesKey]);

  const wall = useMemo(() => compose((measured ?? []).filter((m) => !broken.has(m.item.url))), [measured, broken]);
  const wallKey = wall.map((w) => w.item.url).join('|');
  const n = wall.length;

  /* ---- interaction state ---- */
  const [hover, setHover] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>('closed');
  const [index, setIndex] = useState(0);
  const [lifted, setLifted] = useState<number | null>(null);
  const [layers, setLayers] = useState<{ src: (string | null)[]; active: 0 | 1 }>({ src: [null, null], active: 0 });

  const phaseRef = useRef<Phase>('closed');
  phaseRef.current = phase;
  const indexRef = useRef(0);
  indexRef.current = index;

  const overlayRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const chromeRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLImageElement>(null);
  const layerRefs = useRef<(HTMLImageElement | null)[]>([null, null]);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const invokerRef = useRef<HTMLElement | null>(null);
  const scrollYRef = useRef(0);
  const navToken = useRef(0);
  const swipe = useRef<{ x: number; y: number; id: number } | null>(null);
  const swiped = useRef(false);

  /* ---- scroll lock (Lenis + body) with scrollbar compensation and exact position restore ---- */
  const lock = useCallback((on: boolean) => {
    if (on) {
      scrollYRef.current = window.scrollY;
      const sbw = window.innerWidth - document.documentElement.clientWidth;
      document.documentElement.style.setProperty('--pw-sbw', `${Math.max(0, sbw)}px`);
      lockScroll(true);
    } else {
      lockScroll(false);
      document.documentElement.style.removeProperty('--pw-sbw');
      if (Math.abs(window.scrollY - scrollYRef.current) > 1) window.scrollTo(0, scrollYRef.current);
    }
  }, []);

  /* ---- entrance + pointer parallax ---- */
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el || !n) return;
    const ctx = gsap.context(() => {
      const nodes = gsap.utils.toArray<HTMLElement>('.pw-item');
      const head = el.querySelector<HTMLElement>('.pw-head');
      const trigger = { trigger: el, start: 'top 78%', once: true };
      if (reducedMotion()) {
        gsap.from([head, ...nodes], { opacity: 0, duration: 0.5, stagger: 0.05, ease: 'power1.out', clearProps: 'opacity', scrollTrigger: trigger });
        return;
      }
      const tl = gsap.timeline({ scrollTrigger: trigger, defaults: { ease: 'power3.out' } });
      // NB: clear only the animated props — the items carry their slot geometry as inline CSS variables.
      tl.from(head, { opacity: 0, y: 34, duration: 0.9, clearProps: 'opacity,transform' }, 0)
        .from(nodes, { opacity: 0, y: 44, rotation: (i: number) => (i % 2 ? 4 : -4), duration: 0.85, stagger: 0.08, clearProps: 'opacity,transform' }, 0.12); // ends ≈ 1.4s

      if (!window.matchMedia('(pointer: fine)').matches) return;
      const xs = nodes.map((it) => gsap.quickTo(it.querySelector('.pw-para'), 'x', { duration: 0.7, ease: 'power3.out' }));
      const ys = nodes.map((it) => gsap.quickTo(it.querySelector('.pw-para'), 'y', { duration: 0.7, ease: 'power3.out' }));
      const onMove = (e: PointerEvent) => {
        if (e.pointerType !== 'mouse' || phaseRef.current !== 'closed') return;
        const r = el.getBoundingClientRect();
        const nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        const ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
        nodes.forEach((it, k) => {
          const d = Number(it.dataset.depth || 1) * 10;
          xs[k](gsap.utils.clamp(-12, 12, nx * d));
          ys[k](gsap.utils.clamp(-12, 12, ny * d));
        });
      };
      const onLeave = () => nodes.forEach((_, k) => { xs[k](0); ys[k](0); });
      el.addEventListener('pointermove', onMove);
      el.addEventListener('pointerleave', onLeave);
      return () => {
        el.removeEventListener('pointermove', onMove);
        el.removeEventListener('pointerleave', onLeave);
      };
    }, el);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallKey]);

  /* ---- open / close / navigate ---- */
  const open = useCallback((k: number, invoker: HTMLElement | null) => {
    if (phaseRef.current !== 'closed' || !wall[k]) return;
    invokerRef.current = invoker;
    navToken.current++;
    setHover(null);
    setIndex(k);
    setLayers({ src: [wall[k].item.url, null], active: 0 });
    setPhase('opening');
  }, [wall]);

  const close = useCallback(() => {
    if (phaseRef.current !== 'open') return;
    setPhase('closing');
  }, []);

  const goTo = useCallback((k: number) => {
    if (phaseRef.current !== 'open' || n < 2) return;
    const next = ((k % n) + n) % n;
    if (next === indexRef.current) return;
    const token = ++navToken.current;
    const url = wall[next].item.url;
    const pre = new Image();
    pre.src = url;
    const swap = () => {
      if (token !== navToken.current || phaseRef.current !== 'open') return;
      setIndex(next);
      setLifted(next);
      setLayers((l) => {
        const active = (1 - l.active) as 0 | 1;
        const src = l.src.slice();
        src[active] = url;
        return { src, active };
      });
    };
    // Wait (briefly) for the next image to decode so the crossfade never shows a blank frame.
    Promise.race([pre.decode().catch(() => undefined), sleep(320)]).then(swap);
  }, [n, wall]);

  /* Opening: expand the very same photo from its wall position into the viewer (FLIP). */
  useLayoutEffect(() => {
    if (phase !== 'opening') return;
    const k = index;
    const src = imgRefs.current[k];
    const ghost = ghostRef.current;
    const real = layerRefs.current[layers.active];
    const backdrop = backdropRef.current;
    const chrome = chromeRef.current;
    lock(true);
    let cancelled = false;
    let tl: gsap.core.Timeline | null = null;
    const focusClose = gsap.delayedCall(0.4, () => closeBtnRef.current?.focus({ preventScroll: true }));

    const run = async () => {
      if (real?.decode) await Promise.race([real.decode().catch(() => undefined), sleep(350)]);
      if (cancelled) return;
      if (!src || !ghost || !real || !backdrop || !chrome || reducedMotion()) {
        // Reduced motion / missing refs: short fades only.
        if (backdrop && chrome) gsap.fromTo([backdrop, chrome], { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power1.out' });
        setLifted(k);
        setPhase('open');
        return;
      }
      ghost.src = src.currentSrc || src.src;
      gsap.set(ghost, { display: 'block', borderRadius: getComputedStyle(src).borderRadius });
      Flip.fit(ghost, src, { scale: false }); // exact position, size AND rotation of the wall photo
      setLifted(k);                            // the wall frame becomes an empty mat while its photo travels
      tl = gsap.timeline({
        onComplete: () => {
          if (cancelled) return;
          setPhase('open');                    // real image fades in underneath the ghost …
          gsap.delayedCall(0.45, () => gsap.set(ghost, { display: 'none' })); // … then the ghost steps away
        },
      });
      tl.to(backdrop, { opacity: 1, duration: 0.55, ease: 'power2.out' }, 0)
        .add(Flip.fit(ghost, real, { scale: false, duration: 0.78, ease: 'power3.inOut' }) as gsap.core.Tween, 0)
        .to(ghost, { borderRadius: 0, duration: 0.5, ease: 'power2.inOut' }, 0.06)
        .fromTo(chrome, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out', clearProps: 'transform' }, 0.35);
    };
    run();
    return () => { cancelled = true; focusClose.kill(); tl?.kill(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  /* Closing: shrink the currently displayed photo back into its own frame in the wall. */
  useLayoutEffect(() => {
    if (phase !== 'closing') return;
    const k = index;
    const src = imgRefs.current[k];
    const ghost = ghostRef.current;
    const real = layerRefs.current[layers.active];
    const backdrop = backdropRef.current;
    const chrome = chromeRef.current;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      setLifted(null);
      setLayers({ src: [null, null], active: 0 });
      setPhase('closed');
      lock(false);
      const target = invokerRef.current?.isConnected ? invokerRef.current : btnRefs.current[k];
      target?.focus({ preventScroll: true });
    };
    let tl: gsap.core.Timeline | null = null;
    if (!src || !ghost || !real || !backdrop || !chrome || reducedMotion()) {
      tl = gsap.timeline({ onComplete: finish });
      tl.to([backdrop, chrome].filter(Boolean), { opacity: 0, duration: 0.25, ease: 'power1.out' });
    } else {
      ghost.src = real.currentSrc || real.src;
      gsap.set(ghost, { display: 'block', borderRadius: 0 });
      Flip.fit(ghost, real, { scale: false }); // start exactly where the viewer image is
      tl = gsap.timeline({ onComplete: finish });
      tl.to(chrome, { opacity: 0, duration: 0.25, ease: 'power1.out' }, 0)
        .add(Flip.fit(ghost, src, { scale: false, duration: 0.7, ease: 'power3.inOut' }) as gsap.core.Tween, 0)
        .to(ghost, { borderRadius: getComputedStyle(src).borderRadius, duration: 0.45, ease: 'power2.inOut' }, 0.22)
        .to(backdrop, { opacity: 0, duration: 0.6, ease: 'power2.inOut' }, 0.1);
    }
    return () => { tl?.kill(); if (!done) finish(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  /* Preload neighbours while the viewer is open. */
  useEffect(() => {
    if (phase !== 'open' || n < 2) return;
    [index - 1, index + 1].forEach((k) => { const im = new Image(); im.src = wall[((k % n) + n) % n].item.url; });
  }, [phase, index, n, wall]);

  /* Keyboard: Escape closes, arrows navigate, Tab is trapped inside the dialog. */
  useEffect(() => {
    if (phase === 'closed') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(indexRef.current + 1); return; }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(indexRef.current - 1); return; }
      if (e.key === 'Tab' && overlayRef.current) {
        const f = Array.from(overlayRef.current.querySelectorAll<HTMLElement>('button:not([disabled])')).filter((b) => b.offsetParent !== null);
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (e.shiftKey && (active === first || !overlayRef.current.contains(active))) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && (active === last || !overlayRef.current.contains(active))) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, close, goTo]);

  /* Safety net: never leave the page locked if the component unmounts mid-view. */
  useEffect(() => () => { if (phaseRef.current !== 'closed') lock(false); }, [lock]);

  /* Swipe navigation in the viewer. */
  const onPointerDown = (e: React.PointerEvent) => { swipe.current = { x: e.clientX, y: e.clientY, id: e.pointerId }; swiped.current = false; };
  const onPointerUp = (e: React.PointerEvent) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s || s.id !== e.pointerId) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.2) { swiped.current = true; goTo(indexRef.current + (dx < 0 ? 1 : -1)); }
  };
  /* Any click that is not on the photo itself (gutters, canvas, backdrop) closes the viewer. */
  const onStageClick = (e: React.MouseEvent) => {
    if (swiped.current) { swiped.current = false; return; }
    const t = e.target as HTMLElement;
    if (t.closest('.pw-layer') || t.closest('.pw-ghost')) return;
    close();
  };

  if (measured === null || !n) return null;

  const current = wall[index];
  const viewerOpen = phase !== 'closed';

  return (
    <>
      <section className="pw-section" ref={rootRef} aria-labelledby="pw-title">
        <div className="container">
          <div className="pw-stage">
            <div className="pw-head">
              <h2 className="pw-title" id="pw-title">
                <span className="pw-eyebrow">Explore</span>
                SHIVANTA HOMES
              </h2>
              <p className="pw-sub">A closer look at your future home.</p>
            </div>
            <div className={`pw-wall ${hover !== null && !viewerOpen ? 'has-hover' : ''}`}>
              {wall.map((w, k) => {
                const s = SLOTS[w.slot];
                const title = w.item.title || 'Shivanta Homes photo';
                return (
                  <div
                    key={w.item.url}
                    className={`pw-item ${hover === k ? 'is-hover' : ''} ${lifted === k ? 'is-lifted' : ''}`}
                    style={{ '--l': `${s.left}%`, '--t': `${s.top}%`, '--w': `${s.w}%`, '--ar': String(s.ar), '--mar': String(s.mAr), '--r': `${s.rot}deg` } as React.CSSProperties}
                    data-depth={s.depth}
                    onPointerEnter={(e) => { if (e.pointerType === 'mouse') setHover(k); }}
                    onPointerLeave={() => setHover((h) => (h === k ? null : h))}
                  >
                    <div className="pw-para">
                      <div className="pw-tilt">
                        <button
                          type="button"
                          className="pw-frame"
                          ref={(el) => { btnRefs.current[k] = el; }}
                          onClick={(e) => open(k, e.currentTarget)}
                          aria-haspopup="dialog"
                        >
                          <img
                            ref={(el) => { imgRefs.current[k] = el; }}
                            src={w.item.url}
                            alt={w.item.alt || title}
                            loading="lazy"
                            decoding="async"
                            draggable={false}
                            onError={() => setBroken((b) => new Set(b).add(w.item.url))}
                          />
                          <span className="pw-view" aria-hidden="true">View image ↗</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {viewerOpen && current && createPortal(
        <div className={`pw-viewer is-${phase}`} ref={overlayRef} role="dialog" aria-modal="true" aria-label="Image viewer">
          <div className="pw-backdrop" ref={backdropRef} onClick={close} />
          <div className="pw-stage-v" onClick={onStageClick} onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => { swipe.current = null; }}>
            <div className="pw-canvas">
              {[0, 1].map((L) => {
                const src = layers.src[L];
                const item = wall.find((w) => w.item.url === src)?.item;
                return (
                  <img
                    key={L}
                    ref={(el) => { layerRefs.current[L] = el; }}
                    className={`pw-layer ${layers.active === L && src ? 'is-active' : ''}`}
                    src={src ?? undefined}
                    alt={item ? item.alt || item.title : ''}
                    draggable={false}
                  />
                );
              })}
              <img className="pw-ghost" ref={ghostRef} alt="" aria-hidden="true" draggable={false} />
            </div>
          </div>
          <div className="pw-chrome" ref={chromeRef}>
            <div className="pw-counter" aria-live="polite">{String(index + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}</div>
            <button type="button" className="pw-btn pw-close" ref={closeBtnRef} onClick={close} aria-label="Close image viewer">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
            {n > 1 && (
              <>
                <button type="button" className="pw-btn pw-nav pw-prev" onClick={() => goTo(index - 1)} aria-label="Previous image">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
                </button>
                <button type="button" className="pw-btn pw-nav pw-next" onClick={() => goTo(index + 1)} aria-label="Next image">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7" /></svg>
                </button>
              </>
            )}
            <div className="pw-caption">
              {current.item.title && <b>{current.item.title}</b>}
              {current.item.category && <span>{current.item.category}</span>}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
