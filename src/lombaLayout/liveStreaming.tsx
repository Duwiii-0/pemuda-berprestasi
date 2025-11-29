import { useState } from "react";
import { X, Play, Clapperboard } from "lucide-react";

// Tipe data untuk video
interface LiveVideo {
  id: number;
  title: string;
  description: string;
  videoId: string;
  thumbnail: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const LiveStreamingPage = () => {
  const [selectedVideo, setSelectedVideo] = useState<LiveVideo | null>(null);

  const videos: LiveVideo[] = [
    {
      id: 1,
      title: "Live Streaming - Hari 1",
      description:
        "Saksikan pertandingan langsung dari Sriwijaya International Taekwondo Championship.",
      videoId: "vyz5VKM8RRE",
      thumbnail: `https://img.youtube.com/vi/vyz5VKM8RRE/hqdefault.jpg`,
      icon: Clapperboard,
    },
    {
      id: 2,
      title: "Live Streaming - Hari 2",
      description:
        "Saksikan pertandingan langsung dari Sriwijaya International Taekwondo Championship.",
      videoId: "LfdrEziyU_4",
      thumbnail: `https://img.youtube.com/vi/LfdrEziyU_4/hqdefault.jpg`,
      icon: Clapperboard,
    },
    {
      id: 3,
      title: "Live Streaming - Hari 3",
      description:
        "Saksikan pertandingan langsung dari Sriwijaya International Taekwondo Championship.",
      videoId: "AFd-GyM4dpM",
      thumbnail: `https://img.youtube.com/vi/AFd-GyM4dpM/hqdefault.jpg`,
      icon: Clapperboard,
    },
    {
      id: 4,
      title: "Live Streaming - Hari 4",
      description:
        "Saksikan pertandingan langsung dari Sriwijaya International Taekwondo Championship.",
      videoId: "bvJeOk2hQwE",
      thumbnail: `https://img.youtube.com/vi/bvJeOk2hQwE/hqdefault.jpg`,
      icon: Clapperboard,
    },
  ];

  const openModal = (video: LiveVideo) => {
    setSelectedVideo(video);
  };

  const closeModal = () => {
    setSelectedVideo(null);
  };

  return (
    <div className="min-h-screen bg-white py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto pt-16">
        {/* Header */}
        <div className="text-center mb-20">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-judul font-bebas text-red leading-none tracking-wide mb-8">
            <span className="bg-gradient-to-r from-red via-red/90 to-red/80 bg-clip-text text-transparent">
              Live Streaming
            </span>
          </h1>
          <div className="w-24 h-0.5 bg-red-600 mx-auto mb-8"></div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed font-light">
            Saksikan pertandingan langsung dari arena melalui kanal YouTube
            resmi
          </p>
        </div>

        {/* Video Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-12">
          {videos.map((video, index) => {
            const IconComponent = video.icon;
            return (
              <div
                key={video.id}
                className="group cursor-pointer transform transition-all duration-700 hover:-translate-y-3"
                onClick={() => openModal(video)}
              >
                <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-700 border border-gray-100 hover:border-gray-200">
                  {/* Video Thumbnail */}
                  <div className="relative aspect-video bg-gray-900 overflow-hidden">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://via.placeholder.com/640x360/374151/ffffff?text=Video+Streaming";
                      }}
                    />

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                      <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center backdrop-blur-sm transform scale-0 group-hover:scale-100 transition-transform duration-500">
                        <Play
                          className="w-6 h-6 text-gray-900 ml-0.5"
                          fill="currentColor"
                        />
                      </div>
                    </div>

                    {/* Number Badge */}
                    <div className="absolute top-6 left-6 w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-8">
                    <div className="flex items-start space-x-4 mb-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-red-50 transition-colors duration-500">
                        <IconComponent className="w-6 h-6 text-gray-700 group-hover:text-red-600 transition-colors duration-500" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight">
                          {video.title}
                        </h3>
                      </div>
                    </div>

                    <p className="text-gray-600 leading-relaxed font-light">
                      {video.description}
                    </p>

                    {/* Action Indicator */}
                    <div className="mt-6 flex items-center text-red-600 font-medium text-sm opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                      <span>Tonton Sekarang</span>
                      <svg
                        className="w-4 h-4 ml-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {selectedVideo && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="relative bg-black rounded-2xl overflow-hidden w-full h-full sm:w-[80vw] sm:h-[80vh] max-w-6xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-20 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors duration-200 backdrop-blur-md"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Video */}
            <iframe
              src={`https://www.youtube.com/embed/${selectedVideo.videoId}?autoplay=1&rel=0`}
              title={selectedVideo.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full rounded-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveStreamingPage;
