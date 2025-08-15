import { Outlet } from "react-router-dom";
import NavbarLomba from "../components/navbar/navbarLomba";
import FooterLomba from '../components/footerLomba'


export default function LombaLayout() {
  console.log('lombalayout dipakai')
  return (
    <div className="min-h-screen flex flex-col">
      <NavbarLomba />
      <main>
        <Outlet />
      </main>
      <FooterLomba/>
    </div>
  );
}
