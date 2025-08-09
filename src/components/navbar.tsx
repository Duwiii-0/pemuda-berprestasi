import GeneralButton from "./generalButton";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const location = useLocation();
  const Warna = 
    location.pathname === "/"
      ? "white" // warna untuk Home
      : "red" // warna untuk Event
  const warnaJudul = 
    location.pathname === '/'
      ? "yellow"
      : "black"

    return (
        <div className={`absolute top-0 left-1/2 transform -translate-x-1/2 h-24 w-[90vw] border-b-2 border-${Warna} flex justify-between items-center pt-4 px-12`}>
            <a href="/" className={`text-h3 text-${warnaJudul} font-bebas tracking-wider uppercase`}>pemuda berprestasi</a>
            <div className="flex gap-20 items-center">
                <Link to="/" className={`text-lg text-${Warna} font-inter`}>Home</Link>
                <Link to="/event" className={`text-lg text-${Warna} font-inter`}>Event</Link>
                <GeneralButton className={`text-lg border-2 b-rder-${Warna} text-${Warna} font-inter`}>Register</GeneralButton>
            </div>
        </div>
    )

}

export default Navbar;