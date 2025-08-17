import { useNavigate, useLocation } from "react-router-dom";
import { Menu } from 'lucide-react';
import { ArrowLeft } from 'lucide-react';

interface NavbarProps {
  mobile?: boolean;
  onClose?: () => void;
}

const NavbarDashboard: React.FC<NavbarProps> = ({ mobile, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path: string) => {
    navigate(path);
    if (onClose) onClose(); // Close mobile menu after navigation
  };

  const isActive = (path: string) => {
    return location.pathname.includes(path);
  };

  const navItems = [
    { path: '/dashboard/dojang', label: 'Data Dojang' },
    { path: '/dashboard/atlit', label: 'Data Atlit' },
    { path: '/dashboard/dataKompetisi', label: 'Data Kompetisi' }
  ];

  return (
    <div className={mobile ? "fixed left-0 top-0 h-full w-64 bg-white shadow-lg z-50" : "hidden lg:block w-64 h-screen bg-white shadow-2xl fixed left-0 top-0"}>
      {mobile && (
        <button onClick={onClose} className="absolute top-4 right-4 p-2">
          <Menu size={24} />
        </button>
      )}
      <div className="p-6">
        <button 
          onClick={() => navigate('/')}
          className="text-red hover:text-red/80 font-inter mb-4 flex items-center gap-2 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>        
        <div className="font-bebas text-xl mb-8">DASHBOARD</div>
        
        <nav className="space-y-2">
          {navItems.map((item) => (
            <button 
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={`w-full text-left block p-3 rounded-lg font-inter transition-all duration-300 ${
                isActive(item.path)
                  ? 'bg-red text-white'
                  : 'hover:bg-red/10 text-red border border-red/20'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        
        <div className="absolute bottom-6 left-6 right-6">
          <button 
            onClick={() => handleNavigation('/login')}
            className="w-full p-3 rounded-lg border border-red/20 text-red hover:bg-red/5 font-inter transition-all duration-300"
          >
            Logout
          </button>
          <p className="text-center text-sm text-gray-500 mt-4">© 2025 apani</p>
        </div>
      </div>
    </div>
  );
};

export default NavbarDashboard;