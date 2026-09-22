import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { Icon } from '../../lib/icons';

const GROUPS: { label: string; items: { to: string; label: string; icon: string }[] }[] = [
  {
    label: 'Manage',
    items: [
      { to: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' },
      { to: '/admin/enquiries', label: 'Enquiries', icon: 'users' },
      { to: '/admin/site-visits', label: 'Site Visits', icon: 'calendar' },
      { to: '/admin/media', label: 'Media Library', icon: 'image' },
    ],
  },
  {
    label: 'Website Content',
    items: [
      { to: '/admin/hero', label: 'Hero Section', icon: 'home' },
      { to: '/admin/overview', label: 'Project Overview', icon: 'info' },
      { to: '/admin/residences', label: 'Residences', icon: 'home' },
      { to: '/admin/amenities', label: 'Amenities', icon: 'garden' },
      { to: '/admin/gallery', label: 'Gallery', icon: 'grid' },
      { to: '/admin/videos', label: 'Videos', icon: 'video' },
      { to: '/admin/floor-plans', label: 'Floor Plans', icon: 'file' },
      { to: '/admin/specifications', label: 'Specifications', icon: 'structure' },
      { to: '/admin/location', label: 'Location', icon: 'pin' },
      { to: '/admin/brochure', label: 'Brochure', icon: 'download' },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/admin/seo', label: 'SEO', icon: 'seo' },
      { to: '/admin/settings', label: 'Settings', icon: 'settings' },
      { to: '/admin/activity', label: 'Activity Logs', icon: 'activity' },
      { to: '/admin/profile', label: 'Profile', icon: 'users' },
    ],
  },
];

export default function AdminLayout() {
  const { admin, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = useNavigate();
  const loc = useLocation();
  const title = GROUPS.flatMap((g) => g.items).find((i) => loc.pathname.startsWith(i.to))?.label ?? 'Dashboard';

  const doLogout = async () => {
    await logout();
    nav('/admin/login');
  };

  return (
    <div className="adm-shell">
      <aside className={`adm-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="side-brand">
          <img src="/media/mark.jpg" alt="" style={{ borderRadius: 8 }} />
          <span>
            <b style={{ display: 'block', lineHeight: 1 }}>SHIVANTA</b>
            <small style={{ letterSpacing: '0.4em', fontSize: 8, color: 'var(--gold)' }}>HOMES ADMIN</small>
          </span>
        </div>
        {GROUPS.map((g) => (
          <div key={g.label}>
            <div className="side-group">{g.label}</div>
            {g.items.map((i) => (
              <NavLink key={i.to} to={i.to} className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
                <Icon name={i.icon} size={17} /> {i.label}
              </NavLink>
            ))}
          </div>
        ))}
        <div style={{ padding: 16, marginTop: 'auto', borderTop: '1px solid rgba(247,243,236,.1)' }}>
          <a className="side-link" href="/" style={{ margin: 0 }}><Icon name="external" size={16} /> View Website</a>
          <button className="side-link" style={{ margin: '4px 0 0', width: '100%', background: 'none', border: 0, textAlign: 'left' }} onClick={doLogout}>
            <Icon name="logout" size={16} /> Logout
          </button>
        </div>
      </aside>

      <div className="adm-main">
        <div className="adm-topbar">
          <button className="icon-btn" onClick={() => { setCollapsed(!collapsed); setMobileOpen(true); }} aria-label="Toggle menu">
            <Icon name="menu" size={17} />
          </button>
          <h1>{title}</h1>
          <div className="spacer" />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)' }}>{admin?.name}</span>
          <NavLink to="/admin/profile" className="icon-btn" aria-label="Profile"><Icon name="users" size={16} /></NavLink>
        </div>
        <div className="adm-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
