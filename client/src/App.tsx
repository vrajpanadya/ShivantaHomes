import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { ToastProvider, ConfirmProvider, Spinner } from './lib/ui';
import Home from './pages/Home';
import { LoginPage, ResetPage } from './pages/admin/Login';
import AdminLayout from './pages/admin/Layout';
import Dashboard from './pages/admin/Dashboard';
import Enquiries from './pages/admin/Enquiries';
import SiteVisits from './pages/admin/SiteVisits';
import Media from './pages/admin/Media';
import Activity from './pages/admin/Activity';
import Profile from './pages/admin/Profile';
import {
  HeroPage, OverviewPage, ResidencesPage, AmenitiesPage, GalleryPage, VideosPage,
  FloorPlansPage, SpecificationsPage, LocationPage, BrochurePage, SettingsPage, SeoPage,
} from './pages/admin/cms';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { admin, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><Spinner /></div>;
  if (!admin) return <Navigate to="/admin/login" replace state={{ from: loc.pathname }} />;
  return <>{children}</>;
}

function LoginGate() {
  const { admin, loading } = useAuth();
  if (!loading && admin) return <Navigate to="/admin/dashboard" replace />;
  return <LoginPage />;
}

export default function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/admin/login" element={<LoginGate />} />
              <Route path="/admin/reset" element={<ResetPage />} />
              <Route path="/admin" element={<RequireAuth><AdminLayout /></RequireAuth>}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="enquiries" element={<Enquiries />} />
                <Route path="site-visits" element={<SiteVisits />} />
                <Route path="media" element={<Media />} />
                <Route path="hero" element={<HeroPage />} />
                <Route path="overview" element={<OverviewPage />} />
                <Route path="residences" element={<ResidencesPage />} />
                <Route path="amenities" element={<AmenitiesPage />} />
                <Route path="gallery" element={<GalleryPage />} />
                <Route path="videos" element={<VideosPage />} />
                <Route path="floor-plans" element={<FloorPlansPage />} />
                <Route path="specifications" element={<SpecificationsPage />} />
                <Route path="location" element={<LocationPage />} />
                <Route path="brochure" element={<BrochurePage />} />
                <Route path="seo" element={<SeoPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="activity" element={<Activity />} />
                <Route path="profile" element={<Profile />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ConfirmProvider>
    </ToastProvider>
  );
}
