import { Menu, X, ChevronUp, ChevronDown } from "lucide-react";
import GeneralButton from "../generalButton";
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/authContext";

const NavbarLomba = ({ onLogoutRequest }: { onLogoutRequest: () => void }) => {
  const location = useLocation();

  const { user } = useAuth(); 
  const [showDropdown, setShowDropdown] = useState(false);
  const [isBurgerOpen, setIsBurgerOpen] = useState(false);



  return (
    <div className="bg-red absolute top-0 left-0 h-24 w-full flex justify-between items-center px-4 md:px-10 lg:px-12 z-50">
      {/* Logo */}
      <Link
        to="/"
        className="block md:hidden lg:block text-h3 xl:px-10 text-yellow font-bebas tracking-wider uppercase"
      >
        pemuda berprestasi
      </Link>

      {/* Menu Desktop */}
      <div className="hidden md:flex md:gap-10  xl:gap-20 items-center ">
        <Link
          to="/lomba/home"
          className={`active:scale-95 transition-all duration-300 relative text-lg font-plex  ${
            location.pathname === "/lomba/home" ? "text-yellow" : "text-white hover:text-yellow/70"
          }`}
        >
          Beranda
          <span
            className={`absolute left-0 -bottom-1 h-[2px] bg-yellow transition-all duration-300 ${
              location.pathname === "/lomba/home" ? "w-full" : "w-0"
            }`}
          />
        </Link>
        <Link
          to="/lomba/timeline"
          className={`active:scale-95 transition-all duration-300 relative text-lg font-plex  ${
            location.pathname === "/lomba/timeline" ? "text-yellow" : "text-white hover:text-yellow/70"
          }`}
        >
          Timeline
          <span
            className={`absolute left-0 -bottom-1 h-[2px] bg-yellow transition-all duration-300 ${
              location.pathname === "/lomba/timeline" ? "w-full" : "w-0"
            }`}
          />
        </Link>
        <Link
          to="/lomba/faq"
          className={`active:scale-95 transition-all duration-300 relative text-lg font-plex ${
            location.pathname === "/lomba/faq" ? "text-yellow" : "text-white hover:text-yellow/70"
          }`}
        >
          Faq
          <span
            className={`absolute left-0 -bottom-1 h-[2px] bg-yellow transition-all duration-300 ${
              location.pathname === "/lomba/faq" ? "w-full" : "w-0"
            }`}
          />
        </Link>
      </div>

      {/* Button Desktop */}
      {!user ? (
        <div className="hidden md:flex gap-10">
          <GeneralButton
            type="navbar"
            to="/register"
            label="Register"
            className="active:scale-95 h-12 text-lg border-2 border-white text-white font-plex"
          />
          <GeneralButton
            type="navbar"
            to="/login"
            label="Login"
            className="active:scale-95 h-12 text-lg border-2 bg-white border-white text-red font-plex"
          />
        </div>
      ) : (
        <div className="hidden md:block relative">
          <button
            onClick={() => setShowDropdown((prev) => !prev)}
            className={`${showDropdown && 'border-yellow'} h-12 px-6 text-lg border-2 bg-white border-yellow text-red font-plex rounded-lg transition-all duration-300 ${showDropdown && "rounded-b-none border-b-transparent pt-4"}`}
          >
            <span className="flex gap-2 items-center justify-center">
              <span className="max-w-32 lg:max-w-42 xl:max-w-full truncate">
                {user?.pelatih?.nama_pelatih ?? "Nama tidak tersedia"}
              </span>
              {showDropdown ? (
                <ChevronUp size={26} className="transition-all duration-500" />
              ) : (
                <ChevronUp size={26} className="transition-all duration-500 -rotate-180" />
              )}
            </span>
          </button>

          {showDropdown && (
            <div className={`absolute right-0 -mt-2 bg-white w-full pt-6 shadow-lg rounded-lg rounded-t-none border-2 border-t-transparent border-white ${showDropdown && 'border-yellow'} z-50`}>
              <Link
                to="/dashboard/dojang"
                className={`text-lg block px-4 py-2 text-red hover:font-semibold transition-all duration-300 hover:text-yellow`} 
                onClick={() => setShowDropdown(false)}
              >
                Dashboard
              </Link>
              <Link
                to="/settings"
                className={`text-lg block px-4 py-2 text-red hover:font-semibold transition-all duration-300 hover:text-yellow`} 
                onClick={() => setShowDropdown(false)}
              >
                Settings
              </Link>
              <button
                onClick={() => {
                  setShowDropdown(false);
                  onLogoutRequest();
                }}
                className={`text-lg w-full text-left px-4 py-2 text-red hover:font-semibold transition-all duration-300 hover:text-yellow`}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      )}

      {/* Burger Mobile */}
      <div className="md:hidden">
        <button onClick={() => setIsBurgerOpen((prev) => !prev)}>
          {isBurgerOpen ? (
            <X size={32} className="text-white" />
          ) : (
            <Menu size={32} className="text-white" />
          )}
        </button>

        <div
          className={`fixed top-0 left-0 w-full bg-white shadow-lg border-b border-gray-200 z-40 flex flex-col transform transition-transform duration-300 ${
            isBurgerOpen ? "translate-y-0" : "-translate-y-full"
          }`}
        >
          <div className="flex justify-end items-center h-20 px-6 border-b border-gray-200">
            <button onClick={() => setIsBurgerOpen(false)}>
              <X size={28} className="text-gray-700" />
            </button>
          </div>

          <div className="flex flex-col p-4 text-lg text-center">
            {!user ? (
              <>
                <Link to="/lomba/home" className="px-4 py-3 text-black hover:bg-gray-100 rounded" onClick={() => setIsBurgerOpen(false)}>Beranda</Link>
                <Link to="/lomba/timeline" className="px-4 py-3 text-black hover:bg-gray-100 rounded" onClick={() => setIsBurgerOpen(false)}>Timeline</Link>
                <Link to="/lomba/faq" className="px-4 py-3 text-black hover:bg-gray-100 rounded" onClick={() => setIsBurgerOpen(false)}>FAQ</Link>
                <Link to="/register" className="px-4 py-3 text-black hover:bg-gray-100 rounded" onClick={() => setIsBurgerOpen(false)}>Register</Link>
                <Link to="/login" className="px-4 py-3 text-black hover:bg-gray-100 rounded" onClick={() => setIsBurgerOpen(false)}>Login</Link>
              </>
            ) : (
              <>
                <Link to="/lomba/home" className="px-4 py-3 text-black hover:bg-gray-100 rounded" onClick={() => setIsBurgerOpen(false)}>Beranda</Link>
                <Link to="/lomba/timeline" className="px-4 py-3 text-black hover:bg-gray-100 rounded" onClick={() => setIsBurgerOpen(false)}>Timeline</Link>
                <Link to="/lomba/faq" className="px-4 py-3 text-black hover:bg-gray-100 rounded" onClick={() => setIsBurgerOpen(false)}>FAQ</Link>
                <Link to="/dashboard/dojang" className="px-4 py-3 text-black hover:bg-gray-100 rounded" onClick={() => setIsBurgerOpen(false)}>Dashboard</Link>
                <Link to="/settings" className="px-4 py-3 text-black hover:bg-gray-100 rounded" onClick={() => setIsBurgerOpen(false)}>Settings</Link>
                <button
                  onClick={() => {
                    setIsBurgerOpen(false);
                    localStorage.removeItem("loggedUser");
                    window.location.href = "/";
                  }}
                  className="px-4 py-3 text-gray-700 hover:bg-gray-100 rounded"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavbarLomba;
