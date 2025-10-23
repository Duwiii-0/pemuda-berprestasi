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
  CreditCard,
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
    {
      icon: CreditCard,
      label: 'Bukti Transfer',
      path: '/admin/bukti-pembayaran',
      active: location.pathname === '/admin/bukti-pembayaran'
    },
  ];

  if (!isAdmin) {
    return null;
  }

  const displayName = user?.admin?.nama_admin || user?.email || 'Admin';

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5FBEF' }}>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-72 lg:overflow-y-auto">
        <div className="h-full shadow-lg border-r" style={{ backgroundColor: '#F5FBEF', borderColor: '#990D35' }}>
          {/* Header */}
          <div className="p-6 border-b" style={{ borderColor: '#990D35' }}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl shadow-sm" style={{ backgroundColor: '#990D35' }}>
                <Shield className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bebas tracking-wide leading-tight" style={{ color: '#050505' }}>
                  ADMIN PANEL
                </h1>
                <p className="text-sm font-medium" style={{ color: '#050505', opacity: 0.7 }}>
                  CJV Management System
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
                    ? 'shadow-md' 
                    : 'hover:shadow-sm'
                }`}
                style={{
                  backgroundColor: item.active ? '#990D35' : 'transparent',
                  color: item.active ? '#F5FBEF' : '#050505'
                }}
                onMouseEnter={(e) => {
                  if (!item.active) {
                    e.currentTarget.style.backgroundColor = 'rgba(153, 13, 53, 0.1)';
                    e.currentTarget.style.color = '#990D35';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!item.active) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#050505';
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <item.icon 
                    size={20} 
                    style={{
                      color: item.active ? '#F5B700' : '#050505'
                    }}
                    className="transition-colors group-hover:text-current"
                  />
                  <span className="font-medium text-base">
                    {item.label}
                  </span>
                </div>
                <ChevronRight 
                  size={16} 
                  style={{
                    color: item.active ? '#F5B700' : 'rgba(5, 5, 5, 0.4)'
                  }}
                  className="transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-current"
                />
              </button>
            ))}
          </nav>

          {/* Logout Button */}
          <div className="absolute bottom-6 left-6 right-6">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-4 rounded-xl transition-all duration-200 border hover:shadow-sm"
              style={{ 
                color: '#990D35', 
                borderColor: '#990D35',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(153, 13, 53, 0.1)';
                e.currentTarget.style.borderColor = '#990D35';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = '#990D35';
              }}
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
      <div className="lg:hidden border-b px-4 py-3 flex items-center justify-between shadow-sm" style={{ backgroundColor: '#F5FBEF', borderColor: '#990D35' }}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl transition-colors hover:shadow-sm"
            style={{ color: '#050505' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(5, 5, 5, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
            <Shield style={{ color: '#990D35' }} size={20} />
            <h1 className="text-xl font-bold" style={{ color: '#050505' }}>
              ADMIN
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm" style={{ backgroundColor: '#F5B700', color: '#050505' }}>
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
          <aside className="fixed inset-y-0 left-0 z-50 w-72 shadow-xl lg:hidden" style={{ backgroundColor: '#F5FBEF' }}>
            <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: '#990D35' }}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl" style={{ backgroundColor: '#990D35' }}>
                  <Shield className="text-white" size={20} />
                </div>
                <div>
                  <h1 className="text-xl font-bebas" style={{ color: '#050505' }}>
                    ADMIN PANEL
                  </h1>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-xl transition-colors"
                style={{ color: '#050505', opacity: 0.7 }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(5, 5, 5, 0.1)';
                  e.currentTarget.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.opacity = '0.7';
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 border-b" style={{ borderColor: '#990D35' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold" style={{ backgroundColor: '#F5B700', color: '#050505' }}>
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-base" style={{ color: '#050505' }}>
                    {displayName}
                  </p>
                  <p className="text-sm font-medium" style={{ color: '#990D35' }}>
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
                      ? 'shadow-md' 
                      : 'hover:shadow-sm'
                  }`}
                  style={{
                    backgroundColor: item.active ? '#990D35' : 'transparent',
                    color: item.active ? '#F5FBEF' : '#050505'
                  }}
                  onMouseEnter={(e) => {
                    if (!item.active) {
                      e.currentTarget.style.backgroundColor = 'rgba(153, 13, 53, 0.1)';
                      e.currentTarget.style.color = '#990D35';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!item.active) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#050505';
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <item.icon 
                      size={20} 
                      style={{
                        color: item.active ? '#F5B700' : '#050505'
                      }}
                      className="transition-colors"
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
                className="w-full flex items-center gap-3 p-4 rounded-xl transition-all duration-200 border hover:shadow-sm"
                style={{ 
                  color: '#990D35', 
                  borderColor: '#990D35',
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(153, 13, 53, 0.1)';
                  e.currentTarget.style.borderColor = '#990D35';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = '#990D35';
                }}
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