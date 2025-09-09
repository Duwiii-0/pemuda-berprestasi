// src/layouts/adminlayout.tsx
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Shield, 
  Users, 
  Trophy,  
  LogOut, 
  Menu, 
  X,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/authContext';

const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, navigate]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  const menuItems = [
    {
      icon: Trophy,
      label: 'Validasi Peserta',
      path: '/admin/validasi-peserta',
      active: location.pathname === '/admin/validasi-peserta'
    },
    {
      icon: Users,
      label: 'Data Atlet',
      path: '/admin/atlets',
      active: location.pathname === '/admin/atlets'
    },
    {
      icon: UserCheck,
      label: 'Validasi Dojang',
      path: '/admin/validasi-dojang',
      active: location.pathname === '/admin/validasi-dojang'
    },
  ];

  if (!isAdmin) {
    return null;
  }

  const displayName = user?.admin?.nama_admin || user?.email || 'Admin';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-72 lg:overflow-y-auto">
        <div className="h-full bg-white shadow-lg border-r border-gray-200">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-600 shadow-sm">
                <Shield className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bebas tracking-wide text-gray-900 leading-tight">
                  ADMIN PANEL
                </h1>
                <p className="text-sm text-gray-600 font-medium">
                  Management System
                </p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-yellow-400 flex items-center justify-center font-bold text-lg text-gray-900 shadow-sm">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-base">
                  {displayName}
                </p>
                <p className="text-sm text-red-600 font-medium">
                  Administrator
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-6 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200 group ${
                  item.active 
                    ? 'bg-red-500 text-white shadow-md' 
                    : 'text-gray-700 hover:bg-red-50 hover:text-red-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon 
                    size={20} 
                    className={`${
                      item.active 
                        ? 'text-yellow-400' 
                        : 'text-gray-500 group-hover:text-red-600'
                    } transition-colors`}
                  />
                  <span className="font-medium text-base">
                    {item.label}
                  </span>
                </div>
                <ChevronRight 
                  size={16} 
                  className={`${
                    item.active 
                      ? 'text-yellow-400' 
                      : 'text-gray-400 group-hover:text-red-600'
                  } transition-all duration-200 group-hover:translate-x-0.5`}
                />
              </button>
            ))}
          </nav>

          {/* Logout Button */}
          <div className="absolute bottom-6 left-6 right-6">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-4 rounded-xl transition-all duration-200 text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300"
            >
              <LogOut size={20} />
              <span className="font-medium text-base">
                Logout
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="text-red-600" size={20} />
            <h1 className="text-xl font-bold text-gray-900">
              ADMIN
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-yellow-400 flex items-center justify-center font-bold text-sm text-gray-900">
            {displayName.charAt(0).toUpperCase()}
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
          <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl lg:hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-red-600">
                  <Shield className="text-white" size={20} />
                </div>
                <div>
                  <h1 className="text-xl font-bebas text-gray-900">
                    ADMIN PANEL
                  </h1>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-400 flex items-center justify-center font-bold text-gray-900">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-base">
                    {displayName}
                  </p>
                  <p className="text-sm text-red-600 font-medium">
                    Administrator
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
                    item.active 
                      ? 'bg-red-700 text-white shadow-md' 
                      : 'text-gray-700 hover:bg-red-50 hover:text-red-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon 
                      size={20} 
                      className={`${
                        item.active 
                          ? 'text-yellow-400' 
                          : 'text-gray-500'
                      } transition-colors`}
                    />
                    <span className="font-medium text-base">
                      {item.label}
                    </span>
                  </div>
                </button>
              ))}
            </nav>

            <div className="absolute bottom-6 left-6 right-6">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 p-4 rounded-xl transition-all duration-200 text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300"
              >
                <LogOut size={20} />
                <span className="font-medium text-base">
                  Logout
                </span>
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Main Content */}
      <main className="lg:ml-72">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;