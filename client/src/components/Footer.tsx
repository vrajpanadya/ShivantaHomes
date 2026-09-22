import { useEffect, useRef } from 'react';
import { usePublic } from '../lib/usePublic';
import { FALLBACK } from '../lib/fallback';
import { scrollToHash } from '../lib/smooth';
import { Icon } from '../lib/icons';
import type { Settings } from '../lib/types';

export default function Footer() {
  const { data: s } = usePublic<Settings>('/settings', FALLBACK.settings);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /* Oryzo-style interactive particle field */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let w = 0, h = 0, raf = 0, running = false;
    const DPR = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * DPR; canvas.height = h * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    resize();
    const parts = Array.from({ length: 56 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: Math.random() * 1.8 + 0.6,
      vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
      a: Math.random() * 0.45 + 0.12,
    }));
    const mouse = { x: -9999, y: -9999 };
    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    const loop = () => {
      if (!running) { raf = 0; return; }
      raf = requestAnimationFrame(loop);
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < 12000) { const d = Math.sqrt(d2) || 1; p.x += (dx / d) * 0.7; p.y += (dy / d) * 0.7; }
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,146,66,${p.a})`; ctx.fill();
      }
      for (let i = 0; i < parts.length; i++) {
        for (let j = i + 1; j < parts.length; j++) {
          const a = parts[i], b = parts[j];
          const dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
          if (d2 < 9000) {
            ctx.strokeStyle = `rgba(156,112,96,${0.16 * (1 - d2 / 9000)})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
    };
    const io = new IntersectionObserver(([en]) => {
      running = en.isIntersecting;
      if (running && !raf) loop();
    });
    io.observe(canvas);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => {
      running = false; cancelAnimationFrame(raf);
      io.disconnect(); ro.disconnect();
      window.removeEventListener('mousemove', onMove);
    };
  }, []);
  const go = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    scrollToHash(href);
  };
  return (
    <footer className="footer">
      <canvas ref={canvasRef} className="particles" aria-hidden="true" />
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="brand" style={{ marginBottom: 14 }}>
              <img src="/media/mark.jpg" alt="" style={{ height: 44, borderRadius: 8 }} />
              <span>
                <span className="b-name" style={{ display: 'block', color: '#fff', lineHeight: 1 }}>SHIVANTA</span>
                <span className="b-sub">HOMES</span>
              </span>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.8, maxWidth: 340 }}>{s.footerText}</p>
            <div className="socials">
              {s.instagram && <a href={s.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"><Icon name="instagram" size={16} /></a>}
              {s.facebook && <a href={s.facebook} target="_blank" rel="noreferrer" aria-label="Facebook"><Icon name="facebook" size={16} /></a>}
              <a href={`https://wa.me/${s.whatsapp}`} target="_blank" rel="noreferrer" aria-label="WhatsApp"><Icon name="whatsapp" size={16} /></a>
            </div>
          </div>
          <div>
            <h4>Explore</h4>
            {[['#overview', 'Project Overview'], ['#residences', 'Residences'], ['#amenities', 'Amenities'], ['#gallery', 'Gallery'], ['#plans', 'Floor Plans'], ['#location', 'Location']].map(([h, l]) => (
              <a key={h} href={h} onClick={go(h)}>{l}</a>
            ))}
          </div>
          <div>
            <h4>Contact</h4>
            <a href={`tel:${s.phone.replace(/\s/g, '')}`}><Icon name="phone" size={13} style={{ display: 'inline', marginRight: 8 }} />{s.phone}</a>
            <a href={s.mapsLink} target="_blank" rel="noreferrer"><Icon name="pin" size={13} style={{ display: 'inline', marginRight: 8 }} />{s.address}</a>
            <a href="#contact" onClick={go('#contact')}><Icon name="calendar" size={13} style={{ display: 'inline', marginRight: 8 }} />Book a site visit</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>{s.copyright}</span>
          <span>{s.tagline}</span>
        </div>
      </div>
    </footer>
  );
}
