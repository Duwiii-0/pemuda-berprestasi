import { Menu, X } from "lucide-react"
import GeneralButton from "./generalButton";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";


const Navbar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);


  const Warna = 
    location.pathname === "/"
      ? "white" // warna untuk Home
      : "red" // warna untuk Event
  const warnaJudul = 
    location.pathname === '/'
      ? "yellow"
      : "red"

    return (
        <div className={`absolute top-0 left-1/2 transform -translate-x-1/2 h-24 w-[90vw] border-b-2 border-${Warna} flex justify-between items-center pt-4 md:px-2 lg:px-12`}>
            <a href="/" className={`text-h3 text-${warnaJudul} font-bebas tracking-wider uppercase`}>pemuda berprestasi</a>
            <div className="hidden md:flex md:gap-6 lg:gap-10 xl:gap-20 items-center">
                <Link to="/" className={`text-lg text-${Warna} font-inter`}>Home</Link>
                <Link to="/event" className={`text-lg text-${Warna} font-inter`}>Event</Link>
                <div className="relative">
               <button
                 onClick={() => setShowDropdown(!showDropdown)}
                 className={`h-12 text-lg text-${Warna} font-inter cursor-pointer`}
               >
                 Register
               </button>

               {showDropdown && (
                 <div
                   className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-40 bg-white shadow-lg rounded-lg border border-gray-200 z-50"
                 >
                   <Link
                     to="/registerdojang"
                     className="block px-4 py-2 hover:bg-red/10"
                     onClick={() => setShowDropdown(false)}
                   >
                     Dojang
                   </Link>
                   <Link
                     to="/register/peserta"
                     className="block px-4 py-2 hover:bg-red/10"
                     onClick={() => setShowDropdown(false)}
                   >
                     Peserta
                   </Link>
                 </div>
               )}
              </div>
              <GeneralButton className={`h-12 text-lg border-2 border-${Warna} text-${Warna} font-inter`}>Login</GeneralButton>
            </div>


            {/* Icon Burger Mobile */}
            <div className="md:hidden z-50">
              {isOpen ? (
                <X
                  size={32}
                  onClick={() => setIsOpen(false)}
                  className={`cursor-pointer z-10 text-${Warna}`}
                />
              ) : (
                <Menu
                  size={32}
                  onClick={() => setIsOpen(true)}
                  className={`cursor-pointer text-${Warna}`}
                />
              )}
            </div>
            
            {/* Panel Mobile */}
            {isOpen && (
              <div
                className="absolute top-0 left-1/2 transform -translate-x-1/2 w-screen h-[30vh] bg-white text-red z-10"
              >
                <div className="flex flex-col items-center justify-center h-full gap-10">
                  <Link
                    to="/"
                    className="text-lg font-inter"
                    onClick={() => setIsOpen(false)}
                  >
                    Home
                  </Link>
                  <Link
                    to="/event"
                    className="text-lg font-inter"
                    onClick={() => setIsOpen(false)}
                  >
                    Event
                  </Link>
                  <Link
                    to="/event"
                    className="text-lg font-inter"
                    onClick={() => setIsOpen(false)}
                  >Register
                  </Link>
                </div>
              </div>
            )}
        </div>
    )

}

export default Navbar;