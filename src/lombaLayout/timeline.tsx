import {
  TimelineCardKiri,
  TimelineCardKanan,
} from "../components/TimelineCard";
import { useNavigate } from "react-router-dom";

const events = [
  {
    event: "registrasi",
    time: "1 Agustus - 8 November 2025",
    side: "left",
    month: "November",
  },
  {
    event: "Penimbangan",
    time: "21 November 2025 10.00 - 15.00",
    side: "right",
    month: "November",
  },
  {
    event: "technical meeting",
    time: "21 November 2025 15.30 - selesai",
    side: "left",
    month: "November",
  },
  {
    event: "Pertandingan",
    time: "22 -26 November 2025",
    side: "right",
    month: "November",
  },
];

// Group events by month
const groupedEvents = events.reduce((acc, curr) => {
  if (!acc[curr.month]) acc[curr.month] = [];
  acc[curr.month].push(curr);
  return acc;
}, {} as Record<string, typeof events>);

export default function Timeline() {
  const navigate = useNavigate();

  const handleDaftarSekarang = () => {
    navigate("/lomba/home");
    window.scrollTo(0, 0);
  };

  return (
    <div className="relative w-full min-h-screen bg-gradient-to-br from-white via-red/[0.01] to-white overflow-hidden pt-10 lg:pt-0">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.015]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
            linear-gradient(rgba(220,38,38,.2) 1px, transparent 1px),
            linear-gradient(90deg, rgba(220,38,38,.2) 1px, transparent 1px)
          `,
            backgroundSize: "50px 50px",
          }}
        ></div>
      </div>

      <div className="relative z-10 flex flex-col items-center pt-20 md:pt-32 lg:pt-40 pb-16 md:pb-20 lg:pb-24 px-4 sm:px-6 lg:px-8">
        {/* Enhanced Title Section */}
        <div className="text-center space-y-6 md:space-y-8 mb-16 md:mb-20 lg:mb-24">
          {/* Section Label */}
          <div className="hidden lg:inline-block group">
            <span className="text-red font-plex font-semibold text-xs sm:text-sm uppercase tracking-[0.2em] border-l-4 border-red pl-4 md:pl-6 relative">
              Jadwal Kegiatan
              <div className="absolute -left-1 top-0 bottom-0 w-1 bg-red/20 group-hover:bg-red/40 transition-colors duration-300"></div>
            </span>
          </div>

          <div className="relative">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bebas leading-[0.85] tracking-wide">
              <span className="bg-gradient-to-r from-red via-red/90 to-red/80 bg-clip-text text-transparent">
                Timeline
              </span>
            </h1>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-16 md:w-24 h-1 bg-gradient-to-r from-red to-red/60 rounded-full"></div>
          </div>

          <p className="text-sm sm:text-base md:text-lg lg:text-xl font-plex text-black/80 max-w-4xl mx-auto leading-relaxed font-light px-4">
            Ikuti setiap tahapan penting dalam Sriwijaya Competition 2025 untuk
            memastikan partisipasi yang optimal.
          </p>
        </div>

        {/* Enhanced Timeline Sections */}
        <div className="w-full max-w-7xl mx-auto relative">
          {/* Main continuous timeline line - Desktop */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-red/60 via-red/40 to-red/20 transform -translate-x-1/2 z-0"></div>

          {/* Main continuous timeline line - Tablet */}
          <div className="hidden sm:block md:hidden absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-red/60 via-red/40 to-red/20 z-0"></div>

          {/* Main continuous timeline line - Mobile */}
          <div className="sm:hidden absolute left-20 top-0 bottom-0 w-0.5 bg-gradient-to-b from-red/60 via-red/40 to-red/20 z-0"></div>

          {Object.entries(groupedEvents).map(
            ([month, monthEvents], monthIndex) => (
              <div
                key={month}
                className="relative w-full flex flex-col items-center justify-center mb-16 md:mb-20 lg:mb-24"
              >
                {/* Enhanced Month Header */}
                <div className="relative mb-12 md:mb-16 lg:mb-20 z-10">
                  <div className="text-center space-y-4">
                    <div className="inline-block bg-gradient-to-r from-yellow/10 to-yellow/5 border border-yellow/20 rounded-xl px-6 py-3">
                      <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bebas bg-gradient-to-r from-yellow to-yellow/90 bg-clip-text text-transparent capitalize">
                        {month}
                      </h2>
                    </div>
                    <div className="w-12 md:w-16 h-0.5 bg-gradient-to-r from-yellow/60 to-transparent mx-auto"></div>
                  </div>
                </div>

                {/* Enhanced Timeline Events */}
                <div className="relative w-full z-10">
                  <div className="flex flex-col items-center justify-center">
                    {monthEvents.map((item, index) => (
                      <div key={index} className="w-full">
                        {/* Desktop Layout */}
                        <div className="hidden md:flex w-full items-start justify-center relative group mb-8 md:mb-12">
                          {/* Left Card */}
                          <div
                            className={`w-1/2 flex justify-end pr-8 xl:pr-12 2xl:pr-16 ${
                              item.side === "left" ? "" : "invisible"
                            }`}
                          >
                            <div className="transform transition-all duration-500 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-red/10 group-hover:rotate-1 group-hover:-translate-y-1">
                              <TimelineCardKiri
                                event={item.event}
                                time={item.time}
                              />
                            </div>
                          </div>

                          {/* Enhanced Central Timeline */}
                          <div className="relative flex flex-col items-center justify-start w-16 pt-8 md:pt-10">
                            {/* Enhanced Dot */}
                            <div className="relative z-20">
                              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-red to-red/80 rounded-full shadow-lg border-4 border-white transition-all duration-500 group-hover:scale-125 group-hover:shadow-xl group-hover:shadow-red/30 group-hover:animate-pulse" />
                            </div>
                          </div>

                          {/* Right Card */}
                          <div
                            className={`w-1/2 flex justify-start pl-8 xl:pl-12 2xl:pl-16 ${
                              item.side === "right" ? "" : "invisible"
                            }`}
                          >
                            <div className="transform transition-all duration-500 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-red/10 group-hover:-rotate-1 group-hover:-translate-y-1">
                              <TimelineCardKanan
                                event={item.event}
                                time={item.time}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Tablet Layout */}
                        <div className="hidden sm:flex md:hidden w-full justify-start items-start gap-6 md:gap-8 px-4 md:px-6 mb-8 group">
                          {/* Enhanced Timeline Dot */}
                          <div className="relative flex flex-col items-center justify-start pt-6 md:pt-8">
                            <div className="relative z-20">
                              <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-red to-red/80 rounded-full shadow-md border-2 md:border-3 border-white transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-red/30" />
                              <div className="absolute inset-0 w-6 h-6 md:w-8 md:h-8 bg-red/20 rounded-full animate-ping group-hover:animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </div>
                          </div>

                          {/* Enhanced Card */}
                          <div className="flex-1 transform transition-all duration-300 group-hover:scale-102 group-hover:-translate-y-1">
                            <TimelineCardKanan
                              event={item.event}
                              time={item.time}
                            />
                          </div>
                        </div>

                        {/* Mobile Layout */}
                        <div className="sm:hidden flex justify-start items-start gap-4 px-4 mb-6 group">
                          {/* Enhanced Mobile Timeline Dot */}
                          <div
                            className="relative flex flex-col items-center justify-start pt-5"
                            style={{ marginLeft: "6px" }}
                          >
                            <div className="relative z-20">
                              <div className="w-5 h-5 bg-gradient-to-br from-red to-red/80 rounded-full shadow-md border-2 border-white transition-all duration-300 group-hover:scale-110" />
                              <div className="absolute inset-0 w-5 h-5 bg-red/20 rounded-full animate-ping group-hover:animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </div>
                          </div>

                          {/* Enhanced Mobile Card */}
                          <div className="flex-1 transform transition-all duration-300 group-hover:scale-[1.02]">
                            <TimelineCardKanan
                              event={item.event}
                              time={item.time}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          )}
        </div>

        {/* Enhanced Bottom CTA Section */}
        <div className="w-full max-w-4xl mx-auto mt-16 md:mt-20 text-center">
          <div className="bg-gradient-to-r from-red/[0.02] to-red/[0.01] border border-red/10 rounded-2xl md:rounded-3xl p-8 md:p-12 backdrop-blur-sm">
            <div className="space-y-6 md:space-y-8">
              <div className="space-y-4">
                <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bebas text-red">
                  Siap Untuk Bergabung?
                </h3>
                <div className="w-16 h-0.5 bg-gradient-to-r from-red to-red/60 mx-auto"></div>
                <p className="text-sm md:text-base lg:text-lg font-plex text-black/70 leading-relaxed max-w-2xl mx-auto">
                  Jangan lewatkan kesempatan berpartisipasi dalam kompetisi
                  taekwondo internasional bergengsi. Daftarkan diri Anda
                  sekarang dan buktikan kemampuan terbaik Anda!
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                <button
                  onClick={handleDaftarSekarang}
                  className="px-10 py-6 bg-red text-white hover:bg-yellow hover:text-black font-plex font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-red/30 hover:-translate-y-1 text-sm md:text-base"
                >
                  Daftar Sekarang
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
