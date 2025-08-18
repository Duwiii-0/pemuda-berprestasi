import { Menu, X, ChevronUp, ChevronDown } from "lucide-react";
import GeneralButton from "../generalButton";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/authContext";

const NavbarLomba = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isBurgerOpen, setIsBurgerOpen] = useState(false);

  return (
    <div className="bg-red absolute top-0 left-0 h-24 w-full flex justify-between items-center px-4 md:px-10 lg:px-12 z-50">
      {/* Logo */}
      <Link
        to="/"
        className="block md:hidden lg:block text-h3 text-yellow font-bebas tracking-wider uppercase"
      >
        pemuda berprestasi
      </Link>

      {/* Menu Desktop */}
      <div className="hidden md:flex md:gap-10  xl:gap-20 items-center">
        <Link to="/lomba/home" className="text-lg text-white font-inter">
          Beranda
        </Link>
        <Link to="/lomba/timeline" className="text-lg text-white font-inter">
          Timeline
        </Link>
        <Link to="/lomba/faq" className="text-lg text-white font-inter">
          FAQ
        </Link>
      </div>

      {/* Button Desktop */}
      {!user ? (
        <div className="hidden md:flex gap-10">
          <GeneralButton
            type="link"
            to="/register"
            label="Register"
            className="h-12 text-lg border-2 border-white text-white font-inter"
          />
          <GeneralButton
            type="link"
            to="/login"
            label="Login"
            className="h-12 text-lg border-2 border-white text-white font-inter"
          />
        </div>
      ) : (
        <div className="hidden md:block relative">
          <button
            onClick={() => setShowDropdown((prev) => !prev)}
            className="h-12 px-6 text-lg border-2 border-white text-white font-inter rounded-lg"
          >
            <span className="flex gap-2 items-center justify-center">
              <span className="max-w-32 lg:max-w-42 xl:max-w-full truncate">
                {user.name}
              </span>
              {showDropdown ? (
                <ChevronUp size={26} className="transition-all duration-300" />
              ) : (
                <ChevronDown size={26} className="transition-all duration-300" />
              )}
            </span>
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg border border-gray-200 z-50">
              <Link
                to="/dashboard/dojang"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                onClick={() => setShowDropdown(false)}
              >
                Dashboard
              </Link>
              <Link
                to="/settings"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                onClick={() => setShowDropdown(false)}
              >
                Settings
              </Link>
              <button
                onClick={() => {
                  setShowDropdown(false);
                  localStorage.removeItem("loggedUser");
                  window.location.href = "/";
                }}
                className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
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
