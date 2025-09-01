// src/layouts/adminlayout.tsx
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Shield, 
  Users, 
  Trophy, 
  FileText, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  ChevronRight,
  UserCheck,
  BarChart3
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
//    {
//      icon: Users,
//      label: 'Manajemen User',
//      path: '/admin/users',
//      active: location.pathname === '/admin/users'
//    },
//    {
//      icon: BarChart3,
//      label: 'Statistik',
//      path: '/admin/statistik',
//      active: location.pathname === '/admin/statistik'
//    },
//    {
//      icon: FileText,
//      label: 'Laporan',
//      path: '/admin/reports',
//      active: location.pathname === '/admin/reports'
//    },
//    {
//      icon: Settings,
//      label: 'Pengaturan',
//      path: '/admin/settings',
//      active: location.pathname === '/admin/settings'
//    }
  ];

  if (!isAdmin) {
    return null;
  }

  const displayName = user?.admin?.nama_admin || user?.email || 'Admin';

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5FBEF' }}>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-72 lg:overflow-y-auto shadow-2xl">
        <div className="h-full shadow-2xl" style={{ backgroundColor: '#F5FBEF' }}>
          {/* Header */}
          <div className="p-6 border-b" style={{ borderColor: '#990D35' }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ backgroundColor: '#990D35' }}>
                <Shield className="text-white" size={24} />
              </div>
              <div>
                <h1 
                  className="font-bebas tracking-wide" 
                  style={{ 
                    fontSize: '41.89px',
                    color: '#990D35',
                    lineHeight: '1'
                  }}
                >
                  ADMIN PANEL
                </h1>
                <p 
                  className="font-plex" 
                  style={{ 
                    fontSize: '16px',
                    color: '#050505'
                  }}
                >
                  Management System
                </p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="p-6 border-b" style={{ borderColor: '#990D35' }}>
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center font-inter font-bold text-lg"
                style={{ backgroundColor: '#F5B700', color: '#050505' }}
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p 
                  className="font-inter font-semibold" 
                  style={{ color: '#050505', fontSize: '16px' }}
                >
                  {displayName}
                </p>
                <p 
                  className="font-inter" 
                  style={{ color: '#990D35', fontSize: '14px' }}
                >
                  Administrator
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-6 space-y-3">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-300 group ${
                  item.active ? 'shadow-lg' : 'hover:shadow-md'
                }`}
                style={{
                  backgroundColor: item.active ? '#990D35' : 'transparent',
                  color: item.active ? '#F5FBEF' : '#050505'
                }}
                onMouseEnter={(e) => {
                  if (!item.active) {
                    e.currentTarget.style.backgroundColor = '#990D35';
                    e.currentTarget.style.opacity = '0.8';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!item.active) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.opacity = '1';
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <item.icon 
                    size={20} 
                    style={{ color: item.active ? '#F5B700' : '#050505' }}
                    className="group-hover:text-yellow-500 transition-colors"
                  />
                  <span 
                    className="font-inter font-medium"
                    style={{ fontSize: '16px' }}
                  >
                    {item.label}
                  </span>
                </div>
                <ChevronRight 
                  size={16} 
                  style={{ color: item.active ? '#F5B700' : '#050505' }}
                  className="transition-transform group-hover:translate-x-1"
                />
              </button>
            ))}
          </nav>

          {/* Logout Button */}
          <div className="absolute bottom-6 left-6 right-6">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-4 rounded-xl transition-all duration-300 hover:shadow-md"
              style={{ 
                backgroundColor: 'transparent',
                color: '#990D35',
                border: `1px solid #990D35`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#990D35';
                e.currentTarget.style.color = '#F5FBEF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#990D35';
              }}
            >
              <LogOut size={20} />
              <span className="font-inter font-medium" style={{ fontSize: '16px' }}>
                Logout
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div 
        className="lg:hidden border-b px-4 py-3 flex items-center justify-between"
        style={{ 
          backgroundColor: '#050505',
          borderColor: '#990D35'
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl transition-all duration-300"
            style={{ color: '#F5FBEF' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#990D35';
              e.currentTarget.style.color = '#F5FBEF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#990D35';
            }}
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
            <Shield style={{ color: '#F5B700' }} size={20} />
            <h1 
              className="font-inter font-bold"
              style={{ 
                fontSize: '20px',
                color: '#F5B700'
              }}
            >
              ADMIN
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center font-inter font-bold text-sm"
            style={{ backgroundColor: '#F5B700', color: '#050505' }}
          >
            {displayName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <aside 
            className="fixed inset-y-0 left-0 z-50 w-72 shadow-2xl lg:hidden"
            style={{ backgroundColor: '#050505' }}
          >
            <div 
              className="p-6 border-b flex items-center justify-between"
              style={{ borderColor: '#990D35' }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="p-2 rounded-xl"
                  style={{ backgroundColor: '#990D35' }}
                >
                  <Shield className="text-white" size={20} />
                </div>
                <div>
                  <h1 
                    className="font-bebas"
                    style={{ 
                      fontSize: '25.89px',
                      color: '#F5B700'
                    }}
                  >
                    ADMIN PANEL
                  </h1>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-xl transition-all duration-300"
                style={{ color: '#F5FBEF' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#990D35'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X size={20} />
              </button>
            </div>

            <div 
              className="p-6 border-b"
              style={{ borderColor: '#990D35' }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bebas"
                  style={{ backgroundColor: '#F5B700', color: '#050505' }}
                >
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p 
                    className="font-plex font-semibold"
                    style={{ color: '#F5FBEF', fontSize: '16px' }}
                  >
                    {displayName}
                  </p>
                  <p 
                    className="font-plex"
                    style={{ color: '#F5B700', fontSize: '14px' }}
                  >
                    Administrator
                  </p>
                </div>
              </div>
            </div>

            <nav className="p-6 space-y-3">
              {menuItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${
                    item.active ? 'shadow-lg' : 'hover:shadow-md'
                  }`}
                  style={{
                    backgroundColor: item.active ? '#990D35' : 'transparent',
                    color: '#F5FBEF'
                  }}
                  onMouseEnter={(e) => {
                    if (!item.active) {
                      e.currentTarget.style.backgroundColor = '#990D35';
                      e.currentTarget.style.opacity = '0.8';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!item.active) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.opacity = '1';
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <item.icon 
                      size={20} 
                      style={{ color: item.active ? '#F5B700' : '#F5FBEF' }}
                    />
                    <span 
                      className="font-plex font-medium"
                      style={{ fontSize: '16px' }}
                    >
                      {item.label}
                    </span>
                  </div>
                </button>
              ))}
            </nav>

            <div className="absolute bottom-6 left-6 right-6">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 p-4 rounded-xl transition-all duration-300"
                style={{ 
                  backgroundColor: 'transparent',
                  color: '#990D35',
                  border: `1px solid #990D35`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#990D35';
                  e.currentTarget.style.color = '#F5FBEF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#990D35';
                }}
              >
                <LogOut size={20} />
                <span className="font-plex font-medium" style={{ fontSize: '16px' }}>
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