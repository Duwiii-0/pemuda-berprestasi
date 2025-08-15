import { TimelineCardKiri, TimelineCardKanan } from "../components/TimelineCard";

const events = [
  { event: "registrasi gelombang 1", time: "1 - 7 agustus 2025", side: "left", month: "August" },
  { event: "registrasi gelombang 2", time: "8 - 20 agustus 2025", side: "right", month: "August" },
  { event: "technical meeting", time: "22 agustus 2025", side: "left", month: "August" },
  { event: "submission open", time: "10 september 2025", side: "right", month: "September" },
  { event: "submission closed", time: "14 september 2025", side: "left", month: "September" },
  { event: "opening ceremony", time: "15 september 2025", side: "right", month: "September" },
  { event: "Pengumuman finalis", time: "19 september 2025", side: "left", month: "September" },
  { event: "Babak Final", time: "1 Oktober 2025", side: "right", month: "Oktober" },
  { event: "Closing Ceremony", time: "2 Oktober 2025", side: "left", month: "Oktober" },
  // { event: "technical meeting final", time: "20 september 2025", side: "right", month: "September" },
  // { event: "final online", time: "23 september 2025", side: "left", month: "September" },
  // { event: "final offline", time: "25 - 26 september 2025", side: "right", month: "September" },
  // { event: "seminar & closing", time: "27 september 2025", side: "left", month: "September" },
];

// Group events by month
const groupedEvents = events.reduce((acc, curr) => {
  if (!acc[curr.month]) acc[curr.month] = [];
  acc[curr.month].push(curr);
  return acc;
}, {} as Record<string, typeof events>);

export default function Timeline() {
  return (
    <div className="relative w-full min-h-screen flex flex-col items-center pt-40 pb-10 px-4 md:px-20">
      {/* Title */}
      <h1 className="text-6xl md:text-8xl text-red font-bebas leading-[80%] uppercase mb-20">
        Timeline
      </h1>

      {/* Timeline Sections */}
      {Object.entries(groupedEvents).map(([month, monthEvents]) => (
        <div key={month} className="w-full flex flex-col items-center justify-center gap-10 mb-24">
          <h2 className="text-3xl md:text-5xl text-red font-bebas capitalize mb-10">{month}</h2>
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            {/* Events */}
            <div className="flex flex-col min-w-full justify-start items-center">
              {monthEvents.map((item, index) => (
                <div key={index}>
                  {/* Desktop Layout */}
                  <div className="hidden sm:flex min-w-full items-start justify-center relative">
                    {/* Left Card */}
                    <div className={`w-1/2 flex justify-end pr-10 sm:pr-13 md:pr-15 lg:pr-25 xl:pr-30 ${item.side === 'left' ? '' : 'invisible'}`}>
                      <TimelineCardKiri event={item.event} time={item.time} />
                    </div>

                    {/* Dot + Conditional Vertical Line */}
                    <div className="relative flex flex-col items-center justify-start gap-10 w-10 pt-10">
                      {/* Dot */}
                      <div className="w-10 h-10 bg-red rounded-full shadow-md" />

                      {/* Line - Only show if not last item */}
                      {index !== monthEvents.length - 1 && (
                        <div className=" w-[2px] h-30 bg-black mt-1 z-0" />
                      )}
                    </div>

                    {/* Right Card */}
                    <div className={`w-1/2 flex justify-start pl-10 sm:pl-13 md:pl-15 lg:pl-25 xl:pl-30 ${item.side === 'right' ? '' : 'invisible'}`}>
                      <TimelineCardKanan event={item.event} time={item.time} />
                    </div>
                  </div>

                  {/* Mobile Layout */}
                  <div className="sm:hidden flex justify-start items-start gap-15 px-4">
                    {/* Dot + Conditional Vertical Line */}
                    <div className="relative flex flex-col items-center justify-start gap-5 w-10 pt-7">
                      {/* Dot */}
                      <div className="w-7 h-7 bg-red rounded-full shadow-md" />

                      {/* Line - Only show if not last item */}
                      {index !== monthEvents.length - 1 && (
                        <div className="w-[2px] h-25 bg-white mt-1 7" />
                      )}
                    </div>

                    {/* Card */}
                    <div className="flex-2 w-full h-full">
                      <TimelineCardKanan event={item.event} time={item.time} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
