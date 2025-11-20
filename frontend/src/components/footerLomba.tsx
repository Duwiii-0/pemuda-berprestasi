import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="relative bg-gradient-to-b from-red to-red/95 text-white w-full py-8 overflow-hidden">
      
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-32 h-32 border border-white/20 rounded-full"></div>
        <div className="absolute bottom-0 right-1/4 w-24 h-24 border border-white/15 rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-white/10 rounded-full"></div>
      </div>

      <div className="container mx-auto px-6 lg:px-4 relative z-10">
        
        {/* Main Footer Content */}
        <div className="flex flex-col md:flex-row items-center justify-between">
          
          {/* Enhanced Brand Section */}
          <div className="group">
            <h1 className="text-3xl lg:text-4xl font-bebas tracking-wide hover:scale-105 transition-transform duration-300 cursor-default">
              <span className="bg-gradient-to-r from-white via-white/95 to-white/90 bg-clip-text text-transparent">
                Pemuda Berprestasi
              </span>
            </h1>
            <div className="w-0 group-hover:w-full h-0.5 bg-gradient-to-r from-white/60 to-transparent transition-all duration-500 mt-1"></div>
          </div>

          {/* Enhanced Navigation */}
          <nav className="flex gap-8 mt-6 md:mt-0 font-plex">
            <Link
              to="/event/home"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="group relative px-1 py-2 hover:text-white/90 transition-all duration-300"
            >
              <span className="relative z-10">Home</span>
              <div className="absolute bottom-0 left-0 w-0 group-hover:w-full h-0.5 bg-white/60 transition-all duration-300"></div>
            </Link>
            <Link
              to="/event/timeline"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="group relative px-1 py-2 hover:text-white/90 transition-all duration-300"
            >
              <span className="relative z-10">Timeline</span>
              <div className="absolute bottom-0 left-0 w-0 group-hover:w-full h-0.5 bg-white/60 transition-all duration-300"></div>
            </Link>
            <Link
              to="/event/faq"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="group relative px-1 py-2 hover:text-white/90 transition-all duration-300"
            >
              <span className="relative z-10">FAQ</span>
              <div className="absolute bottom-0 left-0 w-0 group-hover:w-full h-0.5 bg-white/60 transition-all duration-300"></div>
            </Link>
          </nav>
        </div>

        {/* Enhanced Copyright Section */}
        <div className="mt-8 pt-6 border-t border-white/15 relative">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Copyright Text */}
            <p className="text-sm text-white/80 font-plex">
              © 2025 Pemuda Berprestasi. All rights reserved.
            </p>
          </div>
          
          {/* Subtle accent line */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;