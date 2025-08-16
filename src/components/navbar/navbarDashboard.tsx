import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { X } from "lucide-react";
import GeneralButton from "../generalButton";

interface NavbarDashboardProps {
  mobile?: boolean;
  onClose?: () => void;
}

const NavbarDashboard: React.FC<NavbarDashboardProps> = ({ mobile = false, onClose }) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { name: "Data Dojang", path: "/dashboard/dojang" },
    { name: "Data Atlit", path: "/dashboard/Atlit" },
    { name: "Riwayat Pertandingan", path: "/dashboard/riwayatpertandingan" },
    { name: "Ganti Password", path: "/dashboard/changepassword" },
  ];

  // Versi Mobile
  if (mobile) {
    return (
      <div className="lg:hidden fixed top-0 right-0 h-full w-92 bg-white border-r-2 border-red z-50 shadow-2xl flex flex-col">
        <div className="flex items-end justify-between p-4 border-b">
          <div className="font-bebas text-red text-2xl">Menu</div>
          <button onClick={onClose}>
            <X size={28} />
          </button>
        </div>

        <div className="text-center font-bebas text-3xl px-4 py-4">
          dashboard anggota
        </div>

        <nav className="flex flex-col gap-4 w-full px-4 text-inter text-center py-4">
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
              onClick={onClose}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-4 px-4 pb-6">
          <GeneralButton
            type="link"
            to="/login"
            label="Logout"
            className="rounded-2xl h-12 w-full text-lg border-2 border-red-500 text-red-500 font-inter hover:bg-red-500 hover:text-white transition-colors duration-200 ease-in-out"
          />
          <div className="text-sm text-gray-500 text-center">© 2025 apani</div>
        </div>
      </div>
    );
  }

  // Versi Desktop
  return (
    <div className="hidden lg:flex fixed left-3 top-1/2 -translate-y-1/2 h-[95vh] lg:w-[27vw] xl:w-[20vw] border-2 border-red flex-col justify-start items-center py-t pb-0 z-50 bg-white rounded-2xl shadow-2xl">
      <div className="text-center font-bebas text-5xl px-20 py-20">
        logo
      </div>
      <div className="text-center font-bebas text-5xl px-20 pb-4">
        dashboard 
      </div>

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

      <div className="h-full w-full flex flex-col justify-end items-center gap-4 px-6">
        <GeneralButton
          type="link"
          to="/login"
          label="Logout"
          className="rounded-2xl h-12 w-full text-lg border-2 border-red-500 text-red-500 font-inter hover:bg-red-500 hover:text-white transition-colors duration-200 ease-in-out"
        />
        <div className="text-sm text-gray-500 pb-4">© 2025 apani</div>
      </div>
    </div>
  );
};

export default NavbarDashboard;
