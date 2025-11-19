import React, { useEffect, useState } from "react";
import { Loader, Radio, User } from "lucide-react";

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

interface MatchData {
  nomor_antrian: number;
  nomor_lapangan: string;
  nama_atlet_a: string;
  nama_atlet_b: string;
  foto_atlet_a?: string;
  foto_atlet_b?: string;
}

const getPhotoUrl = (filename: string): string | null => {
  if (!filename) return null;
  return `${
    process.env.REACT_APP_API_BASE_URL || "http://cjvmanagementevent.com"
  }/uploads/atlet/pas_foto/${filename}`;
};

const LivePertandinganView: React.FC<{ idKompetisi?: number }> = ({
  idKompetisi,
}) => {
  const [hariList, setHariList] = useState<HariData[]>([]);
  const [matchData, setMatchData] = useState<MatchData[]>([]);
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
    fetchMatchData();

    const interval = setInterval(() => {
      fetchLiveData();
      fetchMatchData();
    }, 10000);
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
                jumlah_peserta: 0,
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

  const fetchMatchData = async () => {
    if (!idKompetisi) return;
    try {
      const res = await fetch(`/api/pertandingan/kompetisi/${idKompetisi}`);
      const data = await res.json();
      if (data.success) {
        setMatchData(data.data);
      }
    } catch (error) {
      console.error("Error fetching match data:", error);
    }
  };

  const currentHari = hariList.find((h) => h.tanggal === selectedHari);

          const renderMatchDetails = (
            lap: LapanganData,
            match: MatchData | undefined,
            title: string,
            colorClass: string
          ) => {
            const bgColor = colorClass.replace("text", "bg").replace("700", "100");
            const matchNumber =
              title === "Bertanding"
                ? lap.antrian?.bertanding
                : title === "Persiapan"
                ? lap.antrian?.persiapan
                : lap.antrian?.pemanasan;    const renderAtlet = (nama: string, foto: string | undefined) => {
      const photoUrl = foto ? getPhotoUrl(foto) : null;
      return (
        <div className="flex flex-col items-center justify-center w-full">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={nama}
              className="w-16 h-16 rounded-full object-cover mb-2"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-2">
              <User className="w-8 h-8 text-gray-500" />
            </div>
          )}
          <p className="text-lg font-medium text-center">
            {nama || "Nama peserta tidak tersedia"}
          </p>
        </div>
      );
    };

    return (
      <div
        className={`relative w-full ${colorClass} ${bgColor} p-4 rounded-lg`}
      >
        <div className="absolute top-2 left-2 w-12 h-12 bg-white/70 rounded-full flex items-center justify-center text-xl font-bold">
          {matchNumber}
        </div>
        {match ? (
          <div className="flex flex-col gap-4 mt-8">
            {renderAtlet(match.nama_atlet_a, match.foto_atlet_a)}
            <div className="flex items-center justify-center">
              <span className="text-xl font-bold">VS</span>
            </div>
            {renderAtlet(match.nama_atlet_b, match.foto_atlet_b)}
          </div>
        ) : (
          <div className="text-center mt-8 text-lg font-medium">
            <p>Nama peserta tidak tersedia</p>
          </div>
        )}
      </div>
    );
  };

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
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="text-center p-8 rounded-xl border"
          style={{ borderColor: "#dc2626" }}
        >
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <section className="relative w-full min-h-screen overflow-hidden py-12 md:py- pt-24 sm:pt-28 md:pt-32 lg:pt-36">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center space-y-4 sm:space-y-6 md:space-y-8">
          <div className="hidden lg:inline-block group">
            <span className="text-red font-plex font-semibold text-xs sm:text-sm uppercase tracking-[0.2em] border-l-4 border-red pl-3 sm:pl-4 md:pl-6 relative">
              antrean pertandingan
              <div className="absolute -left-1 top-0 bottom-0 w-1 bg-red/20 group-hover:bg-red/40 transition-colors duration-300"></div>
            </span>
          </div>

          <div className="relative">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bebas leading-[0.85] tracking-wide">
              <span className="bg-gradient-to-r from-red via-red/90 to-red/80 bg-clip-text text-transparent">
                live Antrean
              </span>
            </h1>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-12 sm:w-16 md:w-20 h-0.5 sm:h-1 bg-gradient-to-r from-red to-red/60 rounded-full"></div>
          </div>

          <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-plex text-black/80 max-w-4xl mx-auto leading-relaxed font-light px-2 sm:px-4">
            Pantau aktivitas setiap lapangan dari pemanasan hingga pertandingan
            berlangsung
          </p>
        </div>

        {hariList.length > 1 && (
          <div className="flex justify-center gap-2 my-8 overflow-x-auto pb-2">
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

        {currentHari && currentHari.lapangan.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16 w-full">
            {currentHari.lapangan.map((lap) => {
              const bertandingMatch = matchData.find(
                (m) =>
                  m.nomor_lapangan === lap.nama_lapangan &&
                  m.nomor_antrian === lap.antrian?.bertanding
              );
              const persiapanMatch = matchData.find(
                (m) =>
                  m.nomor_lapangan === lap.nama_lapangan &&
                  m.nomor_antrian === lap.antrian?.persiapan
              );
              const pemanasanMatch = matchData.find(
                (m) =>
                  m.nomor_lapangan === lap.nama_lapangan &&
                  m.nomor_antrian === lap.antrian?.pemanasan
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
                  <div className="flex items-center justify-between mb-6">
                    <h3
                      className="text-3xl font-bebas"
                      style={{ color: "#990D35" }}
                    >
                      Lapangan {lap.nama_lapangan}
                    </h3>
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                  </div>

                  {lap.antrian && (
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-2xl font-semibold text-green-700 mb-2">
                          Bertanding
                        </h4>
                        {renderMatchDetails(
                          lap,
                          bertandingMatch,
                          "Bertanding",
                          "text-green-700"
                        )}
                      </div>
                      <div>
                        <h4 className="text-2xl font-semibold text-orange-700 mb-2">
                          Persiapan
                        </h4>
                        {renderMatchDetails(
                          lap,
                          persiapanMatch,
                          "Persiapan",
                          "text-orange-700"
                        )}
                      </div>
                      <div>
                        <h4 className="text-2xl font-semibold text-yellow-700 mb-2">
                          Pemanasan
                        </h4>
                        {renderMatchDetails(
                          lap,
                          pemanasanMatch,
                          "Pemanasan",
                          "text-yellow-700"
                        )}
                      </div>
                    </div>
                  )}
                  <p
                    className="text-sm mt-6 text-center"
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
      </div>
    </section>
  );
};

export default LivePertandinganView;
