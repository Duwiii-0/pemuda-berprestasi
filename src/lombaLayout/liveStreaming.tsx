import React from "react";

const LiveStreaming: React.FC = () => {
  return (
    <div className="min-h-screen py-12 sm:py-16 md:py-20 pt-24 sm:pt-28 md:pt-32 lg:pt-36">
      <div className="container mx-auto px-6 lg:px-12">
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

        <div className="mt-12 sm:mt-16 md:mt-20 grid grid-cols-2 gap-8 lg:gap-12">
          {/* Video 1: Hari 1 */}
          <div className="rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1 group">
            <div className="aspect-w-4 aspect-h-3">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/vyz5VKM8RRE?si=4OFvTmCjQoFj6wrf"
                title="YouTube video player - Hari 1"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <div className="p-5 bg-white">
              <h3 className="font-bebas text-2xl text-gray-800 tracking-wider group-hover:text-red transition-colors duration-300">
                Hari 1
              </h3>
              <p className="font-plex text-sm text-gray-600 mt-1">
                Pertandingan Taekwondo
              </p>
            </div>
          </div>

          {/* Video 2: Hari 2 */}
          <div className="rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1 group">
            <div className="aspect-w-4 aspect-h-3">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/LfdrEziyU_4?si=LuzzQo9dVq7nQz3r"
                title="YouTube video player - Hari 2"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <div className="p-5 bg-white">
              <h3 className="font-bebas text-2xl text-gray-800 tracking-wider group-hover:text-red transition-colors duration-300">
                Hari 2
              </h3>
              <p className="font-plex text-sm text-gray-600 mt-1">
                Pertandingan Taekwondo
              </p>
            </div>
          </div>

          {/* Video 3: Hari 3 */}
          <div className="rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1 group">
            <div className="aspect-w-4 aspect-h-3">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/AFd-GyM4dpM?si=EaCyqxKcKWrYT3pv"
                title="YouTube video player - Hari 3"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <div className="p-5 bg-white">
              <h3 className="font-bebas text-2xl text-gray-800 tracking-wider group-hover:text-red transition-colors duration-300">
                Hari 3
              </h3>
              <p className="font-plex text-sm text-gray-600 mt-1">
                Pertandingan Taekwondo
              </p>
            </div>
          </div>

          {/* Video 4: Hari 4 */}
          <div className="rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1 group">
            <div className="aspect-w-4 aspect-h-3">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/bvJeOk2hQwE?si=x6aCRk8iALSDm1KB"
                title="YouTube video player - Hari 4"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <div className="p-5 bg-white">
              <h3 className="font-bebas text-2xl text-gray-800 tracking-wider group-hover:text-red transition-colors duration-300">
                Hari 4
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
