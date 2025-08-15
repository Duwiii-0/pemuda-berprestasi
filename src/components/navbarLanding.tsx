import { Menu, X } from "lucide-react";
import GeneralButton from "./generalButton";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/authContext";

const NavbarLanding = () => {
  const location = useLocation();
  const { user } = useAuth(); // Ambil dari AuthContext
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const Warna = location.pathname === "/" ? "white" : "red";

  return (
    <div
      className={`absolute top-0 left-1/2 transform -translate-x-1/2 h-24 w-[90vw] border-b-2 border-${Warna} flex justify-between items-center pt-4 md:px-2 lg:px-12`}
    >
      <Link
        to="/"
        className={`text-h3 text-red font-bebas tracking-wider uppercase`}
      >
        pemuda berprestasi
      </Link>

      <div className="hidden md:flex md:gap-6 lg:gap-10 xl:gap-20 items-center">
        <Link to="/" className={`text-lg text-${Warna} font-inter`}>
          Home
        </Link>
        <Link to="/event" className={`text-lg text-${Warna} font-inter`}>
          Event
        </Link>

        {/* Dashboard selalu ada */}
        <Link
          to="/dashboard/dojang"
          className={`text-lg text-${Warna} font-inter`}
        >
          Dashboard
        </Link>

        {/* Register selalu ada */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className={`h-12 text-lg text-${Warna} font-inter cursor-pointer`}
          >
            Register
          </button>

          {showDropdown && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-40 bg-white shadow-lg rounded-lg border border-gray-200 z-50">
              <Link
                to="/registerdojang"
                className="block px-4 py-2 hover:bg-red/10"
                onClick={() => setShowDropdown(false)}
              >
                Dojang
              </Link>
              <Link
                to="/registerpeserta"
                className="block px-4 py-2 hover:bg-red/10"
                onClick={() => setShowDropdown(false)}
              >
                Peserta
              </Link>
            </div>
          )}
        </div>

        {/* Tombol Login hilang kalau sudah login */}
        {!user && (
          <GeneralButton
            type="link"
            to="/login"
            label="Login"
            className={`h-12 text-lg border-2 border-${Warna} text-${Warna} font-inter`}
          />
        )}
      </div>
    </div>
  );
};

export default NavbarLanding;
