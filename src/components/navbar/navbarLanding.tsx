import { Menu, X, ChevronUp, ChevronDown } from "lucide-react";
import GeneralButton from "../generalButton";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/authContext";

const NavbarLanding = () => {
  const location = useLocation();
  const isSettings = location.pathname.startsWith("/settings");

  const { user } = useAuth(); // Ambil dari AuthContext
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const Warna = location.pathname === "/event" ? "red" : "white";
  const tulisan = location.pathname === "/event" ? "white" : "black";

  return (
    <div
      className={`absolute top-0 left-1/2 transform -translate-x-1/2 h-24 w-[90vw] border-b-2 border-${Warna} flex justify-between items-center pt-4 md:px-2 lg:px-12`}
    >
      { !isSettings ? <Link
        to="/"
        className={`text-h3 text-red font-bebas tracking-wider uppercase`}
      >
        pemuda berprestasi
      </Link> : <Link
        to="/"
        className={`text-h3 text-yellow font-bebas tracking-wider uppercase`}
      >
        pemuda berprestasi
      </Link> }

      <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:flex md:gap-6 lg:gap-10 xl:gap-20 items-center">
        <Link to="/" className={`text-lg text-${Warna} font-inter`}>
          Beranda
        </Link>
        <Link to="/event" className={`text-lg text-${Warna} font-inter`}>
          Event
        </Link>
        <Link to="/lomba/home" className={`text-lg text-${Warna} font-inter`}>
          Tutorial
        </Link>


        
      </div>
      {!user ? (
      <div className="flex gap-10">
          <GeneralButton
              type="link"
              to="/register"
              label="Register"
              className={`h-12 text-lg border-2 border-${Warna} text-${Warna} font-inter`}
            />

            <GeneralButton
              type="link"
              to="/login"
              label="Login"
              className={`h-12 text-lg px-8 border-2 border-${Warna} text-${tulisan} bg-${Warna} font-inter`}
            />
        </div>
      ) : (
        <div className="relative">
          {/* Tombol untuk buka dropdown */}
          <button
            onClick={() => setShowDropdown((prev) => !prev)}
            className={`h-12 px-6 text-lg border-2 border-${Warna} text-${Warna} font-inter rounded-lg`}
          >
            <span className="flex gap-2 items-center justify-center ">
              {user.name}
              {showDropdown ? <ChevronUp size={26} /> : <ChevronDown size={26} />}
            </span>
          </button>

          {/* Dropdown menu */}
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
                  localStorage.removeItem("loggedUser"); // logout manual
                  window.location.href = "/"; // redirect ke home
                }}
                className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NavbarLanding;
