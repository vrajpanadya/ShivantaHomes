// import { useLayoutEffect, useMemo, useRef } from 'react';
// import { gsap, scrollToHash } from '../lib/smooth';
// import { Icon } from '../lib/icons';
// import type { Hero as HeroData } from '../lib/types';
// import { registerCrop, toGray, loadGray, type Window as TraceWindow } from '../lib/traceRegister';
// import { TRACE_REF } from '../lib/traceRef';
// import './Hero.css';

// /**
//  * SHIVANTA HOMES hero — "Architectural Blueprint → Reality".
//  *
//  * Opening sequence (≈2.4 s, integrated — never blocks nav/scroll):
//  *   ivory canvas → bronze linework traces the gate / rooflines →
//  *   photo revealed from the centre by a rectangular mask (lines fade) →
//  *   photo settles 1.05 → 1 → letters of "SHIVANTA HOMES" rise inside
//  *   line masks → label / copy / CTAs overlap in.
//  *
//  * Wrapper roles (kept separate to avoid transform conflicts):
//  *   .hero-bg     scroll zoom 1 → 1.04 (desktop, ScrollTrigger)
//  *   .hero-plate  clip-path reveal mask (+ readability gradients)
//  *   .hero-zoom   entrance settle 1.05 → 1
//  *   .hero-lines  SVG tracing, scaled in sync with .hero-zoom so it stays registered
//  *   .hero-text   scroll exit motion (y / opacity) for label + title + accent
//  */

// /* Natural size of the original entrance render — the tracing coordinates below live in this space.
//  * The linework is registered to whatever crop/export of that render the admin uploads (traceRegister.ts). */
// const TRACE_W = 2200;
// const TRACE_H = 1100;
// /* If the photograph is not decoded by then, reveal anyway (dark plate) and fade it in later. */
// const MEDIA_WAIT_CAP = 2500;
// /* If the photograph is not decoded by then, skip the blueprint phase (lines need the photo to register). */
// const LINES_WAIT_CAP = 1200;

// type Props = { data: HeroData; play: boolean; fallbackTitle?: string };

// function splitHeading(heading: string): string[] {
//   if (heading.includes(',')) return heading.split(',').map((s) => s.trim()).filter(Boolean);
//   return heading
//     .split(' ')
//     .reduce<string[][]>((ls, w) => {
//       const last = ls[ls.length - 1];
//       if (last && last.join(' ').length < 12) last.push(w);
//       else ls.push([w]);
//       return ls;
//     }, [])
//     .map((l) => l.join(' '))
//     .flatMap((l) => {
//       const ws = l.split(' ');
//       if (ws.length > 1 && l.length > 12) {
//         const mid = Math.ceil(ws.length / 2);
//         return [ws.slice(0, mid).join(' '), ws.slice(mid).join(' ')];
//       }
//       return [l];
//     });
// }

// /** object-position ("50% 42%", "center top", …) → fractions; unknown units fall back to centre. */
// function parseObjectPosition(value: string): [number, number] {
//   const kw: Record<string, number> = { left: 0, top: 0, center: 0.5, right: 1, bottom: 1 };
//   const parts = (value ?? '').trim().split(/\s+/);
//   const conv = (p: string | undefined) => {
//     if (!p) return 0.5;
//     if (p in kw) return kw[p];
//     if (p.endsWith('%')) return Math.min(1, Math.max(0, parseFloat(p) / 100));
//     return 0.5;
//   };
//   return [conv(parts[0]), conv(parts[1] ?? parts[0])];
// }

// /**
//  * Splitting letters into inline-blocks disables font kerning (AV, TA…).
//  * Measure the advances of the un-split line and give each letter the
//  * kerning difference as margin-left so spacing matches the plain heading.
//  */
// function matchKerning(line: HTMLElement) {
//   const chars = Array.from(line.querySelectorAll<HTMLElement>('.ch'));
//   if (chars.length < 2) return;
//   chars.forEach((c) => { c.style.marginLeft = ''; });
//   const text = chars.map((c) => c.textContent ?? '').join('');
//   const probe = document.createElement('span');
//   probe.className = 'hero-kern-probe';
//   probe.textContent = text;
//   line.appendChild(probe);
//   try {
//     const node = probe.firstChild as Text;
//     const range = document.createRange();
//     const kerned: number[] = [];
//     for (let i = 0; i < text.length; i++) {
//       range.setStart(node, i);
//       range.setEnd(node, i + 1);
//       kerned.push(range.getBoundingClientRect().left);
//     }
//     const split = chars.map((c) => c.getBoundingClientRect().left);
//     for (let i = 1; i < chars.length; i++) {
//       const d = (kerned[i] - kerned[i - 1]) - (split[i] - split[i - 1]);
//       if (Math.abs(d) > 0.05 && Math.abs(d) < 40) chars[i].style.marginLeft = `${d.toFixed(2)}px`;
//     }
//   } finally {
//     probe.remove();
//   }
// }

// export default function Hero({ data, play, fallbackTitle = 'SHIVANTA HOMES' }: Props) {
//   const root = useRef<HTMLElement>(null);
//   // Heading is optional (admin can leave it empty — the photograph's own signboard carries the name).
//   const lines = useMemo(() => {
//   const heading = (data?.heading ?? '').trim();
//   return heading ? splitHeading(heading) : [];
// }, [data?.heading]);

// const labelText = (data?.label ?? '').trim(); // optional too — empty hides the location label (and its line)
//   const bare = lines.length === 0 && !labelText; // nothing above the CTAs
//   const traced = !data.videoUrl && !!data.posterUrl; // linework shows only if the photo registers to the traced render
//   const go = (href: string) => (e: React.MouseEvent) => { e.preventDefault(); scrollToHash(href); };

//   useLayoutEffect(() => {
//     const el = root.current;
//     if (!play || !el) return;

//     if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
//       el.classList.add('hero-static');
//       return () => el.classList.remove('hero-static');
//     }

//     const mobile = window.matchMedia('(max-width: 820px)').matches;
//     const nav = document.querySelector<HTMLElement>('.nav');
//     const bg = el.querySelector<HTMLElement>('.hero-bg');
//     const img = el.querySelector<HTMLImageElement>('.hero-zoom img');
//     const video = el.querySelector<HTMLVideoElement>('.hero-zoom video');
//     const svg = el.querySelector<SVGSVGElement>('.hero-blueprint');
//     const titleLines = Array.from(el.querySelectorAll<HTMLElement>('.hero-title .line'));

//     let disposed = false;
//     const cleanups: Array<() => void> = [];
//     let ctx: gsap.Context | null = null;

//     /* Window of the traced render that the uploaded photograph shows (trace units); null until registered. */
//     let reg: TraceWindow | null = null;
//     const refGray = traced && svg ? loadGray(TRACE_REF, 128) : Promise.resolve(null);

//     /* Keep the SVG tracing registered with the photo's object-fit: cover box. */
//     const place = () => {
//       if (!svg || !bg || !reg) return;
//       const cw = bg.clientWidth;
//       const ch = bg.clientHeight;
//       if (!cw || !ch) return;
//       const iw = img?.naturalWidth || TRACE_W;
//       const ih = img?.naturalHeight || TRACE_H;
//       const s = Math.max(cw / iw, ch / ih);
//       const rw = iw * s;
//       const rh = ih * s;
//       const [px, py] = parseObjectPosition(img ? getComputedStyle(img).objectPosition : '50% 50%');
//       svg.setAttribute('viewBox', `${reg.x.toFixed(1)} ${reg.y.toFixed(1)} ${reg.w.toFixed(1)} ${reg.h.toFixed(1)}`);
//       svg.style.left = `${(cw - rw) * px}px`;
//       svg.style.top = `${(ch - rh) * py}px`;
//       svg.style.width = `${rw}px`;
//       svg.style.height = `${rh}px`;
//       const upp = reg.w / rw; // trace units per CSS pixel
//       svg.style.setProperty('--sw-main', (1.6 * upp).toFixed(3));
//       svg.style.setProperty('--sw-thin', (1 * upp).toFixed(3));
//     };
//     const kern = () => { try { titleLines.forEach(matchKerning); } catch { /* spacing falls back to default */ } };

//     try {
//       place();
//       kern();
//       document.fonts?.ready.then(() => { if (!disposed) kern(); });
//       const onFonts = () => { if (!disposed) kern(); };
//       document.fonts?.addEventListener?.('loadingdone', onFonts);
//       cleanups.push(() => document.fonts?.removeEventListener?.('loadingdone', onFonts));

//       let raf = 0;
//       const ro = new ResizeObserver(() => {
//         cancelAnimationFrame(raf);
//         raf = requestAnimationFrame(() => { place(); kern(); });
//       });
//       if (bg) ro.observe(bg);
//       cleanups.push(() => { cancelAnimationFrame(raf); ro.disconnect(); });

//       ctx = gsap.context(() => {
//         const q = gsap.utils.selector(el);
//         const plate = q('.hero-plate');
//         const frame = q('.hero-frame');
//         const zoom = q('.hero-zoom');
//         const linesWrap = q('.hero-lines');
//         const settleTargets = [...zoom, ...linesWrap];
//         const label = q('.hero-label');
//         const chars = q('.hero-title .chi');
//         const accent = q('.hero-accent');
//         const desc = q('.hero-desc');
//         const ctas = q('.hero-ctas .btn');

//         /* ---------- initial states (applied before paint via useLayoutEffect) ---------- */
//         gsap.set(plate, { clipPath: 'inset(50% 50% 50% 50%)' });
//         gsap.set(frame, { top: '50%', right: '50%', bottom: '50%', left: '50%', autoAlpha: 1 });
//         gsap.set(settleTargets, { scale: 1.05, transformOrigin: '50% 50%' });
//         if (label.length) gsap.set(label, { autoAlpha: 0, y: 22 });
//         if (chars.length) gsap.set(chars, { yPercent: mobile ? 70 : 112, rotate: mobile ? 2 : 5, opacity: 0, transformOrigin: '0% 100%' });
//         if (accent.length) gsap.set(accent, { scaleX: 0, autoAlpha: 0 });
//         if (desc.length) gsap.set(desc, { autoAlpha: 0, y: 18 });
//         gsap.set(ctas, { autoAlpha: 0, y: 18 });
//         if (nav) gsap.set(nav, { yPercent: -100, autoAlpha: 0 });

//         // Navigation never waits for the photograph.
//         if (nav) gsap.to(nav, { yPercent: 0, autoAlpha: 1, duration: 0.7, ease: 'power3.out', clearProps: 'transform,opacity,visibility', delay: 1.15 });

//         /* ---------- phase A: bronze linework draws itself (once the photo is located in the traced render) ---------- */
//         let linesOk = false;
//         let mediaOk = false;
//         let started = false;
//         let linesDecided = false;
//         const tryStart = () => {
//           if (started || disposed || !(linesOk && mediaOk)) return;
//           started = true;
//           tlB.play();
//         };
//         const noLines = () => {
//           if (linesDecided) return;
//           linesDecided = true;
//           if (linesWrap.length) gsap.set(linesWrap, { display: 'none' });
//           linesOk = true;
//           tryStart();
//         };
//         const withLines = (w: TraceWindow) => {
//           if (linesDecided || disposed) return;
//           linesDecided = true;
//           reg = w;
//           place();
//           const tlA = gsap.timeline({ delay: 0.05, defaults: { ease: 'power2.inOut' } });
//           const draw = (sel: string, at: number, duration: number, stagger = 0) => {
//             const paths = q<SVGPathElement>(sel).filter((p) => p.getTotalLength() > 0);
//             if (!paths.length) return;
//             paths.forEach((p) => {
//               const len = p.getTotalLength();
//               gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
//             });
//             tlA.to(paths, { strokeDashoffset: 0, duration, stagger }, at);
//           };
//           const guide = q('.bp-guide');
//           gsap.set(guide, { opacity: 0 });
//           tlA.to(guide, { opacity: 0.55, duration: 0.5, ease: 'power1.out' }, 0);
//           draw('.bp-gate .bp-main', 0, 0.85);
//           draw('.bp-gate .bp-sub', 0.22, 0.55, 0.06);
//           if (!mobile) {
//             draw('.bp-wing .bp-main', 0.28, 0.65, 0.08);
//             draw('.bp-wing .bp-thin', 0.55, 0.42, 0.05);
//           }
//           gsap.set(linesWrap, { autoAlpha: 1 });
//           tlA.add(() => { linesOk = true; tryStart(); }, 0.55);
//         };
//         /* Locate the uploaded photograph inside the traced render; unrelated photos get no linework. */
//         const registerLines = async () => {
//           if (!svg || !img || linesDecided) return;
//           try {
//             const ref = await refGray;
//             if (disposed || linesDecided) return;
//             const g = ref ? toGray(img, img.naturalWidth, img.naturalHeight, 128) : null;
//             const w = ref && g ? registerCrop(ref, g, TRACE_W, TRACE_H) : null;
//             if (w) withLines(w);
//             else noLines();
//           } catch {
//             noLines();
//           }
//         };

//         /* ---------- phase B: reveal + settle + typography (waits for the photograph) ---------- */
//         const tlB = gsap.timeline({
//           paused: true,
//           defaults: { ease: 'power3.out' },
//           onComplete: () => {
//             if (linesWrap.length) gsap.set(linesWrap, { display: 'none' });
//             gsap.set(frame, { display: 'none' });
//             ro.disconnect();
//           },
//         });
//         // fromTo: the browser serialises the set value as the shorthand `inset(50%)`, which would break interpolation
//         tlB.fromTo(plate, { clipPath: 'inset(50% 50% 50% 50%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.85, ease: 'power3.inOut', immediateRender: false, clearProps: 'clipPath' }, 0)
//           .to(frame, { top: '0%', right: '0%', bottom: '0%', left: '0%', duration: 0.85, ease: 'power3.inOut' }, 0)
//           .to(frame, { autoAlpha: 0, duration: 0.3, ease: 'power1.out' }, 0.62)
//           .to(settleTargets, { scale: 1, duration: 1.5, ease: 'expo.out', clearProps: 'transform' }, 0);
//         if (linesWrap.length) tlB.to(linesWrap, { autoAlpha: 0, duration: 0.55, ease: 'power1.inOut' }, 0.4);
//         if (label.length) tlB.to(label, { autoAlpha: 1, y: 0, duration: 0.6, clearProps: 'transform' }, 0.55);
//         if (chars.length) {
//           tlB.to(chars, {
//             yPercent: 0, rotate: 0, opacity: 1, duration: 0.8, ease: 'expo.out',
//             stagger: mobile ? 0.025 : 0.03, clearProps: 'transform,opacity',
//           }, 0.62);
//         }
//         if (accent.length) tlB.to(accent, { scaleX: 1, autoAlpha: 1, duration: 0.7 }, chars.length ? 0.95 : 0.75);
//         const ctasAt = chars.length ? 1.05 : label.length ? 0.85 : 0.7; // nothing above the buttons → they come in sooner
//         if (desc.length) tlB.to(desc, { autoAlpha: 1, y: 0, duration: 0.6, clearProps: 'transform,opacity,visibility' }, 1.0);
//         tlB.to(ctas, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.1, clearProps: 'transform,opacity,visibility' }, ctasAt);

//         /* start B once the lines are mostly drawn (or skipped) AND the photograph is decoded (capped) */
//         const mediaReady = () => { mediaOk = true; tryStart(); };
//         if (!svg) noLines();
//         if (video) {
//           if (video.readyState >= 2) mediaReady();
//           else video.addEventListener('loadeddata', mediaReady, { once: true });
//           const t = window.setTimeout(mediaReady, 1500);
//           cleanups.push(() => clearTimeout(t));
//         } else if (img) {
//           let late = false;
//           const fail = () => { el.classList.add('hero-nophoto'); noLines(); mediaReady(); };
//           const show = async () => {
//             if (late && !disposed) gsap.fromTo(img, { opacity: 0 }, { opacity: 1, duration: 0.8, ease: 'power1.out', clearProps: 'opacity' });
//             if (!late) await registerLines();
//             if (!disposed) mediaReady();
//           };
//           const loaded = () => {
//             if (img.naturalWidth === 0) return fail();
//             if (typeof img.decode === 'function') img.decode().then(show, show);
//             else show();
//           };
//           if (img.complete) loaded();
//           else {
//             img.addEventListener('load', loaded, { once: true });
//             img.addEventListener('error', fail, { once: true });
//           }
//           const tl = window.setTimeout(noLines, LINES_WAIT_CAP); // slow photo: skip the blueprint phase
//           const t = window.setTimeout(() => {
//             if (mediaOk) return;
//             late = true; // photograph is slow: reveal a dark plate now, fade the photo in when it arrives
//             noLines();
//             el.classList.add('hero-late');
//             if (!img.complete) gsap.set(img, { opacity: 0 });
//             mediaReady();
//           }, MEDIA_WAIT_CAP);
//           cleanups.push(() => { clearTimeout(tl); clearTimeout(t); });
//         } else { noLines(); mediaReady(); }

//         /* ---------- scroll interaction (desktop only; no pinning) ---------- */
//         if (!mobile) {
//           gsap.to(q('.hero-bg'), {
//             scale: 1.04, ease: 'none', transformOrigin: '50% 50%',
//             scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true },
//           });
//           gsap.to(q('.hero-text'), {
//             y: -70, opacity: 0, ease: 'none',
//             scrollTrigger: { trigger: el, start: 'top top', end: '78% top', scrub: true },
//           });
//         }
//       }, el);
//     } catch (err) {
//       // Animation must never take the content down with it.
//       console.error('[hero] animation init failed — showing static hero', err);
//       el.classList.add('hero-static');
//       nav?.removeAttribute('style');
//     }

//     return () => {
//       disposed = true;
//       cleanups.forEach((f) => f());
//       ctx?.revert();
//       el.classList.remove('hero-static', 'hero-nophoto', 'hero-late');
//       titleLines.forEach((l) => l.querySelectorAll<HTMLElement>('.ch').forEach((c) => { c.style.marginLeft = ''; }));
//       if (svg) { svg.removeAttribute('style'); svg.setAttribute('viewBox', `0 0 ${TRACE_W} ${TRACE_H}`); }
//     };
//   }, [play]);

//   return (
//     <section className={`hero${bare ? ' hero--bare' : ''}`} ref={root}>
//       <div className="hero-bg" aria-hidden="true">
//         <div className="hero-plate">
//           <div className="hero-zoom">
//             {data.videoUrl ? (
//               <video src={data.videoUrl} poster={data.posterUrl} autoPlay muted loop playsInline />
//             ) : data.posterUrl ? (
//               <img src={data.posterUrl} alt="SHIVANTA HOMES entrance, Chavaj, Bharuch" decoding="async" />
//             ) : null}
//           </div>
//         </div>
//         {traced && (
//           <div className="hero-lines">
//             {/* Decorative tracing of a few structural edges of the entrance photograph (2200×1100 space). */}
//             <svg className="hero-blueprint" viewBox={`0 0 ${TRACE_W} ${TRACE_H}`} preserveAspectRatio="none" focusable="false">
//               <g className="bp-guide"><path d="M0 905H2200" /></g>
//               <g className="bp-gate">
//                 <path className="bp-main" d="M690 905V447H1510V905" />
//                 <path className="bp-sub" d="M690 545H1510" />
//                 <path className="bp-sub" d="M790 545V905" />
//                 <path className="bp-sub" d="M1305 545V905" />
//                 <path className="bp-sub" d="M1410 545V905" />
//                 <path className="bp-sub bp-thin" d="M705 465H1495" />
//                 <path className="bp-sub bp-thin" d="M705 525H1495" />
//                 <path className="bp-sub" d="M790 750H1305" />
//                 <path className="bp-sub bp-thin" d="M1322 700H1395V835H1322Z" />
//               </g>
//               <g className="bp-wing bp-left">
//                 <path className="bp-main" d="M845 450V372H0" />
//                 <path className="bp-main" d="M250 372V262H660V372" />
//                 <path className="bp-thin" d="M50 462H225V662H50Z" />
//                 <path className="bp-thin" d="M340 462H530V662H340Z" />
//               </g>
//               <g className="bp-wing bp-right">
//                 <path className="bp-main" d="M1400 410H1440V325H2200" />
//                 <path className="bp-main" d="M1630 325V225H2040V325" />
//                 <path className="bp-thin" d="M1670 445H1840V665H1670Z" />
//                 <path className="bp-thin" d="M2010 445H2185V665H2010Z" />
//               </g>
//             </svg>
//           </div>
//         )}
//         <div className="hero-frame" />
//       </div>

//       <div className={`container hero-content${bare ? ' hero-content--bare' : ''}`}>
//         <div className="hero-text">
//           {lines.length === 0 && <h1 className="sr-only">{fallbackTitle}</h1>}
//           {labelText && <span className="hero-label">{labelText}</span>}
//           {lines.length > 0 && (
//           <h1 className="hero-title">
//             <span className="sr-only">{lines.join(' ')}</span>
//             {lines.map((line, i) => (
//               <span className="line" key={i} aria-hidden="true">
//                 {Array.from(line).map((ch, j) => (
//                   <span className="ch" key={j}>
//                     <span className="chi">{ch === ' ' ? '\u00A0' : ch}</span>
//                   </span>
//                 ))}
//               </span>
//             ))}
//           </h1>
//           )}
//           {lines.length > 0 && <span className="hero-accent" aria-hidden="true" />}
//         </div>
//         {data.description && <p className="hero-desc">{data.description}</p>}
//         <div className="hero-ctas">
//           <a className="btn btn-primary" href={data.primaryCta.href} onClick={go(data.primaryCta.href)}>
//             {data.primaryCta.text} <Icon name="arrow" size={16} className="cta-arrow" />
//           </a>
//           <a className="btn btn-ghost on-dark" href={data.secondaryCta.href} onClick={go(data.secondaryCta.href)}>
//             {data.secondaryCta.text}
//           </a>
//         </div>
//       </div>

//     </section>
//   );
// }
import { useLayoutEffect, useMemo, useRef } from 'react';
import { gsap, scrollToHash } from '../lib/smooth';
import { Icon } from '../lib/icons';
import type { Hero as HeroData } from '../lib/types';
import { registerCrop, toGray, loadGray, type Window as TraceWindow } from '../lib/traceRegister';
import { TRACE_REF } from '../lib/traceRef';
import './Hero.css';

/**
 * SHIVANTA HOMES hero — "Architectural Blueprint → Reality".
 *
 * Opening sequence (≈2.4 s, integrated — never blocks nav/scroll):
 *   ivory canvas → bronze linework traces the gate / rooflines →
 *   photo revealed from the centre by a rectangular mask (lines fade) →
 *   photo settles 1.05 → 1 → letters of "SHIVANTA HOMES" rise inside
 *   line masks → label / copy / CTAs overlap in.
 *
 * Wrapper roles (kept separate to avoid transform conflicts):
 *   .hero-bg     scroll zoom 1 → 1.04 (desktop, ScrollTrigger)
 *   .hero-plate  clip-path reveal mask (+ readability gradients)
 *   .hero-zoom   entrance settle 1.05 → 1
 *   .hero-lines  SVG tracing, scaled in sync with .hero-zoom so it stays registered
 *   .hero-text   scroll exit motion (y / opacity) for label + title + accent
 */

/* Natural size of the original entrance render — the tracing coordinates below live in this space.
 * The linework is registered to whatever crop/export of that render the admin uploads (traceRegister.ts). */
const TRACE_W = 2200;
const TRACE_H = 1100;
/* If the photograph is not decoded by then, reveal anyway (dark plate) and fade it in later. */
const MEDIA_WAIT_CAP = 2500;
/* If the photograph is not decoded by then, skip the blueprint phase (lines need the photo to register). */
const LINES_WAIT_CAP = 1200;

type Props = { data: HeroData; play: boolean; fallbackTitle?: string };

function splitHeading(heading?: string): string[] {
  const safeHeading = (heading ?? '').trim();

  if (!safeHeading) return [];

  if (safeHeading.includes(',')) {
    return safeHeading
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
  }

  return safeHeading
    .split(/\s+/)
    .reduce<string[][]>((ls, w) => {
      const last = ls[ls.length - 1];
      if (last && last.join(' ').length < 12) last.push(w);
      else ls.push([w]);
      return ls;
    }, [])
    .map((l) => l.join(' '))
    .flatMap((l) => {
      const ws = l.split(' ');
      if (ws.length > 1 && l.length > 12) {
        const mid = Math.ceil(ws.length / 2);
        return [ws.slice(0, mid).join(' '), ws.slice(mid).join(' ')];
      }
      return [l];
    });
}

/** object-position ("50% 42%", "center top", …) → fractions; unknown units fall back to centre. */
function parseObjectPosition(value: string): [number, number] {
  const kw: Record<string, number> = { left: 0, top: 0, center: 0.5, right: 1, bottom: 1 };
  const parts = (value ?? '').trim().split(/\s+/);
  const conv = (p: string | undefined) => {
    if (!p) return 0.5;
    if (p in kw) return kw[p];
    if (p.endsWith('%')) return Math.min(1, Math.max(0, parseFloat(p) / 100));
    return 0.5;
  };
  return [conv(parts[0]), conv(parts[1] ?? parts[0])];
}

/**
 * Splitting letters into inline-blocks disables font kerning (AV, TA…).
 * Measure the advances of the un-split line and give each letter the
 * kerning difference as margin-left so spacing matches the plain heading.
 */
function matchKerning(line: HTMLElement) {
  const chars = Array.from(line.querySelectorAll<HTMLElement>('.ch'));
  if (chars.length < 2) return;
  chars.forEach((c) => { c.style.marginLeft = ''; });
  const text = chars.map((c) => c.textContent ?? '').join('');
  const probe = document.createElement('span');
  probe.className = 'hero-kern-probe';
  probe.textContent = text;
  line.appendChild(probe);
  try {
    const node = probe.firstChild as Text;
    const range = document.createRange();
    const kerned: number[] = [];
    for (let i = 0; i < text.length; i++) {
      range.setStart(node, i);
      range.setEnd(node, i + 1);
      kerned.push(range.getBoundingClientRect().left);
    }
    const split = chars.map((c) => c.getBoundingClientRect().left);
    for (let i = 1; i < chars.length; i++) {
      const d = (kerned[i] - kerned[i - 1]) - (split[i] - split[i - 1]);
      if (Math.abs(d) > 0.05 && Math.abs(d) < 40) chars[i].style.marginLeft = `${d.toFixed(2)}px`;
    }
  } finally {
    probe.remove();
  }
}

export default function Hero({ data, play, fallbackTitle = 'SHIVANTA HOMES' }: Props) {
  const root = useRef<HTMLElement>(null);
  // Heading is optional (admin can leave it empty — the photograph's own signboard carries the name).
  const lines = useMemo(() => {
    const heading = (data?.heading ?? '').trim();
    return splitHeading(heading);
  }, [data?.heading]);

  const labelText = (data?.label ?? '').trim(); // optional too — empty hides the location label (and its line)
  const bare = lines.length === 0 && !labelText; // nothing above the CTAs
  const traced = !data.videoUrl && !!data.posterUrl; // linework shows only if the photo registers to the traced render
  const go = (href: string) => (e: React.MouseEvent) => { e.preventDefault(); scrollToHash(href); };

  useLayoutEffect(() => {
    const el = root.current;
    if (!play || !el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('hero-static');
      return () => el.classList.remove('hero-static');
    }

    const mobile = window.matchMedia('(max-width: 820px)').matches;
    const nav = document.querySelector<HTMLElement>('.nav');
    const bg = el.querySelector<HTMLElement>('.hero-bg');
    const img = el.querySelector<HTMLImageElement>('.hero-zoom img');
    const video = el.querySelector<HTMLVideoElement>('.hero-zoom video');
    const svg = el.querySelector<SVGSVGElement>('.hero-blueprint');
    const titleLines = Array.from(el.querySelectorAll<HTMLElement>('.hero-title .line'));

    let disposed = false;
    const cleanups: Array<() => void> = [];
    let ctx: gsap.Context | null = null;

    /* Window of the traced render that the uploaded photograph shows (trace units); null until registered. */
    let reg: TraceWindow | null = null;
    const refGray = traced && svg ? loadGray(TRACE_REF, 128) : Promise.resolve(null);

    /* Keep the SVG tracing registered with the photo's object-fit: cover box. */
    const place = () => {
      if (!svg || !bg || !reg) return;
      const cw = bg.clientWidth;
      const ch = bg.clientHeight;
      if (!cw || !ch) return;
      const iw = img?.naturalWidth || TRACE_W;
      const ih = img?.naturalHeight || TRACE_H;
      const s = Math.max(cw / iw, ch / ih);
      const rw = iw * s;
      const rh = ih * s;
      const [px, py] = parseObjectPosition(img ? getComputedStyle(img).objectPosition : '50% 50%');
      svg.setAttribute('viewBox', `${reg.x.toFixed(1)} ${reg.y.toFixed(1)} ${reg.w.toFixed(1)} ${reg.h.toFixed(1)}`);
      svg.style.left = `${(cw - rw) * px}px`;
      svg.style.top = `${(ch - rh) * py}px`;
      svg.style.width = `${rw}px`;
      svg.style.height = `${rh}px`;
      const upp = reg.w / rw; // trace units per CSS pixel
      svg.style.setProperty('--sw-main', (1.6 * upp).toFixed(3));
      svg.style.setProperty('--sw-thin', (1 * upp).toFixed(3));
    };
    const kern = () => { try { titleLines.forEach(matchKerning); } catch { /* spacing falls back to default */ } };

    try {
      place();
      kern();
      document.fonts?.ready.then(() => { if (!disposed) kern(); });
      const onFonts = () => { if (!disposed) kern(); };
      document.fonts?.addEventListener?.('loadingdone', onFonts);
      cleanups.push(() => document.fonts?.removeEventListener?.('loadingdone', onFonts));

      let raf = 0;
      const ro = new ResizeObserver(() => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => { place(); kern(); });
      });
      if (bg) ro.observe(bg);
      cleanups.push(() => { cancelAnimationFrame(raf); ro.disconnect(); });

      ctx = gsap.context(() => {
        const q = gsap.utils.selector(el);
        const plate = q('.hero-plate');
        const frame = q('.hero-frame');
        const zoom = q('.hero-zoom');
        const linesWrap = q('.hero-lines');
        const settleTargets = [...zoom, ...linesWrap];
        const label = q('.hero-label');
        const chars = q('.hero-title .chi');
        const accent = q('.hero-accent');
        const desc = q('.hero-desc');
        const ctas = q('.hero-ctas .btn');

        /* ---------- initial states (applied before paint via useLayoutEffect) ---------- */
        gsap.set(plate, { clipPath: 'inset(50% 50% 50% 50%)' });
        gsap.set(frame, { top: '50%', right: '50%', bottom: '50%', left: '50%', autoAlpha: 1 });
        gsap.set(settleTargets, { scale: 1.05, transformOrigin: '50% 50%' });
        if (label.length) gsap.set(label, { autoAlpha: 0, y: 22 });
        if (chars.length) gsap.set(chars, { yPercent: mobile ? 70 : 112, rotate: mobile ? 2 : 5, opacity: 0, transformOrigin: '0% 100%' });
        if (accent.length) gsap.set(accent, { scaleX: 0, autoAlpha: 0 });
        if (desc.length) gsap.set(desc, { autoAlpha: 0, y: 18 });
        gsap.set(ctas, { autoAlpha: 0, y: 18 });
        if (nav) gsap.set(nav, { yPercent: -100, autoAlpha: 0 });

        // Navigation never waits for the photograph.
        if (nav) gsap.to(nav, { yPercent: 0, autoAlpha: 1, duration: 0.7, ease: 'power3.out', clearProps: 'transform,opacity,visibility', delay: 1.15 });

        /* ---------- phase A: bronze linework draws itself (once the photo is located in the traced render) ---------- */
        let linesOk = false;
        let mediaOk = false;
        let started = false;
        let linesDecided = false;
        const tryStart = () => {
          if (started || disposed || !(linesOk && mediaOk)) return;
          started = true;
          tlB.play();
        };
        const noLines = () => {
          if (linesDecided) return;
          linesDecided = true;
          if (linesWrap.length) gsap.set(linesWrap, { display: 'none' });
          linesOk = true;
          tryStart();
        };
        const withLines = (w: TraceWindow) => {
          if (linesDecided || disposed) return;
          linesDecided = true;
          reg = w;
          place();
          const tlA = gsap.timeline({ delay: 0.05, defaults: { ease: 'power2.inOut' } });
          const draw = (sel: string, at: number, duration: number, stagger = 0) => {
            const paths = q<SVGPathElement>(sel).filter((p) => p.getTotalLength() > 0);
            if (!paths.length) return;
            paths.forEach((p) => {
              const len = p.getTotalLength();
              gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
            });
            tlA.to(paths, { strokeDashoffset: 0, duration, stagger }, at);
          };
          const guide = q('.bp-guide');
          gsap.set(guide, { opacity: 0 });
          tlA.to(guide, { opacity: 0.55, duration: 0.5, ease: 'power1.out' }, 0);
          draw('.bp-gate .bp-main', 0, 0.85);
          draw('.bp-gate .bp-sub', 0.22, 0.55, 0.06);
          if (!mobile) {
            draw('.bp-wing .bp-main', 0.28, 0.65, 0.08);
            draw('.bp-wing .bp-thin', 0.55, 0.42, 0.05);
          }
          gsap.set(linesWrap, { autoAlpha: 1 });
          tlA.add(() => { linesOk = true; tryStart(); }, 0.55);
        };
        /* Locate the uploaded photograph inside the traced render; unrelated photos get no linework. */
        const registerLines = async () => {
          if (!svg || !img || linesDecided) return;
          try {
            const ref = await refGray;
            if (disposed || linesDecided) return;
            const g = ref ? toGray(img, img.naturalWidth, img.naturalHeight, 128) : null;
            const w = ref && g ? registerCrop(ref, g, TRACE_W, TRACE_H) : null;
            if (w) withLines(w);
            else noLines();
          } catch {
            noLines();
          }
        };

        /* ---------- phase B: reveal + settle + typography (waits for the photograph) ---------- */
        const tlB = gsap.timeline({
          paused: true,
          defaults: { ease: 'power3.out' },
          onComplete: () => {
            if (linesWrap.length) gsap.set(linesWrap, { display: 'none' });
            gsap.set(frame, { display: 'none' });
            ro.disconnect();
          },
        });
        // fromTo: the browser serialises the set value as the shorthand `inset(50%)`, which would break interpolation
        tlB.fromTo(plate, { clipPath: 'inset(50% 50% 50% 50%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.85, ease: 'power3.inOut', immediateRender: false, clearProps: 'clipPath' }, 0)
          .to(frame, { top: '0%', right: '0%', bottom: '0%', left: '0%', duration: 0.85, ease: 'power3.inOut' }, 0)
          .to(frame, { autoAlpha: 0, duration: 0.3, ease: 'power1.out' }, 0.62)
          .to(settleTargets, { scale: 1, duration: 1.5, ease: 'expo.out', clearProps: 'transform' }, 0);
        if (linesWrap.length) tlB.to(linesWrap, { autoAlpha: 0, duration: 0.55, ease: 'power1.inOut' }, 0.4);
        if (label.length) tlB.to(label, { autoAlpha: 1, y: 0, duration: 0.6, clearProps: 'transform' }, 0.55);
        if (chars.length) {
          tlB.to(chars, {
            yPercent: 0, rotate: 0, opacity: 1, duration: 0.8, ease: 'expo.out',
            stagger: mobile ? 0.025 : 0.03, clearProps: 'transform,opacity',
          }, 0.62);
        }
        if (accent.length) tlB.to(accent, { scaleX: 1, autoAlpha: 1, duration: 0.7 }, chars.length ? 0.95 : 0.75);
        const ctasAt = chars.length ? 1.05 : label.length ? 0.85 : 0.7; // nothing above the buttons → they come in sooner
        if (desc.length) tlB.to(desc, { autoAlpha: 1, y: 0, duration: 0.6, clearProps: 'transform,opacity,visibility' }, 1.0);
        tlB.to(ctas, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.1, clearProps: 'transform,opacity,visibility' }, ctasAt);

        /* start B once the lines are mostly drawn (or skipped) AND the photograph is decoded (capped) */
        const mediaReady = () => { mediaOk = true; tryStart(); };
        if (!svg) noLines();
        if (video) {
          if (video.readyState >= 2) mediaReady();
          else video.addEventListener('loadeddata', mediaReady, { once: true });
          const t = window.setTimeout(mediaReady, 1500);
          cleanups.push(() => clearTimeout(t));
        } else if (img) {
          let late = false;
          const fail = () => { el.classList.add('hero-nophoto'); noLines(); mediaReady(); };
          const show = async () => {
            if (late && !disposed) gsap.fromTo(img, { opacity: 0 }, { opacity: 1, duration: 0.8, ease: 'power1.out', clearProps: 'opacity' });
            if (!late) await registerLines();
            if (!disposed) mediaReady();
          };
          const loaded = () => {
            if (img.naturalWidth === 0) return fail();
            if (typeof img.decode === 'function') img.decode().then(show, show);
            else show();
          };
          if (img.complete) loaded();
          else {
            img.addEventListener('load', loaded, { once: true });
            img.addEventListener('error', fail, { once: true });
          }
          const tl = window.setTimeout(noLines, LINES_WAIT_CAP); // slow photo: skip the blueprint phase
          const t = window.setTimeout(() => {
            if (mediaOk) return;
            late = true; // photograph is slow: reveal a dark plate now, fade the photo in when it arrives
            noLines();
            el.classList.add('hero-late');
            if (!img.complete) gsap.set(img, { opacity: 0 });
            mediaReady();
          }, MEDIA_WAIT_CAP);
          cleanups.push(() => { clearTimeout(tl); clearTimeout(t); });
        } else { noLines(); mediaReady(); }

        /* ---------- scroll interaction (desktop only; no pinning) ---------- */
        if (!mobile) {
          gsap.to(q('.hero-bg'), {
            scale: 1.04, ease: 'none', transformOrigin: '50% 50%',
            scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true },
          });
          gsap.to(q('.hero-text'), {
            y: -70, opacity: 0, ease: 'none',
            scrollTrigger: { trigger: el, start: 'top top', end: '78% top', scrub: true },
          });
        }
      }, el);
    } catch (err) {
      // Animation must never take the content down with it.
      console.error('[hero] animation init failed — showing static hero', err);
      el.classList.add('hero-static');
      nav?.removeAttribute('style');
    }

    return () => {
      disposed = true;
      cleanups.forEach((f) => f());
      ctx?.revert();
      el.classList.remove('hero-static', 'hero-nophoto', 'hero-late');
      titleLines.forEach((l) => l.querySelectorAll<HTMLElement>('.ch').forEach((c) => { c.style.marginLeft = ''; }));
      if (svg) { svg.removeAttribute('style'); svg.setAttribute('viewBox', `0 0 ${TRACE_W} ${TRACE_H}`); }
    };
  }, [play]);

  return (
    <section className={`hero${bare ? ' hero--bare' : ''}`} ref={root}>
      <div className="hero-bg" aria-hidden="true">
        <div className="hero-plate">
          <div className="hero-zoom">
            {data.videoUrl ? (
              <video src={data.videoUrl} poster={data.posterUrl} autoPlay muted loop playsInline />
            ) : data.posterUrl ? (
              <img src={data.posterUrl} alt="SHIVANTA HOMES entrance, Chavaj, Bharuch" decoding="async" />
            ) : null}
          </div>
        </div>
        {traced && (
          <div className="hero-lines">
            {/* Decorative tracing of a few structural edges of the entrance photograph (2200×1100 space). */}
            <svg className="hero-blueprint" viewBox={`0 0 ${TRACE_W} ${TRACE_H}`} preserveAspectRatio="none" focusable="false">
              <g className="bp-guide"><path d="M0 905H2200" /></g>
              <g className="bp-gate">
                <path className="bp-main" d="M690 905V447H1510V905" />
                <path className="bp-sub" d="M690 545H1510" />
                <path className="bp-sub" d="M790 545V905" />
                <path className="bp-sub" d="M1305 545V905" />
                <path className="bp-sub" d="M1410 545V905" />
                <path className="bp-sub bp-thin" d="M705 465H1495" />
                <path className="bp-sub bp-thin" d="M705 525H1495" />
                <path className="bp-sub" d="M790 750H1305" />
                <path className="bp-sub bp-thin" d="M1322 700H1395V835H1322Z" />
              </g>
              <g className="bp-wing bp-left">
                <path className="bp-main" d="M845 450V372H0" />
                <path className="bp-main" d="M250 372V262H660V372" />
                <path className="bp-thin" d="M50 462H225V662H50Z" />
                <path className="bp-thin" d="M340 462H530V662H340Z" />
              </g>
              <g className="bp-wing bp-right">
                <path className="bp-main" d="M1400 410H1440V325H2200" />
                <path className="bp-main" d="M1630 325V225H2040V325" />
                <path className="bp-thin" d="M1670 445H1840V665H1670Z" />
                <path className="bp-thin" d="M2010 445H2185V665H2010Z" />
              </g>
            </svg>
          </div>
        )}
        <div className="hero-frame" />
      </div>

      <div className={`container hero-content${bare ? ' hero-content--bare' : ''}`}>
        <div className="hero-text">
          {lines.length === 0 && <h1 className="sr-only">{fallbackTitle}</h1>}
          {labelText && <span className="hero-label">{labelText}</span>}
          {lines.length > 0 && (
          <h1 className="hero-title">
            <span className="sr-only">{lines.join(' ')}</span>
            {lines.map((line, i) => (
              <span className="line" key={i} aria-hidden="true">
                {Array.from(line).map((ch, j) => (
                  <span className="ch" key={j}>
                    <span className="chi">{ch === ' ' ? '\u00A0' : ch}</span>
                  </span>
                ))}
              </span>
            ))}
          </h1>
          )}
          {lines.length > 0 && <span className="hero-accent" aria-hidden="true" />}
        </div>
        {data.description && <p className="hero-desc">{data.description}</p>}
        <div className="hero-ctas">
          <a className="btn btn-primary" href={data.primaryCta.href} onClick={go(data.primaryCta.href)}>
            {data.primaryCta.text} <Icon name="arrow" size={16} className="cta-arrow" />
          </a>
          <a className="btn btn-ghost on-dark" href={data.secondaryCta.href} onClick={go(data.secondaryCta.href)}>
            {data.secondaryCta.text}
          </a>
        </div>
      </div>

    </section>
  );
}
