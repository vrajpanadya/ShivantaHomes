// import { useEffect, useRef, useState } from 'react';
// import { usePublic } from '../lib/usePublic';
// import { FALLBACK } from '../lib/fallback';
// import { scrollToHash, lockScroll } from '../lib/smooth';
// import { Icon } from '../lib/icons';
// import type { Settings } from '../lib/types';

// const LINKS = [
//   { href: '#overview', label: 'About' },
//   { href: '#residences', label: 'Homes' },
//   { href: '#amenities', label: 'Facilities' },
//   { href: '#gallery', label: 'Photos' },
//   { href: '#plans', label: 'Plans' },
//   { href: '#location', label: 'Address' },
// ];

// export default function Navbar() {
//   const [solid, setSolid] = useState(false);
//   const [hide, setHide] = useState(false);
//   const [open, setOpen] = useState(false);
//   const [active, setActive] = useState('');
//   const closeRef = useRef<HTMLButtonElement>(null);
//   const { data: settings } = usePublic<Settings>('/settings', FALLBACK.settings);

//   /* scroll state: glass header + hide-on-down + section scroll-spy */
//   useEffect(() => {
//     let lastY = window.scrollY;
//     const ids = LINKS.map((l) => l.href.slice(1));
//     const onScroll = () => {
//       const y = window.scrollY;
//       setSolid(y > 48);
//       setHide(y > 260 && y > lastY + 4 ? true : y < lastY - 4 || y <= 260 ? false : hide);
//       lastY = y;
//       let current = '';
//       for (const id of ids) {
//         const el = document.getElementById(id);
//         if (el && el.getBoundingClientRect().top <= 150) current = id;
//       }
//       setActive(current);
//     };
//     onScroll();
//     window.addEventListener('scroll', onScroll, { passive: true });
//     return () => window.removeEventListener('scroll', onScroll);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   /* drawer: scroll lock + escape + focus management */
//   useEffect(() => {
//     if (open) {
//       lockScroll(true);
//       closeRef.current?.focus();
//     } else {
//       lockScroll(false);
//     }
//     const onKey = (e: KeyboardEvent) => {
//       if (e.key === 'Escape') setOpen(false);
//     };
//     window.addEventListener('keydown', onKey);
//     return () => {
//       window.removeEventListener('keydown', onKey);
//       lockScroll(false);
//     };
//   }, [open]);

//   const go = (href: string) => (e: React.MouseEvent) => {
//     e.preventDefault();
//     setOpen(false);
//     scrollToHash(href);
//   };

//   return (
//     <>
//       <div className="blessing" role="note" lang="gu">
//         <span aria-hidden="true">॥</span>
//         <span>શુભ આરંભ</span>
//         <span>શ્રી ગણેશાય નમઃ</span>
//         <span aria-hidden="true">॥</span>
//       </div>
//       <header className={`nav on-dark ${solid ? 'solid' : ''} ${hide && !open ? 'hide' : ''}`}>
//         <div className="container nav-inner">
//           <a href="#top" className="brand" onClick={go('#top')} aria-label="Shivanta Homes — back to top">
//             <img src="/media/mark-t.png" alt="Shivanta Homes logo" />
//           </a>
//           <nav className="nav-links" aria-label="Primary">
//             {LINKS.map((l) => (
//               <a
//                 key={l.href}
//                 href={l.href}
//                 onClick={go(l.href)}
//                 className={active === l.href.slice(1) ? 'active' : ''}
//                 aria-current={active === l.href.slice(1) ? 'true' : undefined}
//               >
//                 {l.label}
//               </a>
//             ))}
//           </nav>
//           <button className="burger" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)}>
//             <span /><span /><span />
//           </button>
//         </div>
//       </header>

//       {/* polished side-drawer mobile menu */}
//       <div className={`mobile-menu ${open ? 'open' : ''}`} aria-hidden={!open}>
//         <div className="mm-backdrop" onClick={() => setOpen(false)} />
//         <div className="drawer" role="dialog" aria-modal="true" aria-label="Site menu">
//           <div className="drawer-head">
//             <span>
//               <span className="b-name" style={{ display: 'block', lineHeight: 1 }}>SHIVANTA</span>
//               <span className="b-sub">HOMES</span>
//             </span>
//             <button ref={closeRef} className="drawer-close" aria-label="Close menu" onClick={() => setOpen(false)}>
//               <Icon name="close" size={20} />
//             </button>
//           </div>
//           <nav className="drawer-links" aria-label="Mobile">
//             {LINKS.map((l, i) => (
//               <a key={l.href} href={l.href} onClick={go(l.href)} style={{ transitionDelay: open ? `${0.14 + i * 0.06}s` : '0s' }}>
//                 {l.label}
//               </a>
//             ))}
//           </nav>
//           <p className="drawer-phone">{settings.phone}</p>
//         </div>
//       </div>
//     </>
//   );
// }
import { useEffect, useRef, useState } from 'react';
import { usePublic } from '../lib/usePublic';
import { FALLBACK } from '../lib/fallback';
import { scrollToHash, lockScroll } from '../lib/smooth';
import { Icon } from '../lib/icons';
import type { Settings } from '../lib/types';

const LINKS = [
  { href: '#overview', label: 'About' },
  { href: '#residences', label: 'Homes' },
  { href: '#amenities', label: 'Facilities' },
  { href: '#gallery', label: 'Photos' },
  { href: '#plans', label: 'Plans' },
  { href: '#location', label: 'Address' },
];

export default function Navbar() {
  const [solid, setSolid] = useState(false);
  const [hide, setHide] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('');
  const closeRef = useRef<HTMLButtonElement>(null);
  const { data: settings } = usePublic<Settings>('/settings', FALLBACK.settings);

  /* scroll state: glass header + hide-on-down + section scroll-spy */
  useEffect(() => {
    let lastY = window.scrollY;
    const ids = LINKS.map((l) => l.href.slice(1));
    const onScroll = () => {
      const y = window.scrollY;
      setSolid(y > 48);
      setHide(y > 260 && y > lastY + 4 ? true : y < lastY - 4 || y <= 260 ? false : hide);
      lastY = y;
      let current = '';
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 150) current = id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* drawer: scroll lock + escape + focus management */
  useEffect(() => {
    if (open) {
      lockScroll(true);
      closeRef.current?.focus();
    } else {
      lockScroll(false);
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      lockScroll(false);
    };
  }, [open]);

  const go = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(false);
    // The drawer stops Lenis and locks the body while it is open. Unlock it
    // before starting the navigation; otherwise mobile link taps cannot scroll.
    lockScroll(false);
    window.requestAnimationFrame(() => scrollToHash(href));
  };

  return (
    <>
      <div className="blessing" role="note" lang="gu">
        <span aria-hidden="true">॥</span>
        <span>શુભ આરંભ</span>
        <span>શ્રી ગણેશાય નમઃ</span>
        <span aria-hidden="true">॥</span>
      </div>
      <header className={`nav on-dark ${solid ? 'solid' : ''} ${hide && !open ? 'hide' : ''}`}>
        <div className="container nav-inner">
          <a href="#top" className="brand" onClick={go('#top')} aria-label="Shivanta Homes — back to top">
            <img src="/media/mark-t.png" alt="Shivanta Homes logo" />
          </a>
          <nav className="nav-links" aria-label="Primary">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={go(l.href)}
                className={active === l.href.slice(1) ? 'active' : ''}
                aria-current={active === l.href.slice(1) ? 'true' : undefined}
              >
                {l.label}
              </a>
            ))}
          </nav>
          <button className="burger" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)}>
            <span /><span /><span />
          </button>
        </div>
      </header>

      {/* polished side-drawer mobile menu */}
      <div className={`mobile-menu ${open ? 'open' : ''}`} aria-hidden={!open}>
        <div className="mm-backdrop" onClick={() => setOpen(false)} />
        <div className="drawer" role="dialog" aria-modal="true" aria-label="Site menu">
          <div className="drawer-head">
            <span>
              <span className="b-name" style={{ display: 'block', lineHeight: 1 }}>SHIVANTA</span>
              <span className="b-sub">HOMES</span>
            </span>
            <button ref={closeRef} className="drawer-close" aria-label="Close menu" onClick={() => setOpen(false)}>
              <Icon name="close" size={20} />
            </button>
          </div>
          <nav className="drawer-links" aria-label="Mobile">
            {LINKS.map((l, i) => (
              <a key={l.href} href={l.href} onClick={go(l.href)} style={{ transitionDelay: open ? `${0.14 + i * 0.06}s` : '0s' }}>
                {l.label}
              </a>
            ))}
          </nav>
          <p className="drawer-phone">{settings.phone}</p>
        </div>
      </div>
    </>
  );
}
