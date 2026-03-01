import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Providers } from './components/providers';
import { AuthGuard, RoleGuard, RoleBasedRedirect } from './components/auth';
import { AppLayout } from './components/layout';
import { Toaster } from './components/ui/sonner';

// Auth pages
const LoginPage = lazy(() => import('./pages/auth/login'));
const RegisterPage = lazy(() => import('./pages/auth/register'));

// Main pages
const DashboardPage = lazy(() => import('./pages/dashboard'));
const EventsPage = lazy(() => import('./pages/events'));
const NewEventPage = lazy(() => import('./pages/events/new'));
const EventDetailPage = lazy(() => import('./pages/events/detail'));
const ContactsPage = lazy(() => import('./pages/contacts'));
const SettingsPage = lazy(() => import('./pages/settings'));

// Moderation page
const ModeratorPage = lazy(() => import('./pages/moderation'));

// Admin pages
const AdminIndexPage = lazy(() => import('./pages/admin'));
const AdminTenantsPage = lazy(() => import('./pages/admin/tenants'));
const AdminAdsPage = lazy(() => import('./pages/admin/ads'));
const AdminCreditsPage = lazy(() => import('./pages/admin/credits'));
const AdminTenantDetailPage = lazy(() => import('./pages/admin/tenant-detail'));

function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
    </div>
  );
}

export function App() {
  return (
    <Providers>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public auth routes */}
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/register" element={<RegisterPage />} />

            {/* Protected routes */}
            <Route
              element={
                <AuthGuard>
                  <AppLayout />
                </AuthGuard>
              }
            >
              {/* Tenant admin + super admin routes */}
              <Route element={<RoleGuard allowedRoles={['tenant_admin', 'super_admin']} />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/events/new" element={<NewEventPage />} />
                <Route path="/events/:id" element={<EventDetailPage />} />
                <Route path="/contacts" element={<ContactsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>

              {/* Moderator page (accessible to all authenticated users) */}
              <Route path="/moderate" element={<ModeratorPage />} />

              {/* Super admin routes */}
              <Route element={<RoleGuard allowedRoles={['super_admin']} />}>
                <Route path="/admin" element={<AdminIndexPage />} />
                <Route path="/admin/tenants" element={<AdminTenantsPage />} />
                <Route path="/admin/tenants/:id" element={<AdminTenantDetailPage />} />
                <Route path="/admin/ads" element={<AdminAdsPage />} />
                <Route path="/admin/credits" element={<AdminCreditsPage />} />
              </Route>
            </Route>

            {/* Redirects */}
            <Route path="/" element={<RoleBasedRedirect />} />
            <Route path="*" element={<RoleBasedRedirect />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Toaster />
    </Providers>
  );
}
