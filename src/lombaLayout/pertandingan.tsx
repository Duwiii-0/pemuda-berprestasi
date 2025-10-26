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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "bertanding":
        return "bg-green-500/80";
      case "persiapan":
        return "bg-orange-400/80";
      case "pemanasan":
        return "bg-yellow-400/80";
      default:
        return "bg-gray-300/80";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "bertanding":
        return "🟢 Sedang Bertanding";
      case "persiapan":
        return "🟠 Persiapan";
      case "pemanasan":
        return "🟡 Pemanasan";
      default:
        return "⚪ Menunggu";
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
      className="relative w-full min-h-screen overflow-hidden py-12 md:py-16"
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

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Radio
              className="animate-pulse"
              size={40}
              style={{ color: "#990D35" }}
            />
            <h1
              className="text-4xl sm:text-5xl md:text-6xl font-bebas"
              style={{ color: "#990D35" }}
            >
              LIVE PERTANDINGAN
            </h1>
          </div>
          <p
            className="text-base md:text-lg"
            style={{ color: "#050505", opacity: 0.7 }}
          >
            Pantau aktivitas setiap lapangan — dari pemanasan hingga
            pertandingan berlangsung
          </p>
        </div>

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {currentHari.lapangan.map((lap) => {
              const bertandingClass = lap.kelas_kejuaraan.find(
                (kelas) => kelas.status_antrian === "bertanding"
              );
              return (
                <div
                  key={lap.id_lapangan}
                  className="relative p-6 rounded-2xl shadow-xl border transition-all duration-500 hover:shadow-2xl"
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

                  {bertandingClass && (
                    <p
                      className="text-lg font-semibold mb-2"
                      style={{ color: "#050505" }}
                    >
                      Sedang Bertanding: <br />
                      {bertandingClass.nama_kelas}
                    </p>
                  )}

                  {lap.antrian && (
                    <div className="mb-4 space-y-2">
                      <div className="flex justify-center items-center gap-2">
                        <span className="text-lg font-medium text-green-700 bg-green-100 px-3 py-3 rounded-md">
                          Bertanding: {lap.antrian.bertanding}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-medium text-orange-700 bg-orange-100 px-3 py-1 rounded-md">
                          Persiapan: {lap.antrian.persiapan}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-medium text-yellow-700 bg-yellow-100 px-3 py-1 rounded-md">
                          Pemanasan: {lap.antrian.pemanasan}
                        </span>
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

                  <div className="space-y-3">
                    {lap.kelas_kejuaraan.length > 0 ? (
                      lap.kelas_kejuaraan.map((kelas) => (
                        <div
                          key={kelas.id_kelas_kejuaraan}
                          className="flex items-center justify-between p-3 rounded-xl border transition-all duration-300 hover:bg-white"
                          style={{
                            backgroundColor: "rgba(255, 255, 255, 0.7)",
                            borderColor: "rgba(153, 13, 53, 0.05)",
                          }}
                        >
                          <div className="flex-1">
                            <p
                              className="font-semibold text-sm"
                              style={{ color: "#050505" }}
                            >
                              {kelas.nama_kelas}
                            </p>
                            <p
                              className="text-xs mt-1"
                              style={{ color: "#990D35" }}
                            >
                              Antrian #{kelas.nomor_antrian}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <div
                              className={`w-3 h-3 rounded-full ${getStatusColor(
                                kelas.status_antrian
                              )} ring-4 ring-white/60 shadow-md`}
                              title={kelas.status_antrian}
                            ></div>
                            <span
                              className="text-xs whitespace-nowrap"
                              style={{ color: "#050505", opacity: 0.7 }}
                            >
                              {
                                getStatusLabel(kelas.status_antrian).split(
                                  " "
                                )[1]
                              }
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p
                          className="text-sm"
                          style={{ color: "#050505", opacity: 0.5 }}
                        >
                          Belum ada kelas terjadwal
                        </p>
                      </div>
                    )}
                  </div>
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

        {/* YouTube Live Section */}
        <div className="mt-16 relative max-w-5xl mx-auto">
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

export default LivePertandinganView;
