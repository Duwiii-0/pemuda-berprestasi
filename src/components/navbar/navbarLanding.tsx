import { ChevronUp, ChevronDown, Menu, X } from "lucide-react";
import GeneralButton from "../generalButton";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/authContext";

const NavbarLanding = ({ onLogoutRequest }: { onLogoutRequest: () => void }) => {
  const location = useLocation();
  const isSettings = location.pathname.startsWith("/settings");

  const { user } = useAuth(); 
  const [showDropdown, setShowDropdown] = useState(false);
  const [isBurgerOpen, setIsBurgerOpen] = useState(false);

  const Warna = location.pathname === "/event" ? "red" : "white";
  const tulisan = location.pathname === "/event" ? "white" : "black";

  return (
    <div
      className={`absolute top-0 left-1/2 transform -translate-x-1/2 h-24 w-screen px-4 md:px-0 md:w-[90vw] md:border-b-2 border-${Warna} flex justify-between items-center pt-4 md:px-2 lg:px-2 xl:px-12 z-50`}
    >
      {/* Logo */}
      { !isSettings ? (
        <Link to="/" className={`sm:block md:hidden lg:block max-w-92 xl:px-10 text-h3 text-${Warna} font-bebas tracking-wider uppercase`}>
          pemuda berprestasi
        </Link>
      ) : (
        <Link to="/" className={`sm:block md:hidden lg:block max-w-92 xl:px-10 text-h3 text-${Warna} font-bebas tracking-wider uppercase`}>
          pemuda berprestasi
        </Link>
      )}

      {/* Menu Desktop */}
      <div className="hidden md:flex md:gap-20 lg:gap-10 xl:gap-20 items-center">
        <Link to="/" className={`text-lg text-${Warna} font-inter`}>
          Beranda
        </Link>
        <Link to="/event" className={`text-lg text-${Warna} font-inter`}>
          Event
        </Link>
        <Link to="/tutorial" className={`text-lg text-${Warna} font-inter`}>
          Tutorial
        </Link>
      </div>

      {/* Button Desktop */}
      {!user ? (
        <div className="hidden md:flex gap-10">
          <GeneralButton
            type="navbar"
            to="/register"
            label="Register"
            className={`h-12 text-lg border-2 border-${Warna} text-${Warna} font-inter`}
          />
          <GeneralButton
            type="navbar"
            to="/login"
            label="Login"
            className={`h-12 text-lg px-8 border-2 border-${Warna} text-${tulisan} bg-${Warna} font-inter`}
          />
        </div>
      ) : (
        <div className="hidden md:block relative">
          <button
            onClick={() => setShowDropdown((prev) => !prev)}
            className={`h-12 px-6 text-lg border-2 border-${Warna} text-${Warna} font-inter rounded-lg`}
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
                  onLogoutRequest();
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
          {isBurgerOpen ? <X size={32} className={`text-${Warna}`} /> : <Menu size={32} className={`text-${Warna}`} />}
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
                <Link to="/" className="px-4 py-3 text-black hover:bg-gray-100 rounded" onClick={() => setIsBurgerOpen(false)}>Beranda</Link>
                <Link to="/event" className="px-4 py-3 text-black hover:bg-gray-100 rounded" onClick={() => setIsBurgerOpen(false)}>Event</Link>
                <Link to="/tutorial" className="px-4 py-3 text-black hover:bg-gray-100 rounded" onClick={() => setIsBurgerOpen(false)}>Tutorial</Link>
                <Link to="/register" className="px-4 py-3 text-black hover:bg-gray-100 rounded" onClick={() => setIsBurgerOpen(false)}>Register</Link>
                <Link to="/login" className="px-4 py-3 text-black hover:bg-gray-100 rounded" onClick={() => setIsBurgerOpen(false)}>Login</Link>
              </>
            ) : (
              <>
                <Link to="/" className="px-4 py-3 text-black hover:bg-gray-100 rounded" onClick={() => setIsBurgerOpen(false)}>Beranda</Link>
                <Link to="/event" className="px-4 py-3 text-black hover:bg-gray-100 rounded" onClick={() => setIsBurgerOpen(false)}>Event</Link>
                <Link to="/tutorial" className="px-4 py-3 text-black hover:bg-gray-100 rounded" onClick={() => setIsBurgerOpen(false)}>Tutorial</Link>
                <Link to="/dashboard/dojang" className="px-4 py-3 text-black hover:bg-gray-100 rounded" onClick={() => setIsBurgerOpen(false)}>Dashboard</Link>
                <Link to="/settings" className="px-4 py-3 text-black hover:bg-gray-100 rounded" onClick={() => setIsBurgerOpen(false)}>Settings</Link>
                <button
                  onClick={() => {
                    setIsBurgerOpen(false);
                    onLogoutRequest();
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

export default NavbarLanding;
