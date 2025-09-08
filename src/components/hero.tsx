import { Link } from "react-router-dom";
import hero from '../assets/photos/hero.png'
const Hero = () => {
  return (
    <div className="relative h-[85vh] md:h-[90vh] lg:h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Background with Gradient Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{backgroundImage: `url(${hero})`}}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-red/90 via-red/70 to-red/40" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40" />
      
      {/* Decorative Elements */}
      <div className="absolute top-1/4 right-1/4 w-32 h-32 border-2 border-white/20 rounded-full animate-pulse"></div>
      <div className="absolute bottom-1/3 left-1/4 w-24 h-24 border border-white/15 rounded-full"></div>
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
        <div className="w-full max-w-5xl flex flex-col justify-center space-y-6 lg:space-y-8 text-center md:text-left">
          
          {/* Main Heading */}
          <div className="space-y-2 lg:space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bebas text-white leading-[0.9] tracking-wide drop-shadow-2xl">
              Welcome to the
              <span className="block bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                Arena
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-plex font-medium text-white/95 max-w-3xl mx-auto md:mx-0 leading-relaxed drop-shadow-lg">
              Tempat di mana semangat kompetisi bertemu dengan prestasi luar biasa. 
              Bergabunglah dalam pertandingan taekwondo dengan standar internasional.
            </p>
          </div>

          {/* CTA Buttons - STYLING TERINTEGRASI */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start items-center pt-2">
            <Link
              to="/event"
              className="group relative w-auto px-8 py-4 text-xs md:text-lg font-plex font-semibold border-2 border-white text-white bg-transparent hover:bg-white hover:text-red transition-all duration-300 rounded-xl backdrop-blur-sm hover:scale-105 hover:shadow-2xl overflow-hidden"
            >
              <span className="relative px-4 z-10">Lihat Kompetisi</span>
              <div className="absolute inset-0 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;