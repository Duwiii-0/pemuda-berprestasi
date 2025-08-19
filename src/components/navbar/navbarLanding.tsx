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

  const Warna = location.pathname === "/" ? "white" : "red";
  const tulisan = location.pathname === "/" ? "black" : "white";

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
        <Link to="/" className={`active:scale-95 transition-all duraiton-300 relative text-lg text-${Warna} font-plex 
        ${location.pathname === "/" ? "text-yellow" : " hover:text-yellow/70"}`}>
          Beranda
          <span
            className={`absolute left-0 -bottom-1 h-[2px] bg-yellow transition-all duration-300 ${
              location.pathname === "/" ? "w-full" : "w-0"
            }`}
          />
        </Link>
        <Link to="/event" className={`active:scale-95 transition-all duraiton-300 relative text-lg text-${Warna} font-plex 
        ${location.pathname === "/event" ? "text-yellow" : " hover:text-yellow/70"}`}>
          Event
          <span
            className={`absolute left-0 -bottom-1 h-[2px] bg-yellow transition-all duration-300 ${
              location.pathname === "/event" ? "w-full" : "w-0"
            }`}
          />

        </Link>
        <Link to="/tutorial" className={`active:scale-95 transition-all duraiton-300 relative text-lg text-${Warna} font-plex
        ${location.pathname === "/tutorial" ? "text-yellow" : " hover:text-yellow/70"}`}>
          Tutorial
          <span
            className={`absolute left-0 -bottom-1 h-[2px] bg-yellow transition-all duration-300 ${
              location.pathname === "/tutorial" ? "w-full" : "w-0"
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
            className={`h-12 text-lg border-2 border-${Warna} text-${Warna} font-plex`}
          />
          <GeneralButton
            type="navbar"
            to="/login"
            label="Login"
            className={`h-12 text-lg px-8 border-2 border-${Warna} text-${tulisan} bg-${Warna} font-plex`}
          />
        </div>
      ) : (
        <div className="hidden md:block relative">
          <button
            onClick={() => setShowDropdown((prev) => !prev)}
            className={`h-12 px-6 text-lg border-2 border-${Warna} text-${Warna} font-plex rounded-lg transition-all duration-300 ${showDropdown && "rounded-b-none border-b-transparent pt-4"}`}
          >
            <span className="flex gap-2 items-center justify-center">
              <span className="max-w-32 lg:max-w-42 xl:max-w-full truncate">
                {user.name}
              </span>
              {showDropdown ? (
                <ChevronUp size={26} className="transition-all duration-500" />
              ) : (
                <ChevronUp size={26} className="transition-all duration-500 rotate-180" />
              )}
            </span>
          </button>

          {showDropdown && (
            <div className={`absolute right-0 -mt-2 w-full pt-6 shadow-lg rounded-lg rounded-t-none border-2 border-t-transparent transition-all duration-300 border-${Warna} z-50`}>
              <Link
                to="/dashboard/dojang"
                className={`text-lg block px-4 py-2 text-${Warna} hover:font-semibold transition-all duraiton-300 hover:text-yellow`} 
                onClick={() => setShowDropdown(false)}
              >
                Dashboard
              </Link>
              <Link
                to="/settings"
                className={`text-lg block px-4 py-2 text-${Warna} hover:font-semibold transition-all duraiton-300 hover:text-yellow`} 
                onClick={() => setShowDropdown(false)}
              >
                Settings
              </Link>
              <button
                onClick={() => {
                  setShowDropdown(false);
                  onLogoutRequest();
                }}
                className={`text-lg w-full text-left px-4 py-2 text-${Warna} hover:font-semibold transition-all duraiton-300 hover:text-yellow`}
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
