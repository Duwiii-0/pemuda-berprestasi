import { Outlet } from "react-router-dom";
import NavbarLanding from "../components/navbarLanding";
import Footer from "../components/footer";

export default function LandingLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavbarLanding />
      <main>
        <Outlet />
      </main>
        <Footer />
    </div>
  );
}
