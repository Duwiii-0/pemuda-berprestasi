import { Youtube } from "lucide-react";

const LiveStreamingPage = () => {
  return (
    <section
      className="relative w-full min-h-screen overflow-hidden py-12 md:py- pt-24 sm:pt-28 md:pt-32 lg:pt-36"
      style={{ backgroundColor: "#F5FBEF" }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/3 left-1/4 w-80 h-80 border rounded-full animate-pulse opacity-20"
          style={{ borderColor: "rgba(153, 13, 53, 0.2)" }}
        ></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-64 h-64 border rounded-full animate-pulse opacity-15"
          style={{ borderColor: "rgba(153, 13, 53, 0.15)" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full animate-bounce"
          style={{ backgroundColor: "rgba(153, 13, 53, 0.3)" }}
        ></div>
      </div>
      <section className="relative w-full flex flex-col justify-center items-center bg-gradient-to-br from-white via-red/[0.02] to-white overflow-hidden pt-24 sm:pt-28 md:pt-32 lg:pt-36 pb-6 sm:pb-8 md:pb-12 lg:pb-16">
        <div className="absolute inset-0 opacity-[0.02]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(rgba(220,38,38,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(220,38,38,.3) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          ></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 relative z-10 w-full max-w-7xl">
          <div className="text-center space-y-4 sm:space-y-6 md:space-y-8">
            <div className="hidden lg:inline-block group">
              <span className="text-red font-plex font-semibold text-xs sm:text-sm uppercase tracking-[0.2em] border-l-4 border-red pl-3 sm:pl-4 md:pl-6 relative">
                <Youtube size={16} className="inline-block mr-2" />
                Tonton Pertandingan
                <div className="absolute -left-1 top-0 bottom-0 w-1 bg-red/20 group-hover:bg-red/40 transition-colors duration-300"></div>
              </span>
            </div>

            <div className="relative">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl font-bebas leading-[0.85] tracking-wide">
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
        </div>
      </section>

      <div className="container mx-auto px-4 relative z-10">
        <div className="relative max-w-5xl mx-auto">
          <div
            className="relative rounded-2xl overflow-hidden shadow-2xl border"
            style={{ borderColor: "rgba(153, 13, 53, 0.1)" }}
          >
            <iframe
              className="w-full h-[300px] md:h-[450px] lg:h-[600px]"
              src="https://www.youtube.com/embed/live_stream?channel=YOUR_CHANNEL_ID"
              title="Live YouTube Stream"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to top, rgba(153, 13, 53, 0.1), transparent)",
              }}
            ></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LiveStreamingPage;
