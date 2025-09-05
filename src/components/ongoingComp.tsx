import toast from "react-hot-toast";
import CompCard from "./compCard";
import { ChevronLeft, ChevronRight } from "lucide-react";

const OngoingComp = () => {
  const handleNavClick = () => {
    toast.error("Hanya ada satu kompetisi untuk sekarang", {
      style: {
        background: '#990D35',
        color: 'white',
        fontFamily: 'IBM Plex Sans'
      }
    });
  };

  return (
    <section className="relative w-full bg-gradient-to-br from-white via-red/[0.02] to-white overflow-hidden py-8 md:py-12 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Enhanced Header Section */}
        <div className="text-left mb-12 md:mb-16 lg:mb-20 max-w-4xl">
          {/* Section Label with Animation */}
          <div className="inline-block group mb-4 md:mb-6">
            <span className="text-red font-plex font-semibold text-sm uppercase tracking-[0.2em] border-l-4 border-red pl-4 md:pl-6 relative">
              Kompetisi Terkini
              <div className="absolute -left-1 top-0 bottom-0 w-1 bg-red/20 group-hover:bg-red/40 transition-colors duration-300"></div>
            </span>
          </div>
          
          {/* Main Heading with Gradient Text */}
          <div className="relative mb-4 md:mb-6">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bebas leading-[0.85] tracking-wide">
              <span className="bg-gradient-to-r from-red via-red/90 to-red/80 bg-clip-text text-transparent">
                Our
              </span>
              <span className="block bg-gradient-to-r from-red/90 via-red to-red/90 bg-clip-text text-transparent">
                Competitions
              </span>
            </h2>
            {/* Subtle underline accent */}
            <div className="absolute -bottom-2 left-0 w-16 md:w-24 h-1 bg-gradient-to-r from-red to-red/60 rounded-full"></div>
          </div>
          
          <p className="text-base md:text-lg lg:text-xl xl:text-2xl font-plex text-black/70 leading-relaxed font-light max-w-2xl">
            Jadilah bagian dari tantangan taekwondo terbaik di arena digital global
          </p>
        </div>

        {/* Enhanced Competition Card Section */}
        <div className="mb-12 md:mb-16 lg:mb-20">
          {/* Desktop Layout */}
          <div className="hidden lg:flex items-center justify-center gap-8 xl:gap-12 w-full">
            <div className="flex-shrink-0">
              <button 
                onClick={() => handleNavClick()}
                className="group relative p-4 xl:p-6 rounded-2xl xl:rounded-3xl bg-white/90 backdrop-blur-md border border-red/10 hover:border-red/20 hover:bg-red transition-all duration-500 hover:shadow-2xl hover:shadow-red/25"
              >
                <ChevronLeft 
                  size={28} 
                  className="xl:w-8 xl:h-8 text-red group-hover:text-white transition-all duration-300"
                />
              </button>
            </div>
            
            <div className="flex-1 max-w-6xl flex justify-center">
                <CompCard />
            </div>
            
            <div className="flex-shrink-0">
              <button 
                onClick={() => handleNavClick()}
                className="group relative p-4 xl:p-6 rounded-2xl xl:rounded-3xl bg-white/90 backdrop-blur-md border border-red/10 hover:border-red/20 hover:bg-red transition-all duration-500 hover:shadow-2xl hover:shadow-red/25"
              >
                <ChevronRight 
                  size={28} 
                  className="xl:w-8 xl:h-8 text-red group-hover:text-white transition-all duration-300"
                />
              </button>
            </div>
          </div>

          {/* Enhanced Mobile Layout */}
          <div className="lg:hidden flex flex-col items-center">
            <div className="w-full max-w-4xl mb-6 flex justify-center">
              <div className="border-2 border-red/20 rounded-xl md:rounded-2xl p-1 bg-gradient-to-r from-red/5 to-red/10 shadow-lg">
                <CompCard />
              </div>
            </div>
            
            <div className="flex justify-center items-center gap-3">
              <div className="relative">
                <div className="w-3 h-3 md:w-4 md:h-4 bg-gradient-to-r from-red to-red/80 rounded-full shadow-sm"></div>
                <div className="absolute inset-0 w-3 h-3 md:w-4 md:h-4 bg-red/30 rounded-full animate-ping"></div>
              </div>
              <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-red/20 rounded-full hover:bg-red/40 transition-colors duration-300 cursor-pointer"></div>
              <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-red/20 rounded-full hover:bg-red/40 transition-colors duration-300 cursor-pointer"></div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default OngoingComp;