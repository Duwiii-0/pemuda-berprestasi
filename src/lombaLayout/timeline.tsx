import { TimelineCardKiri, TimelineCardKanan } from "../components/TimelineCard";
import { useNavigate } from "react-router-dom";

const events = [
  { event: "registrasi", time: "1 - 8 November 2025", side: "left", month: "November" },
  { event: "Penimbangan", time: "21 November 2025 10.00 - 15.00", side: "right", month: "November" },
  { event: "technical meeting", time: "21 November 2025 15.30 - selesai", side: "left", month: "November" },
  { event: "Pertandingan", time: "22 -26 November 2025", side: "right", month: "November" },
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
    navigate('/lomba/home');
    window.scrollTo(0, 0)
  };

  return (
    <div className="relative w-full min-h-screen bg-gradient-to-br from-white via-red/[0.01] to-white overflow-hidden pt-10 lg:pt-0">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.015]">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(220,38,38,.2) 1px, transparent 1px),
            linear-gradient(90deg, rgba(220,38,38,.2) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}></div>
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
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl font-bebas leading-[0.85] tracking-wide">
              <span className="bg-gradient-to-r from-red via-red/90 to-red/80 bg-clip-text text-transparent">
                Timeline
              </span>
            </h1>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-16 md:w-24 h-1 bg-gradient-to-r from-red to-red/60 rounded-full"></div>
          </div>
          
          <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-plex text-black/80 max-w-4xl mx-auto leading-relaxed font-light px-4">
            Ikuti setiap tahapan penting dalam Sriwijaya Competition 2025 
            untuk memastikan partisipasi yang optimal.
          </p>
        </div>

        {/* Continuous Timeline Container */}
        <div className="w-full max-w-7xl mx-auto relative">
          
          {/* Main Continuous Timeline Line - Desktop */}
          <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 top-10 bottom-10 w-1 bg-gradient-to-b from-red/60 via-red/40 to-red/20"></div>
          
          {/* Main Continuous Timeline Line - Mobile & Tablet */}
          <div className="md:hidden absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-red/60 via-red/40 to-red/20"></div>

          {/* Timeline Events */}
          {Object.entries(groupedEvents).map(([month, monthEvents], monthIndex) => (
            <div key={month} className="relative w-full mb-12 md:mb-16 lg:mb-20">
              
              {/* Enhanced Month Header */}
              <div className="relative mb-8 md:mb-12 lg:mb-16 flex justify-center">
                <div className="text-center space-y-4 bg-white px-6 py-2 rounded-xl border border-yellow/20 shadow-sm relative z-10">
                  <div className="inline-block bg-gradient-to-r from-yellow/10 to-yellow/5 rounded-lg px-4 py-2">
                    <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bebas bg-gradient-to-r from-yellow to-yellow/90 bg-clip-text text-transparent capitalize">
                      {month}
                    </h2>
                  </div>
                </div>
              </div>
              
              {/* Month Events */}
              <div className="space-y-6 md:space-y-8 lg:space-y-12">
                {monthEvents.map((item, eventIndex) => {
                  const isLastEventInMonth = eventIndex === monthEvents.length - 1;
                  const isLastMonth = monthIndex === Object.entries(groupedEvents).length - 1;
                  
                  return (
                    <div key={eventIndex} className="relative">
                      
                      {/* Desktop Layout */}
                      <div className="hidden md:flex w-full items-start justify-center relative group">
                        
                        {/* Left Card */}
                        <div className={`w-1/2 flex justify-end pr-8 xl:pr-12 2xl:pr-16 ${item.side === 'left' ? '' : 'invisible'}`}>
                          <div className="transform transition-all duration-500 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-red/10 group-hover:rotate-1 group-hover:-translate-y-1">
                            <TimelineCardKiri event={item.event} time={item.time} />
                          </div>
                        </div>

                        {/* Enhanced Central Timeline Dot */}
                        <div className="relative flex items-center justify-center w-16 z-20">
                          <div className="relative">
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-red to-red/80 rounded-full shadow-lg border-4 border-white transition-all duration-500 group-hover:scale-125 group-hover:shadow-xl group-hover:shadow-red/30 relative z-10" />
                            <div className="absolute inset-0 w-8 h-8 md:w-10 md:h-10 bg-red/20 rounded-full animate-ping group-hover:animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </div>
                        </div>

                        {/* Right Card */}
                        <div className={`w-1/2 flex justify-start pl-8 xl:pl-12 2xl:pl-16 ${item.side === 'right' ? '' : 'invisible'}`}>
                          <div className="transform transition-all duration-500 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-red/10 group-hover:-rotate-1 group-hover:-translate-y-1">
                            <TimelineCardKanan event={item.event} time={item.time} />
                          </div>
                        </div>
                      </div>

                      {/* Tablet Layout */}
                      <div className="hidden sm:flex md:hidden w-full justify-start items-start gap-6 px-4 group">
                        
                        {/* Timeline Dot */}
                        <div className="relative flex items-center justify-center pt-6 z-20">
                          <div className="relative">
                            <div className="w-6 h-6 bg-gradient-to-br from-red to-red/80 rounded-full shadow-md border-3 border-white transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-red/30 relative z-10" />
                            <div className="absolute inset-0 w-6 h-6 bg-red/20 rounded-full animate-ping group-hover:animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </div>
                        </div>

                        {/* Card */}
                        <div className="flex-1 transform transition-all duration-300 group-hover:scale-[1.02] group-hover:-translate-y-1">
                          <TimelineCardKanan event={item.event} time={item.time} />
                        </div>
                      </div>

                      {/* Mobile Layout */}
                      <div className="sm:hidden flex justify-start items-start gap-4 px-4 group">
                        
                        {/* Timeline Dot */}
                        <div className="relative flex items-center justify-center pt-5 z-20">
                          <div className="relative">
                            <div className="w-5 h-5 bg-gradient-to-br from-red to-red/80 rounded-full shadow-md border-2 border-white transition-all duration-300 group-hover:scale-110 relative z-10" />
                            <div className="absolute inset-0 w-5 h-5 bg-red/20 rounded-full animate-ping group-hover:animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </div>
                        </div>

                        {/* Card */}
                        <div className="flex-1 transform transition-all duration-300 group-hover:scale-[1.02]">
                          <TimelineCardKanan event={item.event} time={item.time} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
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
                  Jangan lewatkan kesempatan berpartisipasi dalam kompetisi taekwondo internasional bergengsi. 
                  Daftarkan diri Anda sekarang dan buktikan kemampuan terbaik Anda!
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