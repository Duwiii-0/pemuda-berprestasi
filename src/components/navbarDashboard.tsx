import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import GeneralButton from "./generalButton";

const NavbarDashboard = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { name: "Dojang", path: "/dashboard/peserta/dojang" },
    { name: "Data Diri", path: "/dashboard/peserta/profile" },
    { name: "Riwayat Pertandingan", path: "/dashboard/peserta/riwayatpertandingan" },
    { name: "Ganti Password", path: "/dashboard/peserta/changepassword" },
  ];

  return (
    <div className="fixed left-3 top-1/2 -translate-y-1/2 h-[95vh] w-[20vw] border-2 border-red flex flex-col justify-start items-center py-t pb-0 z-50 bg-white rounded-2xl shadow-2xl">
      {/* Judul */}
      <div className="text-center font-bebas text-5xl px-20 py-20">
        Pemuda Berprestasi
      </div>
      <div className="text-center font-bebas text-3xl px-20 pb-4">
        dashboard anggota
      </div>

      {/* Menu */}
      <nav className="flex flex-col gap-4 w-full px-6 text-inter text-center">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`block px-4 py-2 rounded-lg text-lg font-inter transition-colors duration-200
              ${
                location.pathname === item.path
                  ? "bg-red text-white"
                  : "text-black hover:bg-yellow/10 border-1 border-red"
              }`}
          >
            {item.name}
          </Link>
        ))}
      </nav>

      {/* Footer di Navbar (opsional) */}
      <div className="h-full w-full flex flex-col justify-end items-center gap-4 px-6">
      <GeneralButton type="link" to="/login" label="Login" className={`rounded-2xl h-12 w-full text-lg border-2 border-red-500 text-red-500 font-inter hover:bg-red-500 hover:text-white transition-colors duration-200 ease-in-out`}/>
      <div className="text-sm text-gray-500 pb-4">© 2025 apani</div>
      </div>
    </div>
  );
};

export default NavbarDashboard;
