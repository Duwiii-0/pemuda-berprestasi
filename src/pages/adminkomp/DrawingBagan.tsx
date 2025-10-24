import React, { useEffect, useState } from "react";
import {
  GitBranch,
  Users,
  Filter,
  Search,
  Trophy,
  Medal,
  AlertTriangle,
  Loader,
  Eye,
} from "lucide-react";
import { useAuth } from "../../context/authContext";
import { useKompetisi } from "../../context/KompetisiContext";
import TournamentBracketPemula from "../../components/TournamentBracketPemula";
import TournamentBracketPrestasi from "../../components/TournamentBracketPrestasi";

interface KelasKejuaraan {
  id_kelas_kejuaraan: string;
  cabang: "KYORUGI" | "POOMSAE";
  kategori_event: {
    nama_kategori: string;
  };
  kelompok: {
    id_kelompok: number;
    nama_kelompok: string;
    usia_min: number;
    usia_max: number;
  };
  kelas_berat?: {
    nama_kelas: string;
  };
  poomsae?: {
    nama_kelas: string;
  };
  jenis_kelamin: "LAKI_LAKI" | "PEREMPUAN";
  peserta_count: number;
  bracket_status: "not_created" | "created" | "in_progress" | "completed";
}

const DrawingBagan: React.FC = () => {
  const { token, user } = useAuth();
  const { pesertaList, fetchAtletByKompetisi, loadingAtlet } = useKompetisi();

  const [kelasKejuaraan, setKelasKejuaraan] = useState<KelasKejuaraan[]>([]);
  const [filteredKelas, setFilteredKelas] = useState<KelasKejuaraan[]>([]);
  const [selectedKelas, setSelectedKelas] = useState<KelasKejuaraan | null>(
    null
  );
  const [showBracket, setShowBracket] = useState(false);
  const [loadingBracketStatus, setLoadingBracketStatus] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCabang, setFilterCabang] = useState<
    "ALL" | "KYORUGI" | "POOMSAE"
  >("ALL");
  const [filterLevel, setFilterLevel] = useState<"ALL" | "pemula" | "prestasi">(
    "ALL"
  );
  const [filterStatus, setFilterStatus] = useState<
    "ALL" | "not_created" | "created" | "in_progress" | "completed"
  >("ALL");
  const [filterGender, setFilterGender] = useState<
    "ALL" | "LAKI_LAKI" | "PEREMPUAN"
  >("ALL");

  const kompetisiId =
    user?.role === "ADMIN_KOMPETISI"
      ? user?.admin_kompetisi?.id_kompetisi
      : null;

  useEffect(() => {
    if (kompetisiId) {
      fetchAtletByKompetisi(kompetisiId);
    }
  }, [kompetisiId]);

  // Process peserta data
  useEffect(() => {
    if (pesertaList.length > 0) {
      const kelasMap = new Map<string, KelasKejuaraan>();

      pesertaList
        .filter((peserta) => peserta.status === "APPROVED")
        .forEach((peserta) => {
          const kelas = peserta.kelas_kejuaraan;
          if (!kelas) return;

          const key = `${kelas.id_kelas_kejuaraan}`;

          if (kelasMap.has(key)) {
            const existing = kelasMap.get(key)!;
            existing.peserta_count += 1;
          } else {
            kelasMap.set(key, {
              id_kelas_kejuaraan: kelas.id_kelas_kejuaraan,
              cabang: kelas.cabang,
              kategori_event: kelas.kategori_event,
              kelompok: kelas.kelompok,
              kelas_berat: kelas.kelas_berat,
              poomsae: kelas.poomsae,
              jenis_kelamin: kelas.jenis_kelamin,
              peserta_count: 1,
              bracket_status: "not_created",
            });
          }
        });

      const kelasArray = Array.from(kelasMap.values());
      setKelasKejuaraan(kelasArray);
    }
  }, [pesertaList]);

  // Fetch bracket status
  useEffect(() => {
    const fetchBracketStatus = async () => {
      if (kelasKejuaraan.length === 0 || !kompetisiId) return;

      setLoadingBracketStatus(true);

      try {
        const updatedKelas = await Promise.all(
          kelasKejuaraan.map(async (kelas) => {
            try {
              const response = await fetch(
                `${
                  import.meta.env.VITE_API_URL || "/api"
                }/kompetisi/${kompetisiId}/brackets/${
                  kelas.id_kelas_kejuaraan
                }`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              if (response.ok) {
                const result = await response.json();
                const matches = result.data?.matches || [];

                let status:
                  | "not_created"
                  | "created"
                  | "in_progress"
                  | "completed" = "not_created";

                if (matches.length > 0) {
                  const hasScores = matches.some(
                    (m: any) => m.scoreA > 0 || m.scoreB > 0
                  );

                  if (hasScores) {
                    const allCompleted = matches.every(
                      (m: any) =>
                        (m.participant1 &&
                          m.participant2 &&
                          (m.scoreA > 0 || m.scoreB > 0)) ||
                        !m.participant1 ||
                        !m.participant2
                    );
                    status = allCompleted ? "completed" : "in_progress";
                  } else {
                    status = "created";
                  }
                }

                return { ...kelas, bracket_status: status };
              } else if (response.status === 404) {
                return {
                  ...kelas,
                  bracket_status: "not_created" as const,
                };
              } else {
                return kelas;
              }
            } catch (error) {
              console.error(
                `❌ Error fetching bracket for kelas ${kelas.id_kelas_kejuaraan}:`,
                error
              );
              return kelas;
            }
          })
        );

        setKelasKejuaraan(updatedKelas);
      } catch (error) {
        console.error("❌ Error fetching bracket status:", error);
      } finally {
        setLoadingBracketStatus(false);
      }
    };

    fetchBracketStatus();
  }, [kelasKejuaraan.length, kompetisiId]);

  // Apply filters
  useEffect(() => {
    let filtered = kelasKejuaraan;

    if (searchTerm) {
      filtered = filtered.filter((kelas) => {
        const searchString = `${kelas.cabang} ${kelas.kategori_event.nama_kategori} ${kelas.kelompok.nama_kelompok}`;
        return searchString.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    if (filterCabang !== "ALL") {
      filtered = filtered.filter((kelas) => kelas.cabang === filterCabang);
    }

    if (filterLevel !== "ALL") {
      filtered = filtered.filter(
        (kelas) =>
          kelas.kategori_event.nama_kategori.toLowerCase() === filterLevel
      );
    }

    if (filterStatus !== "ALL") {
      filtered = filtered.filter(
        (kelas) => kelas.bracket_status === filterStatus
      );
    }

    if (filterGender !== "ALL") {
      filtered = filtered.filter(
        (kelas) => kelas.jenis_kelamin === filterGender
      );
    }

    setFilteredKelas(filtered);
  }, [
    kelasKejuaraan,
    searchTerm,
    filterCabang,
    filterLevel,
    filterStatus,
    filterGender,
  ]);

  const getStatusBadge = (status: KelasKejuaraan["bracket_status"]) => {
    const statusConfig = {
      not_created: {
        bg: "rgba(156, 163, 175, 0.2)",
        text: "#6b7280",
        label: "Belum Dibuat",
      },
      created: {
        bg: "rgba(245, 183, 0, 0.2)",
        text: "#F5B700",
        label: "Sudah Dibuat",
      },
      in_progress: {
        bg: "rgba(34, 197, 94, 0.2)",
        text: "#22c55e",
        label: "Berlangsung",
      },
      completed: {
        bg: "rgba(34, 197, 94, 0.2)",
        text: "#059669",
        label: "Selesai",
      },
    };

    const config = statusConfig[status];
    return (
      <span
        className="px-2 py-1 rounded-full text-xs font-medium"
        style={{ backgroundColor: config.bg, color: config.text }}
      >
        {config.label}
      </span>
    );
  };

  // Check if kelas is Pemula or Prestasi
  const isPemula = (kelas: KelasKejuaraan) => {
    return kelas.kategori_event.nama_kategori.toLowerCase().includes("pemula");
  };

  if (user?.role !== "ADMIN_KOMPETISI") {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: "#F5FBEF" }}
      >
        <div
          className="rounded-xl shadow-sm border p-6 max-w-md w-full"
          style={{
            backgroundColor: "rgba(153, 13, 53, 0.05)",
            borderColor: "rgba(153, 13, 53, 0.2)",
          }}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              size={20}
              className="flex-shrink-0 mt-0.5"
              style={{ color: "#990D35" }}
            />
            <p className="text-sm sm:text-base" style={{ color: "#990D35" }}>
              Akses ditolak. Hanya Admin Kompetisi yang dapat mengelola drawing
              bagan.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!kompetisiId) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: "#F5FBEF" }}
      >
        <div
          className="rounded-xl shadow-sm border p-6 max-w-md w-full"
          style={{ backgroundColor: "#F5FBEF", borderColor: "#990D35" }}
        >
          <p
            className="text-sm sm:text-base"
            style={{ color: "#050505", opacity: 0.6 }}
          >
            Tidak ada kompetisi terkait akun ini.
          </p>
        </div>
      </div>
    );
  }

  // Show appropriate bracket component
  if (showBracket && selectedKelas) {
    const kelasDataForBracket = {
      ...selectedKelas,
      id_kelas_kejuaraan: parseInt(selectedKelas.id_kelas_kejuaraan),
      kompetisi: {
        id_kompetisi: kompetisiId!,
        nama_event:
          pesertaList[0]?.kelas_kejuaraan?.kompetisi?.nama_event ||
          "Competition",
        tanggal_mulai:
          pesertaList[0]?.kelas_kejuaraan?.kompetisi?.tanggal_mulai ||
          new Date().toISOString(),
        tanggal_selesai:
          pesertaList[0]?.kelas_kejuaraan?.kompetisi?.tanggal_selesai ||
          new Date().toISOString(),
        lokasi:
          pesertaList[0]?.kelas_kejuaraan?.kompetisi?.lokasi || "Location",
        status:
          pesertaList[0]?.kelas_kejuaraan?.kompetisi?.status || "PENDAFTARAN",
      },
      peserta_kompetisi: pesertaList
        .filter(
          (p) =>
            p.status === "APPROVED" &&
            p.kelas_kejuaraan?.id_kelas_kejuaraan ===
              selectedKelas.id_kelas_kejuaraan
        )
        .map((p) => ({
          id_peserta_kompetisi: p.id_peserta_kompetisi,
          id_atlet: p.atlet?.id_atlet,
          is_team: p.is_team,
          status: p.status,
          atlet: p.atlet
            ? {
                id_atlet: p.atlet.id_atlet,
                nama_atlet: p.atlet.nama_atlet,
                dojang: {
                  nama_dojang: p.atlet.dojang?.nama_dojang || "",
                },
              }
            : undefined,
          anggota_tim: p.anggota_tim?.map((at) => ({
            atlet: {
              nama_atlet: at.atlet.nama_atlet,
            },
          })),
        })),
      bagan: [],
    };

    const handleBackFromBracket = () => {
      console.log("🔙 Back to drawing bagan list");
      setShowBracket(false);
      setSelectedKelas(null);

      if (kompetisiId) {
        fetchAtletByKompetisi(kompetisiId);
      }
    };

    // Render PEMULA or PRESTASI component based on kategori
    if (isPemula(selectedKelas)) {
      return (
        <TournamentBracketPemula
          kelasData={kelasDataForBracket}
          onBack={handleBackFromBracket}
          apiBaseUrl={import.meta.env.VITE_API_URL || "/api"}
        />
      );
    } else {
      return (
        <TournamentBracketPrestasi
          kelasData={kelasDataForBracket}
          onBack={handleBackFromBracket}
          apiBaseUrl={import.meta.env.VITE_API_URL || "/api"}
        />
      );
    }
  }

  if (loadingAtlet || loadingBracketStatus) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: "#F5FBEF" }}
      >
        <div className="flex flex-col items-center gap-3">
          <Loader
            className="animate-spin"
            style={{ color: "#990D35" }}
            size={32}
          />
          <p style={{ color: "#050505", opacity: 0.6 }}>
            {loadingAtlet
              ? "Memuat data kelas kejuaraan..."
              : "Memeriksa status bracket..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5FBEF" }}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-full">
        {/* HEADER */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shadow-lg"
              style={{
                background: "linear-gradient(135deg, #990D35 0%, #7A0A2B 100%)",
              }}
            >
              <GitBranch
                size={32}
                className="sm:w-8 sm:h-8"
                style={{ color: "white" }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h1
                className="text-2xl sm:text-3xl lg:text-4xl font-bebas leading-tight mb-1"
                style={{ color: "#050505" }}
              >
                DRAWING BAGAN TOURNAMENT
              </h1>
              <p
                className="text-sm sm:text-base"
                style={{ color: "#050505", opacity: 0.6 }}
              >
                Kelola bracket tournament untuk setiap kelas kejuaraan
              </p>
            </div>
          </div>
        </div>

        {/* STATISTICS CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {/* Card 1 - Total Kelas (MERAH) */}
          <div
            className="rounded-2xl shadow-md border p-5 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            style={{
              backgroundColor: "#F5FBEF",
              borderColor: "rgba(153, 13, 53, 0.1)",
              background:
                "linear-gradient(135deg, #F5FBEF 0%, rgba(153, 13, 53, 0.02) 100%)",
            }}
          >
            <div className="flex flex-col gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                style={{
                  background:
                    "linear-gradient(135deg, #990D35 0%, #7A0A2B 100%)",
                }}
              >
                <Trophy size={24} style={{ color: "white" }} />
              </div>
              <div>
                <p
                  className="text-2xl font-bold mb-1"
                  style={{ color: "#050505" }}
                >
                  {kelasKejuaraan.length}
                </p>
                <p
                  className="text-xs font-medium"
                  style={{ color: "#050505", opacity: 0.6 }}
                >
                  Total Kelas
                </p>
              </div>
            </div>
          </div>

          {/* Card 2 - Bracket Dibuat (KUNING) */}
          <div
            className="rounded-2xl shadow-md border p-5 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            style={{
              backgroundColor: "#F5FBEF",
              borderColor: "rgba(245, 183, 0, 0.2)",
              background:
                "linear-gradient(135deg, #F5FBEF 0%, rgba(245, 183, 0, 0.03) 100%)",
            }}
          >
            <div className="flex flex-col gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                style={{
                  background:
                    "linear-gradient(135deg, #F5B700 0%, #D19B00 100%)",
                }}
              >
                <GitBranch size={24} style={{ color: "white" }} />
              </div>
              <div>
                <p
                  className="text-2xl font-bold mb-1"
                  style={{ color: "#050505" }}
                >
                  {
                    kelasKejuaraan.filter((k) => k.bracket_status === "created")
                      .length
                  }
                </p>
                <p
                  className="text-xs font-medium"
                  style={{ color: "#050505", opacity: 0.6 }}
                >
                  Bracket Dibuat
                </p>
              </div>
            </div>
          </div>

          {/* Card 3 - Berlangsung (KUNING) */}
          <div
            className="rounded-2xl shadow-md border p-5 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            style={{
              backgroundColor: "#F5FBEF",
              borderColor: "rgba(245, 183, 0, 0.2)",
              background:
                "linear-gradient(135deg, #F5FBEF 0%, rgba(245, 183, 0, 0.03) 100%)",
            }}
          >
            <div className="flex flex-col gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                style={{
                  background:
                    "linear-gradient(135deg, #F5B700 0%, #D19B00 100%)",
                }}
              >
                <Medal size={24} style={{ color: "white" }} />
              </div>
              <div>
                <p
                  className="text-2xl font-bold mb-1"
                  style={{ color: "#050505" }}
                >
                  {
                    kelasKejuaraan.filter(
                      (k) => k.bracket_status === "in_progress"
                    ).length
                  }
                </p>
                <p
                  className="text-xs font-medium"
                  style={{ color: "#050505", opacity: 0.6 }}
                >
                  Berlangsung
                </p>
              </div>
            </div>
          </div>

          {/* Card 4 - Total Peserta (MERAH) */}
          <div
            className="rounded-2xl shadow-md border p-5 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            style={{
              backgroundColor: "#F5FBEF",
              borderColor: "rgba(153, 13, 53, 0.1)",
              background:
                "linear-gradient(135deg, #F5FBEF 0%, rgba(153, 13, 53, 0.02) 100%)",
            }}
          >
            <div className="flex flex-col gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                style={{
                  background:
                    "linear-gradient(135deg, #990D35 0%, #7A0A2B 100%)",
                }}
              >
                <Users size={24} style={{ color: "white" }} />
              </div>
              <div>
                <p
                  className="text-2xl font-bold mb-1"
                  style={{ color: "#050505" }}
                >
                  {kelasKejuaraan.reduce((sum, k) => sum + k.peserta_count, 0)}
                </p>
                <p
                  className="text-xs font-medium"
                  style={{ color: "#050505", opacity: 0.6 }}
                >
                  Total Peserta
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FILTER + SEARCH */}
        <div
          className="rounded-2xl shadow-md border p-6 sm:p-8 mb-8 hover:shadow-lg transition-all duration-300"
          style={{
            backgroundColor: "#F5FBEF",
            borderColor: "rgba(153, 13, 53, 0.1)",
            background:
              "linear-gradient(135deg, #F5FBEF 0%, rgba(153, 13, 53, 0.01) 100%)",
          }}
        >
          <div className="space-y-5">
            {/* Search */}
            <div className="w-full">
              <div className="relative">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  style={{ color: "#990D35", opacity: 0.5 }}
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Cari kelas kejuaraan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border-2 shadow-sm text-sm font-medium focus:outline-none focus:ring-2 transition-all"
                  style={{
                    borderColor: "rgba(153, 13, 53, 0.2)",
                    backgroundColor: "white",
                    color: "#050505",
                  }}
                />
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <label
                  className="block text-xs mb-2 font-bold"
                  style={{ color: "#050505", opacity: 0.7 }}
                >
                  Cabang
                </label>
                <div className="relative">
                  <select
                    value={filterCabang}
                    onChange={(e) => setFilterCabang(e.target.value as any)}
                    className="w-full px-4 py-3 rounded-xl border-2 shadow-sm text-sm font-medium focus:outline-none focus:ring-2 transition-all appearance-none cursor-pointer"
                    style={{
                      borderColor: "rgba(153, 13, 53, 0.2)",
                      backgroundColor: "white",
                      color: "#050505",
                    }}
                  >
                    <option value="ALL">Semua Cabang</option>
                    <option value="KYORUGI">KYORUGI</option>
                    <option value="POOMSAE">POOMSAE</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                      <path
                        d="M5 7.5L10 12.5L15 7.5"
                        stroke="#990D35"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label
                  className="block text-xs mb-2 font-bold"
                  style={{ color: "#050505", opacity: 0.7 }}
                >
                  Level
                </label>
                <div className="relative">
                  <select
                    value={filterLevel}
                    onChange={(e) => setFilterLevel(e.target.value as any)}
                    className="w-full px-4 py-3 rounded-xl border-2 shadow-sm text-sm font-medium focus:outline-none focus:ring-2 transition-all appearance-none cursor-pointer"
                    style={{
                      borderColor: "rgba(153, 13, 53, 0.2)",
                      backgroundColor: "white",
                      color: "#050505",
                    }}
                  >
                    <option value="ALL">Semua Level</option>
                    <option value="pemula">Pemula</option>
                    <option value="prestasi">Prestasi</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                      <path
                        d="M5 7.5L10 12.5L15 7.5"
                        stroke="#990D35"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label
                  className="block text-xs mb-2 font-bold"
                  style={{ color: "#050505", opacity: 0.7 }}
                >
                  Status
                </label>
                <div className="relative">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="w-full px-4 py-3 rounded-xl border-2 shadow-sm text-sm font-medium focus:outline-none focus:ring-2 transition-all appearance-none cursor-pointer"
                    style={{
                      borderColor: "rgba(153, 13, 53, 0.2)",
                      backgroundColor: "white",
                      color: "#050505",
                    }}
                  >
                    <option value="ALL">Semua Status</option>
                    <option value="not_created">Belum Dibuat</option>
                    <option value="created">Sudah Dibuat</option>
                    <option value="in_progress">Berlangsung</option>
                    <option value="completed">Selesai</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                      <path
                        d="M5 7.5L10 12.5L15 7.5"
                        stroke="#990D35"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label
                  className="block text-xs mb-2 font-bold"
                  style={{ color: "#050505", opacity: 0.7 }}
                >
                  Gender
                </label>
                <div className="relative">
                  <select
                    value={filterGender}
                    onChange={(e) => setFilterGender(e.target.value as any)}
                    className="w-full px-4 py-3 rounded-xl border-2 shadow-sm text-sm font-medium focus:outline-none focus:ring-2 transition-all appearance-none cursor-pointer"
                    style={{
                      borderColor: "rgba(153, 13, 53, 0.2)",
                      backgroundColor: "white",
                      color: "#050505",
                    }}
                  >
                    <option value="ALL">Semua</option>
                    <option value="LAKI_LAKI">Putra</option>
                    <option value="PEREMPUAN">Putri</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                      <path
                        d="M5 7.5L10 12.5L15 7.5"
                        stroke="#990D35"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFilterCabang("ALL");
                    setFilterLevel("ALL");
                    setFilterStatus("ALL");
                    setFilterGender("ALL");
                  }}
                  className="w-full px-4 py-3 rounded-xl border-2 font-bold text-sm shadow-sm hover:shadow-md transition-all transform hover:scale-[1.02]"
                  style={{
                    borderColor: "#990D35",
                    color: "#990D35",
                    backgroundColor: "white",
                  }}
                >
                  Reset Filter
                </button>
              </div>
            </div>

            <div
              className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 pt-4 border-t"
              style={{ borderColor: "rgba(153, 13, 53, 0.1)" }}
            >
              <p
                className="text-sm font-medium"
                style={{ color: "#050505", opacity: 0.6 }}
              >
                Menampilkan{" "}
                <span className="font-bold" style={{ color: "#990D35" }}>
                  {filteredKelas.length}
                </span>{" "}
                dari{" "}
                <span className="font-bold" style={{ color: "#990D35" }}>
                  {kelasKejuaraan.length}
                </span>{" "}
                kelas
              </p>
            </div>
          </div>
        </div>

        {/* CONTENT - Kelas Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredKelas.map((kelas) => (
            <div
              key={kelas.id_kelas_kejuaraan}
              className="rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
              style={{
                backgroundColor: "#F5FBEF",
                border: "1px solid rgba(153, 13, 53, 0.1)",
                boxShadow:
                  "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
              }}
            >
              {/* Header */}
              <div
                className="p-5 border-b"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(153, 13, 53, 0.08) 0%, rgba(153, 13, 53, 0.04) 100%)",
                  borderColor: "rgba(153, 13, 53, 0.1)",
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                      style={{
                        backgroundColor: "#990D35",
                      }}
                    >
                      {kelas.cabang === "KYORUGI" ? (
                        <Medal size={20} style={{ color: "white" }} />
                      ) : (
                        <Trophy size={20} style={{ color: "white" }} />
                      )}
                    </div>
                    <span
                      className="px-3 py-1.5 rounded-full text-xs font-bold shadow-sm"
                      style={{
                        backgroundColor: "#990D35",
                        color: "white",
                      }}
                    >
                      {kelas.cabang}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {loadingBracketStatus && (
                      <Loader
                        size={14}
                        className="animate-spin"
                        style={{ color: "#6b7280" }}
                      />
                    )}
                    {getStatusBadge(kelas.bracket_status)}
                  </div>
                </div>

                <h3
                  className="font-bold text-base leading-tight mb-2"
                  style={{ color: "#050505" }}
                >
                  {kelas.kategori_event.nama_kategori.toUpperCase()} -{" "}
                  {kelas.kelompok.nama_kelompok}
                </h3>

                <p
                  className="text-sm"
                  style={{ color: "#050505", opacity: 0.7 }}
                >
                  {kelas.jenis_kelamin === "LAKI_LAKI" ? "Putra" : "Putri"}
                  {kelas.kelas_berat && ` - ${kelas.kelas_berat.nama_kelas}`}
                  {kelas.poomsae && ` - ${kelas.poomsae.nama_kelas}`}
                </p>

                {/* Category Badge - PEMULA & PRESTASI SAMA-SAMA MERAH */}
                <div className="mt-3">
                  <span
                    className="inline-flex items-center text-xs px-3 py-1.5 rounded-full font-bold shadow-sm"
                    style={{
                      background:
                        "linear-gradient(135deg, #990D35 0%, #7A0A2B 100%)",
                      color: "white",
                    }}
                  >
                    {isPemula(kelas) ? "🥋 PEMULA" : "🏆 PRESTASI"}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                      style={{ backgroundColor: "rgba(153, 13, 53, 0.1)" }}
                    >
                      <Users size={18} style={{ color: "#990D35" }} />
                    </div>
                    <div>
                      <p
                        className="text-xs"
                        style={{ color: "#050505", opacity: 0.5 }}
                      >
                        Total Peserta
                      </p>
                      <p
                        className="text-lg font-bold"
                        style={{ color: "#050505" }}
                      >
                        {kelas.peserta_count}
                      </p>
                    </div>
                  </div>
                  {kelas.peserta_count >= 4 && (
                    <span
                      className="text-xs px-3 py-1.5 rounded-full font-bold shadow-sm"
                      style={{
                        background:
                          "linear-gradient(135deg, #22c55e 0%, #10b981 100%)",
                        color: "white",
                      }}
                    >
                      ✓ Siap
                    </span>
                  )}
                </div>

                {/* Progress Tournament - KUNING ke HIJAU */}
                {kelas.bracket_status !== "not_created" && (
                  <div
                    className="p-4 rounded-xl"
                    style={{ backgroundColor: "rgba(153, 13, 53, 0.04)" }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className="text-sm font-bold"
                        style={{ color: "#050505" }}
                      >
                        Progress Tournament
                      </span>
                      <span
                        className="text-xs font-medium"
                        style={{ color: "#050505", opacity: 0.6 }}
                      >
                        {Math.ceil(Math.log2(kelas.peserta_count))} Babak
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-2.5 rounded-full transition-all duration-500"
                        style={{
                          background:
                            kelas.bracket_status === "completed"
                              ? "linear-gradient(90deg, #22c55e 0%, #10b981 100%)"
                              : "linear-gradient(90deg, #F5B700 0%, #F59E0B 100%)",
                          width:
                            kelas.bracket_status === "completed"
                              ? "100%"
                              : "45%",
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Warning minimal peserta */}
                {kelas.peserta_count < 4 && (
                  <div
                    className="p-3 rounded-xl flex items-center gap-2"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(245, 183, 0, 0.08) 0%, rgba(245, 183, 0, 0.04) 100%)",
                      border: "1px solid rgba(245, 183, 0, 0.2)",
                    }}
                  >
                    <AlertTriangle size={16} style={{ color: "#F5B700" }} />
                    <span
                      className="text-xs font-medium"
                      style={{ color: "#F5B700" }}
                    >
                      Minimal 4 peserta untuk tournament
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-5 pt-0">
                <button
                  onClick={() => {
                    setSelectedKelas(kelas);
                    setShowBracket(true);
                  }}
                  disabled={kelas.peserta_count < 4}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                  style={{
                    background:
                      kelas.bracket_status === "not_created"
                        ? "linear-gradient(135deg, #F5B700 0%, #D19B00 100%)"
                        : "linear-gradient(135deg, #990D35 0%, #7A0A2B 100%)",
                    color: "white",
                  }}
                >
                  {kelas.bracket_status === "not_created" ? (
                    <>
                      <GitBranch size={18} />
                      <span>Buat Bracket</span>
                    </>
                  ) : (
                    <>
                      <Eye size={18} />
                      <span>Lihat Bracket</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredKelas.length === 0 && (
          <div
            className="text-center py-16"
            style={{ color: "#050505", opacity: 0.4 }}
          >
            <GitBranch size={64} className="mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              Tidak ada kelas kejuaraan ditemukan
            </h3>
            <p className="text-base">
              {kelasKejuaraan.length === 0
                ? "Belum ada peserta yang disetujui"
                : "Coba ubah filter pencarian"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DrawingBagan;
