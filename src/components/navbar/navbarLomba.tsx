import { Menu, X, ChevronUp, ChevronDown } from "lucide-react";
import GeneralButton from "../generalButton";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/authContext";

const NavbarLomba = () => {
  const location = useLocation();
  const { user } = useAuth(); // Ambil dari AuthContext
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div
      className={`bg-red absolute top-0 transform h-24 w-full flex justify-between items-center md:px-2 lg:px-12 z-50`}
    >
      <Link
        to="/"
        className={`text-h3 text-yellow font-bebas tracking-wider uppercase`}
      >
        pemuda berprestasi
      </Link>

      <div className="hidden md:flex md:gap-6 lg:gap-10 xl:gap-20 items-center">
        <Link to="/lomba/home" className={`text-lg text-white font-inter`}>
          Beranda
        </Link>
        <Link to="/lomba/timeline" className={`text-lg text-white font-inter`}>
          Timeline
        </Link>

        <Link to="/lomba/faq" className={`text-lg text-white font-inter`}>
          FAQ
        </Link>

      </div>
      {!user ? (
      <div className="flex gap-10">
          <GeneralButton
              type="link"
              to="/register"
              label="Register"
              className={`h-12 text-lg border-2 border-white text-white font-inter`}
            />

            <GeneralButton
              type="link"
              to="/login"
              label="Login"
              className={`h-12 text-lg border-2 border-white text-white font-inter`}
            />
        </div>
      ) : (
        <div className="relative">
          {/* Tombol untuk buka dropdown */}
          <button
            onClick={() => setShowDropdown((prev) => !prev)}
            className={`h-12 px-6 text-lg border-2 border-white text-white font-inter rounded-lg`}
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

export default NavbarLomba;
