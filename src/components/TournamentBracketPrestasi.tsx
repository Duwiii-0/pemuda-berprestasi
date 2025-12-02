import React, { useState, useEffect } from "react";
import {
  Trophy,
  Edit3,
  ArrowLeft,
  AlertTriangle,
  RefreshCw,
  Download,
  Shuffle,
  CheckCircle,
  Users,
  FilePenLine,
  Calendar,
} from "lucide-react";
import { exportBracketFromData } from "../utils/exportBracketPDF";
import { useAuth } from "../context/authContext";
import sriwijaya from "../assets/logo/sriwijaya.png";
import taekwondo from "../assets/logo/taekwondo.png";
import * as XLSX from "xlsx";

interface Atlet {
  id_atlet: number;
  nama_atlet: string;
  jenis_kelamin?: "LAKI_LAKI" | "PEREMPUAN";
  tanggal_lahir?: string;
  berat_badan?: number;
  tinggi_badan?: number;
  belt?: string;
  sabuk?: {
    nama_sabuk: string;
  };
  dojang: {
    nama_dojang: string;
    id_dojang?: number;
  };
}

interface AnggotaTim {
  atlet: Atlet;
}

interface Peserta {
  id_peserta_kompetisi: number;
  id_atlet?: number;
  is_team: boolean;
  status: "PENDING" | "APPROVED" | "REJECTED";
  atlet?: Atlet;
  anggota_tim?: AnggotaTim[];
}

interface Match {
  id_match: number;
  ronde: number;
  id_peserta_a?: number;
  id_peserta_b?: number;
  skor_a: number;
  skor_b: number;
  peserta_a?: Peserta;
  peserta_b?: Peserta;
  venue?: {
    nama_venue: string;
  };
  tanggal_pertandingan?: string;
  nomor_partai?: string;
  nomor_antrian?: number;
  nomor_lapangan?: string;
  positionY?: number;
  verticalCenter?: number;
  stageName?: string;
  kelasKejuaraanId?: number;
}

interface KelasKejuaraan {
  id_kelas_kejuaraan: number;
  cabang: "KYORUGI" | "POOMSAE";
  jenis_kelamin?: "LAKI_LAKI" | "PEREMPUAN"; // ✅ ADDED THIS
  kategori_event: {
    nama_kategori: string;
  };
  kelompok?: {
    nama_kelompok: string;
    usia_min: number;
    usia_max: number;
  };
  kelas_berat?: {
    nama_kelas: string;
    batas_min: number;
    batas_max: number;
    jenis_kelamin: "LAKI_LAKI" | "PEREMPUAN";
  };
  poomsae?: {
    nama_kelas: string;
    jenis_kelamin: "LAKI_LAKI" | "PEREMPUAN";
  };
  kompetisi: {
    id_kompetisi: number;
    nama_event: string;
    tanggal_mulai: string;
    tanggal_selesai: string;
    lokasi: string;
    status: "PENDAFTARAN" | "SEDANG_DIMULAI" | "SELESAI";
  };
  peserta_kompetisi: Peserta[];
  bagan: {
    id_bagan: number;
    match: Match[];
    drawing_seed: {
      peserta_kompetisi: Peserta;
      seed_num: number;
    }[];
  }[];
}

interface TournamentBracketPrestasiProps {
  kelasData: KelasKejuaraan;
  onBack?: () => void;
  apiBaseUrl?: string;
  viewOnly?: boolean; // ⭐ TAMBAHKAN
}

interface DojangSeparationConfig {
  enabled: boolean;
  mode: "STRICT" | "BALANCED"; // STRICT = final only, BALANCED = as late as possible
}

const TournamentBracketPrestasi: React.FC<TournamentBracketPrestasiProps> = ({
  kelasData,
  onBack,
  apiBaseUrl = "/api",
  viewOnly = false, // ⭐ TAMBAHKAN
}) => {
  const { token } = useAuth();
  const [viewMode, setViewMode] = useState<"bracket" | "list">("bracket");

  const gender = kelasData.jenis_kelamin;

  const displayGender =
    gender === "LAKI_LAKI" ? "Male" : gender === "PEREMPUAN" ? "Female" : "";
  const [matches, setMatches] = useState<Match[]>([]);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [editAthleteModal, setEditAthleteModal] = useState<{
    show: boolean;
    match: Match | null;
    slot: "A" | "B" | null;
  }>({
    show: false,
    match: null,
    slot: null,
  });
  const [loading, setLoading] = useState(false);
  const [bracketGenerated, setBracketGenerated] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [showParticipantPreview, setShowParticipantPreview] = useState(false);
  const bracketRef = React.useRef<HTMLDivElement>(null);
  const [showDojangModal, setShowDojangModal] = useState(false);
  const [clearingScheduling, setClearingScheduling] = useState(false);
  const [tanggalPertandingan, setTanggalPertandingan] = useState<string | null>(
    null
  );

  useEffect(() => {
    const fetchTanggalPertandingan = async () => {
      if (kelasData?.kompetisi?.id_kompetisi && kelasData?.id_kelas_kejuaraan) {
        try {
          const response = await fetch(
            `${apiBaseUrl}/kompetisi/${kelasData.kompetisi.id_kompetisi}/brackets/${kelasData.id_kelas_kejuaraan}/tanggal`,
            {
              headers: {
                ...(token && { Authorization: `Bearer ${token}` }),
              },
            }
          );
          if (response.ok) {
            const result = await response.json();
            if (result.data && result.data.tanggal) {
              setTanggalPertandingan(
                new Date(result.data.tanggal).toISOString().split("T")[0]
              );
            }
          } else {
            console.log(
              "Tanggal pertandingan khusus kelas tidak ditemukan, menggunakan tanggal mulai kompetisi."
            );
          }
        } catch (error) {
          console.error("Error fetching tanggal pertandingan:", error);
        }
      }
    };

    fetchTanggalPertandingan();
  }, [kelasData, apiBaseUrl, token]);

  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    type: "success" | "error" | "warning" | "info";
    title: string;
    message: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
  }>({
    type: "info",
    title: "",
    message: "",
  });

  const CARD_WIDTH = 450;
  const CARD_HEIGHT = 240;
  const ROUND_GAP = 200;
  const BASE_VERTICAL_GAP = 150;
  const CENTER_GAP = 700; // Perbesar dari 350 ke 500 - lebih banyak gap antara semi-final dan final

  const showNotification = (
    type: "success" | "error" | "warning" | "info",
    title: string,
    message: string,
    onConfirm?: () => void
  ) => {
    setModalConfig({
      type,
      title,
      message,
      onConfirm,
      confirmText: "OK",
    });
    setShowModal(true);
  };

  const showConfirmation = (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ) => {
    setModalConfig({
      type: "warning",
      title,
      message,
      onConfirm,
      onCancel,
      confirmText: "Ya, Lanjutkan",
      cancelText: "Batal",
    });
    setShowModal(true);
  };

  const [dojangSeparation, setDojangSeparation] =
    useState<DojangSeparationConfig>({
      enabled: false,
      mode: "BALANCED",
    });

  const clearScheduling = async () => {
    if (!kelasData) return;

    const kompetisiId = kelasData.kompetisi.id_kompetisi;
    const kelasKejuaraanId = kelasData.id_kelas_kejuaraan;

    showConfirmation(
      "Hapus Semua Nomor Partai?",
      "⚠️ Ini akan menghapus:\n\n• Nomor Antrian\n• Nomor Lapangan\n• Nomor Partai\n• Tanggal Pertandingan\n\n✅ Bracket dan skor TIDAK akan terpengaruh.\n\nAksi ini tidak dapat dibatalkan.",
      async () => {
        setClearingScheduling(true);
        try {
          const response = await fetch(
            `${apiBaseUrl}/kompetisi/${kompetisiId}/kelas/${kelasKejuaraanId}/scheduling`,
            {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
              },
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Gagal menghapus scheduling");
          }

          const result = await response.json();

          await fetchBracketData(kompetisiId, kelasKejuaraanId);

          showNotification(
            "success",
            "Berhasil!",
            result.message || "Semua scheduling berhasil dihapus",
            () => setShowModal(false)
          );
        } catch (error: any) {
          console.error("❌ Error clearing scheduling:", error);
          showNotification(
            "error",
            "Gagal Menghapus Scheduling",
            error.message || "Terjadi kesalahan saat menghapus scheduling.",
            () => setShowModal(false)
          );
        } finally {
          setClearingScheduling(false);
        }
      },
      () => setShowModal(false)
    );
  };

  const handleExportPDF = async () => {
    if (!kelasData || matches.length === 0) {
      showNotification(
        "warning",
        "Tidak Dapat Export",
        "Bracket belum dibuat atau tidak ada data untuk di-export.",
        () => setShowModal(false)
      );
      return;
    }

    setExportingPDF(true);

    try {
      const bracketElement = bracketRef.current;
      if (!bracketElement) {
        throw new Error("Bracket element not found");
      }

      // ✅ Ambil tanggal dari input manual
      const dateInput = document.getElementById(
        "tournament-date-display"
      ) as HTMLInputElement;
      const selectedDate = dateInput?.value
        ? new Date(dateInput.value).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : new Date(kelasData.kompetisi.tanggal_mulai).toLocaleDateString(
            "id-ID",
            {
              day: "numeric",
              month: "long",
              year: "numeric",
            }
          );

      // ✅ Siapkan metadata untuk PDF header
      const metadata = {
        logoPBTI: taekwondo,
        logoEvent: sriwijaya,
        namaKejuaraan: kelasData.kompetisi.nama_event,
        kelas: `${kelasData.kelompok?.nama_kelompok} ${displayGender} ${
          kelasData.kelas_berat?.nama_kelas || kelasData.poomsae?.nama_kelas
        }`,
        tanggalTanding: selectedDate, // ✅ Pakai tanggal dari input
        jumlahKompetitor: approvedParticipants.length,
        lokasi: kelasData.kompetisi.lokasi,
      };

      await exportBracketFromData(kelasData, bracketElement, metadata);

      showNotification(
        "success",
        "Berhasil!",
        "PDF bracket PRESTASI berhasil didownload!",
        () => setShowModal(false)
      );
    } catch (error: any) {
      console.error("❌ Error exporting PDF:", error);
      showNotification(
        "error",
        "Gagal Export PDF",
        error.message || "Terjadi kesalahan saat membuat PDF.",
        () => setShowModal(false)
      );
    } finally {
      setExportingPDF(false);
    }
  };

  const approvedParticipants = kelasData.peserta_kompetisi.filter(
    (p) => p.status === "APPROVED"
  );

  useEffect(() => {
    if (kelasData?.kompetisi?.id_kompetisi) {
      const kompetisiId = kelasData.kompetisi.id_kompetisi;
      const kelasKejuaraanId = kelasData.id_kelas_kejuaraan;

      console.log(
        `🔄 Loading PRESTASI bracket for kelas ${kelasKejuaraanId}...`
      );
      fetchBracketData(kompetisiId, kelasKejuaraanId);
    }
  }, [kelasData?.id_kelas_kejuaraan]);

  const fetchBracketData = async (
    kompetisiId: number,
    kelasKejuaraanId: number
  ) => {
    try {
      setLoading(true);

      const response = await fetch(
        `${apiBaseUrl}/kompetisi/${kompetisiId}/brackets/${kelasKejuaraanId}`,
        {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          console.log("ℹ️ Bracket not yet generated for this class");
          setBracketGenerated(false);
          setMatches([]);
          return;
        }
        throw new Error("Failed to fetch bracket data");
      }

      const result = await response.json();
      console.log("📊 PRESTASI Bracket data fetched:", result);

      if (result.data && result.data.matches) {
        const transformedMatches: Match[] = result.data.matches.map(
          (m: any) => ({
            id_match: m.id,
            ronde: m.round,
            id_peserta_a: m.participant1?.id,
            id_peserta_b: m.participant2?.id,
            skor_a: m.scoreA || 0,
            skor_b: m.scoreB || 0,
            peserta_a: m.participant1
              ? transformParticipantFromAPI(m.participant1)
              : undefined,
            peserta_b: m.participant2
              ? transformParticipantFromAPI(m.participant2)
              : undefined,
            venue: m.venue ? { nama_venue: m.venue } : undefined,
            tanggal_pertandingan: m.tanggalPertandingan,
            nomor_partai: m.nomorPartai,
            nomor_antrian: m.nomorAntrian,
            nomor_lapangan: m.nomorLapangan,
            // ⭐ TAMBAHKAN INI - Map stageName dari API
            stageName: m.stageName,
          })
        );

        setMatches(transformedMatches);
        setBracketGenerated(true);
        console.log(`✅ Loaded ${transformedMatches.length} PRESTASI matches`);

        // ⭐ Debug: Log stage names untuk verifikasi
        console.log("📊 Stage names per round:");
        const roundsMap = new Map<number, string>();
        transformedMatches.forEach((m) => {
          if (!roundsMap.has(m.ronde)) {
            roundsMap.set(m.ronde, (m as any).stageName || "NO_STAGE");
          }
        });
        roundsMap.forEach((stage, round) => {
          console.log(`   Round ${round}: ${stage}`);
        });
      }
    } catch (error: any) {
      console.error("❌ Error fetching PRESTASI bracket:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderListView = () => {
    // Sort matches by nomor_partai (as numbers) if nomor_partai exists
    const sortedMatches = [...matches]
      .filter((match) => match.nomor_partai) // Only include matches that have a nomor_partai
      .sort((a, b) => {
        const numA = parseInt(a.nomor_partai!, 10);
        const numB = parseInt(b.nomor_partai!, 10);
        return numA - numB;
      });

    if (sortedMatches.length === 0) {
      return (
        <div className="text-center py-20 px-6">
          <AlertTriangle size={48} className="mx-auto text-yellow-500" />
          <p className="mt-4 text-lg font-semibold text-gray-700">
            Belum Ada Jadwal Pertandingan
          </p>
          <p className="text-gray-500 mt-2">
            Nomor partai untuk kelas ini belum dibuat. Silakan generate
            scheduling terlebih dahulu.
          </p>
        </div>
      );
    }

    return (
      <div className="p-4 sm:p-6">
        <div className="bg-white rounded-lg shadow-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider"
                >
                  Partai
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-bold text-blue-600 uppercase tracking-wider"
                >
                  Atlet Sudut Biru
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-bold text-red-600 uppercase tracking-wider"
                >
                  Atlet Sudut Merah
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider"
                >
                  Skor
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider"
                >
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedMatches.map((match) => (
                <tr key={match.id_match} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-lg font-extrabold text-red-700">
                      {match.nomor_partai || "-"}
                    </div>
                    <div className="text-xs text-gray-500 font-semibold">
                      {match.nomor_lapangan
                        ? `Lap. ${match.nomor_lapangan}`
                        : ""}
                    </div>
                  </td>
                  <td className="px-6 py-4 bg-blue-50 border border-blue-200">
                    <div className="text-sm font-semibold text-blue-600">
                      {getParticipantName(match.peserta_a) || "TBD"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {getDojoName(match.peserta_a)}
                    </div>
                  </td>
                  <td className="px-6 py-4 bg-red-50 border border-red-200">
                    <div className="text-sm font-semibold text-red-600">
                      {getParticipantName(match.peserta_b) || "TBD"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {getDojoName(match.peserta_b)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm font-semibold text-blue-600">
                      {match.skor_a}
                    </span>{" "}
                    -{" "}
                    <span className="text-sm font-semibold text-red-600">
                      {match.skor_b}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => setEditingMatch(match)}
                      className="px-4 py-2 text-sm font-semibold rounded-md text-white transition-colors hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: "#990D35" }}
                      disabled={viewOnly}
                    >
                      Input Skor
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const transformParticipantFromAPI = (participant: any): Peserta => {
    if (participant.isTeam) {
      return {
        id_peserta_kompetisi: participant.id,
        is_team: true,
        status: "APPROVED",
        anggota_tim:
          participant.teamMembers?.map((name: string) => ({
            atlet: { nama_atlet: name },
          })) || [],
      };
    } else {
      return {
        id_peserta_kompetisi: participant.id,
        id_atlet: participant.atletId,
        is_team: false,
        status: "APPROVED",
        atlet: {
          id_atlet: participant.atletId || 0,
          nama_atlet: participant.name,
          dojang: {
            nama_dojang: participant.dojang || "",
          },
        },
      };
    }
  };

  const openParticipantPreview = () => {
    setShowParticipantPreview(true);
  };

  const generateBracket = async () => {
    if (!kelasData) return;

    console.log("🏆 PRESTASI: Auto-generating bracket");
    console.log("🏠 Dojang Separation:", dojangSeparation);

    setLoading(true);
    setShowParticipantPreview(false);

    try {
      const kompetisiId = kelasData.kompetisi.id_kompetisi;
      const kelasKejuaraanId = kelasData.id_kelas_kejuaraan;

      const endpoint = `${apiBaseUrl}/kompetisi/${kompetisiId}/brackets/generate`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          kelasKejuaraanId: kelasKejuaraanId,
          byeParticipantIds: [],
          // ⭐ TAMBAHKAN CONFIG DOJANG
          dojangSeparation: dojangSeparation.enabled
            ? {
                enabled: true,
                mode: dojangSeparation.mode,
              }
            : undefined,
        }),
      });

      // ✅ Handle "bracket already exists" error
      if (!response.ok) {
        const errorData = await response.json();

        // ✅ Jika bracket sudah ada, langsung fetch saja
        if (
          errorData.message?.includes("sudah dibuat") ||
          errorData.message?.includes("already exists")
        ) {
          console.log(
            "ℹ️ Bracket already exists, fetching existing bracket..."
          );
          await fetchBracketData(kompetisiId, kelasKejuaraanId);

          showNotification(
            "info",
            "Bracket Sudah Ada",
            "Bracket untuk kelas ini sudah pernah dibuat sebelumnya.",
            () => setShowModal(false)
          );
          return;
        }

        // Error lainnya
        throw new Error(errorData.message || "Failed to generate bracket");
      }

      const result = await response.json();
      console.log("✅ PRESTASI Bracket generated:", result);

      await fetchBracketData(kompetisiId, kelasKejuaraanId);

      showNotification(
        "success",
        "Berhasil!",
        "Bracket berhasil dibuat secara otomatis!",
        () => setShowModal(false)
      );
    } catch (error: any) {
      console.error("❌ Error generating PRESTASI bracket:", error);
      showNotification(
        "error",
        "Gagal Membuat Bracket",
        error.message || "Terjadi kesalahan saat membuat bracket.",
        () => setShowModal(false)
      );
    } finally {
      setLoading(false);
    }
  };

  const shuffleBracket = async () => {
    if (!kelasData) return;

    console.log("🔀 Shuffling PRESTASI bracket...");
    console.log("🏠 Dojang Separation:", dojangSeparation);

    setLoading(true);

    try {
      const kompetisiId = kelasData.kompetisi.id_kompetisi;
      const kelasKejuaraanId = kelasData.id_kelas_kejuaraan;

      const endpoint = `${apiBaseUrl}/kompetisi/${kompetisiId}/brackets/shuffle`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          kelasKejuaraanId: kelasKejuaraanId,
          isPemula: false,
          // ⭐ TAMBAHKAN CONFIG DOJANG
          dojangSeparation: dojangSeparation.enabled
            ? {
                enabled: true,
                mode: dojangSeparation.mode,
              }
            : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (errorData.message?.includes("Bagan sudah dibuat")) {
          const deleteResponse = await fetch(
            `${apiBaseUrl}/kompetisi/${kompetisiId}/brackets/${kelasKejuaraanId}`,
            {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
              },
            }
          );

          if (!deleteResponse.ok) {
            throw new Error("Failed to delete existing bracket");
          }

          const retryResponse = await fetch(
            `${apiBaseUrl}/kompetisi/${kompetisiId}/brackets/generate`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
              },
              body: JSON.stringify({
                kelasKejuaraanId: kelasKejuaraanId,
              }),
            }
          );

          if (!retryResponse.ok) {
            throw new Error("Failed to regenerate bracket");
          }
        } else {
          throw new Error(errorData.message || "Failed to shuffle bracket");
        }
      }

      await fetchBracketData(kompetisiId, kelasKejuaraanId);

      showNotification(
        "success",
        "Berhasil!",
        "Bracket berhasil diacak ulang dengan BYE baru!",
        () => setShowModal(false)
      );
    } catch (error: any) {
      console.error("❌ Error shuffling PRESTASI bracket:", error);
      showNotification(
        "error",
        "Gagal Shuffle",
        error.message || "Terjadi kesalahan saat shuffle bracket.",
        () => setShowModal(false)
      );
    } finally {
      setLoading(false);
    }
  };

  const clearBracketResults = async () => {
    if (!kelasData) return;

    const kompetisiId = kelasData.kompetisi.id_kompetisi;
    const kelasKejuaraanId = kelasData.id_kelas_kejuaraan;

    showConfirmation(
      "Hapus Semua Hasil Pertandingan?",
      "Semua skor akan direset ke 0. Struktur bracket tetap sama. Aksi ini tidak dapat dibatalkan.",
      async () => {
        setClearing(true);
        try {
          const response = await fetch(
            `${apiBaseUrl}/kompetisi/${kompetisiId}/brackets/${kelasKejuaraanId}/clear-results`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
              },
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to clear results");
          }

          await fetchBracketData(kompetisiId, kelasKejuaraanId);

          showNotification(
            "success",
            "Berhasil!",
            "Semua hasil pertandingan berhasil direset",
            () => setShowModal(false)
          );
        } catch (error: any) {
          console.error("❌ Error clearing results:", error);
          showNotification(
            "error",
            "Gagal Mereset Hasil",
            error.message || "Terjadi kesalahan saat mereset hasil.",
            () => setShowModal(false)
          );
        } finally {
          setClearing(false);
        }
      },
      () => setShowModal(false)
    );
  };

  const deleteBracketPermanent = async () => {
    if (!kelasData) return;

    const kompetisiId = kelasData.kompetisi.id_kompetisi;
    const kelasKejuaraanId = kelasData.id_kelas_kejuaraan;
    const isSelesai = kelasData.kompetisi.status === "SELESAI";

    const confirmationSteps = async () => {
      showConfirmation(
        "Hapus Bracket Turnamen?",
        "Bracket akan dihapus PERMANENT termasuk semua pertandingan dan hasil. Anda harus generate ulang dari awal. Aksi ini tidak dapat dibatalkan.",
        async () => {
          if (isSelesai) {
            showConfirmation(
              "⚠️ Kompetisi Sudah Selesai!",
              "Kompetisi ini sudah berstatus SELESAI. Apakah Anda YAKIN ingin menghapus bracket? Data hasil tidak dapat dikembalikan.",
              async () => {
                await executeDeletion();
              },
              () => setShowModal(false)
            );
          } else {
            await executeDeletion();
          }
        },
        () => setShowModal(false)
      );
    };

    const executeDeletion = async () => {
      setDeleting(true);
      try {
        const response = await fetch(
          `${apiBaseUrl}/kompetisi/${kompetisiId}/brackets/${kelasKejuaraanId}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to delete bracket");
        }

        setMatches([]);
        setBracketGenerated(false);

        showNotification(
          "success",
          "Berhasil!",
          "Bracket berhasil dihapus. Anda dapat generate bracket baru.",
          () => setShowModal(false)
        );
      } catch (error: any) {
        console.error("❌ Error deleting bracket:", error);
        showNotification(
          "error",
          "Gagal Menghapus Bracket",
          error.message || "Terjadi kesalahan saat menghapus bracket.",
          () => setShowModal(false)
        );
      } finally {
        setDeleting(false);
      }
    };

    confirmationSteps();
  };

  const updateMatchResult = async (
    matchId: number,
    scoreA: number,
    scoreB: number
  ) => {
    if (!kelasData) return;

    try {
      const kompetisiId = kelasData.kompetisi.id_kompetisi;

      const match = matches.find((m) => m.id_match === matchId);
      if (!match) {
        throw new Error("Match not found");
      }

      const tanggalInput =
        (document.getElementById("tanggalPertandingan") as HTMLInputElement)
          ?.value || null;
      const nomorAntrianInput =
        (document.getElementById("nomorAntrian") as HTMLInputElement)?.value ||
        null;
      const nomorLapanganInput =
        (document.getElementById("nomorLapangan") as HTMLInputElement)?.value ||
        null;

      // ⭐ VALIDASI: Harus diisi bersamaan
      if (
        (nomorAntrianInput && !nomorLapanganInput) ||
        (!nomorAntrianInput && nomorLapanganInput)
      ) {
        showNotification(
          "warning",
          "Input Tidak Lengkap",
          "Nomor antrian dan nomor lapangan harus diisi bersamaan",
          () => setShowModal(false)
        );
        return;
      }

      // ⭐ CEK: Apakah ada perubahan skor?
      const hasScoreChange = scoreA > 0 || scoreB > 0;

      // ⭐ HANYA TENTUKAN WINNER JIKA ADA SKOR
      let winnerId = null;
      if (hasScoreChange) {
        winnerId = scoreA > scoreB ? match.id_peserta_a : match.id_peserta_b;

        if (!winnerId) {
          throw new Error("Cannot determine winner - no valid participant");
        }
      }

      // ⭐ PAYLOAD FLEKSIBEL
      const payload: any = {
        tanggalPertandingan: tanggalInput,
        nomorAntrian: nomorAntrianInput ? parseInt(nomorAntrianInput) : null,
        nomorLapangan: nomorLapanganInput
          ? nomorLapanganInput.toUpperCase()
          : null,
      };

      // ⭐ HANYA KIRIM SKOR & WINNER JIKA ADA
      if (hasScoreChange) {
        payload.scoreA = scoreA;
        payload.scoreB = scoreB;
        payload.winnerId = winnerId;
      }

      const response = await fetch(
        `${apiBaseUrl}/kompetisi/${kompetisiId}/brackets/match/${matchId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update match result");
      }

      await fetchBracketData(kompetisiId, kelasData.id_kelas_kejuaraan);

      setEditingMatch(null);
      showNotification(
        "success",
        "Berhasil!",
        hasScoreChange
          ? "Hasil pertandingan berhasil diperbarui!"
          : "Informasi pertandingan berhasil disimpan!",
        () => setShowModal(false)
      );
    } catch (error: any) {
      console.error("❌ Error updating match:", error);
      showNotification(
        "error",
        "Gagal Memperbarui",
        error.message || "Gagal memperbarui pertandingan.",
        () => setShowModal(false)
      );
    }
  };

  const exportPesertaToExcel = () => {
    // ✅ PERBAIKAN KRUSIAL: Gunakan data ASLI dari kelasData, BUKAN dari state matches!
    if (!kelasData?.peserta_kompetisi?.length) {
      showNotification(
        "warning",
        "Export Peserta",
        "Tidak ada data peserta untuk diexport",
        () => setShowModal(false)
      );
      return;
    }

    try {
      // ✅ Filter hanya APPROVED dari data ORIGINAL
      const approvedList = kelasData.peserta_kompetisi.filter(
        (p: any) => p.status === "APPROVED"
      );

      if (approvedList.length === 0) {
        showNotification(
          "warning",
          "Export Peserta",
          "Tidak ada peserta yang sudah di-approve",
          () => setShowModal(false)
        );
        return;
      }

      // ✅ Siapkan data header informasi kejuaraan
      const currentDate = new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      const headerInfo = [
        ["LAPORAN DATA PESERTA KOMPETISI - KATEGORI PRESTASI"],
        [
          "Nama Event",
          kelasData.kompetisi?.nama_event ||
            "Sriwijaya International Taekwondo Championship 2025",
        ],
        [
          "Kelas",
          `${kelasData.kelompok?.nama_kelompok} ${displayGender} ${
            kelasData.kelas_berat?.nama_kelas || kelasData.poomsae?.nama_kelas
          }`,
        ],
        ["Lokasi", kelasData.kompetisi?.lokasi || "GOR Ranau JSC Palembang"],
        ["Tanggal Export", currentDate],
        ["Total Peserta", approvedList.length.toString()],
        [], // Baris kosong
      ];

      const rows: any[] = [];

      // ✅ LOOP PAKAI DATA ORIGINAL - Ini yang penting!
      approvedList.forEach((peserta: any, index: number) => {
        const isTeam = peserta.is_team;

        // ✅ Handle nama peserta untuk tim dan individu
        const namaPeserta = isTeam
          ? peserta.anggota_tim?.map((m: any) => m.atlet.nama_atlet).join(", ")
          : peserta.atlet?.nama_atlet || "-";

        const cabang = kelasData.cabang || "-";
        const levelEvent = kelasData.kategori_event?.nama_kategori || "PEMULA";

        const kelasBerat =
          cabang === "KYORUGI" ? kelasData.kelas_berat?.nama_kelas || "-" : "-";

        const kelasPoomsae =
          cabang === "POOMSAE" ? kelasData.poomsae?.nama_kelas || "-" : "-";

        const kelasUsia = kelasData.kelompok?.nama_kelompok || "-";

        // ✅ PERBAIKAN: Jenis kelamin - langsung dari data peserta
        const jenisKelamin = !isTeam
          ? peserta.atlet?.jenis_kelamin === "LAKI_LAKI"
            ? "Laki-Laki"
            : peserta.atlet?.jenis_kelamin === "PEREMPUAN"
            ? "Perempuan"
            : "-"
          : "-";

        // ✅ PERBAIKAN: Dojang - langsung dari data peserta
        const dojang =
          isTeam && peserta.anggota_tim?.length
            ? peserta.anggota_tim[0]?.atlet?.dojang?.nama_dojang || "-"
            : peserta.atlet?.dojang?.nama_dojang || "-";

        // ✅ PERBAIKAN: Data detail - langsung dari data peserta
        const tanggalLahir = !isTeam
          ? peserta.atlet?.tanggal_lahir || "-"
          : "-";

        const beratBadan = !isTeam
          ? peserta.atlet?.berat_badan
            ? `${peserta.atlet.berat_badan} kg`
            : "-"
          : "-";

        const tingiBadan = !isTeam
          ? peserta.atlet?.tinggi_badan
            ? `${peserta.atlet.tinggi_badan} cm`
            : "-"
          : "-";

        // ✅ PERBAIKAN: Sabuk - langsung dari data peserta dengan fallback
        const sabuk = !isTeam
          ? peserta.atlet?.sabuk?.nama_sabuk || peserta.atlet?.belt || "-"
          : "-";

        // ✅ Detail anggota tim
        const anggotaTimDetail =
          isTeam && peserta.anggota_tim?.length
            ? peserta.anggota_tim
                .map(
                  (m: any, i: number) =>
                    `${i + 1}. ${m.atlet.nama_atlet} (${
                      m.atlet.dojang?.nama_dojang || "-"
                    })`
                )
                .join("; ")
            : "-";

        rows.push({
          No: index + 1,
          "Nama Peserta": namaPeserta,
          Tipe: isTeam ? "Tim" : "Individu",
          Kategori: cabang,
          Level: levelEvent,
          "Kelas Berat": kelasBerat,
          "Kelas Poomsae": kelasPoomsae,
          "Kelompok Usia": kelasUsia,
          "Jenis Kelamin": jenisKelamin,
          "Tanggal Lahir": tanggalLahir,
          "Berat Badan": beratBadan,
          "Tinggi Badan": tingiBadan,
          Sabuk: sabuk,
          Dojang: dojang,
          Status: peserta.status,
          "Anggota Tim": anggotaTimDetail,
        });
      });

      // ✅ Create workbook dengan header info
      const workbook = XLSX.utils.book_new();

      // ✅ Buat worksheet dengan header info dulu
      const worksheet = XLSX.utils.aoa_to_sheet(headerInfo);

      // ✅ Tambahkan data peserta ke worksheet yang sama
      XLSX.utils.sheet_add_json(worksheet, rows, {
        origin: `A${headerInfo.length + 1}`,
        skipHeader: false,
      });

      // ✅ Set column widths
      const columnWidths = [
        { wch: 5 }, // No
        { wch: 30 }, // Nama Peserta
        { wch: 10 }, // Tipe
        { wch: 12 }, // Kategori
        { wch: 10 }, // Level
        { wch: 15 }, // Kelas Berat
        { wch: 15 }, // Kelas Poomsae
        { wch: 18 }, // Kelompok Usia
        { wch: 15 }, // Jenis Kelamin
        { wch: 15 }, // Tanggal Lahir
        { wch: 12 }, // Berat Badan
        { wch: 12 }, // Tinggi Badan
        { wch: 15 }, // Sabuk
        { wch: 25 }, // Dojang
        { wch: 12 }, // Status
        { wch: 50 }, // Anggota Tim
      ];
      worksheet["!cols"] = columnWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, "Data Peserta");

      // ✅ Generate filename dengan timestamp
      const timestamp = new Date().toISOString().split("T")[0];
      const eventName =
        kelasData.kompetisi?.nama_event?.replace(/\s+/g, "_") || "Turnamen";
      const kelasName = `${kelasData.kelompok?.nama_kelompok}_${
        kelasData.kelas_berat?.nama_kelas || kelasData.poomsae?.nama_kelas
      }`.replace(/\s+/g, "_");
      const fileName = `Data_Peserta_PRESTASI_${eventName}_${kelasName}_${timestamp}.xlsx`;

      // ✅ Export file
      XLSX.writeFile(workbook, fileName);

      showNotification(
        "success",
        "Export Peserta",
        "Data peserta PRESTASI berhasil diexport ke spreadsheet",
        () => setShowModal(false)
      );
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      showNotification(
        "error",
        "Gagal Export",
        "Terjadi kesalahan saat mengekspor data",
        () => setShowModal(false)
      );
    }
  };

  const getParticipantName = (peserta?: Peserta) => {
    if (!peserta) return "";
    if (peserta.is_team) {
      return (
        peserta.anggota_tim
          ?.map((t) => t.atlet.nama_atlet.toUpperCase())
          .join(", ") || "Team"
      );
    }
    return peserta.atlet?.nama_atlet.toUpperCase() || "";
  };

  const getDojoName = (peserta?: Peserta) => {
    if (!peserta) return "";
    return peserta.atlet?.dojang.nama_dojang || "";
  };

  const getTotalRounds = (): number => {
    if (matches.length > 0) {
      return Math.max(...matches.map((m) => m.ronde));
    }

    // ✅ PERBAIKAN: Handle 2-3 participants
    if (approvedParticipants.length < 2) return 0;
    if (approvedParticipants.length === 2) return 1; // Langsung final
    if (approvedParticipants.length === 3) return 2; // 1 match + final
    if (approvedParticipants.length === 4) return 2; // Semi + final

    let rounds = 2;

    if (approvedParticipants.length >= 8) {
      rounds++;

      if (approvedParticipants.length > 8) {
        rounds++;
      }
    } else if (approvedParticipants.length > 4) {
      rounds++;
    }

    return rounds;
  };

  const getRoundName = (round: number, totalRounds: number): string => {
    const roundMatches = getMatchesByRound(round);

    // ⭐ PRIORITAS 1: Gunakan stageName dari backend jika ada
    if (roundMatches.length > 0) {
      const matchWithStageName = roundMatches.find((m) => m.stageName);

      if (matchWithStageName && matchWithStageName.stageName) {
        const stageName = matchWithStageName.stageName;

        switch (stageName) {
          case "ROUND_OF_64":
            return "Round of 64";
          case "ROUND_OF_32":
            return "Round of 32";
          case "ROUND_OF_16":
            return "Round of 16";
          case "QUARTER_FINAL":
            return "Quarter Final";
          case "SEMI_FINAL":
            return "Semi Final";
          case "FINAL":
            return "Final";
          default:
            return stageName
              .replace(/_/g, " ")
              .replace(/\b\w/g, (l: string) => l.toUpperCase());
        }
      }
    }

    // ⭐⭐⭐ PRIORITAS 2: HARDCODE untuk 3 peserta ⭐⭐⭐
    if (approvedParticipants.length === 3) {
      if (round === 1) return "Semi Final";
      if (round === 2) return "Final";
    }

    // ⭐ PRIORITAS 3: Fallback - Hitung berdasarkan match count
    const matchCount = roundMatches.length;

    switch (matchCount) {
      case 32:
        return "Round of 64";
      case 16:
        return "Round of 32";
      case 8:
        return "Round of 16";
      case 4:
        return "Quarter Final";
      case 2:
        return "Semi Final";
      case 1:
        return "Final";
      default:
        if (matchCount > 32) return "Round of 64";
        if (matchCount > 16) return "Round of 32";
        if (matchCount > 8) return "Round of 16";
        if (matchCount > 4) return "Quarter Final";
        if (matchCount > 2) return "Semi Final";
        return "Final";
    }
  };

  const getMatchesByRound = (round: number) => {
    return matches.filter((match) => match.ronde === round);
  };

  // ...existing code...

  const generatePrestasiLeaderboard = () => {
    if (matches.length === 0) return null;

    const leaderboard: {
      first: { name: string; dojo: string; id: number } | null;
      second: { name: string; dojo: string; id: number }[];
      third: { name: string; dojo: string; id: number }[];
    } = {
      first: null,
      second: [],
      third: [],
    };

    const totalRounds = getTotalRounds();
    const processedSilver = new Set<number>();
    const processedBronze = new Set<number>();

    // ═══════════════════════════════════════════════════════════════
    // FINAL: Winner = GOLD, Loser = SILVER
    // ═══════════════════════════════════════════════════════════════
    const finalMatch = matches.find((m) => m.ronde === totalRounds);

    if (finalMatch && (finalMatch.skor_a > 0 || finalMatch.skor_b > 0)) {
      const winner =
        finalMatch.skor_a > finalMatch.skor_b
          ? finalMatch.peserta_a
          : finalMatch.peserta_b;

      const loser =
        finalMatch.skor_a > finalMatch.skor_b
          ? finalMatch.peserta_b
          : finalMatch.peserta_a;

      // Winner Final → GOLD
      if (winner) {
        leaderboard.first = {
          name: getParticipantName(winner),
          dojo: getDojoName(winner),
          id: winner.id_peserta_kompetisi,
        };
      }

      // Loser Final → SILVER
      if (loser) {
        leaderboard.second.push({
          name: getParticipantName(loser),
          dojo: getDojoName(loser),
          id: loser.id_peserta_kompetisi,
        });
        processedSilver.add(loser.id_peserta_kompetisi);
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // ⭐ PERBAIKAN: SEMI-FINAL - Loser = BRONZE (bukan SILVER!)
    // ═══════════════════════════════════════════════════════════════
    const semiRound = totalRounds - 1;
    const semiMatches = matches.filter((m) => m.ronde === semiRound);

    semiMatches.forEach((match) => {
      if (match.skor_a > 0 || match.skor_b > 0) {
        const loser =
          match.skor_a > match.skor_b ? match.peserta_b : match.peserta_a;

        // ⭐ FIX: Semua loser semi-final langsung dapat BRONZE
        if (loser && !processedBronze.has(loser.id_peserta_kompetisi)) {
          leaderboard.third.push({
            name: getParticipantName(loser),
            dojo: getDojoName(loser),
            id: loser.id_peserta_kompetisi,
          });
          processedBronze.add(loser.id_peserta_kompetisi);
        }
      }
    });

    return leaderboard;
  };

  const renderMatchCard = (
    match: Match,
    key: string | number,
    matchIndex: number
  ) => {
    const hasScores = match.skor_a > 0 || match.skor_b > 0;
    const winner = hasScores
      ? match.skor_a > match.skor_b
        ? match.peserta_a
        : match.peserta_b
      : null;

    const cardStyle: React.CSSProperties = {
      width: `${CARD_WIDTH}px`,
      height: `${CARD_HEIGHT}px`,
      position: "relative",
      zIndex: 10,
      margin: 0,
      border: "2px solid #990D35",
      borderRadius: "12px",
      backgroundColor: "#F5FBEF",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      padding: "10px",
    };

    return (
      <div className="match-card" style={cardStyle}>
        {/* Participant A - TOP (Biru) */}
        <div
          style={{
            height: "70px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
            zIndex: 2,
            marginBottom: "18px", // Adjusted margin-bottom as requested
            paddingTop: "10px", // Added top padding for spacing from card top
          }}
        >
          {match.peserta_a ? (
            <>
              <p
                className="font-bold leading-tight text-center truncate w-full"
                style={{ color: "#3B82F6", fontSize: "30px" }}
              >
                {getParticipantName(match.peserta_a)}
              </p>
              <p
                className="text-center truncate w-full"
                style={{
                  color: "#666",
                  opacity: 0.7,
                  marginTop: "2px",
                  fontSize: "22px",
                }}
              >
                {getDojoName(match.peserta_a)}
              </p>
            </>
          ) : (
            <span
              className="text-gray-400 text-center"
              style={{ fontSize: "16px" }}
            >
              TBD
            </span>
          )}
        </div>

        {/* Center Line Section - Horizontal Line dengan Badge */}
        <div
          style={{
            height: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            zIndex: 2,
          }}
        >
          {/* Horizontal Main Line - Background */}
          <div
            style={{
              position: "absolute",
              height: "6px",
              backgroundColor: "#990D35",
              zIndex: 0,
              left: "-10px", // Make the line touch the card's left border
              right: "-10px", // Make the line touch the card's right border
            }}
          />

          {/* Match Number Badge - Center */}
          <div
            style={{
              position: "relative",
              zIndex: 1,
              backgroundColor: "#F5FBEF",
              padding: "4px 12px",
              borderRadius: "4px",
            }}
          >
            {match.nomor_partai ? (
              <span
                className="font-bold"
                style={{
                  color: "#000000",
                  fontSize: "32px",
                  whiteSpace: "nowrap",
                }}
              >
                {match.nomor_partai}
              </span>
            ) : match.ronde === 1 &&
              ((match.peserta_a && !match.peserta_b) ||
                (!match.peserta_a && match.peserta_b)) ? (
              <span
                className="font-bold"
                style={{ color: "#F5B700", fontSize: "32px" }}
              >
                BYE
              </span>
            ) : null}
          </div>
        </div>

        {/* Participant B - BOTTOM (Merah) */}
        <div
          style={{
            height: "70px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            position: "relative",
            zIndex: 2,
            marginTop: "10px", // Added padding between blue athlete and center line
          }}
        >
          {match.peserta_b ? (
            <>
              <p
                className="font-bold leading-tight text-center truncate w-full"
                style={{ color: "#DC143C", fontSize: "30px" }}
              >
                {getParticipantName(match.peserta_b)}
              </p>
              <p
                className="text-center truncate w-full"
                style={{
                  color: "#666",
                  opacity: 0.7,
                  marginTop: "2px",
                  fontSize: "22px",
                }}
              >
                {getDojoName(match.peserta_b)}
              </p>
            </>
          ) : (
            <span
              className="text-gray-400 text-center"
              style={{ fontSize: "16px" }}
            >
              TBD
            </span>
          )}
        </div>

        {/* Action Buttons - BOTTOM (Hidden) */}
        <div
          style={{
            display: "none",
          }}
        >
          {/* Edit match scores/details button */}
          <button
            onClick={() => setEditingMatch(match)}
            className="p-1 rounded hover:bg-black/5 transition-all"
            disabled={viewOnly}
            style={{
              opacity: viewOnly ? 0.3 : 1,
              cursor: viewOnly ? "not-allowed" : "pointer",
            }}
            title="Edit match scores and details"
          >
            <FilePenLine size={12} style={{ color: "#3B82F6" }} />
          </button>

          {/* Edit athletes button */}
          {match.ronde === 1 && (
            <button
              onClick={() => {
                // ⭐ Check if match has scores (already started)
                if (hasScores) {
                  showNotification(
                    "warning",
                    "Match Sudah Dimulai",
                    "Tidak dapat mengubah peserta karena match sudah memiliki skor.",
                    () => setShowModal(false)
                  );
                  return;
                }
                setEditAthleteModal({ show: true, match: match, slot: null });
              }}
              className="p-1 rounded hover:bg-black/5 transition-all"
              disabled={viewOnly || hasScores}
              style={{
                opacity: viewOnly || hasScores ? 0.3 : 1,
                cursor: viewOnly || hasScores ? "not-allowed" : "pointer",
              }}
              title={
                hasScores
                  ? "Match sudah dimulai - tidak dapat diubah"
                  : "Edit athletes"
              }
            >
              <Edit3 size={12} style={{ color: "#DC143C" }} />
            </button>
          )}
        </div>
      </div>
    );
  };

  /**
   * 🎯 Calculate vertical positions for all rounds
   * Setiap round berikutnya berada TEPAT di tengah 2 parent match
   */
  // 🧩 Fungsi untuk menghitung posisi vertikal setiap match di tiap ronde
  const calculateVerticalPositions = (matchesBySide: Match[][]) => {
    if (matchesBySide.length === 0) return [];

    // positions[n][m] = posisi Y match ke-m di round ke-n
    const positions: number[][] = [];

    // 🧱 Round 1 (pertama) — pakai spacing dasar antar card
    const round1Count = matchesBySide[0].length;
    positions[0] = [];

    for (let i = 0; i < round1Count; i++) {
      const yPos = i * (CARD_HEIGHT + BASE_VERTICAL_GAP);
      positions[0].push(yPos);

      // ✅ Tambahan penting: simpan posisi vertikal di object match
      if (matchesBySide[0][i]) {
        matchesBySide[0][i].positionY = yPos;
        matchesBySide[0][i].verticalCenter = yPos + CARD_HEIGHT / 2;
      }
    }

    // 🌀 Round berikutnya — posisi = titik tengah vertikal dari 2 parent match
    for (let roundIdx = 1; roundIdx < matchesBySide.length; roundIdx++) {
      positions[roundIdx] = [];
      const currentRoundMatches = matchesBySide[roundIdx];

      for (
        let matchIdx = 0;
        matchIdx < currentRoundMatches.length;
        matchIdx++
      ) {
        const parent1Idx = matchIdx * 2;
        const parent2Idx = matchIdx * 2 + 1;

        const parent1Y = positions[roundIdx - 1][parent1Idx];
        const parent2Y = positions[roundIdx - 1][parent2Idx];

        if (parent1Y === undefined) {
          console.warn(
            `  ⚠️ Warning: parent1Y undefined for match ${matchIdx + 1}`
          );
          continue;
        }

        // 🧩 Handle BYE (jika hanya satu parent)
        const effectiveParent2Y = parent2Y !== undefined ? parent2Y : parent1Y;

        // 💡 Titik tengah vertikal antar dua parent
        const centerY =
          (parent1Y + effectiveParent2Y + CARD_HEIGHT) / 2 - CARD_HEIGHT / 2;

        positions[roundIdx].push(centerY);

        // ✅ Tambahan penting: simpan posisi ke object match
        if (currentRoundMatches[matchIdx]) {
          currentRoundMatches[matchIdx].positionY = centerY;
          currentRoundMatches[matchIdx].verticalCenter =
            centerY + CARD_HEIGHT / 2;
        }
      }
    }

    // 📤 Return hasil posisi untuk referensi eksternal (opsional)
    return positions;
  };

  const renderCenterFinal = () => {
    const finalMatch = getFinalMatch();
    const leftMatches = getLeftMatches();
    const rightMatches = getRightMatches();

    // ⭐ PERBAIKAN: Deteksi berbagai kasus special
    const isDirectFinal = approvedParticipants.length === 2;
    const isThreeParticipants = approvedParticipants.length === 3;

    // Calculate positions
    const leftPositions = calculateVerticalPositions(leftMatches);
    const rightPositions = calculateVerticalPositions(rightMatches);

    // Get semi-final Y positions
    let finalYPosition = 0;
    const HEADER_HEIGHT = 60; // Tinggi round header + margin

    if (isDirectFinal) {
      // For 2 participants, it's just a final. Let's provide a fixed position.
      finalYPosition = 100;
    } else if (isThreeParticipants) {
      // For 3 participants, align the final with the single semi-final match.
      const semiFinalY = leftPositions[0]?.[0] || 0;
      finalYPosition = semiFinalY + 20;
    } else {
      // For 4+ participants, position the final between the two semi-finals.
      const leftSemiY = leftPositions[leftPositions.length - 1]?.[0] || 0;
      const rightSemiY = rightPositions[rightPositions.length - 1]?.[0] || 0;
      finalYPosition = (leftSemiY + rightSemiY) / 2 + HEADER_HEIGHT - 40; // Naikkan card sedikit (dari -40 → -50)
    }

    const lineLength = CENTER_GAP / 2 + 60;
    const STROKE_WIDTH = 6;
    // Garis horizontal card final berada di: finalYPosition + 70 (peserta_a) + 20 (tengah center section)
    const centerLineY = finalYPosition + 120;
    const connectorTop = centerLineY - STROKE_WIDTH / 2;

    return (
      <div
        style={{
          position: "relative",
          width: `${CARD_WIDTH}px`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginTop: "80px",
        }}
      >
        {/* Round Header */}
        <div
          className="round-header"
          style={{
            width: `${CARD_WIDTH}px`,
            textAlign: "center",
            position: "relative",
            zIndex: 20,
            background: "#F5FBEF",
            padding: "8px 12px",
          }}
        >
          <div
            className="px-6 py-3 rounded-lg font-bold text-2xl shadow-md mb-5"
            style={{
              backgroundColor: "#990D35",
              color: "#F5FBEF",
              marginTop: "20px",
            }}
          >
            Final
          </div>
        </div>

        {/* Container untuk card + connectors */}
        <div
          style={{ position: "relative", width: "100%", minHeight: "600px" }}
        >
          {/* ⭐ RENDER CONNECTORS */}
          {/* Case for 4+ participants (left and right connectors) */}
          {!isDirectFinal && !isThreeParticipants && (
            <>
              {/* LEFT CONNECTOR to Final */}
              <svg
                style={{
                  position: "absolute",
                  left: -lineLength,
                  top: `${connectorTop}px`,
                  width: lineLength,
                  height: 6,
                  pointerEvents: "none",
                  zIndex: 1,
                }}
              >
                <line
                  x1="0"
                  y1="3"
                  x2={lineLength}
                  y2="3"
                  stroke="#990D35"
                  strokeWidth="6"
                  opacity="0.8"
                />
              </svg>

              {/* RIGHT CONNECTOR to Final */}
              <svg
                style={{
                  position: "absolute",
                  right: -lineLength,
                  top: `${connectorTop}px`,
                  width: lineLength,
                  height: 6,
                  pointerEvents: "none",
                  zIndex: 1,
                }}
              >
                <line
                  x1="0"
                  y1="3"
                  x2={lineLength}
                  y2="3"
                  stroke="#990D35"
                  strokeWidth="6"
                  opacity="0.8"
                />
              </svg>
            </>
          )}

          {/* Case for 3 participants (left connector only) */}
          {isThreeParticipants && (
            <>
              {/* LEFT CONNECTOR to Final */}
              <svg
                style={{
                  position: "absolute",
                  left: -lineLength,
                  top: `${connectorTop}px`,
                  width: lineLength,
                  height: 6,
                  pointerEvents: "none",
                  zIndex: 1,
                }}
              >
                <line
                  x1="0"
                  y1="3"
                  x2={lineLength}
                  y2="3"
                  stroke="#990D35"
                  strokeWidth="6"
                  opacity="0.8"
                />
              </svg>
            </>
          )}

          {/* Final Match Card */}
          <div
            style={{
              position: "absolute",
              top: `${finalYPosition}px`,
              left: 0,
              width: `${CARD_WIDTH}px`,
            }}
          >
            {finalMatch ? (
              renderMatchCard(
                finalMatch,
                `final-${finalMatch.id_match}`,
                matches.findIndex((m) => m.id_match === finalMatch.id_match)
              )
            ) : (
              <div
                className="w-full p-6 rounded-xl border-2 text-center"
                style={{
                  borderColor: "#990D35",
                  backgroundColor: "rgba(153, 13, 53, 0.05)",
                  height: `${CARD_HEIGHT}px`, // ✅ TAMBAHKAN height explicit
                }}
              >
                <Trophy
                  size={48}
                  style={{ color: "#990D35", opacity: 0.3 }}
                  className="mx-auto mb-2"
                />
                <p
                  className="text-sm font-medium"
                  style={{ color: "#050505", opacity: 0.6 }}
                >
                  Waiting for finalists
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ✅ LEADERBOARD - DIPERBAIKI */}
        {prestasiLeaderboard && (
          <div
            id="prestasi-leaderboard"
            style={{
              width: "550px",
              marginTop: `${
                finalYPosition + CARD_HEIGHT + (isDirectFinal ? 40 : -420)
              }px`,
              position: "relative",
              zIndex: 20,
            }}
          >
            <div
              className="bg-white rounded-lg shadow-lg border-2"
              style={{ borderColor: "#990D35" }}
            >
              {/* Header */}
              <div
                className="p-6 border-b"
                style={{
                  backgroundColor: "rgba(153, 13, 53, 0.05)",
                  borderColor: "#990D35",
                }}
              >
                <div className="flex items-center gap-3 justify-center">
                  <Trophy size={28} style={{ color: "#990D35" }} />
                  <h3
                    className="text-3xl font-bold"
                    style={{ color: "#990D35" }}
                  >
                    LEADERBOARD
                  </h3>
                </div>
              </div>

              <div className="p-6">
                {/* 1st Place - GOLD */}
                {prestasiLeaderboard.first && (
                  <div className="mb-4">
                    <div
                      className="relative p-4 rounded-lg border-2 shadow-md"
                      style={{
                        backgroundColor: "rgba(255, 215, 0, 0.1)",
                        borderColor: "#FFD700",
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 shadow-md"
                          style={{ backgroundColor: "#FFD700" }}
                        >
                          <span className="text-4xl">🥇</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <span
                            className="text-sm font-bold px-2 py-1 rounded-full"
                            style={{
                              backgroundColor: "#FFD700",
                              color: "white",
                            }}
                          >
                            CHAMPION
                          </span>
                          <h4
                            className="text-2xl font-bold mt-1 truncate"
                            style={{ color: "#050505" }}
                          >
                            {prestasiLeaderboard.first.name}
                          </h4>
                          <p
                            className="text-sm uppercase truncate"
                            style={{ color: "#050505", opacity: 0.6 }}
                          >
                            {prestasiLeaderboard.first.dojo}
                          </p>
                        </div>

                        <Trophy
                          size={32}
                          style={{ color: "#FFD700" }}
                          className="flex-shrink-0"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 2nd Places - SILVER (termasuk yang kalah di semi) */}
                {prestasiLeaderboard.second.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <span
                        className="text-sm font-bold"
                        style={{ color: "#A9A9A9" }}
                      >
                        🥈 SILVER ({prestasiLeaderboard.second.length})
                      </span>
                    </div>
                    {prestasiLeaderboard.second.map((participant, index) => (
                      <div
                        key={participant.id}
                        className={
                          index < prestasiLeaderboard.second.length - 1
                            ? "mb-3"
                            : ""
                        }
                      >
                        <div
                          className="p-4 rounded-lg border-2 shadow-sm"
                          style={{
                            backgroundColor: "rgba(192, 192, 192, 0.1)",
                            borderColor: "#C0C0C0",
                          }}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 shadow-md"
                              style={{ backgroundColor: "#C0C0C0" }}
                            >
                              <span className="text-3xl">🥈</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4
                                className="text-xl font-bold truncate"
                                style={{ color: "#050505" }}
                              >
                                {participant.name}
                              </h4>
                              <p
                                className="text-sm uppercase truncate"
                                style={{ color: "#050505", opacity: 0.6 }}
                              >
                                {participant.dojo}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 3rd Places - BRONZE */}
                {prestasiLeaderboard.third.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <span
                        className="text-sm font-bold"
                        style={{ color: "#CD7F32" }}
                      >
                        🥉 BRONZE ({prestasiLeaderboard.third.length})
                      </span>
                    </div>
                    {prestasiLeaderboard.third.map((participant, index) => (
                      <div
                        key={participant.id}
                        className={
                          index < prestasiLeaderboard.third.length - 1
                            ? "mb-3"
                            : ""
                        }
                      >
                        <div
                          className="p-4 rounded-lg border-2 shadow-sm"
                          style={{
                            backgroundColor: "rgba(205, 127, 50, 0.1)",
                            borderColor: "#CD7F32",
                          }}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 shadow-md"
                              style={{ backgroundColor: "#CD7F32" }}
                            >
                              <span className="text-3xl">🥉</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4
                                className="text-xl font-bold mt-1 truncate"
                                style={{ color: "#050505" }}
                              >
                                {participant.name}
                              </h4>
                              <p
                                className="text-sm uppercase truncate"
                                style={{ color: "#050505", opacity: 0.6 }}
                              >
                                {participant.dojo}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty State - DIPERBAIKI */}
                {!prestasiLeaderboard.first &&
                  prestasiLeaderboard.second.length === 0 && (
                    <div className="text-center py-10">
                      <Trophy
                        size={48}
                        style={{ color: "#990D35", opacity: 0.3 }}
                        className="mx-auto mb-3"
                      />
                      <p
                        className="text-base font-semibold mb-1"
                        style={{ color: "#050505" }}
                      >
                        Belum Ada Hasil
                      </p>
                      <p
                        className="text-sm"
                        style={{ color: "#050505", opacity: 0.5 }}
                      >
                        Leaderboard akan muncul setelah pertandingan selesai
                      </p>
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 🧩 Kode perbaikan fungsi renderBracketSide
  const renderBracketSide = (
    matchesBySide: Match[][],
    side: "left" | "right",
    startRound: number = 1
  ) => {
    const isRight = side === "right";
    const totalRounds = getTotalRounds();

    // ✅ Hitung semua posisi vertikal untuk tiap match
    const verticalPositions = calculateVerticalPositions(matchesBySide);

    // ✅ Pastikan nilai tidak undefined sebelum dihitung
    const validY = verticalPositions
      .flat()
      .filter((y): y is number => y !== undefined);
    const maxY =
      (validY.length > 0 ? Math.max(...validY) : 0) + CARD_HEIGHT + 100;

    return (
      <div
        className="bracket-side"
        style={{
          display: "flex",
          flexDirection: isRight ? "row-reverse" : "row",
          alignItems: "flex-start",
          gap: `${ROUND_GAP}px`,
          position: "relative",
          minHeight: `${maxY}px`,
          marginTop: "100px", // Ditambahkan kembali sesuai permintaan user
        }}
      >
        {matchesBySide.map((roundMatches, roundIndex) => {
          if (roundMatches.length === 0) return null;

          const actualRound = startRound + roundIndex;
          const roundName = getRoundName(actualRound, totalRounds);
          const matchCount = roundMatches.length;
          const hasNextRound =
            roundIndex < matchesBySide.length - 1 &&
            matchesBySide[roundIndex + 1].length > 0;

          return (
            <div
              key={`${side}-round-${actualRound}`}
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                minHeight: `${maxY}px`,
              }}
            >
              {/* 🏷️ Round Header */}
              <div
                className="round-header"
                style={{
                  width: `${CARD_WIDTH}px`,
                  marginBottom: "20px",
                  textAlign: "center",
                  position: "relative",
                  zIndex: 20,
                  background: "#F5FBEF",
                  padding: "8px 12px",
                }}
              >
                <div
                  className="px-6 py-3 rounded-lg font-bold text-2xl shadow-md mb-5"
                  style={{ backgroundColor: "#990D35", color: "#F5FBEF" }}
                >
                  {roundName}
                </div>
              </div>

              {/* 🎮 Container untuk match cards dan connector */}
              <div
                style={{
                  position: "relative",
                  width: `${CARD_WIDTH}px`,
                  height: `${maxY}px`,
                  flexGrow: 0,
                  flexShrink: 0,
                }}
              >
                {/* ============================================
                    🔗 RENDER CONNECTORS (Garis penghubung)
                  ============================================ */}
                {hasNextRound &&
                  roundMatches.map((match, matchIndex) => {
                    const yPosition =
                      verticalPositions[roundIndex]?.[matchIndex];
                    if (yPosition === undefined) return null;

                    const cardCenterY = yPosition + CARD_HEIGHT / 2;
                    const isFirstInPair = matchIndex % 2 === 0;
                    const hasPartner = matchIndex + 1 < matchCount;
                    const targetMatchIdx = Math.floor(matchIndex / 2);
                    const targetY =
                      verticalPositions[roundIndex + 1]?.[targetMatchIdx];

                    const halfGap = ROUND_GAP / 2;

                    return (
                      <React.Fragment key={`connectors-${match.id_match}`}>
                        {/* ═══════════════════════════════════════════
          STEP 1: Horizontal line DARI card KE vertical line
          ═══════════════════════════════════════════ */}
                        <svg
                          style={{
                            position: "absolute",
                            left: isRight ? `${-halfGap}px` : `${CARD_WIDTH}px`,
                            top: `${cardCenterY - 3}px`,
                            width: halfGap,
                            height: 6,
                            pointerEvents: "none",
                            zIndex: 5,
                          }}
                        >
                          <line
                            x1={isRight ? halfGap : 0}
                            y1="3"
                            x2={isRight ? 0 : halfGap}
                            y2="3"
                            stroke="#990D35"
                            strokeWidth="6"
                            opacity="0.8"
                          />
                        </svg>

                        {/* ═══════════════════════════════════════════
          STEP 2 & 3: Vertical line + Horizontal BARU ke target
          Hanya render untuk match PERTAMA dalam pair
          ═══════════════════════════════════════════ */}
                        {isFirstInPair &&
                          hasPartner &&
                          targetY !== undefined &&
                          (() => {
                            const partnerY =
                              verticalPositions[roundIndex]?.[matchIndex + 1];
                            if (partnerY === undefined) return null;

                            const partnerCenterY = partnerY + CARD_HEIGHT / 2;

                            // Posisi X vertical line (di tengah gap)
                            const verticalLineX = isRight
                              ? -halfGap
                              : CARD_WIDTH + halfGap;

                            // Y positions untuk vertical line
                            const topY = Math.min(cardCenterY, partnerCenterY);
                            const bottomY = Math.max(
                              cardCenterY,
                              partnerCenterY
                            );
                            const verticalHeight = bottomY - topY;
                            const midPointY =
                              (cardCenterY + partnerCenterY) / 2;

                            return (
                              <>
                                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                VERTICAL LINE menghubungkan 2 horizontal
                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                                <svg
                                  style={{
                                    position: "absolute",
                                    left: `${verticalLineX - 3}px`,
                                    top: `${topY}px`,
                                    width: 6,
                                    height: verticalHeight,
                                    pointerEvents: "none",
                                    zIndex: 4,
                                  }}
                                >
                                  <line
                                    x1="3"
                                    y1="0"
                                    x2="3"
                                    y2={verticalHeight}
                                    stroke="#990D35"
                                    strokeWidth="6"
                                    opacity="0.8"
                                  />
                                </svg>

                                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                HORIZONTAL BARU dari vertical ke target card
                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                                <svg
                                  style={{
                                    position: "absolute",
                                    left: isRight
                                      ? `${-ROUND_GAP}px` // Start dari next card edge
                                      : `${CARD_WIDTH + halfGap}px`, // Start dari vertical line
                                    top: `${midPointY - 3}px`, // Tengah-tengah vertical line
                                    width: halfGap,
                                    height: 6,
                                    pointerEvents: "none",
                                    zIndex: 5,
                                  }}
                                >
                                  <line
                                    x1={isRight ? halfGap : 0}
                                    y1="3"
                                    x2={isRight ? 0 : halfGap}
                                    y2="3"
                                    stroke="#990D35"
                                    strokeWidth="6"
                                    opacity="0.8"
                                  />
                                </svg>
                              </>
                            );
                          })()}
                      </React.Fragment>
                    );
                  })}

                {/* ============================================
                  🧩 RENDER MATCH CARDS (Di atas garis)
                  ============================================ */}
                {roundMatches.map((match, matchIndex) => {
                  const yPosition = verticalPositions[roundIndex]?.[matchIndex];
                  if (yPosition === undefined) return null;

                  return (
                    <div
                      key={`card-${match.id_match}`}
                      style={{
                        position: "absolute",
                        top: `${yPosition}px`,
                        left: 0,
                        width: `${CARD_WIDTH}px`,
                        zIndex: 10,
                      }}
                    >
                      {renderMatchCard(
                        match,
                        match.id_match,
                        matches.findIndex((m) => m.id_match === match.id_match)
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  const debugCardPositions = () => {};

  React.useEffect(() => {
    if (matches.length > 0) {
      debugCardPositions();
    }
  }, [matches]);

  const prestasiLeaderboard = generatePrestasiLeaderboard();

  React.useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
    .tournament-layout {
      position: relative;
      z-index: 1;
    }

    .bracket-side {
      position: relative;
      z-index: 2;
    }

    .match-card {
      transition: all 0.2s ease;
      cursor: pointer;
      position: relative !important;  /* ✅ FORCE */
      z-index: 10;
      background: white;
      box-sizing: border-box !important;  /* ✅ FORCE */
    }

    .match-card:hover {
      transform: none !important;
      box-shadow: none;
      z-index: 10;
    }

    .round-header {
      position: relative;
      z-index: 20;
      background: #F5FBEF;
      padding: 8px 12px;
      box-sizing: border-box !important;  /* ✅ FORCE */
    }

    /* ✅ FORCE no margins/paddings */
    .bracket-side > div {
      margin: 0 !important;
    }

    /* Hide scrollbar but keep functionality */
    .overflow-x-auto::-webkit-scrollbar {
      height: 8px;
    }

    .overflow-x-auto::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 10px;
    }

    .overflow-x-auto::-webkit-scrollbar-thumb {
      background: #990D35;
      border-radius: 10px;
    }

    .overflow-x-auto::-webkit-scrollbar-thumb:hover {
      background: #7a0a2a;
    }

    .overflow-x-auto {
      scroll-behavior: smooth;
    }
  `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // ============================================================================
  // 🆕 HELPER: Calculate positions for split bracket
  // ============================================================================

  /**
   * Split matches into left and right sides
   */
  const splitMatchesBySide = (matches: Match[], totalRounds: number) => {
    const allRounds: { left: Match[]; right: Match[] }[] = [];

    for (let round = 1; round <= totalRounds; round++) {
      const roundMatches = getMatchesByRound(round);

      // ✅ PERBAIKAN: Jika total rounds = 1 atau 2 peserta, TIDAK perlu split
      if (totalRounds === 1) {
        allRounds.push({ left: [], right: [] });
        continue;
      }

      // Final round stays in center (tidak di-split)
      if (round === totalRounds) {
        allRounds.push({ left: [], right: [] });
        continue;
      }

      // ✅ PERBAIKAN: Jika 3 peserta (round 1 hanya 1 match), jangan split
      if (approvedParticipants.length === 3 && round === 1) {
        // Taruh di left saja, right kosong
        allRounds.push({
          left: roundMatches,
          right: [],
        });
        continue;
      }

      // Split round matches in half
      const half = Math.ceil(roundMatches.length / 2);
      allRounds.push({
        left: roundMatches.slice(0, half),
        right: roundMatches.slice(half),
      });
    }

    return allRounds;
  };

  /**
   * Get left matches only (untuk render bracket side)
   */
  const handleAssignAthlete = async (
    matchId: number,
    slot: "A" | "B",
    participantId: number
  ) => {
    if (!kelasData) return;

    try {
      const kompetisiId = kelasData.kompetisi.id_kompetisi;
      const kelasKejuaraanId = kelasData.id_kelas_kejuaraan;

      console.log("🔄 Assigning athlete:", { matchId, slot, participantId });

      const response = await fetch(
        `${apiBaseUrl}/kompetisi/${kompetisiId}/brackets/${kelasKejuaraanId}/matches/${matchId}/assign`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({
            slot,
            participantId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to assign athlete");
      }

      const result = await response.json();

      // Close modal
      setEditAthleteModal({ show: false, match: null, slot: null });

      // Refresh bracket data
      await fetchBracketData(kompetisiId, kelasKejuaraanId);

      // Show notification
      showNotification(
        "success",
        result.data.swapped ? "Athlete Swapped!" : "Athlete Assigned!",
        result.data.message || "Athlete successfully assigned to match.",
        () => setShowModal(false)
      );
    } catch (error: any) {
      console.error("❌ Error assigning athlete:", error);
      showNotification(
        "error",
        "Failed to Assign",
        error.message || "Failed to assign athlete to match.",
        () => setShowModal(false)
      );
    }
  };

  const getLeftMatches = () => {
    const totalRounds = getTotalRounds();
    const split = splitMatchesBySide(matches, totalRounds);

    const result: Match[][] = [];

    for (let roundIndex = 0; roundIndex < totalRounds - 1; roundIndex++) {
      result.push(split[roundIndex].left);
    }

    return result;
  };

  /**
   * Get right matches only (untuk render bracket side)
   */
  const getRightMatches = () => {
    const totalRounds = getTotalRounds();
    const split = splitMatchesBySide(matches, totalRounds);

    const result: Match[][] = [];

    for (let roundIndex = 0; roundIndex < totalRounds - 1; roundIndex++) {
      result.push(split[roundIndex].right);
    }

    return result;
  };

  /**
   * Get final match (untuk render di center)
   */
  const getFinalMatch = (): Match | null => {
    const totalRounds = getTotalRounds();
    const finalMatches = getMatchesByRound(totalRounds);
    return finalMatches.length > 0 ? finalMatches[0] : null;
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5FBEF" }}>
      {/* Header */}
      <div
        className="bg-white shadow-sm border-b"
        style={{ borderColor: "#990D35" }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {onBack &&
                !viewOnly && ( // ✅ TAMBAHKAN !viewOnly check
                  <button
                    onClick={() => {
                      // ✅ PERBAIKAN: Deteksi dari mana user datang
                      const currentPath = window.location.pathname;

                      if (currentPath.includes("/bracket-viewer/")) {
                        // Jika dari pelatih dashboard, redirect ke bracket list
                        window.location.href = "/dashboard/bracket-viewer";
                      } else if (currentPath.includes("/admin-kompetisi/")) {
                        // Jika dari admin, redirect ke drawing bagan
                        window.location.href = "/admin-kompetisi/drawing-bagan";
                      } else {
                        // Fallback: gunakan onBack callback
                        onBack();
                      }
                    }}
                    className="p-2 rounded-lg hover:bg-black/5 transition-all"
                  >
                    <ArrowLeft size={20} style={{ color: "#990D35" }} />
                  </button>
                )}
              <div
                className="w-16 h-16 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "#990D35" }}
              >
                <Trophy size={32} style={{ color: "#F5FBEF" }} />
              </div>
              <div>
                <h1
                  className="text-xl font-bold mb-1"
                  style={{ color: "#050505" }}
                >
                  {kelasData.kompetisi.nama_event}
                </h1>
                <div
                  className="flex items-center gap-4 text-sm"
                  style={{ color: "#050505", opacity: 0.7 }}
                >
                  <span>🏆 KATEGORI PRESTASI</span>
                  <span>•</span>
                  <span>
                    {viewMode === "bracket"
                      ? kelasData.kompetisi.lokasi
                      : viewMode === "list"
                      ? "Input Hasil by List"
                      : "Jadwal Global"}
                  </span>
                </div>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-200 rounded-lg p-1">
              <button
                onClick={() => setViewMode("bracket")}
                className={`px-4 py-2 text-sm font-semibold rounded-md ${
                  viewMode === "bracket"
                    ? "bg-white shadow"
                    : "bg-transparent text-gray-600"
                }`}
              >
                Bracket
              </button>
              {!viewOnly && (
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-4 py-2 text-sm font-semibold rounded-md ${
                    viewMode === "list"
                      ? "bg-white shadow"
                      : "bg-transparent text-gray-600"
                  }`}
                >
                  Input Hasil
                </button>
              )}
            </div>

            {!viewOnly && (
              <div className="flex flex-wrap gap-2">
                {/* ROW 1: Primary Actions */}
                <div className="flex gap-2">
                  {/* Export Peserta Button */}
                  <button
                    onClick={exportPesertaToExcel}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all hover:opacity-90 shadow-md"
                    style={{ backgroundColor: "#16a34a", color: "#F5FBEF" }}
                    title="Export daftar peserta ke Excel"
                  >
                    <Download size={16} />
                    <span className="hidden sm:inline">Export Peserta</span>
                    <span className="sm:hidden">Excel</span>
                  </button>

                  {/* Clear Scheduling Button */}
                  <button
                    onClick={clearScheduling}
                    disabled={!bracketGenerated || clearingScheduling}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 shadow-md"
                    style={{
                      backgroundColor: "#8B5CF6",
                      color: "#F5FBEF",
                    }}
                    title="Hapus semua nomor partai (scheduling) - skor tetap"
                  >
                    {clearingScheduling ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span className="hidden sm:inline">Clearing...</span>
                      </>
                    ) : (
                      <>
                        <Calendar size={16} />
                        <span className="hidden sm:inline">
                          Clear Scheduling
                        </span>
                        <span className="sm:hidden">📅🗑️</span>
                      </>
                    )}
                  </button>

                  {/* Dojang Separation Button */}
                  <button
                    onClick={() => setShowDojangModal(true)}
                    disabled={loading || approvedParticipants.length < 2}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      dojangSeparation.enabled ? "ring-2 ring-offset-1" : ""
                    }`}
                    style={{
                      backgroundColor: dojangSeparation.enabled
                        ? "#10B981"
                        : "#6366F1",
                      color: "#F5FBEF",
                    }}
                    title={
                      dojangSeparation.enabled
                        ? "Dojang separation aktif (STRICT mode)"
                        : "Aktifkan dojang separation"
                    }
                  >
                    <Users size={16} />
                    <span className="hidden md:inline">
                      {dojangSeparation.enabled
                        ? "✓ Dojang Separated"
                        : "Dojang Separation"}
                    </span>
                    <span className="md:hidden">
                      {dojangSeparation.enabled ? "✓ Dojang" : "Dojang"}
                    </span>
                  </button>
                </div>

                {/* ROW 2: Bracket Actions */}
                <div className="flex gap-2">
                  {/* Shuffle Button */}
                  <button
                    onClick={shuffleBracket}
                    disabled={
                      loading ||
                      approvedParticipants.length < 2 ||
                      !bracketGenerated
                    }
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 shadow-md"
                    style={{
                      backgroundColor: "#6366F1",
                      color: "#F5FBEF",
                    }}
                    title="Acak ulang susunan bracket"
                  >
                    {loading ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span className="hidden sm:inline">Processing...</span>
                      </>
                    ) : (
                      <>
                        <Shuffle size={16} />
                        <span className="hidden sm:inline">Shuffle</span>
                        <span className="sm:hidden">🔀</span>
                      </>
                    )}
                  </button>

                  {/* Clear Results Button */}
                  <button
                    onClick={clearBracketResults}
                    disabled={!bracketGenerated || clearing}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 shadow-md"
                    style={{
                      backgroundColor: "#F97316",
                      color: "#F5FBEF",
                    }}
                    title="Reset semua skor ke 0 (struktur bracket tetap)"
                  >
                    {clearing ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span className="hidden sm:inline">Clearing...</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle size={16} />
                        <span className="hidden sm:inline">Clear Results</span>
                        <span className="sm:hidden">🗑️</span>
                      </>
                    )}
                  </button>

                  {/* Delete Bracket Button */}
                  <button
                    onClick={deleteBracketPermanent}
                    disabled={!bracketGenerated || deleting}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 shadow-md"
                    style={{
                      backgroundColor: "#DC2626",
                      color: "#F5FBEF",
                    }}
                    title="Hapus bracket secara permanen (TIDAK BISA dibatalkan!)"
                  >
                    {deleting ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span className="hidden sm:inline">Deleting...</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle size={16} />
                        <span className="hidden sm:inline">Delete Bracket</span>
                        <span className="sm:hidden">❌</span>
                      </>
                    )}
                  </button>

                  {/* Download PDF Button */}
                  <button
                    onClick={handleExportPDF}
                    disabled={
                      !bracketGenerated || exportingPDF || matches.length === 0
                    }
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 shadow-md"
                    style={{
                      backgroundColor: "#10B981",
                      color: "#F5FBEF",
                    }}
                    title="Download bracket sebagai PDF"
                  >
                    {exportingPDF ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span className="hidden sm:inline">
                          Generating PDF...
                        </span>
                        <span className="sm:hidden">⏳</span>
                      </>
                    ) : (
                      <>
                        <Download size={16} />
                        <span className="hidden sm:inline">Download PDF</span>
                        <span className="sm:hidden">PDF</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Competition details */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-center gap-8 text-center">
              <div>
                <h2 className="text-lg font-bold" style={{ color: "#990D35" }}>
                  {kelasData.kelompok?.nama_kelompok} {displayGender}{" "}
                  {kelasData.kelas_berat?.nama_kelas ||
                    kelasData.poomsae?.nama_kelas}
                </h2>
                <p
                  className="text-sm mt-1"
                  style={{ color: "#050505", opacity: 0.7 }}
                >
                  Contestants: {approvedParticipants.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {viewMode === "list" ? (
        renderListView()
      ) : viewMode === "bracket" ? (
        /* PRESTASI Layout with FIXED POSITIONING */
        bracketGenerated && matches.length > 0 ? (
          /* Render the bracket */
          <div ref={bracketRef} className="p-6 inline-block">
            <div className="tournament-layout flex justify-center items-start gap-8">
              {renderBracketSide(getLeftMatches(), "left")}
              {renderCenterFinal()}
              {renderBracketSide(getRightMatches(), "right")}
            </div>
          </div>
        ) : (
          /* Empty state for bracket */
          <div className="p-6">
            <div className="text-center py-16">
              <Trophy
                size={64}
                style={{ color: "#990D35", opacity: 0.4 }}
                className="mx-auto mb-4"
              />
              <h3
                className="text-xl font-semibold mb-2"
                style={{ color: "#050505" }}
              >
                {approvedParticipants.length < 2
                  ? "Insufficient Participants"
                  : "Tournament Bracket Not Generated"}
              </h3>
              <p
                className="text-base mb-6"
                style={{ color: "#050505", opacity: 0.6 }}
              >
                {approvedParticipants.length < 2
                  ? `Need at least 2 approved participants. Currently have ${approvedParticipants.length}.`
                  : 'Click "Generate" to create the tournament bracket'}
              </p>
              {approvedParticipants.length >= 2 && (
                <button
                  onClick={openParticipantPreview}
                  disabled={loading}
                  className="px-6 py-3 rounded-lg font-medium transition-all disabled:opacity-50 hover:opacity-90"
                  style={{ backgroundColor: "#F5B700", color: "#F5FBEF" }}
                >
                  {loading ? "Processing..." : "Preview & Generate Bracket"}
                </button>
              )}
            </div>
          </div>
        )
      ) : null}

      {/* Participant Preview Modal, Edit Match Modal, etc. */}
      {showParticipantPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div
              className="p-6 border-b sticky top-0 bg-white z-10"
              style={{ borderColor: "#990D35" }}
            >
              <h3 className="text-xl font-bold" style={{ color: "#050505" }}>
                Preview Peserta Tournament
              </h3>
              <p
                className="text-sm mt-1"
                style={{ color: "#050505", opacity: 0.6 }}
              >
                Total {approvedParticipants.length} peserta akan diikutkan dalam
                bracket
              </p>
            </div>

            <div className="p-6">
              <div className="space-y-3">
                {approvedParticipants.map((peserta, index) => (
                  <div
                    key={peserta.id_peserta_kompetisi}
                    className="p-4 rounded-lg border-2"
                    style={{
                      borderColor: "#990D35",
                      backgroundColor: "rgba(153, 13, 53, 0.05)",
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0"
                        style={{ backgroundColor: "#990D35", color: "white" }}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-bold text-lg mb-1 break-words"
                          style={{ color: "#050505" }}
                        >
                          {getParticipantName(peserta)}
                        </p>
                        <p
                          className="text-base break-words"
                          style={{
                            color: "#050505",
                            opacity: 0.6,
                            wordBreak: "break-word",
                            overflowWrap: "break-word",
                          }}
                        >
                          {getDojoName(peserta)}
                        </p>
                      </div>
                      <CheckCircle
                        size={24}
                        className="text-green-600 flex-shrink-0"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="p-6 border-t flex gap-3 sticky bottom-0 bg-white z-10"
              style={{ borderColor: "#990D35" }}
            >
              <button
                onClick={() => setShowParticipantPreview(false)}
                className="flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all hover:bg-gray-100"
                style={{ borderColor: "#990D35", color: "#990D35" }}
              >
                Batal
              </button>
              <button
                onClick={generateBracket}
                disabled={loading || approvedParticipants.length < 2}
                className="flex-1 py-3 px-4 rounded-lg font-bold transition-all hover:opacity-90 shadow-lg"
                style={{ backgroundColor: "#990D35", color: "#F5FBEF" }}
              >
                {loading
                  ? "Generating..."
                  : `Generate Bracket (${approvedParticipants.length} Peserta)`}
              </button>
            </div>
          </div>
        </div>
      )}
      {editingMatch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="p-6 border-b" style={{ borderColor: "#990D35" }}>
              <h3 className="text-xl font-bold" style={{ color: "#050505" }}>
                Input Hasil Pertandingan
              </h3>
              <p
                className="text-sm mt-1"
                style={{ color: "#050505", opacity: 0.6 }}
              >
                Partai {editingMatch.nomor_partai}
              </p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xl font-bold text-blue-800 text-center">
                    {getParticipantName(editingMatch.peserta_a)}
                  </p>
                  <input
                    type="number"
                    id="scoreA"
                    defaultValue={editingMatch.skor_a}
                    className="mt-1 block w-full px-3 py-2 bg-blue-100 border border-blue-500 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-center text-2xl font-bold"
                  />
                </div>
                <div>
                  <p className="text-xl font-bold text-red-800 text-center">
                    {getParticipantName(editingMatch.peserta_b)}
                  </p>
                  <input
                    type="number"
                    id="scoreB"
                    defaultValue={editingMatch.skor_b}
                    className="mt-1 block w-full px-3 py-2 bg-red-100 border border-red-500 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm text-center text-2xl font-bold"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label
                  htmlFor="tanggalPertandingan"
                  className="block text-sm font-medium text-gray-700"
                >
                  Tanggal Pertandingan
                </label>
                <input
                  type="date"
                  id="tanggalPertandingan"
                  defaultValue={
                    editingMatch.tanggal_pertandingan?.split("T")[0]
                  }
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label
                    htmlFor="nomorAntrian"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Nomor Antrian
                  </label>
                  <input
                    type="number"
                    id="nomorAntrian"
                    defaultValue={editingMatch.nomor_antrian}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="nomorLapangan"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Nomor Lapangan
                  </label>
                  <input
                    type="text"
                    id="nomorLapangan"
                    defaultValue={editingMatch.nomor_lapangan}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setEditingMatch(null)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  const scoreA =
                    parseInt(
                      (document.getElementById("scoreA") as HTMLInputElement)
                        .value
                    ) || 0;
                  const scoreB =
                    parseInt(
                      (document.getElementById("scoreB") as HTMLInputElement)
                        .value
                    ) || 0;
                  updateMatchResult(editingMatch.id_match, scoreA, scoreB);
                }}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                style={{ backgroundColor: "#990D35" }}
              >
                Simpan Hasil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default TournamentBracketPrestasi;
