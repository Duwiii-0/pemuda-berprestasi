import toast from "react-hot-toast";
import CompCard from "./compCard";
import { ChevronLeft, ChevronRight, Trophy, Calendar, MapPin } from "lucide-react";

const OngoingComp = () => {
  const handleNavClick = (direction: string) => {
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
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-48 md:w-72 lg:w-96 h-48 md:h-72 lg:h-96 border border-red/[0.08] rounded-full animate-pulse opacity-40"></div>
        <div className="absolute bottom-1/4 right-1/4 w-36 md:w-56 lg:w-72 h-36 md:h-56 lg:h-72 border border-red/[0.06] rounded-full animate-pulse opacity-30 animation-delay-1000"></div>
        <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-red/20 rounded-full animate-bounce opacity-60"></div>
        <div className="absolute bottom-1/3 left-1/4 w-1 h-1 bg-red/30 rounded-full animate-bounce animation-delay-500"></div>
      </div>

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
                onClick={() => handleNavClick('prev')}
                className="group relative p-4 xl:p-6 rounded-2xl xl:rounded-3xl bg-white/90 backdrop-blur-md border border-red/10 hover:border-red/20 hover:bg-red transition-all duration-500 hover:shadow-2xl hover:shadow-red/25"
              >
                <ChevronLeft 
                  size={28} 
                  className="xl:w-8 xl:h-8 text-red group-hover:text-white transition-all duration-300"
                />
              </button>
            </div>
            
            <div className="flex-1 max-w-6xl flex justify-center">
              <div className="border-2 border-red/20 rounded-2xl lg:rounded-3xl p-1 bg-gradient-to-r from-red/5 to-red/10 shadow-lg hover:shadow-xl transition-all duration-300">
                <CompCard />
              </div>
            </div>
            
            <div className="flex-shrink-0">
              <button 
                onClick={() => handleNavClick('next')}
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

        {/* Enhanced Features Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 lg:gap-10 max-w-6xl mx-auto">
          <div className="group space-y-3 md:space-y-4 p-4 md:p-6 rounded-xl md:rounded-2xl hover:bg-red/[0.02] transition-all duration-500 hover:shadow-lg hover:shadow-red/10 text-center">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-red/10 to-red/5 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto group-hover:from-red/15 group-hover:to-red/8 transition-all duration-300 group-hover:scale-110">
              <Trophy className="w-6 h-6 md:w-7 md:h-7 text-red" />
            </div>
            <h3 className="text-base md:text-lg lg:text-xl font-plex font-semibold text-red group-hover:text-red/90 transition-colors">
              Prestasi Tinggi
            </h3>
            <p className="text-xs md:text-sm lg:text-base text-black/70 font-plex leading-relaxed">
              Kompetisi berstandar internasional dengan sistem penilaian yang fair dan transparan
            </p>
          </div>

          <div className="group space-y-3 md:space-y-4 p-4 md:p-6 rounded-xl md:rounded-2xl hover:bg-red/[0.02] transition-all duration-500 hover:shadow-lg hover:shadow-red/10 text-center">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-red/10 to-red/5 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto group-hover:from-red/15 group-hover:to-red/8 transition-all duration-300 group-hover:scale-110">
              <Calendar className="w-6 h-6 md:w-7 md:h-7 text-red" />
            </div>
            <h3 className="text-base md:text-lg lg:text-xl font-plex font-semibold text-red group-hover:text-red/90 transition-colors">
              Jadwal Fleksibel
            </h3>
            <p className="text-xs md:text-sm lg:text-base text-black/70 font-plex leading-relaxed">
              Berbagai kategori waktu kompetisi yang disesuaikan dengan kebutuhan atlet
            </p>
          </div>

          <div className="group space-y-3 md:space-y-4 p-4 md:p-6 rounded-xl md:rounded-2xl hover:bg-red/[0.02] transition-all duration-500 hover:shadow-lg hover:shadow-red/10 text-center sm:col-span-3 md:col-span-1">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-red/10 to-red/5 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto group-hover:from-red/15 group-hover:to-red/8 transition-all duration-300 group-hover:scale-110">
              <MapPin className="w-6 h-6 md:w-7 md:h-7 text-red" />
            </div>
            <h3 className="text-base md:text-lg lg:text-xl font-plex font-semibold text-red group-hover:text-red/90 transition-colors">
              Jangkauan Global
            </h3>
            <p className="text-xs md:text-sm lg:text-base text-black/70 font-plex leading-relaxed">
              Peserta dari berbagai negara dengan level kompetisi yang beragam dan menantang
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OngoingComp;