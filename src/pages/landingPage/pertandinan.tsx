import React from "react";

interface Lapangan {
  nama: string;
  hari: string;
  kelasKejuaraan: {
    nama: string;
    status: "bermain" | "pemanasan" | "bersiap";
    antrian: number;
  }[];
}

const dataLapangan: Lapangan[] = [
  {
    nama: "Lapangan 1",
    hari: "Jumat, 25 Oktober 2025",
    kelasKejuaraan: [
      { nama: "Poomsae Under 17", status: "bermain", antrian: 1 },
      { nama: "Kyorugi Junior -58kg", status: "pemanasan", antrian: 2 },
      { nama: "Kyorugi Senior -68kg", status: "bersiap", antrian: 3 },
    ],
  },
  {
    nama: "Lapangan 2",
    hari: "Jumat, 25 Oktober 2025",
    kelasKejuaraan: [
      { nama: "Poomsae Over 30", status: "bermain", antrian: 1 },
      { nama: "Kyorugi Cadet -45kg", status: "pemanasan", antrian: 2 },
    ],
  },
];

const getColor = (status: string) => {
  switch (status) {
    case "bermain":
      return "bg-green-500/80";
    case "pemanasan":
      return "bg-orange-400/80";
    case "bersiap":
      return "bg-yellow-400/80";
    default:
      return "bg-gray-300";
  }
};

const LapanganLiveView = () => {
  return (
    <section className="relative w-full flex flex-col bg-gradient-to-br from-white via-red/[0.02] to-white overflow-hidden py-12 md:py-16">
      {/* Background animasi */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-80 h-80 border border-red/[0.08] rounded-full animate-pulse opacity-40"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 border border-red/[0.06] rounded-full animate-pulse opacity-30 animation-delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-red/30 rounded-full animate-bounce"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Judul */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bebas text-transparent bg-gradient-to-r from-red via-red/80 to-red/60 bg-clip-text tracking-wide">
            LIVE ARENA STATUS
          </h2>
          <p className="text-black/70 font-plex text-base md:text-lg mt-2">
            Pantau aktivitas setiap lapangan — dari pemanasan hingga
            pertandingan berlangsung.
          </p>
        </div>

        {/* Grid Lapangan */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {dataLapangan.map((lap) => (
            <div
              key={lap.nama}
              className="relative p-6 rounded-2xl bg-white/60 backdrop-blur-md shadow-xl border border-red/5 hover:shadow-red/10 transition-all duration-500"
            >
              <h3 className="text-2xl font-bebas text-red mb-2">{lap.nama}</h3>
              <p className="text-black/60 font-plex text-sm mb-4">{lap.hari}</p>

              <div className="space-y-3">
                {lap.kelasKejuaraan.map((kelas) => (
                  <div
                    key={kelas.nama}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/70 border border-red/[0.05] hover:bg-white/90 transition-all duration-300"
                  >
                    <div>
                      <p className="font-semibold text-black/90">
                        {kelas.nama}
                      </p>
                      <p className="text-sm text-black/60">
                        Antrian #{kelas.antrian}
                      </p>
                    </div>
                    <div
                      className={`w-3 h-3 rounded-full ${getColor(
                        kelas.status
                      )} ring-4 ring-white/60 shadow-md`}
                      title={kelas.status}
                    ></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Section YouTube Live */}
        <div className="mt-16 relative max-w-5xl mx-auto">
          <div className="text-center mb-6">
            <h3 className="text-3xl font-bebas text-red">
              Live Streaming Arena
            </h3>
            <p className="text-black/70 font-plex text-sm md:text-base">
              Saksikan pertandingan langsung dari arena melalui kanal YouTube
              resmi.
            </p>
          </div>
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-red/10">
            <iframe
              className="w-full h-[300px] md:h-[450px]"
              src="https://www.youtube.com/embed/live_stream?channel=YOUR_CHANNEL_ID"
              title="Live YouTube"
              allowFullScreen
            ></iframe>
            <div className="absolute inset-0 bg-gradient-to-t from-red/10 via-transparent to-transparent pointer-events-none"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LapanganLiveView;
