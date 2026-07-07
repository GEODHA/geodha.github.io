import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import DashboardPage from "./pages/DashboardPage";
import DataPage from "./pages/DataPage";
import ReportPage from "./pages/ReportPage";
import Blog from "./pages/Blog";
import About from "./pages/About";
import GetStarted from "./pages/GetStarted";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Navigation from "./components/Navigation";
import TopBanner from "./components/TopBanner";
import Footer from "./components/Footer";
import NotFound from "./pages/NotFound";
import WasteGuide from "./pages/WasteGuide";
import BWGGuidePage from "./pages/BWGGuidePage";
import VolunteerPage from "./pages/VolunteerPage";

// ── Admin (gitignored — lives in src/admin/, absent on fresh clones) ──────────
// vite.config.ts contains a plugin that resolves these to a null-component stub
// when src/admin/ doesn't exist, so CI/CD builds always succeed.
const AdminLogin        = lazy(() => import("./admin/pages/AdminLogin"));
const AdminLayout       = lazy(() => import("./admin/pages/AdminLayout"));
const ActionsAdmin      = lazy(() => import("./admin/pages/ActionsAdmin"));
const TestimonialsAdmin = lazy(() => import("./admin/pages/TestimonialsAdmin"));
const WardDataAdmin     = lazy(() => import("./admin/pages/WardDataAdmin"));

const queryClient = new QueryClient();

// Teach TypeScript about the gtag global injected by index.html
declare function gtag(...args: unknown[]): void;

// ── Per-route document titles ─────────────────────────────────────────────────
// index.html configures gtag with `send_page_view: false`, so RouteTracker is
// the single source of page_view events — and it sets the title first so GA4
// reports differentiate pages by title (they previously all shared the static
// index.html title).

const DEFAULT_TITLE = 'GEODHA — See garbage around you? Solve it with GEODHA.';

const ROUTE_TITLES: Record<string, string> = {
  '/':            DEFAULT_TITLE,
  '/dashboard':   'Bengaluru Garbage Crisis Map — GEODHA',
  '/data':        'Data — GEODHA',
  '/report':      'Report an Issue — GEODHA',
  '/blog':        'Blog — GEODHA',
  '/about':       'About — GEODHA',
  '/privacy':     'Privacy Policy — GEODHA',
  '/get-started': 'Get Started — GEODHA',
  '/guide':       'Waste Guide — GEODHA',
  '/guide2':      'BWG Disposal Guidelines — GEODHA',
  '/volunteer':   'Volunteer for Cleanups — GEODHA',
};

/** Sets the per-route title, then fires a GA4 page_view on every navigation. */
function RouteTracker() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title =
      ROUTE_TITLES[pathname] ??
      (pathname.startsWith('/admin') ? 'Admin — GEODHA' : DEFAULT_TITLE);
    if (typeof gtag === 'undefined') return;
    gtag('event', 'page_view', {
      page_path:  pathname,
      page_title: document.title,
    });
  }, [pathname]);
  return null;
}

/** Scrolls to the top of the page on every route change. */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

/** Legacy /map → /dashboard redirect (map page merged into the dashboard). */
function LegacyMapRedirect() {
  const { state } = useLocation();
  return <Navigate to="/dashboard" replace state={state} />;
}

/** Renders children only on the home page — used to gate the TopBanner. */
function ShowOnHome({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  return pathname === "/" ? <>{children}</> : null;
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <RouteTracker />
          <ScrollToTop />
          <Suspense fallback={null}>
            <Routes>

              {/* ── Standalone routes (no site nav/footer) ──── */}

              {/* ── Admin routes (standalone, no site chrome) ──── */}
              <Route path="/admin" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route path="actions"      element={<ActionsAdmin />} />
                <Route path="testimonials" element={<TestimonialsAdmin />} />
                <Route path="ward-data"    element={<WardDataAdmin />} />
              </Route>

              {/* ── Public routes (with Navigation + Footer) ──── */}
              <Route path="*" element={
                <div className="min-h-screen bg-background">
                  <ShowOnHome><TopBanner /></ShowOnHome>
                  <Navigation />
                  <Routes>
                    <Route path="/"          element={<Index />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/data"      element={<DataPage />} />
                    <Route path="/report"    element={<ReportPage />} />
                    <Route path="/blog"      element={<Blog />} />
                    <Route path="/map"       element={<LegacyMapRedirect />} />
                    <Route path="/about"     element={<About />} />
                    <Route path="/privacy"   element={<PrivacyPolicy />} />
                    <Route path="/get-started" element={<GetStarted />} />
                    <Route path="/guide"     element={<WasteGuide />} />
                    <Route path="/guide2"    element={<BWGGuidePage />} />
                    <Route path="/volunteer" element={<VolunteerPage />} />
                    <Route path="*"          element={<NotFound />} />
                  </Routes>
                  <Footer />
                </div>
              } />

            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App