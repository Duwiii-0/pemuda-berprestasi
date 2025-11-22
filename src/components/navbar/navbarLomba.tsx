import {
  ChevronDown,
  Menu,
  X,
  User,
  Settings,
  LogOut,
  Home,
  Medal,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/authContext";

const NavbarLomba = ({ onLogoutRequest }: { onLogoutRequest: () => void }) => {
  const location = useLocation();
  const { user } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isBurgerOpen, setIsBurgerOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ✅ NEW: Extract idKompetisi from URL for Medal Tally link
  const getKompetisiId = () => {
    // Try to extract from current URL path
    const match = location.pathname.match(/\/event\/(?:pertandingan|medal-tally)\/(\d+)/);
    if (match) return match[1];
    
    // Fallback: get from localStorage or default
    const storedId = localStorage.getItem('currentKompetisiId');
    return storedId || '1'; // Default to 1 if not found
  };

  const idKompetisi = getKompetisiId();

  // Handle scroll effect for navbar background
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsBurgerOpen(false);
    setShowDropdown(false);
  }, [location]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isBurgerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isBurgerOpen]);

  // ✅ UPDATED: Navigation items with Medal Tally
const navItems = [
  { to: "/event/home", label: "Beranda" },
  { to: "/event/timeline", label: "Timeline" },
  { to: "/event/faq", label: "FAQ" },
  { to: "/event/live-streaming", label: "Live Streaming" },
  { to: `/event/medal-tally/${idKompetisi}`, label: "Perolehan Medali" }, // ✅ COMMENTED - Akan diaktifkan nanti
];

  const getDashboardLink = () => {
    if (user?.role === "PELATIH")
      return { to: "/dashboard/dojang", label: "Dashboard", icon: Home };
    if (user?.role === "ADMIN")
      return { to: "/admin/validasi-peserta", label: "Dashboard", icon: Home };
    if (user?.role === "ADMIN_KOMPETISI")
      return { to: "/admin-kompetisi", label: "Dashboard", icon: Home };
    return { to: "/", label: "Dashboard", icon: Home }; // fallback
  };

  const userMenuItems = [
    getDashboardLink(),
    { to: "/settings", label: "Settings", icon: Settings },
  ];

  // Styling yang konsisten dengan warna merah
  const getNavbarStyles = () => {
    return {
      bg: isScrolled ? "bg-red/95 backdrop-blur-md shadow-lg" : "bg-red",
      text: "text-white",
      logo: "text-yellow drop-shadow-lg",
      buttonBorder: "border-white/80",
      buttonText: "text-white",
      buttonBg: "bg-white text-red hover:bg-white/90 hover:scale-105",
      hoverText: "hover:text-yellow/80 hover:scale-105",
      dropdownBg: "bg-white/95 backdrop-blur-md",
    };
  };

  const styles = getNavbarStyles();

  return (
    <>
      {/* Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${styles.bg}`}
      >
        <div className="w-full px-[5%] sm:px-[8%] lg:px-[10%] py-4 md:py-6">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Logo */}
            <Link
              to="/"
              className={`text-xl sm:text-2xl lg:text-4xl ${styles.logo} font-bebas tracking-wider uppercase transition-all duration-300 ease-out hover:scale-105`}
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              CJV Management
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              {navItems.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={`text-xl relative px-4 py-2 ${
                    styles.text
                  } font-plex font-medium transition-all duration-300 ease-out ${
                    location.pathname === to
                      ? "text-yellow font-semibold"
                      : styles.hoverText
                  } group`}
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  <span className="flex items-center gap-2">
                    {Icon && <Icon size={18} />}
                    {label}
                  </span>
                  {/* Animated underline */}
                  <span
                    className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-yellow transition-all duration-300 ease-out ${
                      location.pathname === to
                        ? "w-full"
                        : "w-0 group-hover:w-full"
                    }`}
                  />
                </Link>
              ))}
            </div>

            {/* Desktop Auth Section */}
            <div className="hidden lg:flex items-center">
              {!user ? (
                <div className="flex items-center space-x-4">
                  <Link
                    to="/register"
                    className={`px-6 py-2.5 text-md xl:text-2xl border-2 ${styles.buttonBorder} ${styles.buttonText} font-plex rounded-lg transition-all duration-300 ease-out hover:bg-white hover:text-red hover:scale-105 hover:shadow-lg`}
                  >
                    Register
                  </Link>
                  <Link
                    to="/login"
                    className={`px-8 py-2.5 text-md xl:text-2xl border-2 ${styles.buttonBorder} ${styles.buttonBg} font-plex rounded-lg transition-all duration-300 ease-out hover:shadow-lg`}
                  >
                    Login
                  </Link>
                </div>
              ) : (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className={`flex items-center space-x-2 px-4 py-2.5 text-md xl:text-2xl border-2 ${styles.buttonBorder} ${styles.buttonText} font-plex rounded-lg transition-all duration-300 ease-out hover:bg-white hover:text-red hover:scale-105 hover:shadow-lg group`}
                  >
                    <User
                      size={24}
                      className="transition-transform duration-300 group-hover:scale-110"
                    />
                    <span className="max-w-48 truncate">
                      {user?.pelatih?.nama_pelatih ?? "User"}
                    </span>
                    <ChevronDown
                      size={18}
                      className={`transition-all duration-300 ease-out ${
                        showDropdown ? "rotate-180" : ""
                      } group-hover:scale-110`}
                    />
                  </button>

                  {/* User Dropdown */}
                  {showDropdown && (
                    <div
                      className={`absolute right-0 mt-2 w-52 ${styles.dropdownBg} rounded-xl border border-gray-200/50 shadow-2xl overflow-hidden z-50 transform transition-all duration-300 ease-out animate-in fade-in slide-in-from-top-2`}
                    >
                      {userMenuItems.map(({ to, label, icon: Icon }) => (
                        <Link
                          key={to}
                          to={to}
                          className="text-xl flex items-center space-x-3 px-4 py-3 text-red font-plex transition-all duration-200 ease-out hover:bg-red hover:text-white group"
                          onClick={() => setShowDropdown(false)}
                        >
                          <Icon
                            size={16}
                            className="transition-transform duration-200 group-hover:scale-110"
                          />
                          <span>{label}</span>
                        </Link>
                      ))}
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          onLogoutRequest();
                        }}
                        className="text-xl flex items-center space-x-3 w-full px-4 py-3 text-red font-plex transition-all duration-200 ease-out hover:bg-red hover:text-white group"
                      >
                        <LogOut
                          size={16}
                          className="transition-transform duration-200 group-hover:scale-110"
                        />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsBurgerOpen(!isBurgerOpen)}
              className={`lg:hidden p-3 ${styles.text} hover:bg-white hover:text-red rounded-xl transition-all duration-300 ease-out hover:scale-110 hover:shadow-lg group`}
            >
              <div className="relative w-6 h-6">
                <Menu
                  size={24}
                  className={`absolute inset-0 transition-all duration-300 ease-out ${
                    isBurgerOpen
                      ? "opacity-0 rotate-180 scale-75"
                      : "opacity-100 rotate-0 scale-100"
                  }`}
                />
                <X
                  size={24}
                  className={`absolute inset-0 transition-all duration-300 ease-out ${
                    isBurgerOpen
                      ? "opacity-100 rotate-0 scale-100"
                      : "opacity-0 rotate-180 scale-75"
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-all duration-500 ease-out ${
          isBurgerOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      >
        {/* Background overlay */}
        <div
          className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-500 ease-out ${
            isBurgerOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setIsBurgerOpen(false)}
        />

        {/* Mobile menu panel */}
        <div
          className={`absolute top-30 md:top-24 left-4 right-4 sm:left-8 sm:right-8 bg-white rounded-xl shadow-2xl transform transition-all duration-500 ease-out ${
            isBurgerOpen
              ? "translate-y-0 opacity-100"
              : "-translate-y-full opacity-0"
          }`}
        >
          <div className="px-4 py-5 max-h-[calc(100vh-6rem)] overflow-y-auto">
            {/* Mobile Navigation Links */}
            <div className="space-y-1 mb-5">
              {navItems.map(({ to, label, icon: Icon }, index) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 px-4 py-3 text-base font-plex font-medium rounded-lg transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-md ${
                    location.pathname === to
                      ? "bg-red text-white shadow-lg"
                      : "text-red hover:bg-red hover:text-white"
                  }`}
                  onClick={() => {
                    setIsBurgerOpen(false);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  style={{
                    transitionDelay: isBurgerOpen ? `${index * 100}ms` : "0ms",
                  }}
                >
                  {Icon && <Icon size={18} />}
                  {label}
                </Link>
              ))}
            </div>

            {/* Mobile Auth Section */}
            <div className="pt-4 border-t border-gray-200">
              {!user ? (
                <div className="space-y-3">
                  <Link
                    to="/register"
                    className="block w-full py-4 text-lg text-center border-2 border-red text-red font-plex font-semibold rounded-xl hover:bg-red hover:text-white transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-lg"
                    onClick={() => setIsBurgerOpen(false)}
                  >
                    Register
                  </Link>
                  <Link
                    to="/login"
                    className="block w-full py-4 text-lg text-center border-2 border-red bg-red text-white font-plex font-semibold rounded-xl hover:bg-red/90 transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-lg"
                    onClick={() => setIsBurgerOpen(false)}
                  >
                    Login
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* User Info */}
                  <div className="flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                    <div className="w-8 h-8 bg-red rounded-full flex items-center justify-center shadow-md">
                      <User size={16} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-plex font-semibold text-red truncate text-sm">
                        {user?.pelatih?.nama_pelatih ?? "User"}
                      </p>
                      <p className="text-xs text-gray-500">Logged in</p>
                    </div>
                  </div>

                  {/* User Menu Items */}
                  <div className="space-y-1">
                    {userMenuItems.map(({ to, label, icon: Icon }) => (
                      <Link
                        key={to}
                        to={to}
                        className="flex items-center space-x-3 px-4 py-3 text-red font-plex rounded-lg hover:bg-red hover:text-white transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-md group"
                        onClick={() => setIsBurgerOpen(false)}
                      >
                        <Icon
                          size={16}
                          className="transition-transform duration-300 group-hover:scale-110"
                        />
                        <span className="text-base">{label}</span>
                      </Link>
                    ))}

                    {/* Logout Button */}
                    <button
                      onClick={() => {
                        setIsBurgerOpen(false);
                        onLogoutRequest();
                      }}
                      className="flex items-center space-x-3 w-full px-4 py-3 text-red font-plex rounded-lg hover:bg-red hover:text-white transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-md border-t border-gray-200 mt-4 pt-3 group"
                    >
                      <LogOut
                        size={16}
                        className="transition-transform duration-200 group-hover:scale-110"
                      />
                      <span className="text-base">Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NavbarLomba;