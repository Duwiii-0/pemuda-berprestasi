import { Outlet, useNavigate } from "react-router-dom";
import NavbarLomba from "../components/navbar/navbarLomba";
import FooterLomba from '../components/footerLomba';
import { useState, useEffect } from "react";
import AlertModal from "../components/alertModal";
import { useAuth } from "../context/authContext";



export default function LombaLayout() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth(); // ⬅️ ambil logout dari AuthContext

  const handleConfirmLogout = () => {
    setIsOpen(false);
    logout(); // ⬅️ pakai context logout
    navigate("/event/home"); // ⬅️ redirect ke halaman utama
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

      <AlertModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleConfirmLogout}
        message="Are you sure you want to log out?"
      />
    </div>
  );
}
