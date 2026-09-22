import { useEffect, useMemo, useRef, useState } from 'react';
import { usePublic } from '../lib/usePublic';
import { FALLBACK } from '../lib/fallback';
import { gsap, ScrollTrigger, initLenis, destroyLenis, scrollToHash } from '../lib/smooth';
import { Icon } from '../lib/icons';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import EnquiryForm from '../components/EnquiryForm';
import PhotoWall from '../components/PhotoWall';
import HeroSection from '../components/Hero';
import type { Hero, Overview, Residence, Amenity, GalleryItem, ProjectVideo, FloorPlan, Specification, LocationInfo, Brochure, Settings, Seo } from '../lib/types';

const GALLERY_CATS = ['All', 'Architecture', 'Lifestyle', 'Garden', 'Streetscape', 'Evening Views', 'Plans'];

export default function Home() {
  const root = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [cat, setCat] = useState('All');
  const [lightbox, setLightbox] = useState<number | null>(null);

  const { data: hero, loading: l1 } = usePublic<Hero>('/hero', FALLBACK.hero);
  const { data: overview, loading: l2 } = usePublic<Overview>('/project-overview', FALLBACK.overview);
  const { data: residences } = usePublic<Residence[]>('/residences', []);
  const { data: amenities } = usePublic<Amenity[]>('/amenities', []);
  const { data: gallery } = usePublic<GalleryItem[]>('/gallery', []);
  const { data: videos } = usePublic<ProjectVideo[]>('/videos', []);
  const { data: plans } = usePublic<FloorPlan[]>('/floor-plans', []);
  const { data: specs } = usePublic<Specification[]>('/specifications', []);
  const { data: location, loading: l3 } = usePublic<LocationInfo>('/location', FALLBACK.location);
  const { data: brochure } = usePublic<Brochure>('/brochure', FALLBACK.brochure);
  const { data: settings } = usePublic<Settings>('/settings', FALLBACK.settings);
  const { data: seo } = usePublic<Seo>('/seo', FALLBACK.seo);

  /* Loader + Lenis lifecycle — the hero photograph is warmed up behind the loader (capped below). */
  const [posterReady, setPosterReady] = useState(false);
  useEffect(() => {
    if (l1) return;
    if (!hero.posterUrl) { setPosterReady(true); return; }
    let live = true;
    const im = new Image();
    im.onload = im.onerror = () => { if (live) setPosterReady(true); };
    im.src = hero.posterUrl;
    if (im.complete) setPosterReady(true);
    return () => { live = false; };
  }, [l1, hero.posterUrl]);
  useEffect(() => {
    if (!l1 && !l2 && !l3 && posterReady) setReady(true);
  }, [l1, l2, l3, posterReady]);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 2500); // never trap the visitor
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    initLenis();
    return () => destroyLenis();
  }, []);

  /* SEO */
  useEffect(() => {
    document.title = seo.title;
    const setMeta = (attr: 'name' | 'property', key: string, content: string) => {
      let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.content = content;
    };
    setMeta('name', 'description', seo.description);
    setMeta('name', 'keywords', seo.keywords);
    setMeta('name', 'robots', seo.index ? 'index, follow' : 'noindex, nofollow');
    setMeta('property', 'og:title', seo.title);
    setMeta('property', 'og:description', seo.description);
    setMeta('property', 'og:image', seo.ogImage);
    setMeta('property', 'og:type', 'website');
    let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (seo.canonical) {
      if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
      }
      link.href = seo.canonical;
    }
    const ld = document.getElementById('sh-jsonld') ?? document.createElement('script');
    ld.id = 'sh-jsonld';
    (ld as HTMLScriptElement).type = 'application/ld+json';
    (ld as HTMLScriptElement).text = JSON.stringify(seo.structuredData ?? {});
    if (!ld.isConnected) document.head.appendChild(ld);
  }, [seo]);

  const stackItems = useMemo(() => {
    const featured = gallery.filter((g) => g.featured);
    const list = featured.length >= 2 ? featured : gallery.slice(0, 3);
    return list.slice(0, 4);
  }, [gallery]);

  /* ============================ SCROLL ANIMATIONS ============================ */
  useEffect(() => {
    if (!ready) return;

    // Accessibility: honour reduced-motion preferences.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.classList.add('no-anim');
      return;
    }

    const ctx = gsap.context(() => {
      /* --- top scroll progress bar --- */
      gsap.to('.scroll-progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

      /* (hero entrance + hero scroll effects live in components/Hero.tsx) */

      /* --- per-character cascade reveals on section titles (oryzo-style) --- */
      gsap.utils.toArray<HTMLElement>('[data-split]').forEach((el) => {
        // words stay unbreakable (.w) so lines only wrap at spaces; letters animate individually (.ci)
        el.innerHTML = (el.textContent ?? '').trim().split(/\s+/)
          .map((word) => `<span class="w">${word.split('').map((ch) => `<span class="c"><span class="ci">${ch}</span></span>`).join('')}</span>`)
          .join('<span class="sp"> </span>');
        gsap.to(el.querySelectorAll('.ci'), {
          y: 0, rotate: 0, duration: 0.8, stagger: 0.018, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 87%' },
        });
      });

      /* --- scramble-decode kickers --- */
      const GLYPHS = 'SHIVANTA•✦<>*';
      gsap.utils.toArray<HTMLElement>('.kicker').forEach((el) => {
        const original = el.textContent ?? '';
        const state = { p: 0 };
        gsap.to(state, {
          p: 1, duration: 1.1, ease: 'none',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          onUpdate: () => {
            const reveal = Math.floor(state.p * original.length);
            el.textContent = original
              .split('')
              .map((ch, i) => (i < reveal || ch === ' ' ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
              .join('');
          },
          onComplete: () => { el.textContent = original; },
        });
      });

      /* --- scrub-driven word highlight statement --- */
      gsap.utils.toArray<HTMLElement>('[data-highlight]').forEach((el) => {
        const words = (el.textContent ?? '').trim().split(/\s+/);
        el.innerHTML = words.map((w) => `<span class="hw">${w}</span>`).join(' ');
        const spans = Array.from(el.querySelectorAll<HTMLElement>('.hw'));
        ScrollTrigger.create({
          trigger: el, start: 'top 72%', end: 'bottom 42%', scrub: 0.5,
          onUpdate: (self) => {
            const n = Math.round(self.progress * spans.length);
            spans.forEach((s, i) => s.classList.toggle('lit', i < n));
          },
        });
      });

      /* --- curtain (clip-path) image reveals + inner zoom --- */
      gsap.utils.toArray<HTMLElement>('[data-curtain]').forEach((el) => {
        const img = el.querySelector('img');
        gsap.fromTo(el, { clipPath: 'inset(0 0 100% 0)' }, {
          clipPath: 'inset(0 0 0% 0)', duration: 1.1, ease: 'power3.inOut',
          scrollTrigger: { trigger: el, start: 'top 82%' },
        });
        if (img) {
          gsap.fromTo(img, { scale: 1.35 }, {
            scale: 1, duration: 1.7, ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 82%' },
          });
        }
      });

      /* --- animated counters --- */
      gsap.utils.toArray<HTMLElement>('[data-count]').forEach((el) => {
        const raw = el.dataset.count ?? '';
        const m = raw.match(/^([\d.]+)(.*)$/);
        if (!m) return;
        const target = parseFloat(m[1]);
        const suffix = m[2];
        const state = { v: 0 };
        gsap.to(state, {
          v: target, duration: 1.6, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 88%' },
          onUpdate: () => {
            el.textContent = (Number.isInteger(target) ? Math.round(state.v) : state.v.toFixed(1)) + suffix;
          },
        });
      });

      /* --- generic fade-up reveals --- */
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
        if (el.closest('[data-stagger]') || el.closest('.amenities-grid') || el.closest('.gallery-grid')) return;
        gsap.to(el, {
          opacity: 1, y: 0, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%' },
          delay: Number(el.dataset.delay ?? 0),
        });
      });
      gsap.utils.toArray<HTMLElement>('[data-stagger]').forEach((parent) => {
        gsap.to(parent.children, {
          opacity: 1, y: 0, duration: 0.9, stagger: 0.07, ease: 'power3.out',
          scrollTrigger: { trigger: parent, start: 'top 86%' },
        });
      });

      /* --- parallax depths --- */
      gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
        gsap.fromTo(el, { yPercent: -8 }, {
          yPercent: 8, ease: 'none',
          scrollTrigger: { trigger: el.parentElement as HTMLElement, start: 'top bottom', end: 'bottom top', scrub: true },
        });
      });

      /* --- stacked cards: scale + dim as the next card covers --- */
      const cards = gsap.utils.toArray<HTMLElement>('.stack-card');
      cards.forEach((card, i) => {
        if (i >= cards.length - 1) return;
        gsap.to(card, {
          scale: 0.93, filter: 'brightness(0.55)', ease: 'none',
          scrollTrigger: { trigger: cards[i + 1], start: 'top 95%', end: 'top 25%', scrub: true },
        });
      });

      /* --- amenity cards: springy scattered pop-in --- */
      if (document.querySelector('.amenities-grid')) {
        gsap.from('.amenity-card', {
          opacity: 0, y: 46, scale: 0.95,
          rotation: (i: number) => (i % 2 ? 1.6 : -1.6),
          duration: 0.8, stagger: 0.06, ease: 'power3.out',
          scrollTrigger: { trigger: '.amenities-grid', start: 'top 85%' },
        });
      }

      /* --- gallery: scattered postcard entrance (replays on filter change) --- */
      if (document.querySelector('.gallery-grid')) {
        gsap.from('.g-item', {
          opacity: 0, y: 70, scale: 0.96,
          rotation: (i: number) => (i % 2 ? 2 : -2),
          duration: 0.9, stagger: 0.08, ease: 'power3.out',
          scrollTrigger: { trigger: '.gallery-grid', start: 'top 86%' },
        });
      }

    }, root);

    return () => ctx.revert();
  }, [ready, cat, gallery.length, amenities.length, stackItems.length]);

  const filtered = useMemo(() => (cat === 'All' ? gallery : gallery.filter((g) => g.category === cat)), [gallery, cat]);
  const go = (href: string) => (e: React.MouseEvent) => { e.preventDefault(); scrollToHash(href); };

  return (
    <div ref={root} id="top">
      <div className="scroll-progress" aria-hidden="true" />
      <div className={`loader ${ready ? 'done' : ''}`}>
        <img className="mark" src="/media/mark.jpg" alt="" style={{ borderRadius: 12 }} />
        <p>Shivanta Homes</p>
      </div>

      <Navbar />

      {/* ------------------------------- HERO ------------------------------- */}
      <HeroSection data={l1 ? { ...hero, posterUrl: '' } : hero} play={ready} fallbackTitle={settings.projectName} />

      {/* ----------------------------- OVERVIEW ----------------------------- */}
      <section className="section" id="overview">
        <div className="container overview-grid">
          <div className="sticky-col">
            <span className="kicker" data-reveal>The Project</span>
            <h2 className="title" data-split>{overview.heading}</h2>
            <p className="lead" data-reveal style={{ marginTop: 18, color: 'var(--muted)', lineHeight: 1.85, fontSize: 16 }}>{overview.description}</p>
            <div className="stats" data-stagger>
              {overview.stats.map((s) => (
                <div className="stat" key={s.label} data-reveal>
                  <b data-count={s.value}>{s.value}</b>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <ul className="highlights" data-stagger>
              {overview.highlights.map((h) => (
                <li key={h} data-reveal><Icon name="check" size={17} /> {h}</li>
              ))}
            </ul>
            {overview.images[0] && (
              <div className="overview-media" data-curtain>
                <img src={overview.images[0]} alt="Shivanta Homes garden" style={{ height: 400, objectFit: 'cover', width: '100%' }} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ---------------------- SCRUB HIGHLIGHT STATEMENT ------------------- */}
      <section className="section statement alt">
        <div className="container">
          <p className="big-statement" data-highlight>
            Shivanta isn't just a house. It's the garden your children run through, the gate that watches over your family, and the balcony where evenings finally slow down.
          </p>
        </div>
      </section>

      {/* -------------------------- STACKED EXPERIENCE ----------------------- */}
      {stackItems.length >= 2 && (
        <section className="section alt" id="experience">
          <div className="container">
            <div className="section-head">
              <span className="kicker" data-reveal>The Experience</span>
              <h2 className="title" data-split>Scroll through a day at Shivanta</h2>
            </div>
          </div>
          <div className="container stack-wrap">
            {stackItems.map((g, i) => (
              <div className="stack-card" key={g._id ?? g.url} style={{ '--i': i } as React.CSSProperties}>
                <img src={g.url} alt={g.alt || g.title} loading={i > 0 ? 'lazy' : undefined} />
                <div className="stack-cap">
                  <span>{String(i + 1).padStart(2, '0')}</span>
                  <h3>{g.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---------------------------- RESIDENCES ---------------------------- */}
      <section className="section dark" id="residences">
        <div className="container">
          <div className="section-head">
            <span className="kicker" data-reveal>Residences</span>
            <h2 className="title" data-split>{residences[0]?.title ?? 'Spacious 3 BHK Row House'}</h2>
            <p className="lead" data-reveal>{residences[0]?.description}</p>
          </div>
          <div className="res-media" data-curtain>
            <img src={residences[0]?.images?.[0] ?? '/media/entrance.jpg'} alt="3 BHK row house elevation" />
          </div>
          <div className="features-grid" data-stagger>
            {(residences[0]?.features ?? []).map((f) => {
              const [name, ...dims] = f.split(/(?<=Room|Kitchen|Toilet|Area|Otta|Parking|Balcony)\s+/);
              return (
                <div className="feature" key={f} data-reveal>
                  <b>{dims.length ? name : f}</b>
                  {dims.length > 0 && <span>{dims.join(' ')}</span>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* -------------------------- BY THE NUMBERS -------------------------- */}
      <section className="section dark numbers">
        <div className="container">
          <div className="numbers-grid" data-stagger>
            {[
              { v: '60', s: '', l: 'Plots in the township' },
              { v: '12', s: '+', l: 'Amenities inside the gate' },
              { v: '800', s: ' sq.ft', l: 'Plot — 20′ × 40′' },
              { v: '3', s: ' BHK', l: 'Spacious row houses' },
            ].map((n) => (
              <div className="number" key={n.l} data-reveal>
                <b data-count={`${n.v}${n.s}`}>0{n.s}</b>
                <span>{n.l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------- AMENITIES ---------------------------- */}
      <section className="section alt" id="amenities">
        <div className="container">
          <div className="section-head">
            <span className="kicker" data-reveal>Amenities</span>
            <h2 className="title" data-split>Everything your family needs, inside the gate</h2>
          </div>
          <div className="amenities-grid">
            {amenities.map((a) => (
              <div className="amenity-card" key={a._id ?? a.name}>
                <div className="amenity-icon"><Icon name={a.icon} size={22} /></div>
                <h3>{a.name}</h3>
                <p>{a.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------- PHOTO WALL (scattered → full-screen) ------------------- */}
      <PhotoWall items={gallery} />

      {/* ------------------------------ GALLERY ----------------------------- */}
      <section className="section" id="gallery">
        <div className="container">
          <div className="section-head">
            <span className="kicker" data-reveal>Gallery</span>
            <h2 className="title" data-split>See the life that awaits</h2>
          </div>
          <div className="chips">
            {GALLERY_CATS.map((c) => (
              <button key={c} className={`chip ${cat === c ? 'active' : ''}`} onClick={() => setCat(c)}>{c}</button>
            ))}
          </div>
          {filtered.length === 0 ? (
            <p style={{ color: 'var(--muted)' }}>No images in this category yet.</p>
          ) : (
            <div className="gallery-grid">
              {filtered.map((g, i) => (
                <figure className="g-item" key={g._id ?? g.url} onClick={() => setLightbox(i)}>
                  <img src={g.url} alt={g.alt || g.title} loading="lazy" />
                  <figcaption>{g.title}</figcaption>
                </figure>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ------------------------------- VIDEOS ----------------------------- */}
      {videos.length > 0 && (
        <section className="section alt" id="videos">
          <div className="container">
            <div className="section-head">
              <span className="kicker" data-reveal>Films</span>
              <h2 className="title" data-split>Walk through Shivanta Homes</h2>
            </div>
            <div className="duo" data-stagger>
              {videos.map((v) => (
                <div className="plan-card" key={v._id} data-reveal>
                  <video controls poster={v.poster || undefined} preload="none" src={v.url} style={{ width: '100%', display: 'block' }} />
                  <div className="panel-body"><b>{v.title}</b> <span className="badge copper" style={{ marginLeft: 8 }}>{v.type}</span></div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------- PLANS ------------------------------ */}
      <section className="section" id="plans">
        <div className="container">
          <div className="section-head">
            <span className="kicker" data-reveal>Floor Plans</span>
            <h2 className="title" data-split>Planned to the last inch</h2>
          </div>
          <div className="plans-grid">
            <div className="plan-card" data-curtain>
              <img src={plans[0]?.image ?? '/media/floor-plan-3bhk.jpg'} alt="3 BHK ground floor plan" />
            </div>
            <div className="plan-side">
              <div className="plan-fact" data-reveal><span>Property</span><b>{plans[0]?.propertyType ?? '3 BHK Row House'}</b></div>
              <div className="plan-fact" data-reveal><span>Plot Size</span><b>{plans[0]?.plotSize ?? "20' × 40'"}</b></div>
              <div className="plan-fact" data-reveal><span>Floor</span><b>Ground Floor</b></div>
              <p data-reveal style={{ color: 'var(--muted)', fontSize: 14.5, lineHeight: 1.8 }}>{plans[0]?.description}</p>
              {brochure.active && brochure.fileUrl && (
                <a className="btn btn-primary" data-reveal href={brochure.fileUrl} download style={{ justifyContent: 'center' }}>
                  <Icon name="download" size={17} /> Download Brochure
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------- SPECIFICATIONS ------------------------- */}
      <section className="section alt" id="specifications">
        <div className="container specs-grid">
          <div className="sticky-col">
            <span className="kicker" data-reveal>Specifications</span>
            <h2 className="title" data-split>Built with intention</h2>
            <p className="lead" data-reveal style={{ marginTop: 16, color: 'var(--muted)', lineHeight: 1.8 }}>
              Every material and finish is chosen for durability, comfort and ease of maintenance.
            </p>
          </div>
          <div className="spec-list" data-stagger>
            {specs.map((s) => (
              <div className="spec-row" key={s._id ?? s.title} data-reveal>
                <div className="amenity-icon"><Icon name={s.icon} size={20} /></div>
                <div>
                  <span className="cat">{s.category}</span>
                  <h4>{s.title}</h4>
                  <p>{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------ LOCATION ---------------------------- */}
      <section className="section" id="location">
        <div className="container">
          <div className="section-head">
            <span className="kicker" data-reveal>Location</span>
            <h2 className="title" data-split>At Chavaj Chokdi, Bharuch</h2>
          </div>
          <div className="location-grid">
            <div className="map-frame" data-reveal>
              {location.embedUrl && <iframe title="Shivanta Homes location map" src={location.embedUrl} loading="lazy" />}
            </div>
            <div>
              <p data-reveal style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--muted)' }}>
                <Icon name="pin" size={16} style={{ display: 'inline', color: 'var(--copper)', marginRight: 8 }} />
                {location.address}
              </p>
              <div className="landmarks" data-stagger>
                {location.landmarks.map((l) => (
                  <div className="landmark" key={l.name} data-reveal><span>{l.name}</span><span>{l.distance}</span></div>
                ))}
              </div>
              <a className="btn btn-ghost" data-reveal href={location.mapsLink} target="_blank" rel="noreferrer">
                <Icon name="map" size={16} /> Get Directions
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------ CONTACT ----------------------------- */}
      <section className="section dark" id="contact">
        <div className="container contact-grid">
          <div>
            <span className="kicker" data-reveal>Get in touch</span>
            <h2 className="title" data-split>Book your site visit today</h2>
            <div className="contact-cards" data-stagger>
              <div className="contact-card" data-reveal>
                <div className="amenity-icon"><Icon name="phone" size={20} /></div>
                <div><b>Call us</b><a href={`tel:${settings.phone.replace(/\s/g, '')}`}>{settings.phone}</a></div>
              </div>
              <div className="contact-card" data-reveal>
                <div className="amenity-icon"><Icon name="whatsapp" size={20} /></div>
                <div><b>WhatsApp</b><a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noreferrer">Chat with our team</a></div>
              </div>
              <div className="contact-card" data-reveal>
                <div className="amenity-icon"><Icon name="pin" size={20} /></div>
                <div><b>Site Address</b><span className="v">{settings.address}</span></div>
              </div>
            </div>
          </div>
          <div data-reveal>
            <EnquiryForm />
          </div>
        </div>
      </section>

      <Footer />

      {lightbox !== null && filtered[lightbox] && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <img src={filtered[lightbox].url} alt={filtered[lightbox].alt || filtered[lightbox].title} onClick={(e) => e.stopPropagation()} />
          <button className="lb-close" onClick={() => setLightbox(null)} aria-label="Close">✕</button>
          <button className="lb-prev" onClick={(e) => { e.stopPropagation(); setLightbox((lightbox - 1 + filtered.length) % filtered.length); }} aria-label="Previous">‹</button>
          <button className="lb-next" onClick={(e) => { e.stopPropagation(); setLightbox((lightbox + 1) % filtered.length); }} aria-label="Next">›</button>
          <div className="lb-cap">{filtered[lightbox].title} — {filtered[lightbox].category}</div>
        </div>
      )}
    </div>
  );
}
