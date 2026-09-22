import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;

export function initLenis() {
  if (lenis) return lenis;
  lenis = new Lenis({ smoothWheel: true, lerp: 0.1 });
  lenis.on('scroll', () => ScrollTrigger.update());
  const raf = (time: number) => lenis?.raf(time * 1000);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

export function destroyLenis() {
  if (lenis) {
    lenis.destroy();
    lenis = null;
  }
}

export function scrollToHash(hash: string) {
  const el = document.querySelector(hash);
  if (!el) return;
  if (lenis) lenis.scrollTo(el as HTMLElement, { offset: -70, duration: 1.4 });
  else el.scrollIntoView({ behavior: 'smooth' });
}

/** Locks page scrolling (Lenis + body) while the mobile menu is open. */
export function lockScroll(lock: boolean) {
  if (lenis) {
    if (lock) lenis.stop();
    else lenis.start();
  }
  document.body.style.overflow = lock ? 'hidden' : '';
  document.body.classList.toggle('menu-lock', lock);
}

export { gsap, ScrollTrigger };
