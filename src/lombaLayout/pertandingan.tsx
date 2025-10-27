import React, { useEffect, useState } from "react";
import { Loader, Radio, Youtube } from "lucide-react";

interface KelasLapangan {
  id_kelas_kejuaraan: number;
  nama_kelas: string;
  jumlah_peserta: number;
  status_antrian: "bertanding" | "persiapan" | "pemanasan" | "menunggu";
  nomor_antrian: number;
}

interface LapanganData {
  id_lapangan: number;
  nama_lapangan: string;
  tanggal: string;
  kelas_kejuaraan: KelasLapangan[];
  antrian: {
    bertanding: number;
    persiapan: number;
    pemanasan: number;
  } | null;
}

interface HariData {
  tanggal: string;
  lapangan: LapanganData[];
}

const LivePertandinganView: React.FC<{ idKompetisi?: number }> = ({
  idKompetisi,
}) => {
  const [hariList, setHariList] = useState<HariData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedHari, setSelectedHari] = useState<string | null>(null);

  const generateNamaKelas = (kelas: any) => {
    const parts = [];
    if (kelas.cabang) parts.push(kelas.cabang);
    if (kelas.kategori_event?.nama_kategori)
      parts.push(kelas.kategori_event.nama_kategori);

    const isPoomsaePemula =
      kelas.cabang === "POOMSAE" &&
      kelas.kategori_event?.nama_kategori === "Pemula";
    if (kelas.kelompok?.nama_kelompok && !isPoomsaePemula) {
      parts.push(kelas.kelompok.nama_kelompok);
    }

    if (kelas.kelas_berat) {
      const gender =
        kelas.kelas_berat.jenis_kelamin === "LAKI_LAKI" ? "Putra" : "Putri";
      parts.push(gender);
    }

    if (kelas.kelas_berat?.nama_kelas) parts.push(kelas.kelas_berat.nama_kelas);
    if (kelas.poomsae?.nama_kelas) parts.push(kelas.poomsae.nama_kelas);

    return parts.length > 0 ? parts.join(" - ") : "Kelas Tidak Lengkap";
  };

  useEffect(() => {
    if (!idKompetisi) return;
    fetchLiveData();

    // Auto refresh setiap 10 detik
    const interval = setInterval(fetchLiveData, 10000);
    return () => clearInterval(interval);
  }, [idKompetisi]);

  const fetchLiveData = async () => {
    if (!idKompetisi) return;

    try {
      const res = await fetch(`/api/lapangan/kompetisi/${idKompetisi}`);
      const data = await res.json();

      if (data.success) {
        const hariData = data.data.hari_pertandingan.map((hari: any) => ({
          tanggal: hari.tanggal,
          lapangan: hari.lapangan.map((lap: any) => ({
            id_lapangan: lap.id_lapangan,
            nama_lapangan: lap.nama_lapangan,
            tanggal: lap.tanggal,
            antrian: lap.antrian,
            kelas_kejuaraan: (lap.kelas_list || []).map(
              (kelasItem: any, index: number) => ({
                id_kelas_kejuaraan: kelasItem.id_kelas_kejuaraan,
                nama_kelas: generateNamaKelas(kelasItem.kelas_kejuaraan),
                jumlah_peserta: 0, // This can be populated if the API provides it
                status_antrian:
                  index === 0
                    ? "bertanding"
                    : index === 1
                    ? "persiapan"
                    : index === 2
                    ? "pemanasan"
                    : "menunggu",
                nomor_antrian: index + 1,
              })
            ),
          })),
        }));

        setHariList(hariData);

        // Auto select hari pertama jika belum ada
        if (!selectedHari && hariData.length > 0) {
          setSelectedHari(hariData[0].tanggal);
        }
      }
    } catch (err: any) {
      console.error("Error fetching live data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const currentHari = hariList.find((h) => h.tanggal === selectedHari);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#F5FBEF" }}
      >
        <div className="text-center">
          <Loader
            className="animate-spin mx-auto mb-4"
            size={48}
            style={{ color: "#990D35" }}
          />
          <p className="text-lg font-medium" style={{ color: "#990D35" }}>
            Memuat data live...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#F5FBEF" }}
      >
        <div
          className="text-center p-8 rounded-xl border"
          style={{ borderColor: "#dc2626", backgroundColor: "#fff" }}
        >
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <section
      className="relative w-full min-h-screen overflow-hidden py-12 md:py- pt-24 sm:pt-28 md:pt-32 lg:pt-36"
      style={{ backgroundColor: "#F5FBEF" }}
    >
      {/* Background animasi */}
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
                <Radio className="animate-pulse inline-block mr-2" size={16} />
                Pantau Pertandingan
                <div className="absolute -left-1 top-0 bottom-0 w-1 bg-red/20 group-hover:bg-red/40 transition-colors duration-300"></div>
              </span>
            </div>

            <div className="relative">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl font-bebas leading-[0.85] tracking-wide">
                <span className="bg-gradient-to-r from-red via-red/90 to-red/80 bg-clip-text text-transparent">
                  Antrean
                </span>
                <span className="block bg-gradient-to-r from-red/80 via-red/90 to-red bg-clip-text text-transparent">
                  Pertandingan
                </span>
              </h1>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-12 sm:w-16 md:w-20 h-0.5 sm:h-1 bg-gradient-to-r from-red to-red/60 rounded-full"></div>
            </div>

            <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-plex text-black/80 max-w-4xl mx-auto leading-relaxed font-light px-2 sm:px-4">
              Pantau aktivitas setiap lapangan — dari pemanasan hingga
              pertandingan berlangsung
            </p>
          </div>
        </div>
      </section>

      {/* Tabs Hari */}
      {hariList.length > 1 && (
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {hariList.map((hari, idx) => (
            <button
              key={hari.tanggal}
              onClick={() => setSelectedHari(hari.tanggal)}
              className={`px-6 py-3 rounded-xl font-medium whitespace-nowrap transition-all ${
                selectedHari === hari.tanggal
                  ? "shadow-lg"
                  : "opacity-60 hover:opacity-100"
              }`}
              style={{
                backgroundColor:
                  selectedHari === hari.tanggal ? "#990D35" : "#fff",
                color: selectedHari === hari.tanggal ? "#F5FBEF" : "#990D35",
                border: `2px solid ${
                  selectedHari === hari.tanggal
                    ? "#990D35"
                    : "rgba(153, 13, 53, 0.2)"
                }`,
              }}
            >
              Hari ke-{idx + 1}
              <div className="text-xs opacity-80 mt-1">
                {new Date(hari.tanggal).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                })}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Grid Lapangan */}
      {currentHari && currentHari.lapangan.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16 w-full">
          {currentHari.lapangan.map((lap) => {
            const bertandingClass = lap.kelas_kejuaraan.find(
              (kelas) => kelas.status_antrian === "bertanding"
            );
            return (
              <div
                key={lap.id_lapangan}
                className="relative p-6 rounded-2xl shadow-xl border transition-all duration-500 hover:shadow-2xl w-full"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  borderColor: "rgba(153, 13, 53, 0.1)",
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3
                    className="text-2xl font-bebas"
                    style={{ color: "#990D35" }}
                  >
                    Lapangan {lap.nama_lapangan}
                  </h3>
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                </div>

                {lap.antrian && (
                  <div className="mb-4 space-y-3 w-full">
                    <div className="flex flex-col items-center justify-center w-full text-green-700 bg-green-100 px-4 py-4 rounded-lg">
                      <span className="text-5xl font-bold mb-2">
                        {lap.antrian.bertanding}
                      </span>
                      <span className="text-2xl font-semibold">Bertanding</span>
                    </div>
                    <div className="flex flex-col items-center justify-center w-full text-orange-700 bg-orange-100 px-4 py-4 rounded-lg">
                      <span className="text-5xl font-bold mb-2">
                        {lap.antrian.persiapan}
                      </span>
                      <span className="text-2xl font-semibold">Persiapan</span>
                    </div>
                    <div className="flex flex-col items-center justify-center w-full text-yellow-700 bg-yellow-100 px-4 py-4 rounded-lg">
                      <span className="text-5xl font-bold mb-2">
                        {lap.antrian.pemanasan}
                      </span>
                      <span className="text-2xl font-semibold">Pemanasan</span>
                    </div>
                  </div>
                )}
                <p
                  className="text-sm mb-4"
                  style={{ color: "#050505", opacity: 0.6 }}
                >
                  {new Date(lap.tanggal).toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <p
            className="text-lg font-medium"
            style={{ color: "#050505", opacity: 0.6 }}
          >
            Belum ada data lapangan untuk hari ini
          </p>
        </div>
      )}
    </section>
  );
};

export default LivePertandinganView;
