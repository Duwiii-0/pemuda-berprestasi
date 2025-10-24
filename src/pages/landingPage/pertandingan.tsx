import React, { useState, useEffect } from "react";

interface KelasKejuaraan {
  urutan: number;
  kelas: {
    id_kelas_kejuaraan: number;
    nama_kelas: string;
    kategori_event: { nama_kategori: string };
    kelompok?: { nama_kelompok: string };
    kelas_berat?: { nama_kelas_berat: string };
    poomsae?: { nama_poomsae: string };
  };
}

interface Lapangan {
  id_lapangan: number;
  nama_lapangan: string;
  tanggal: string;
  kelas_list: Array<{
    urutan: number;
    kelas_kejuaraan: KelasKejuaraan["kelas"];
  }>;
}

interface HariPertandingan {
  tanggal: string;
  jumlah_lapangan: number;
  lapangan: Lapangan[];
}

const API_BASE_URL = "http://localhost:3000/api";
const ID_KOMPETISI = 1;

const getColor = (urutan: number) => {
  if (urutan === 1) return "bg-green-500/80";
  if (urutan === 2) return "bg-orange-400/80";
  if (urutan === 3) return "bg-yellow-400/80";
  return "bg-gray-300/80";
};

const getStatusText = (urutan: number) => {
  if (urutan === 1) return "bermain";
  if (urutan === 2) return "pemanasan";
  if (urutan === 3) return "bersiap";
  return "menunggu";
};

const formatTanggal = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatNamaKelas = (kelas: KelasKejuaraan["kelas"]) => {
  const parts = [kelas.kategori_event.nama_kategori];

  if (kelas.kelompok) parts.push(kelas.kelompok.nama_kelompok);
  if (kelas.kelas_berat) parts.push(kelas.kelas_berat.nama_kelas_berat);
  if (kelas.poomsae) parts.push(kelas.poomsae.nama_poomsae);

  return parts.join(" ");
};

const LapanganLiveView = () => {
  const [hariPertandingan, setHariPertandingan] = useState<HariPertandingan[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/lapangan/kompetisi/${ID_KOMPETISI}`
      );
      const result = await response.json();

      if (result.success) {
        setHariPertandingan(result.data.hari_pertandingan);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Ambil hari pertama atau semua data
  const dataLapangan =
    hariPertandingan.length > 0
      ? hariPertandingan[0].lapangan.map((lap) => ({
          nama: `Lapangan ${lap.nama_lapangan}`,
          hari: formatTanggal(lap.tanggal),
          kelasKejuaraan: lap.kelas_list.map((kls) => ({
            nama: formatNamaKelas(kls.kelas_kejuaraan),
            status: getStatusText(kls.urutan) as
              | "bermain"
              | "pemanasan"
              | "bersiap",
            antrian: kls.urutan,
          })),
        }))
      : [];

  if (loading && dataLapangan.length === 0) {
    return (
      <section className="relative w-full flex flex-col bg-gradient-to-br from-white via-red/[0.02] to-white overflow-hidden py-12 md:py-16">
        <div className="container mx-auto px-4 relative z-10 py-20">
          <div className="text-center">
            <p className="text-black/70 font-plex">
              Memuat data pertandingan...
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full flex flex-col bg-gradient-to-br from-white via-red/[0.02] to-white overflow-hidden py-12 md:py-16">
      {/* Background animasi */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-80 h-80 border border-red/[0.08] rounded-full animate-pulse opacity-40"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 border border-red/[0.06] rounded-full animate-pulse opacity-30 animation-delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-red/30 rounded-full animate-bounce"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10 py-20">
        {/* Judul */}
        <div className="text-center mb-12 pt-10">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-judul font-bebas text-red leading-none tracking-wide mb-8">
            <span className="bg-gradient-to-r from-red via-red/90 to-red/80 bg-clip-text text-transparent">
              Live Pertandingan
            </span>
          </h1>
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
                {lap.kelasKejuaraan.length === 0 ? (
                  <p className="text-black/50 text-center py-4">
                    Belum ada kelas terjadwal
                  </p>
                ) : (
                  lap.kelasKejuaraan.map((kelas, idx) => (
                    <div
                      key={idx}
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
                          kelas.antrian
                        )} ring-4 ring-white/60 shadow-md`}
                        title={kelas.status}
                      ></div>
                    </div>
                  ))
                )}
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
