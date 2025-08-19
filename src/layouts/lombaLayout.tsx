import { Outlet, useLocation, useNavigate } from "react-router-dom";
import NavbarLomba from "../components/navbar/navbarLomba";
import FooterLomba from '../components/footerLomba';
import { useState, useEffect } from "react";
import { useAuth } from "../context/authContext";



export default function LombaLayout() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth(); // ⬅️ ambil logout dari AuthContext
  const isSettings = location.pathname.startsWith("/settings");

  const handleConfirmLogout = () => {
    setIsOpen(false);
    logout(); // ⬅️ pakai context logout
    navigate("/"); // ⬅️ redirect ke halaman utama
  };

  useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
      return () => {
        document.body.style.overflow = "";
      };
    }, [isOpen]);

  console.log('lombalayout dipakai')
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <NavbarLomba onLogoutRequest={() => setIsOpen(true)}/>
      <main>
        <Outlet />
      </main>
      <FooterLomba/>
    </div>
  );
}
