import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Trophy,
  Users,
  UserCheck,
  ClipboardList,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Award,
  GitBranch,
  CreditCard,
  Scale,
} from "lucide-react";
import { useAuth } from "../context/authContext";
import path from "path";

const AdminKompetisiLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/auth/login");
  };

  // Updated menu items with tournament bracket instead of certificates
  const menuItems = [
    {
      icon: ClipboardList,
      label: "Validasi Peserta",
      path: "/admin-kompetisi/validasi-peserta",
      active: location.pathname === "/admin-kompetisi/validasi-peserta",
      description: "Validasi data peserta kompetisi",
    },
    {
      icon: UserCheck,
      label: "Validasi Dojang",
      path: "/admin-kompetisi/validasi-dojang",
      active: location.pathname === "/admin-kompetisi/validasi-dojang",
      description: "Validasi pendaftaran dojang",
    },
    // {
    //   icon: BarChart3,
    //   label: 'Statistik & Laporan',
    //   path: '/admin-kompetisi/statistik',
    //   active: location.pathname === '/admin-kompetisi/statistik',
    //   description: 'Lihat statistik dan buat laporan'
    // },
    {
      icon: GitBranch,
      label: "Drawing Bagan",
      path: "/admin-kompetisi/drawing-bagan",
      active: location.pathname === "/admin-kompetisi/drawing-bagan",
      description: "Kelola drawing bagan tournament",
    },
    {
      icon: CreditCard,
      label: "Bukti Transfer",
      path: "/admin-kompetisi/bukti-pembayaran",
      active: location.pathname === "/admin/bukti-pembayaran",
    },
    {
      icon: Award,
      label: "Jadwal Tanding",
      path: "/admin-kompetisi/jadwal-tanding",
      active: location.pathname === "/admin-kompetisi/jadwal-tanding",
      description: "Atur jadwal pertandingan kompetisi",
    },
    {
      icon: Scale,
      label: "Penimbangan",
      path: "/admin-kompetisi/penimbangan",
      active: location.pathname === "/admin-kompetisi/penimbangan",
      description: "Input hasil penimbangan berat badan",
    },
    {
      icon: Award,
      label: "Bulk Cetak Sertifikat",
      path: "/admin-kompetisi/bulk-cetak-sertifikat",
      active: location.pathname === "/admin-kompetisi/bulk-cetak-sertifikat",
      description: "Cetak sertifikat untuk banyak peserta",
    },
    {
      icon: CreditCard,
      label: "Bulk Generate ID Card",
      path: "/admin-kompetisi/bulk-generate-id-card",
      active: location.pathname === "/admin-kompetisi/bulk-generate-id-card",
      description: "Generate ID card untuk banyak peserta",
    },
  ];

  const displayName =
    user?.admin?.nama_admin || user?.email || "Admin Kompetisi";

  // Get current page info
  const currentPage = menuItems.find((item) => item.active);
  const pageTitle = currentPage?.label || "Dashboard";
  const pageDescription =
    currentPage?.description || "Kelola kompetisi dengan mudah";

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5FBEF" }}>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-80 lg:overflow-y-auto">
        <div
          className="h-full shadow-lg border-r"
          style={{ backgroundColor: "#F5FBEF", borderColor: "#990D35" }}
        >
          {/* Header */}
          <div className="p-6 border-b" style={{ borderColor: "#990D35" }}>
            <div className="flex items-center gap-3">
              <div
                className="p-3 rounded-xl shadow-sm"
                style={{ backgroundColor: "#990D35" }}
              >
                <Trophy className="text-white" size={28} />
              </div>
              <div>
                <h1
                  className="text-2xl font-bebas tracking-wide leading-tight"
                  style={{ color: "#050505" }}
                >
                  ADMIN KOMPETISI
                </h1>
                <p
                  className="text-sm font-medium"
                  style={{ color: "#050505", opacity: 0.7 }}
                >
                  Sriwijaya International Taekwondo Championship 2025
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-6 space-y-2">
            <h3
              className="text-sm font-semibold mb-4"
              style={{ color: "#050505", opacity: 0.7 }}
            >
              NAVIGATION
            </h3>
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200 group ${
                  item.active
                    ? "shadow-md transform scale-[0.98]"
                    : "hover:shadow-sm hover:transform hover:scale-[0.99]"
                }`}
                style={{
                  backgroundColor: item.active ? "#990D35" : "transparent",
                  color: item.active ? "#F5FBEF" : "#050505",
                }}
                onMouseEnter={(e) => {
                  if (!item.active) {
                    e.currentTarget.style.backgroundColor =
                      "rgba(153, 13, 53, 0.1)";
                    e.currentTarget.style.color = "#990D35";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!item.active) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "#050505";
                  }
                }}
              >
                <div className="flex items-center gap-3 flex-1">
                  <item.icon
                    size={22}
                    style={{
                      color: item.active ? "#F5B700" : "#050505",
                    }}
                    className="transition-colors group-hover:text-current flex-shrink-0"
                  />
                  <div className="text-left">
                    <div className="font-semibold text-base">{item.label}</div>
                    {item.active && (
                      <div className="text-xs opacity-80 mt-0.5">
                        {item.description}
                      </div>
                    )}
                  </div>
                </div>
                <ChevronRight
                  size={18}
                  style={{
                    color: item.active ? "#F5B700" : "rgba(5, 5, 5, 0.4)",
                  }}
                  className="transition-all duration-200 group-hover:translate-x-1 group-hover:text-current flex-shrink-0"
                />
              </button>
            ))}
          </nav>

          {/* Settings & Logout */}
          <div className="absolute bottom-6 left-6 right-6 space-y-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 border hover:shadow-sm"
              style={{
                color: "#990D35",
                borderColor: "#990D35",
                backgroundColor: "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(153, 13, 53, 0.1)";
                e.currentTarget.style.borderColor = "#990D35";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.borderColor = "#990D35";
              }}
            >
              <LogOut size={18} />
              <span className="font-medium text-sm">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div
        className="lg:hidden border-b px-4 py-3 shadow-sm"
        style={{ backgroundColor: "#F5FBEF", borderColor: "#990D35" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl transition-colors hover:shadow-sm"
              style={{ color: "#050505" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(5, 5, 5, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2">
              <Trophy style={{ color: "#990D35" }} size={20} />
              <div>
                <h1 className="text-lg font-bold" style={{ color: "#050505" }}>
                  ADMIN KOMPETISI
                </h1>
                <p
                  className="text-xs"
                  style={{ color: "#050505", opacity: 0.7 }}
                >
                  {pageTitle}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div
                className="text-sm font-semibold"
                style={{ color: "#050505" }}
              >
                {displayName}
              </div>
              <div className="text-xs" style={{ color: "#990D35" }}>
                Administrator
              </div>
            </div>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
              style={{ backgroundColor: "#F5B700", color: "#050505" }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <aside
            className="fixed inset-y-0 left-0 z-50 w-80 shadow-xl lg:hidden overflow-y-auto"
            style={{ backgroundColor: "#F5FBEF" }}
          >
            <div
              className="p-6 border-b flex items-center justify-between"
              style={{ borderColor: "#990D35" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="p-2 rounded-xl"
                  style={{ backgroundColor: "#990D35" }}
                >
                  <Trophy className="text-white" size={20} />
                </div>
                <div>
                  <h1
                    className="text-lg font-bebas"
                    style={{ color: "#050505" }}
                  >
                    ADMIN KOMPETISI
                  </h1>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-xl transition-colors"
                style={{ color: "#050505", opacity: 0.7 }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(5, 5, 5, 0.1)";
                  e.currentTarget.style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.opacity = "0.7";
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 border-b" style={{ borderColor: "#990D35" }}>
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-bold"
                  style={{ backgroundColor: "#F5B700", color: "#050505" }}
                >
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p
                    className="font-semibold text-base"
                    style={{ color: "#050505" }}
                  >
                    {displayName}
                  </p>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "#990D35" }}
                  >
                    Competition Admin
                  </p>
                </div>
              </div>
            </div>

            <nav className="p-6 space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${
                    item.active ? "shadow-md" : "hover:shadow-sm"
                  }`}
                  style={{
                    backgroundColor: item.active ? "#990D35" : "transparent",
                    color: item.active ? "#F5FBEF" : "#050505",
                  }}
                  onMouseEnter={(e) => {
                    if (!item.active) {
                      e.currentTarget.style.backgroundColor =
                        "rgba(153, 13, 53, 0.1)";
                      e.currentTarget.style.color = "#990D35";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!item.active) {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "#050505";
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <item.icon
                      size={20}
                      style={{
                        color: item.active ? "#F5B700" : "#050505",
                      }}
                      className="transition-colors"
                    />
                    <span className="font-medium text-base">{item.label}</span>
                  </div>
                </button>
              ))}
            </nav>

            <div className="absolute bottom-6 left-6 right-6 space-y-2">
              <button
                onClick={() => navigate("/admin-kompetisi/settings")}
                className="w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:shadow-sm"
                style={{
                  color: "#050505",
                  backgroundColor: "rgba(5, 5, 5, 0.05)",
                }}
              >
                <Settings size={18} />
                <span className="font-medium text-sm">Pengaturan</span>
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 border hover:shadow-sm"
                style={{
                  color: "#990D35",
                  borderColor: "#990D35",
                  backgroundColor: "transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(153, 13, 53, 0.1)";
                  e.currentTarget.style.borderColor = "#990D35";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.borderColor = "#990D35";
                }}
              >
                <LogOut size={18} />
                <span className="font-medium text-sm">Logout</span>
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Main Content */}
      <main className="lg:ml-80">
        {/* Page Header */}
        <div
          className="bg-white border-b px-6 py-4"
          style={{ borderColor: "#990D35" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: "#050505" }}>
                {pageTitle}
              </h2>
              <p
                className="text-sm mt-1"
                style={{ color: "#050505", opacity: 0.7 }}
              >
                {pageDescription}
              </p>
            </div>
            <div
              className="flex items-center gap-2 text-sm"
              style={{ color: "#050505", opacity: 0.6 }}
            >
              <span>Admin Kompetisi</span>
              <ChevronRight size={16} />
              <span style={{ color: "#990D35" }}>{pageTitle}</span>
            </div>
          </div>
        </div>

        <Outlet />
      </main>
    </div>
  );
};

export default AdminKompetisiLayout;
