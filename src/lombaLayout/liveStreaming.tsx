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
      <div className="container mx-auto px-4 relative z-10">
        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Youtube size={32} style={{ color: "#990D35" }} />
              <h3 className="text-3xl font-bebas" style={{ color: "#990D35" }}>
                LIVE STREAMING ARENA
              </h3>
            </div>
            <p
              className="text-sm md:text-base"
              style={{ color: "#050505", opacity: 0.7 }}
            >
              Saksikan pertandingan langsung dari arena melalui kanal YouTube
              resmi
            </p>
          </div>

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
