import { Outlet, useLocation } from "react-router-dom";
import NavbarLanding from "../components/navbar/navbarLanding";
import Footer from "../components/footer";

export default function LandingLayout() {
  const location = useLocation();
  const isSettings = location.pathname.startsWith("/settings");

  return (
    <div className="min-h-screen flex flex-col">
      <NavbarLanding />
      <main className="flex-1">
        <Outlet />
      </main>
      {!isSettings && <Footer />}
    </div>
  );
}
