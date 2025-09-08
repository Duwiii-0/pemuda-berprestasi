import { Outlet, useLocation, useNavigate } from "react-router-dom";
import NavbarLanding from "../components/navbar/navbarLanding";
import Footer from "../components/footer";
import AlertModal from "../components/alertModal";
import { useState, useEffect } from "react";
import { useAuth } from "../context/authContext";

export default function LandingLayout() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth(); 
  const isSettings = location.pathname.startsWith("/settings");

  const handleConfirmLogout = () => {
    setIsOpen(false);
    logout(); 
    navigate("/"); 
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

  return (
    <div className="min-h-screen flex flex-col">
      <NavbarLanding onLogoutRequest={() => setIsOpen(true)} />
      <main className="flex-1">
        <Outlet />
      </main>
      {!isSettings && <Footer />}
      <AlertModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleConfirmLogout}
        message="Are you sure you want to log out?"
      />
    </div>
  );
}
