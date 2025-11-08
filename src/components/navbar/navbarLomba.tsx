import { ChevronDown, Menu, X, User, Settings, LogOut, Home, Medal } from "lucide-react";
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
    { to: `/event/medal-tally/${idKompetisi}`, label: "Perolehan Medali" }, // ✅ NEW (tanpa icon di sini)
  ];

  const getDashboardLink = () => {
    if (user?.role === "PELATIH")
      return { to: "/dashboard/dojang", label: "Dashboard", icon: Home };
    if (user?.role === "ADMIN")
      return { to: "/admin/validasi-peserta", label: "Dashboard", icon: Home };
    if (user?.role === "ADMIN_KOMPETISI")
      return { to: "/admin-kompetisi", label: "Dashboard", icon: Home };
    return { to: "/", label: "Dashboard", icon: Home };
  };

  const userMenuItems = [
    getDashboardLink(),
    { to: "/settings", label: "Settings", icon: Settings },
  ];

  const getNavbarStyles = () => {
    return {
      bg: isScrolled
        ? "bg-red/95 backdrop-blur-md shadow-lg"
        : "bg-red",
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 lg:h-20">
            {/* Logo */}
            <Link
              to="/event/home"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="flex items-center space-x-2 group"
            >
              <span
                className={`text-2xl xl:text-3xl font-bebas ${styles.logo} transition-all duration-300 ease-out group-hover:scale-110 group-hover:drop-shadow-2xl`}
              >
                CJV Management
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1 xl:space-x-2">
              {navItems.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`relative px-3 xl:px-4 py-2 text-md xl:text-2xl ${styles.text} font-plex transition-all duration-300 ease-out ${styles.hoverText} group`}
                >
                  {label}
                  {/* Animated underline */}
                  <span
                    className={`absolute bottom-0 left-0 w-0 h-0.5 bg-yellow transition-all duration-300 ease-out group-hover:w-full ${
                      location.pathname === to ? "w-full" : ""
                    }`}
                  />
                </Link>
              ))}
            </div>

            {/* Desktop Auth Section */}
            <div className="hidden lg:flex items-center space-x-4">
              {!user ? (
                <>
                  <Link
                    to="/register"
                    className={`px-6 py-2.5 text-md xl:text-2xl border-2 ${styles.buttonBorder} ${styles.buttonText} font-plex rounded-lg transition-all duration-300 ease-out hover:bg-white hover:text-red hover:scale-105 hover:shadow-lg`}
                  >
                    Register
                  </Link>
                  <Link
                    to="/login"
                    className={`px-6 py-2.5 text-md xl:text-2xl ${styles.buttonBg} font-plex rounded-lg transition-all duration-300 ease-out shadow-md hover:shadow-xl`}
                  >
                    Login
                  </Link>
                </>
              ) : (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className={`flex items-center space-x-2 px-4 py-2.5 text-md xl:text-2xl border-2 ${styles.buttonBorder} ${styles.buttonText} font-plex rounded-lg transition-all duration-300 ease-out hover:bg-white hover:text-red hover:scale-105 hover:shadow-lg group`}
                  >
                    <User
                      size={20}
                      className="transition-transform duration-300 ease-out group-hover:rotate-12"
                    />
                    <span>{user?.pelatih?.nama_pelatih ?? "User"}</span>
                    <ChevronDown
                      size={18}
                      className={`transition-transform duration-300 ease-out ${
                        showDropdown ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* User Dropdown */}
                  {showDropdown && (
                    <div
                      className={`absolute right-0 mt-2 w-56 ${styles.dropdownBg} rounded-xl shadow-xl border border-gray-200 overflow-hidden animate-slideDown`}
                    >
                      {userMenuItems.map(({ to, label, icon: Icon }) => (
                        <Link
                          key={to}
                          to={to}
                          onClick={() => setShowDropdown(false)}
                          className="text-xl flex items-center space-x-3 w-full px-4 py-3 text-red font-plex transition-all duration-200 ease-out hover:bg-red hover:text-white group"
                        >
                          <Icon
                            size={20}
                            className="transition-transform duration-200 ease-out group-hover:scale-110"
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
                          size={20}
                          className="transition-transform duration-200 ease-out group-hover:scale-110"
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
              {isBurgerOpen ? (
                <X size={24} className="transition-transform duration-300 ease-out group-hover:rotate-90" />
              ) : (
                <Menu size={24} className="transition-transform duration-300 ease-out group-hover:scale-110" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`lg:hidden fixed inset-0 z-40 transition-all duration-500 ease-out ${
          isBurgerOpen
            ? "visible opacity-100"
            : "invisible opacity-0 pointer-events-none"
        }`}
      >
        {/* Background overlay */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsBurgerOpen(false)}
        />

        {/* Mobile menu panel */}
        <div
          className={`absolute top-16 lg:top-20 right-0 w-full sm:w-96 h-[calc(100vh-4rem)] lg:h-[calc(100vh-5rem)] bg-white shadow-2xl transform transition-all duration-500 ease-out ${
            isBurgerOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="h-full overflow-y-auto p-6 space-y-6">
            {/* Mobile Navigation Links */}
            <div className="space-y-2">
              {navItems.map(({ to, label }, index) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => {
                    setIsBurgerOpen(false);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`flex items-center gap-3 w-full px-4 py-3 text-lg text-red font-plex rounded-lg transition-all duration-300 ease-out hover:bg-red hover:text-white hover:scale-[1.02] hover:shadow-md transform ${
                    isBurgerOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
                  } ${location.pathname === to ? "bg-red text-white" : ""}`}
                  style={{
                    transitionDelay: isBurgerOpen ? `${index * 100}ms` : "0ms",
                  }}
                >
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
                    onClick={() => setIsBurgerOpen(false)}
                    className="block w-full px-6 py-3 text-center text-lg border-2 border-red text-red font-plex rounded-lg transition-all duration-300 ease-out hover:bg-red hover:text-white hover:scale-[1.02] hover:shadow-md"
                  >
                    Register
                  </Link>
                  <Link
                    to="/login"
                    onClick={() => setIsBurgerOpen(false)}
                    className="block w-full px-6 py-3 text-center text-lg bg-red text-white font-plex rounded-lg transition-all duration-300 ease-out hover:bg-red/90 hover:scale-[1.02] hover:shadow-md"
                  >
                    Login
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* User Info */}
                  <div className="flex items-center space-x-3 px-4 py-3 bg-red/5 rounded-lg">
                    <div className="w-12 h-12 rounded-full bg-red flex items-center justify-center text-white font-bold text-lg shadow-md">
                      {(user?.pelatih?.nama_pelatih ?? "U").charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-red font-plex truncate">
                        {user?.pelatih?.nama_pelatih ?? "User"}
                      </p>
                      <p className="text-sm text-gray-500 font-plex">Logged in</p>
                    </div>
                  </div>

                  {/* User Menu Items */}
                  <div className="space-y-2">
                    {userMenuItems.map(({ to, label, icon: Icon }) => (
                      <Link
                        key={to}
                        to={to}
                        onClick={() => setIsBurgerOpen(false)}
                        className="flex items-center space-x-3 w-full px-4 py-3 text-red font-plex rounded-lg hover:bg-red hover:text-white transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-md"
                      >
                        <Icon size={20} />
                        <span>{label}</span>
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
                        size={20}
                        className="transition-transform duration-200 ease-out group-hover:scale-110"
                      />
                      <span>Logout</span>
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