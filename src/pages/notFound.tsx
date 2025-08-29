import { Home, ArrowLeft, Clock, Wrench } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Logo */}
            <div className="flex items-center">
              <div className="text-2xl md:text-3xl font-bebas text-red">
                TAEKWONDO
              </div>
            </div>
            
            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="/" className="text-gray-700 hover:text-red font-plex transition-colors">Home</a>
              <a href="/competitions" className="text-gray-700 hover:text-red font-plex transition-colors">Competitions</a>
              <a href="/about" className="text-gray-700 hover:text-red font-plex transition-colors">About</a>
              <a href="/contact" className="text-gray-700 hover:text-red font-plex transition-colors">Contact</a>
            </div>
            
            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button className="text-gray-700 hover:text-red transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 relative bg-gradient-to-br from-white via-red/[0.02] to-white overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-48 md:w-72 lg:w-96 h-48 md:h-72 lg:h-96 border border-red/[0.08] rounded-full animate-pulse opacity-40"></div>
          <div className="absolute bottom-1/4 right-1/4 w-36 md:w-56 lg:w-72 h-36 md:h-56 lg:h-72 border border-red/[0.06] rounded-full animate-pulse opacity-30 animation-delay-1000"></div>
          <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-red/20 rounded-full animate-bounce opacity-60"></div>
          <div className="absolute bottom-1/3 left-1/4 w-1 h-1 bg-red/30 rounded-full animate-bounce animation-delay-500"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex items-center justify-center min-h-[70vh]">
          <div className="text-center max-w-2xl mx-auto">
            
            {/* Icon */}
            <div className="mb-8">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-red/10 to-red/5 rounded-2xl flex items-center justify-center mx-auto group-hover:from-red/15 group-hover:to-red/8 transition-all duration-300">
                <Wrench className="w-10 h-10 md:w-12 md:h-12 text-red" />
              </div>
            </div>

            {/* Section Label */}
            <div className="inline-block group mb-6">
              <span className="text-red font-plex font-semibold text-sm uppercase tracking-[0.2em] border-l-4 border-red pl-4 md:pl-6 relative">
                Segera Hadir
                <div className="absolute -left-1 top-0 bottom-0 w-1 bg-red/20 group-hover:bg-red/40 transition-colors duration-300"></div>
              </span>
            </div>
            
            {/* Main Heading */}
            <div className="relative mb-6">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bebas leading-[0.85] tracking-wide">
                <span className="bg-gradient-to-r from-red via-red/90 to-red/80 bg-clip-text text-transparent">
                  Page Under
                </span>
                <span className="block bg-gradient-to-r from-red/90 via-red to-red/90 bg-clip-text text-transparent">
                  Development
                </span>
              </h1>
              {/* Subtle underline accent */}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-16 md:w-24 h-1 bg-gradient-to-r from-red to-red/60 rounded-full"></div>
            </div>
            
            {/* Description */}
            <p className="text-base md:text-lg lg:text-xl font-plex text-black/70 leading-relaxed font-light mb-8">
              Halaman ini sedang dalam tahap pengembangan. Tim kami bekerja keras untuk memberikan pengalaman terbaik bagi Anda.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-red to-red/90 hover:from-red/90 hover:to-red text-white font-plex font-medium px-6 md:px-8 py-3 md:py-4 rounded-lg md:rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-red/25 hover:-translate-y-0.5 text-sm md:text-base">
                <Home className="w-4 h-4 md:w-5 md:h-5" />
                <span>Kembali ke Beranda</span>
              </button>
              
              <button className="group relative inline-flex items-center gap-3 bg-white border-2 border-red/20 hover:border-red/40 hover:bg-red/5 text-red font-plex font-medium px-6 md:px-8 py-3 md:py-4 rounded-lg md:rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-red/10 text-sm md:text-base">
                <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-x-1 transition-transform duration-300" />
                <span>Halaman Sebelumnya</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NotFound;