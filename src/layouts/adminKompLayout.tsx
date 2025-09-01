import React, { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Users, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "../context/authContext";

const AdminKompetisiLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    {
      icon: Users,
      label: "Daftar Peserta",
      path: "/admin-kompetisi/peserta",
    },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed z-40 w-64 h-full bg-white shadow-lg transition-transform duration-300 md:translate-x-0`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h1 className="text-lg font-bold text-blue-600">Admin Kompetisi</h1>
          <button
            className="md:hidden p-2 rounded hover:bg-gray-200"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="mt-4">
          {menuItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center w-full px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <item.icon className="w-5 h-5 mr-2" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full border-t">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-gray-100"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:ml-64">
        {/* Navbar */}
        <header className="flex items-center justify-between bg-white shadow px-4 py-3 md:hidden">
          <button
            className="p-2 rounded hover:bg-gray-200"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <h2 className="text-sm font-medium text-gray-600">
            {user?.email || "Admin Kompetisi"}
          </h2>
        </header>

        {/* Outlet */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminKompetisiLayout;
