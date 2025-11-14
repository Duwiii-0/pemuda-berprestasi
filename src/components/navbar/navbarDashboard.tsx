import { useNavigate, useLocation } from "react-router-dom";
import { X, ArrowLeft, Home, Users, Trophy, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../context/authContext'

interface NavbarProps {
  mobile?: boolean;
  onClose?: () => void;
}

const NavbarDashboard: React.FC<NavbarProps> = ({ mobile = false, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth(); 

  const handleNavigation = (path: string) => {
    navigate(path);
    if (onClose && mobile) onClose(); // Close mobile menu after navigation
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

const navItems = [
  { 
    path: '/dashboard/dojang', 
    label: 'Data Dojang', 
    icon: Home,
    exact: false
  },
  { 
    path: '/dashboard/atlit', 
    label: 'Data Atlit', 
    icon: Users,
    exact: false
  },
  { 
    path: '/dashboard/dataKompetisi', 
    label: 'Data Kompetisi', 
    icon: Trophy,
    exact: false
  },
  // ⭐ TAMBAHKAN INI
  { 
    path: '/dashboard/bracket-viewer', 
    label: 'Lihat Bracket', 
    icon: Trophy, // atau import { GitBranch } from 'lucide-react'
    exact: false
  }
];

  const checkIsActive = (path: string, exact: boolean = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path) && path !== '/dashboard';
  };

  return (
    <>
      {/* Overlay for mobile */}
      {mobile && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        ${mobile 
          ? "fixed left-0 top-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300" 
          : "hidden lg:block w-72 h-screen bg-white shadow-2xl fixed left-0 top-0 z-30"
        }
      `}>
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200" style={{ backgroundColor: '#F5FBEF' }}>
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={() => navigate('/')}
              className="cursor-pointer flex items-center gap-2 transition-colors duration-200"
              style={{ 
                color: '#990D35',
                fontFamily: 'IBM Plex Sans, sans-serif'
              }}
              title="Kembali ke Beranda"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Beranda</span>
            </button>
            
            {mobile && (
              <button 
                onClick={onClose} 
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                title="Tutup Menu"
              >
                <X size={20} />
              </button>
            )}
          </div>
          
          <div className="text-center">
            <h1 className="leading-tight" style={{ 
              fontFamily: 'Bebas Neue, sans-serif',
              fontSize: '32px',
              color: '#050505'
            }}>
              DASHBOARD<br/>
              <span style={{ color: '#990D35' }}>PELATIH</span>
            </h1>
          </div>
        </div>
        
        {/* Navigation Menu */}
        <nav className="flex-1 p-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isItemActive = checkIsActive(item.path, item.exact);
            
            return (
              <button 
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`
                  w-full flex items-center gap-3 p-3 rounded-xl font-medium transition-all duration-200
                  ${isItemActive
                    ? 'shadow-lg' 
                    : 'border border-transparent hover:border-red-200'
                  }
                `}
                style={{
                  fontFamily: 'IBM Plex Sans, sans-serif',
                  backgroundColor: isItemActive ? '#990D35' : 'transparent',
                  color: isItemActive ? '#F5FBEF' : '#990D35',
                  ...(isItemActive ? {} : {
                    ':hover': {
                      backgroundColor: '#990D35',
                      color: '#F5FBEF'
                    }
                  })
                }}
                onMouseEnter={(e) => {
                  if (!isItemActive) {
                    e.currentTarget.style.backgroundColor = '#990D35';
                    e.currentTarget.style.color = '#F5FBEF';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isItemActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#990D35';
                  }
                }}
                title={item.label}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        
        {/* Footer */}
        <div className="p-6 border-t border-gray-200 space-y-4">
          {/* Settings Button */}
          <button 
            onClick={() => handleNavigation('/settings')}
            className={`
              w-full flex items-center gap-3 p-3 rounded-xl font-medium transition-all duration-200
              ${checkIsActive('/settings')
                ? 'shadow-lg' 
                : 'border border-gray-200'
              }
            `}
            style={{
              fontFamily: 'IBM Plex Sans, sans-serif',
              backgroundColor: checkIsActive('/settings') ? '#6B7280' : 'transparent',
              color: checkIsActive('/settings') ? '#F5FBEF' : '#6B7280'
            }}
            onMouseEnter={(e) => {
              if (!checkIsActive('/settings')) {
                e.currentTarget.style.backgroundColor = '#6B7280';
                e.currentTarget.style.color = '#F5FBEF';
              }
            }}
            onMouseLeave={(e) => {
              if (!checkIsActive('/settings')) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#6B7280';
              }
            }}
            title="Pengaturan"
          >
            <Settings size={20} />
            <span>Pengaturan</span>
          </button>
          
          {/* Logout Button */}
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-3 rounded-xl font-medium transition-all duration-200 border"
            style={{
              fontFamily: 'IBM Plex Sans, sans-serif',
              color: '#990D35',
              borderColor: '#990D35'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#990D35';
              e.currentTarget.style.color = '#F5FBEF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#990D35';
            }}
            title="Keluar"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
          
          {/* Copyright */}
          <div className="text-center pt-2">
            <p className="text-xs" style={{ color: '#6B7280', fontFamily: 'IBM Plex Sans, sans-serif' }}>
              © 2025 CJV Management
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default NavbarDashboard;
