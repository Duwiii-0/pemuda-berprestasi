import { Routes, Route, Navigate, useParams } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuth } from "./context/authContext";

// Layouts
import LandingLayout from "./layouts/layout";
import DashboardLayout from "./layouts/dashboardLayout";
import LombaLayout from "./layouts/lombaLayout";
import AdminKompetisiLayout from "./layouts/adminKompLayout";

// Auth page
import Login from "./pages/auth/login";
import RegisterDojang from "./pages/auth/registerDojang";
import Register from "./pages/auth/register";
import ResetPassword from "./pages/auth/changepassword";

//Landing Page
import Home from "./pages/landingPage/home";
import Event from "./pages/landingPage/event";
import NotFound from "./pages/notFound";
import TutorialPage from "./pages/landingPage/tutorial";
import LapanganLiveView from "./lombaLayout/pertandingan";
import LiveStreamingPage from "./lombaLayout/liveStreaming";
import MedalTally from "./lombaLayout/medalTally"; // ✅ NEW IMPORT

const LapanganLiveViewWrapper = () => {
  const { idKompetisi } = useParams<{ idKompetisi: string }>();
  const id = idKompetisi ? parseInt(idKompetisi, 10) : undefined;
  return <LapanganLiveView idKompetisi={id} />;
};

// ✅ NEW: Medal Tally Wrapper
const MedalTallyWrapper = () => {
  const { idKompetisi } = useParams<{ idKompetisi: string }>();
  const id = idKompetisi ? parseInt(idKompetisi, 10) : undefined;
  return <MedalTally idKompetisi={id} />;
};

// Dashboard
import DataAtlit from "./pages/dashboard/dataAtlit";
import Dojang from "./pages/dashboard/dataDojang";
import TambahAtlit from "./pages/atlit/TambahAtlit";
import DataKompetisi from "./pages/dashboard/dataKompetisi";
import BracketViewer from "./pages/dashboard/BracketViewer";
import BracketList from "./pages/dashboard/BracketList";

// Admin - Fixed import paths
import AdminLayout from "./layouts/adminlayout";
import ValidasiPeserta from "./pages/admin/ValidasiPeserta";
import ValidasiDojang from "./pages/admin/ValidasiDojang";
import BuktiTf from "./pages/admin/BuktiTf";
import BuktiTfkomp from "./pages/adminkomp/BuktiTf";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminStats from "./pages/admin/AdminStats";
import Reports from "./pages/admin/Reports";
import AdminSettings from "./pages/admin/Settings";
import JadwalPertandingan from "./pages/adminkomp/JadwalTanding";
import StatistikAdminKomp from "./pages/adminkomp/Statistik";

// data atlit
import Profile from "./pages/atlit/profilePage";

// lomba
import LandingPage from "./lombaLayout/home";
import Timeline from "./lombaLayout/timeline";
import FAQ from "./lombaLayout/faq";

// settings
import Settings from "./pages/settings/settings";
import AllAtlets from "./pages/admin/AllAtlets";
import AllPeserta from "./pages/adminkomp/AllPeserta";
import ValidasiDojangAdminKomp from "./pages/adminkomp/ValidasiDojang";

// Import the new Drawing Bagan component
import DrawingBagan from "./pages/adminkomp/DrawingBagan";
import Penimbangan from "./pages/adminkomp/Penimbangan";
import BulkCetakSertifikat from "./pages/adminkomp/BulkCetakSertifikat";
import BulkGenerateIDCard from "./pages/adminkomp/BulkGenerateIDCard";

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "ADMIN" | "PELATIH" | "ADMIN_KOMPETISI";
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const { isAuthenticated, user, loading } = useAuth();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role requirement
  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md mx-auto">
          <div className="text-red-500 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this page.
          </p>
          <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded">
            <p>
              <strong>Required:</strong> {requiredRole}
            </p>
            <p>
              <strong>Your role:</strong> {user?.role}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Public Route (only accessible when not authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  // Redirect based on user role if already authenticated
  if (isAuthenticated && user) {
    if (user.role === "ADMIN") {
      return <Navigate to="/admin" replace />;
    } else if (user.role === "PELATIH") {
      return <Navigate to="/dashboard" replace />;
    } else if (user.role === "ADMIN_KOMPETISI") {
      return <Navigate to="/admin-kompetisi" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default function AppRoutes() {
  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <Routes>
        {/* Admin Kompetisi routes */}
        <Route
          path="/admin-kompetisi"
          element={
            <ProtectedRoute requiredRole="ADMIN_KOMPETISI">
              <AdminKompetisiLayout />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={
              <Navigate to="/admin-kompetisi/validasi-peserta" replace />
            }
          />
          <Route path="validasi-peserta" element={<AllPeserta />} />
          <Route path="validasi-dojang" element={<ValidasiDojangAdminKomp />} />
          <Route path="statistik" element={<StatistikAdminKomp />} />
          <Route path="bukti-pembayaran" element={<BuktiTfkomp />} />
          <Route path="drawing-bagan" element={<DrawingBagan />} />
          <Route path="drawing-bagan/:kelasId?" element={<DrawingBagan />} />
          <Route path="jadwal-tanding" element={<JadwalPertandingan />} />
          <Route path="penimbangan" element={<Penimbangan />} />
          <Route path="bulk-cetak-sertifikat" element={<BulkCetakSertifikat />} />
          <Route path="bulk-generate-id-card" element={<BulkGenerateIDCard />} />
        </Route>

        {/* Admin routes - protected for ADMIN role only */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={<Navigate to="/admin/validasi-peserta" replace />}
          />
          <Route path="validasi-peserta" element={<ValidasiPeserta />} />
          <Route path="validasi-dojang" element={<ValidasiDojang />} />
          <Route path="atlets" element={<AllAtlets />} />
          <Route path="bukti-pembayaran" element={<BuktiTf />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="statistik" element={<AdminStats />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Auth routes - only accessible when not logged in */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        <Route
          path="/resetpassword"
          element={
            <PublicRoute>
              <ResetPassword />
            </PublicRoute>
          }
        />

        {/* Register Dojang - only for authenticated PELATIH */}
        <Route
          path="/registerdojang"
          element={
            <PublicRoute>
              <RegisterDojang />
            </PublicRoute>
          }
        />

        {/* Landing pages - accessible to everyone */}
        <Route element={<LandingLayout />}>
          <Route index element={<Home />} />
          <Route path="events" element={<Event />} />
          <Route path="tutorial" element={<TutorialPage />} />
        </Route>

        {/* Settings - protected route */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute requiredRole="PELATIH">
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* Dashboard - protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          {/* Dojang management - only for PELATIH */}
          <Route index element={<Navigate to="/dashboard/dojang" replace />} />

          {/* Dojang management - only for PELATIH */}
          <Route
            path="dojang"
            element={
              <ProtectedRoute requiredRole="PELATIH">
                <Dojang />
              </ProtectedRoute>
            }
          />

          {/* Atlet management */}
          <Route path="atlit" element={<DataAtlit />} />
          <Route path="atlit/:id" element={<Profile />} />

          {/* Add athlete - only for PELATIH */}
          <Route
            path="TambahAtlit"
            element={
              <ProtectedRoute requiredRole="PELATIH">
                <TambahAtlit />
              </ProtectedRoute>
            }
          />

{/* Competition data */}
  <Route
    path="dataKompetisi"
    element={
      <ProtectedRoute requiredRole="PELATIH">
        <DataKompetisi />
      </ProtectedRoute>
    }
  />

  {/* ⭐ TAMBAHKAN INI - Bracket Viewer Routes */}
  <Route
    path="bracket-viewer"
    element={
      <ProtectedRoute requiredRole="PELATIH">
        <BracketList />
      </ProtectedRoute>
    }
  />
  <Route
    path="bracket-viewer/:kelasId"
    element={
      <ProtectedRoute requiredRole="PELATIH">
        <BracketViewer />
      </ProtectedRoute>
    }
  />
</Route>
        {/* ✅ Lomba pages - PUBLIC ACCESS */}
        <Route path="/event" element={<LombaLayout />}>
          <Route index element={<Navigate to="/event/home" replace />} />
          <Route path="home" element={<LandingPage />} />
          <Route path="faq" element={<FAQ />} />
          <Route path="timeline" element={<Timeline />} />
          <Route path="live-streaming" element={<LiveStreamingPage />} />
          <Route
            path="pertandingan/:idKompetisi"
            element={<LapanganLiveViewWrapper />}
          />
          {/* ✅ NEW: Medal Tally Route */}
          <Route
            path="medal-tally/:idKompetisi"
            element={<MedalTallyWrapper />}
          />
        </Route>

        {/* Root redirect */}
        <Route path="/" element={<Home />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
