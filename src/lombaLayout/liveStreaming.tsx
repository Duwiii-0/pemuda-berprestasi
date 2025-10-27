import React from "react";

const LiveStreaming: React.FC = () => {
  return (
    <div className="min-h-screen py-12 sm:py-16 md:py-20 pt-24 sm:pt-28 md:pt-32 lg:pt-36">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 sm:space-y-6 md:space-y-8">
          <div className="hidden lg:inline-block group">
            <span className="text-red font-plex font-semibold text-xs sm:text-sm uppercase tracking-[0.2em] border-l-4 border-red pl-3 sm:pl-4 md:pl-6 relative">
              Tonton Pertandingan
              <div className="absolute -left-1 top-0 bottom-0 w-1 bg-red/20 group-hover:bg-red/40 transition-colors duration-300"></div>
            </span>
          </div>

          <div className="relative">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bebas leading-[0.85] tracking-wide">
              <span className="bg-gradient-to-r from-red via-red/90 to-red/80 bg-clip-text text-transparent">
                Live Streaming
              </span>
            </h1>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-12 sm:w-16 md:w-20 h-0.5 sm:h-1 bg-gradient-to-r from-red to-red/60 rounded-full"></div>
          </div>

          <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-plex text-black/80 max-w-4xl mx-auto leading-relaxed font-light px-2 sm:px-4">
            Saksikan pertandingan langsung dari arena melalui kanal YouTube
            resmi
          </p>
        </div>

        <div className="mt-12 sm:mt-16 md:mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Video 1: Lapangan A */}
          <div className="rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1 group">
            <div className="aspect-w-16 aspect-h-9">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/unavailable"
                title="YouTube video player - Lapangan A"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <div className="p-5 bg-white">
              <h3 className="font-bebas text-2xl text-gray-800 tracking-wider group-hover:text-red transition-colors duration-300">
                Lapangan A
              </h3>
              <p className="font-plex text-sm text-gray-600 mt-1">
                Pertandingan Taekwondo
              </p>
            </div>
          </div>

          {/* Video 2: Lapangan B */}
          <div className="rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1 group">
            <div className="aspect-w-16 aspect-h-9">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/unavailable"
                title="YouTube video player - Lapangan B"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <div className="p-5 bg-white">
              <h3 className="font-bebas text-2xl text-gray-800 tracking-wider group-hover:text-red transition-colors duration-300">
                Lapangan B
              </h3>
              <p className="font-plex text-sm text-gray-600 mt-1">
                Pertandingan Taekwondo
              </p>
            </div>
          </div>

          {/* Video 3: Lapangan C */}
          <div className="rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1 group">
            <div className="aspect-w-16 aspect-h-9">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/unavailable"
                title="YouTube video player - Lapangan C"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <div className="p-5 bg-white">
              <h3 className="font-bebas text-2xl text-gray-800 tracking-wider group-hover:text-red transition-colors duration-300">
                Lapangan C
              </h3>
              <p className="font-plex text-sm text-gray-600 mt-1">
                Pertandingan Taekwondo
              </p>
            </div>
          </div>

          {/* Video 4: Lapangan D */}
          <div className="rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1 group lg:col-span-1">
            <div className="aspect-w-16 aspect-h-9">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/unavailable"
                title="YouTube video player - Lapangan D"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <div className="p-5 bg-white">
              <h3 className="font-bebas text-2xl text-gray-800 tracking-wider group-hover:text-red transition-colors duration-300">
                Lapangan D
              </h3>
              <p className="font-plex text-sm text-gray-600 mt-1">
                Pertandingan Taekwondo
              </p>
            </div>
          </div>

          {/* Video 5: Lapangan E */}
          <div className="rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1 group lg:col-span-1">
            <div className="aspect-w-16 aspect-h-9">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/unavailable"
                title="YouTube video player - Lapangan E"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <div className="p-5 bg-white">
              <h3 className="font-bebas text-2xl text-gray-800 tracking-wider group-hover:text-red transition-colors duration-300">
                Lapangan E
              </h3>
              <p className="font-plex text-sm text-gray-600 mt-1">
                Pertandingan Taekwondo
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveStreaming;
