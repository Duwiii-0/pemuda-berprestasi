import React, { useState, useEffect } from "react";
import {
  Trophy,
  Edit3,
  CheckCircle,
  ArrowLeft,
  AlertTriangle,
  RefreshCw,
  Download,
  Shuffle,
  Users,
  FilePenLine,
  Calendar,
} from "lucide-react";
import { exportBracketFromData } from "../utils/exportBracketPDF";
import { useAuth } from "../context/authContext";
import { useNavigate } from "react-router-dom";
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

interface TournamentBracketPemulaProps {
  kelasData: KelasKejuaraan;
  onBack?: () => void;
  apiBaseUrl?: string;
  viewOnly?: boolean; // ⭐ TAMBAHKAN
}

interface DojangSeparationConfig {
  enabled: boolean;
  mode: "STRICT" | "BALANCED";
}

const TournamentBracketPemula: React.FC<TournamentBracketPemulaProps> = ({
  kelasData,
  onBack,
  apiBaseUrl = "/api",
  viewOnly = false,
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
  const [exportingPDF, setExportingPDF] = useState(false); // ✅ NEW
  const [clearing, setClearing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showParticipantPreview, setShowParticipantPreview] = useState(false);
  const bracketRef = React.useRef<HTMLDivElement>(null); // ✅ NEW
  const leaderboardRef = React.useRef<HTMLDivElement>(null); // ✅ NEW
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

  const [dojangSeparation, setDojangSeparation] =
    useState<DojangSeparationConfig>({
      enabled: false,
      mode: "BALANCED",
    });
  const [showDojangModal, setShowDojangModal] = useState(false);

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

  const approvedParticipants = kelasData.peserta_kompetisi.filter(
    (p) => p.status === "APPROVED"
  );

  useEffect(() => {
    if (kelasData?.kompetisi?.id_kompetisi) {
      const kompetisiId = kelasData.kompetisi.id_kompetisi;
      const kelasKejuaraanId = kelasData.id_kelas_kejuaraan;

      console.log(`🔄 Loading PEMULA bracket for kelas ${kelasKejuaraanId}...`);
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
      console.log("📊 PEMULA Bracket data fetched:", result);

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
          })
        );

        setMatches(transformedMatches);
        setBracketGenerated(true);
        console.log(`✅ Loaded ${transformedMatches.length} PEMULA matches`);
      }
    } catch (error: any) {
      console.error("❌ Error fetching PEMULA bracket:", error);
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
                  className="px-6 py-3 text-left text-xs font-bold text-red-600 uppercase tracking-wider"
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
                    <span className="text-sm font-semibold text-blue-600">{match.skor_a}</span> - <span className="text-sm font-semibold text-red-600">{match.skor_b}</span>
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

  const navigate = useNavigate();

  const openParticipantPreview = () => {
    setShowParticipantPreview(true);
  };

  const generateBracket = async () => {
    if (!kelasData) return;

    console.log("🥋 PEMULA: Generating bracket...");
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
        throw new Error(errorData.message || "Failed to generate bracket");
      }

      const result = await response.json();
      console.log("✅ PEMULA Bracket generated:", result);

      await fetchBracketData(kompetisiId, kelasKejuaraanId);

      showNotification(
        "success",
        "Berhasil!",
        "Bracket PEMULA berhasil dibuat!",
        () => setShowModal(false)
      );
    } catch (error: any) {
      console.error("❌ Error generating PEMULA bracket:", error);
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

    console.log("🔀 Shuffling PEMULA bracket...");
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
          isPemula: true,
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
        throw new Error(errorData.message || "Failed to shuffle bracket");
      }

      const result = await response.json();
      console.log("✅ PEMULA Bracket shuffled:", result);

      await fetchBracketData(kompetisiId, kelasKejuaraanId);

      showNotification(
        "success",
        "Berhasil!",
        "Susunan peserta berhasil diacak ulang!",
        () => setShowModal(false)
      );
    } catch (error: any) {
      console.error("❌ Error shuffling PEMULA bracket:", error);
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
        ["LAPORAN DATA PESERTA KOMPETISI - KATEGORI PEMULA"],
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
      const fileName = `Data_Peserta_PEMULA_${eventName}_${kelasName}_${timestamp}.xlsx`;

      // ✅ Export file
      XLSX.writeFile(workbook, fileName);

      showNotification(
        "success",
        "Export Peserta",
        "Data peserta PEMULA berhasil diexport ke spreadsheet",
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

  const getParticipantName = (peserta?: Peserta) => {
    if (!peserta) return "";
    if (peserta.is_team) {
      return (
        peserta.anggota_tim?.map((t) => t.atlet.nama_atlet.toUpperCase()).join(", ") || "Team"
      );
    }
    return peserta.atlet?.nama_atlet.toUpperCase() || "";
  };

  const getDojoName = (peserta?: Peserta) => {
    if (!peserta) return "";
    return peserta.atlet?.dojang.nama_dojang || "";
  };

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

const generateLeaderboard = () => {
  if (matches.length === 0) return null;

  const leaderboard: {
    gold: { name: string; dojo: string; id: number }[];
    silver: { name: string; dojo: string; id: number }[];
  } = {
    gold: [],
    silver: [],
  };

  const processedGold = new Set<number>();
  const processedSilver = new Set<number>();

  const round1Matches = matches.filter((m) => m.ronde === 1);
  const round2Matches = matches.filter((m) => m.ronde === 2);
  const hasAdditionalMatch = round2Matches.length > 0;

  // ═══════════════════════════════════════════════════════════════
  // PEMULA: Menang = GOLD, Kalah = SILVER (semua dapat medali)
  // ═══════════════════════════════════════════════════════════════

  // Process Additional Match first (jika ada)
  if (hasAdditionalMatch) {
    const additionalMatch = round2Matches[0];
    if (additionalMatch && (additionalMatch.skor_a > 0 || additionalMatch.skor_b > 0)) {
      const winner = additionalMatch.skor_a > additionalMatch.skor_b 
        ? additionalMatch.peserta_a 
        : additionalMatch.peserta_b;
      const loser = additionalMatch.skor_a > additionalMatch.skor_b 
        ? additionalMatch.peserta_b 
        : additionalMatch.peserta_a;

      if (winner && !processedGold.has(winner.id_peserta_kompetisi)) {
        leaderboard.gold.push({
          name: getParticipantName(winner),
          dojo: getDojoName(winner),
          id: winner.id_peserta_kompetisi,
        });
        processedGold.add(winner.id_peserta_kompetisi);
      }

      if (loser && !processedSilver.has(loser.id_peserta_kompetisi)) {
        leaderboard.silver.push({
          name: getParticipantName(loser),
          dojo: getDojoName(loser),
          id: loser.id_peserta_kompetisi,
        });
        processedSilver.add(loser.id_peserta_kompetisi);
      }
    }
  }

  // Process Round 1 Matches
  round1Matches.forEach((match) => {
    const hasScore = match.skor_a > 0 || match.skor_b > 0;

    if (hasScore && match.peserta_a && match.peserta_b) {
      const winner = match.skor_a > match.skor_b ? match.peserta_a : match.peserta_b;
      const loser = match.skor_a > match.skor_b ? match.peserta_b : match.peserta_a;

      const winnerId = winner.id_peserta_kompetisi;
      const loserId = loser.id_peserta_kompetisi;

      // Winner → GOLD (jika belum diproses)
      if (!processedGold.has(winnerId) && !processedSilver.has(winnerId)) {
        leaderboard.gold.push({
          name: getParticipantName(winner),
          dojo: getDojoName(winner),
          id: winnerId,
        });
        processedGold.add(winnerId);
      }

      // Loser → SILVER (jika belum diproses)
      if (!processedSilver.has(loserId) && !processedGold.has(loserId)) {
        leaderboard.silver.push({
          name: getParticipantName(loser),
          dojo: getDojoName(loser),
          id: loserId,
        });
        processedSilver.add(loserId);
      }
    }
  });

  return leaderboard;
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
      // ✅ METHOD 1: Try using ref
      let bracketElement = bracketRef.current;

      // ✅ METHOD 2: If ref fails, query selector
      if (!bracketElement) {
        console.warn("⚠️ Ref not found, trying querySelector...");
        bracketElement = document.querySelector(
          ".tournament-layout"
        ) as HTMLElement;
      }

      // ✅ METHOD 3: Last resort - find by class pattern
      if (!bracketElement) {
        console.warn("⚠️ tournament-layout not found, trying alternative...");
        const allDivs = document.querySelectorAll('div[class*="space-y-4"]');
        for (const div of allDivs) {
          const htmlDiv = div as HTMLElement;
          if (htmlDiv.querySelector(".bg-white.rounded-lg.shadow-md")) {
            bracketElement = htmlDiv.parentElement as HTMLElement;
            console.log("✅ Found bracket via alternative method");
            break;
          }
        }
      }

      if (!bracketElement) {
        throw new Error(
          "Bracket element not found. Please refresh and try again."
        );
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
        "PDF bracket PEMULA berhasil didownload!",
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

  const leaderboard = generateLeaderboard();

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
              {onBack && (
                <button
                  onClick={() => {
                    // ✅ Method 1: Full page reload with redirect
                    window.location.href = "/admin-kompetisi/drawing-bagan";

                    // ❌ ATAU jika Method 1 tidak work, gunakan:
                    // navigate("/admin-kompetisi/drawing-bagan");
                    // window.location.reload();
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
                  <span>🥋 KATEGORI PEMULA</span>
                  <span>•</span>
                  <span>{kelasData.kompetisi.lokasi}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
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

              {/* Action Buttons */}
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
                        dojangSeparation.enabled
                          ? "ring-2 ring-offset-1"
                          : ""
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
                          <span className="hidden sm:inline">
                            Processing...
                          </span>
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
                          <span className="hidden sm:inline">
                            Clear Results
                          </span>
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
                          <span className="hidden sm:inline">
                            Delete Bracket
                          </span>
                          <span className="sm:hidden">❌</span>
                        </>
                      )}
                    </button>

                    {/* Download PDF Button */}
                    <button
                      onClick={handleExportPDF}
                      disabled={
                        !bracketGenerated ||
                        exportingPDF ||
                        matches.length === 0
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
                          <span className="hidden sm:inline">
                            Download PDF
                          </span>
                          <span className="sm:hidden">PDF</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
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
      {viewMode === "list"
        ? renderListView()
        : bracketGenerated && matches.length > 0
        ? // PEMULA Layout
          // ... (rest of the bracket rendering logic)
          // The following is the original bracket rendering logic
          (
            <div className="p-6">
                          <div className="flex flex-col items-center gap-8 mx-auto">
                            {/* CENTER: Bracket Container */}
                            <div className="w-full">                  {/* Header Sederhana - Tanpa Border */}
                  <div className="mb-4">
                    {/* Header 3 Kolom - Compact */}
                    <div className="flex items-start justify-between gap-4 mb-3">
                      {/* KOLOM KIRI - Logo PBTI */}
                      <div className="flex-shrink-0 w-20">
                        <img
                          src={taekwondo}
                          alt="PBTI Logo"
                          className="h-16 w-auto object-contain"
                        />
                      </div>

                      {/* KOLOM TENGAH - Info Kejuaraan */}
                      <div className="flex-1 text-center px-3">
                        <h2
                          className="text-xl font-bold mb-1"
                          style={{ color: "#990D35" }}
                        >
                          {kelasData.kompetisi.nama_event}
                        </h2>

                        <p
                          className="text-base font-semibold mb-1"
                          style={{ color: "#050505" }}
                        >
                          {kelasData.kelompok?.nama_kelompok} {displayGender}{" "}
                          {kelasData.kelas_berat?.nama_kelas ||
                            kelasData.poomsae?.nama_kelas}
                        </p>

                        <input
                          type="date"
                          id="tournament-date-display"
                          value={tanggalPertandingan || ""}
                          onChange={(e) =>
                            setTanggalPertandingan(e.target.value)
                          }
                          className="text-sm px-2 py-1 rounded border text-center mb-1"
                          style={{
                            borderColor: "#990D35",
                            color: "#050505",
                          }}
                        />

                        <p
                          className="text-sm mb-1"
                          style={{ color: "#050505", opacity: 0.7 }}
                        >
                          {kelasData.kompetisi.lokasi}
                        </p>

                        <p
                          className="text-sm font-medium"
                          style={{ color: "#990D35" }}
                        >
                          {approvedParticipants.length} Kompetitor
                        </p>
                      </div>

                      {/* KOLOM KANAN - Logo Event */}
                      <div className="flex-shrink-0 w-20">
                        <img
                          src={sriwijaya}
                          alt="Event Logo"
                          className="h-16 w-auto object-contain"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ============================================
            🆕 RENDER BRACKET dengan ADDITIONAL MATCH
            ============================================ */}
                  <div
                    ref={bracketRef}
                    className="tournament-layout bg-white p-6 rounded-lg"
                  >
                    {(() => {
                      const round1Matches = matches.filter(
                        (m) => m.ronde === 1
                      );
                      const round2Matches = matches.filter(
                        (m) => m.ronde === 2
                      );
                      const hasAdditionalMatch = round2Matches.length > 0;
                      const additionalMatch = hasAdditionalMatch
                        ? round2Matches[0]
                        : null;

                      const CARD_HEIGHT = 180;
                      const CARD_WIDTH = 320;
                      const COLUMN_GAP = 120;

                      // 🆕 SMART COLUMN BALANCING LOGIC
                      const MIN_MATCHES_PER_COL = 5;
                      const MAX_MATCHES_PER_COL = 5;

                      let columns: Match[][] = [];
                      let byeMatch: Match | null = null;
                      let lastNormalFightMatch: Match | null = null;
                      let lastNormalFightIndex = -1;
                      let byeMatchIndex = -1;

                      let lastFightColumnIndex = -1;
                      let byeColumnIndex = -1;
                      let lastFightColumn = -1;
                      let byeColumn = -1;

                      if (hasAdditionalMatch) {
                        // ═══════════════════════════════════════════════════════════
                        // SCENARIO GANJIL - Ada Additional Match
                        // ═══════════════════════════════════════════════════════════

                        // 🎯 STEP 1: Find BYE match & Last Fight BEFORE any splitting
                        byeMatch =
                          round1Matches.find(
                            (m) => m.peserta_a && !m.peserta_b
                          ) || null;

                        const byeMatchGlobalIndex = byeMatch
                          ? round1Matches.findIndex(
                              (m) => m.id_match === byeMatch!.id_match
                            )
                          : -1;

                        // Last normal fight = match TEPAT SEBELUM BYE
                        const lastNormalFightGlobalIndex =
                          byeMatchGlobalIndex > 0 ? byeMatchGlobalIndex - 1 : -1;

                        lastNormalFightMatch =
                          lastNormalFightGlobalIndex >= 0
                            ? round1Matches[lastNormalFightGlobalIndex]
                            : null;

                        console.log(
                          "🔍 BYE Match Index (global):",
                          byeMatchGlobalIndex
                        );
                        console.log(
                          "🔍 Last Fight Index (global):",
                          lastNormalFightGlobalIndex
                        );
                        console.log(
                          "🔍 Last Fight Nomor Partai:",
                          lastNormalFightMatch?.nomor_partai
                        );

                        // 🎯 STEP 2: Get NORMAL matches (exclude Last Fight & BYE)
                        const normalMatches = round1Matches.filter(
                          (m, idx) =>
                            idx !== lastNormalFightGlobalIndex &&
                            idx !== byeMatchGlobalIndex
                        );

                        console.log(
                          `📊 Normal matches (excluding Last Fight & BYE): ${normalMatches.length}`
                        );

                        // 🎯 STEP 3: Calculate balanced split for NORMAL matches only
                        const numColumns = Math.max(
                          2,
                          Math.ceil(normalMatches.length / MAX_MATCHES_PER_COL)
                        );
                        const matchesPerCol = Math.ceil(
                          normalMatches.length / numColumns
                        );

                        console.log(
                          `📊 Split Strategy: ${normalMatches.length} normal matches → ${numColumns} columns (${matchesPerCol} matches/col)`
                        );

                        // 🎯 STEP 4: Build columns from NORMAL matches
                        for (
                          let i = 0;
                          i < normalMatches.length;
                          i += matchesPerCol
                        ) {
                          columns.push(
                            normalMatches.slice(i, i + matchesPerCol)
                          );
                        }

                        // 🎯 STEP 5: FORCE Last Fight & BYE to LAST column
                        if (lastNormalFightMatch && byeMatch) {
                          // ✅ PERBAIKAN: Pastikan columns tidak kosong
                          if (columns.length === 0) {
                            // Jika belum ada column sama sekali, buat column baru
                            columns.push([lastNormalFightMatch, byeMatch]);
                            lastFightColumn = 0;
                            lastFightColumnIndex = 0;
                            byeColumn = 0;
                            byeColumnIndex = 1;
                          } else {
                            // Jika sudah ada columns, append ke column terakhir
                            const lastColumnIndex = columns.length - 1;

                            // ✅ SAFETY CHECK: Pastikan column terakhir adalah array
                            if (!Array.isArray(columns[lastColumnIndex])) {
                              columns[lastColumnIndex] = [];
                            }

                            columns[lastColumnIndex].push(lastNormalFightMatch);
                            columns[lastColumnIndex].push(byeMatch);

                            // Calculate indices within that column
                            lastFightColumn = lastColumnIndex;
                            lastFightColumnIndex =
                              columns[lastColumnIndex].length - 2; // Second to last

                            byeColumn = lastColumnIndex;
                            byeColumnIndex =
                              columns[lastColumnIndex].length - 1; // Last position
                          }

                          console.log(
                            "✅ FORCED Last Fight & BYE to same column!"
                          );
                          console.log("   📍 Column:", lastFightColumn);
                          console.log(
                            "   📍 Last Fight Index:",
                            lastFightColumnIndex
                          );
                          console.log("   📍 BYE Index:", byeColumnIndex);
                          console.log(
                            "   📦 Column size:",
                            columns[lastFightColumn]?.length || 0,
                            "matches"
                          );
                        }
                      } else {
                        // ═══════════════════════════════════════════════════════════
                        // SCENARIO GENAP - No Additional Match
                        // ═══════════════════════════════════════════════════════════
                        console.log(
                          "ℹ️ No Additional Match - Using balanced split"
                        );

                        const numColumns = Math.max(
                          2,
                          Math.ceil(round1Matches.length / MAX_MATCHES_PER_COL)
                        );
                        const matchesPerCol = Math.ceil(
                          round1Matches.length / numColumns
                        );

                        console.log(
                          `📊 Balanced Split: ${round1Matches.length} matches → ${numColumns} columns (${matchesPerCol} matches/col)`
                        );

                        for (
                          let i = 0;
                          i < round1Matches.length;
                          i += matchesPerCol
                        ) {
                          columns.push(
                            round1Matches.slice(i, i + matchesPerCol)
                          );
                        }
                      }

                      console.log(
                        "📦 Final Columns:",
                        columns.map((col) => col.length)
                      );

                      // ═══════════════════════════════════════════════════════════
                      // CONNECTOR CALCULATIONS
                      // ═══════════════════════════════════════════════════════════
                      const OFFSET_CONNECTOR = 140;

                      const lastFightY =
                        lastFightColumnIndex >= 0
                          ? lastFightColumnIndex * CARD_HEIGHT +
                            OFFSET_CONNECTOR
                          : OFFSET_CONNECTOR;

                      const byeMatchY =
                        byeColumnIndex >= 0
                          ? byeColumnIndex * CARD_HEIGHT + OFFSET_CONNECTOR
                          : OFFSET_CONNECTOR;

                      const ADDITIONAL_CARD_OFFSET = -70;
                      const additionalMatchY = (lastFightY + byeMatchY) / 2;

                      console.log("📏 Last Fight Y:", lastFightY);
                      console.log("📏 BYE Y:", byeMatchY);
                      console.log("📏 Additional Y:", additionalMatchY);

                      // ═══════════════════════════════════════════════════════════
                      // RENDER BRACKET
                      // ═══════════════════════════════════════════════════════════
                      return (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "40px",
                          }}
                        >
                          <div
                            style={{
                              position: "relative",
                              display: "flex",
                              gap: `${COLUMN_GAP}px`,
                              alignItems: "flex-start",
                            }}
                          >
                            {/* ═══════════════════════════════════════════════════════════
            ROUND 1 MATCHES GRID
            ═══════════════════════════════════════════════════════════ */}
                            <div
                              className="grid gap-6"
                              style={{
                                gridTemplateColumns: `repeat(${columns.length}, ${CARD_WIDTH}px)`,
                                columnGap: "24px",
                              }}
                            >
                              {columns.map((columnMatches, colIndex) => (
                                <div key={colIndex} className="space-y-4">
                                  {columnMatches.map((match, matchIndex) => {
                                    const isByeMatch =
                                      byeMatch &&
                                      match.id_match === byeMatch.id_match;
                                    const isLastFightMatch =
                                      lastNormalFightMatch &&
                                      match.id_match ===
                                        lastNormalFightMatch.id_match;

                                    return (
                                      <div
                                        key={match.id_match}
                                        style={{ position: "relative" }}
                                        id={`match-${match.id_match}`}
                                      >
                                        {/* MATCH CARD (sama seperti sebelumnya) */}
                                        <div
                                          className="bg-white rounded-lg shadow-md border overflow-hidden"
                                          style={{
                                            borderColor: "#DC143C",
                                            borderWidth: "1px",
                                            position: "relative",
                                            zIndex: 10,
                                            background: "white",
                                          }}
                                        >
                                          {/* Header */}
                                          <div
                                            className="px-3 py-2 border-b flex items-center justify-between"
                                            style={{
                                              backgroundColor: "#FFF5F5",
                                              borderColor: "#DC143C",
                                            }}
                                          >
                                            <div className="flex items-center gap-2 flex-1">
                                              {match.nomor_partai && (
                                                <span
                                                  className="text-xs px-2 py-1 rounded-full font-bold"
                                                  style={{
                                                    backgroundColor: "#990D35",
                                                    color: "white",
                                                  }}
                                                >
                                                  No.Partai:{" "}
                                                  {match.nomor_partai}
                                                </span>
                                              )}
                                            </div>

                                            <div className="flex items-center gap-2">
                                              <button
                                                onClick={() =>
                                                  setEditingMatch(match)
                                                }
                                                className="p-1 rounded hover:bg-black/5 transition-all"
                                                disabled={viewOnly}
                                                style={{
                                                  opacity: viewOnly ? 0.3 : 1,
                                                  cursor: viewOnly
                                                    ? "not-allowed"
                                                    : "pointer",
                                                }}
                                                title="Edit match scores and details"
                                              >
                                                <FilePenLine
                                                  size={14}
                                                  style={{ color: "#3B82F6" }}
                                                />
                                              </button>

                                              <button
                                                onClick={() => {
                                                  const hasScores =
                                                    match.skor_a > 0 ||
                                                    match.skor_b > 0;
                                                  if (hasScores) {
                                                    showNotification(
                                                      "warning",
                                                      "Match Sudah Dimulai",
                                                      "Tidak dapat mengubah peserta karena match sudah memiliki skor.",
                                                      () => setShowModal(false)
                                                    );
                                                    return;
                                                  }
                                                  setEditAthleteModal({
                                                    show: true,
                                                    match: match,
                                                    slot: null,
                                                  });
                                                }}
                                                className="p-1 rounded hover:bg-black/5 transition-all"
                                                disabled={
                                                  viewOnly ||
                                                  match.skor_a > 0 ||
                                                  match.skor_b > 0
                                                }
                                                style={{
                                                  opacity:
                                                    viewOnly ||
                                                    match.skor_a > 0 ||
                                                    match.skor_b > 0
                                                      ? 0.3
                                                      : 1,
                                                  cursor:
                                                    viewOnly ||
                                                    match.skor_a > 0 ||
                                                    match.skor_b > 0
                                                      ? "not-allowed"
                                                      : "pointer",
                                                }}
                                                title={
                                                  match.skor_a > 0 ||
                                                  match.skor_b > 0
                                                    ? "Match sudah dimulai - tidak dapat diubah"
                                                    : "Edit athletes"
                                                }
                                              >
                                                <Edit3
                                                  size={14}
                                                  style={{ color: "#DC143C" }}
                                                />
                                              </button>
                                            </div>
                                          </div>

                                          {/* Participants */}
                                          <div className="flex flex-col">
                                            <div
                                              className="px-3 py-3 border-b flex items-start justify-between gap-2"
                                              style={{
                                                borderColor: "#F0F0F0",
                                                minHeight: "70px",
                                              }}
                                            >
                                              {match.peserta_a ? (
                                                <>
                                                  <div className="flex-1 min-w-0">
                                                    <p
                                                      className="font-bold text-lg leading-tight mb-1"
                                                      style={{
                                                        color: "#000",
                                                        wordBreak: "break-word",
                                                      }}
                                                    >
                                                      {getParticipantName(
                                                        match.peserta_a
                                                      )}
                                                    </p>
                                                    <p
                                                      className="text-base leading-tight"
                                                      style={{
                                                        color: "#DC143C",
                                                        opacity: 0.7,
                                                      }}
                                                    >
                                                      {getDojoName(
                                                        match.peserta_a
                                                      )}
                                                    </p>
                                                  </div>
                                                  {(match.skor_a > 0 ||
                                                    match.skor_b > 0) && (
                                                    <div
                                                      className="w-8 h-8 rounded flex items-center justify-center font-bold text-sm flex-shrink-0"
                                                      style={{
                                                        backgroundColor:
                                                          match.skor_a >
                                                          match.skor_b
                                                            ? "#22c55e"
                                                            : "#F0F0F0",
                                                        color:
                                                          match.skor_a >
                                                          match.skor_b
                                                            ? "white"
                                                            : "#6b7280",
                                                      }}
                                                    >
                                                      {match.skor_a}
                                                    </div>
                                                  )}
                                                </>
                                              ) : (
                                                <div className="w-full text-center">
                                                  <span className="text-sm text-gray-400">
                                                    TBD
                                                  </span>
                                                </div>
                                              )}
                                            </div>

                                            <div
                                              className="px-3 py-3 flex items-center justify-center"
                                              style={{
                                                minHeight: "70px",
                                                backgroundColor: match.peserta_b
                                                  ? "transparent"
                                                  : "#FFFBEA",
                                              }}
                                            >
                                              {match.peserta_b ? (
                                                <div className="w-full flex items-start justify-between gap-2">
                                                  <div className="flex-1 min-w-0">
                                                    <p
                                                      className="font-bold text-lg leading-tight mb-1"
                                                      style={{
                                                        color: "#000",
                                                        wordBreak: "break-word",
                                                      }}
                                                    >
                                                      {getParticipantName(
                                                        match.peserta_b
                                                      )}
                                                    </p>
                                                    <p
                                                      className="text-base leading-tight"
                                                      style={{
                                                        color: "#EF4444",
                                                        opacity: 0.7,
                                                      }}
                                                    >
                                                      {getDojoName(
                                                        match.peserta_b
                                                      )}
                                                    </p>
                                                  </div>
                                                  {(match.skor_a > 0 ||
                                                    match.skor_b > 0) && (
                                                    <div
                                                      className="w-8 h-8 rounded flex items-center justify-center font-bold text-sm flex-shrink-0"
                                                      style={{
                                                        backgroundColor:
                                                          match.skor_b >
                                                          match.skor_a
                                                            ? "#22c55e"
                                                            : "#F0F0F0",
                                                        color:
                                                          match.skor_b >
                                                          match.skor_a
                                                            ? "white"
                                                            : "#6b7280",
                                                      }}
                                                    >
                                                      {match.skor_b}
                                                    </div>
                                                  )}
                                                </div>
                                              ) : (
                                                <span
                                                  className="text-xs font-bold px-3 py-1 rounded"
                                                  style={{
                                                    backgroundColor: "#DC143C",
                                                    color: "white",
                                                  }}
                                                >
                                                  BYE
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ))}
                            </div>

                            {/* ═══════════════════════════════════════════════════════════
            ADDITIONAL MATCH (jika ada)
            ═══════════════════════════════════════════════════════════ */}
                            {hasAdditionalMatch && additionalMatch && (
                              <div style={{ position: "relative" }}>
                                {/* SVG Connectors */}
                                <svg
                                  style={{
                                    position: "absolute",
                                    left: `-${COLUMN_GAP}px`,
                                    top: 0,
                                    width: `${COLUMN_GAP}px`,
                                    height: "800px",
                                    pointerEvents: "none",
                                    zIndex: 5,
                                    overflow: "visible",
                                  }}
                                >
                                  {/* Line dari Last Fight Match */}
                                  {lastNormalFightMatch && (
                                    <g>
                                      <line
                                        x1="0"
                                        y1={lastFightY}
                                        x2={COLUMN_GAP / 2}
                                        y2={lastFightY}
                                        stroke="#DC143C"
                                        strokeWidth="3"
                                      />
                                      <line
                                        x1={COLUMN_GAP / 2}
                                        y1={lastFightY}
                                        x2={COLUMN_GAP / 2}
                                        y2={additionalMatchY}
                                        stroke="#DC143C"
                                        strokeWidth="3"
                                      />
                                      <line
                                        x1={COLUMN_GAP / 2}
                                        y1={additionalMatchY}
                                        x2={COLUMN_GAP}
                                        y2={additionalMatchY}
                                        stroke="#DC143C"
                                        strokeWidth="3"
                                      />
                                    </g>
                                  )}

                                  {/* Line dari BYE Match */}
                                  {byeMatch && (
                                    <g>
                                      <line
                                        x1="0"
                                        y1={byeMatchY}
                                        x2={COLUMN_GAP / 2}
                                        y2={byeMatchY}
                                        stroke="#DC143C"
                                        strokeWidth="3"
                                      />
                                      <line
                                        x1={COLUMN_GAP / 2}
                                        y1={byeMatchY}
                                        x2={COLUMN_GAP / 2}
                                        y2={additionalMatchY}
                                        stroke="#DC143C"
                                        strokeWidth="3"
                                      />
                                    </g>
                                  )}
                                </svg>

                                {/* Additional Match Card - (code sama seperti sebelumnya) */}
                                <div
                                  className="bg-white rounded-lg shadow-md border overflow-hidden"
                                  style={{
                                    borderColor: "#FFFBEA",
                                    borderWidth: "3px",
                                    position: "relative",
                                    zIndex: 10,
                                    width: `${CARD_WIDTH}px`,
                                    top: `${
                                      additionalMatchY +
                                      ADDITIONAL_CARD_OFFSET
                                    }px`,
                                  }}
                                >
                                  <div
                                    className="px-3 py-2 border-b flex items-center justify-between"
                                    style={{
                                      backgroundColor: "#FFFBEA",
                                      borderColor: "#DC143C",
                                    }}
                                  >
                                    <div className="flex items-center gap-2 flex-1">
                                      {additionalMatch.nomor_partai && (
                                        <span
                                          className="text-xs px-2 py-1 rounded-full font-bold"
                                          style={{
                                            backgroundColor: "#DC143C",
                                            color: "white",
                                          }}
                                        >
                                          No.Partai:{" "}
                                          {additionalMatch.nomor_partai}
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                      {/* Edit match scores/details button */}
                                      <button
                                        onClick={() =>
                                          setEditingMatch(additionalMatch)
                                        }
                                        className="p-1 rounded hover:bg-black/5 transition-all"
                                        disabled={viewOnly}
                                        style={{
                                          opacity: viewOnly ? 0.3 : 1,
                                          cursor: viewOnly
                                            ? "not-allowed"
                                            : "pointer",
                                        }}
                                        title="Edit match scores and details"
                                      >
                                        <FilePenLine
                                          size={14}
                                          style={{ color: "#3B82F6" }}
                                        />
                                      </button>

                                      {/* Edit athletes button */}
                                      <button
                                        onClick={() => {
                                          const hasScores =
                                            additionalMatch.skor_a > 0 ||
                                            additionalMatch.skor_b > 0;
                                          if (hasScores) {
                                            showNotification(
                                              "warning",
                                              "Match Sudah Dimulai",
                                              "Tidak dapat mengubah peserta karena match sudah memiliki skor.",
                                              () => setShowModal(false)
                                            );
                                            return;
                                          }
                                          setEditAthleteModal({
                                            show: true,
                                            match: additionalMatch,
                                            slot: null,
                                          });
                                        }}
                                        className="p-1 rounded hover:bg-black/5 transition-all"
                                        disabled={
                                          viewOnly ||
                                          additionalMatch.skor_a > 0 ||
                                          additionalMatch.skor_b > 0
                                        }
                                        style={{
                                          opacity:
                                            viewOnly ||
                                            additionalMatch.skor_a > 0 ||
                                            additionalMatch.skor_b > 0
                                              ? 0.3
                                              : 1,
                                          cursor:
                                            viewOnly ||
                                            additionalMatch.skor_a > 0 ||
                                            additionalMatch.skor_b > 0
                                              ? "not-allowed"
                                              : "pointer",
                                        }}
                                        title={
                                          additionalMatch.skor_a > 0 ||
                                          additionalMatch.skor_b > 0
                                            ? "Match sudah dimulai - tidak dapat diubah"
                                            : "Edit athletes"
                                        }
                                      >
                                        <Edit3
                                          size={14}
                                          style={{ color: "#DC143C" }}
                                        />
                                      </button>
                                    </div>
                                  </div>

                                  <div className="flex flex-col">
                                    <div
                                      className="px-3 py-3 border-b flex items-start justify-between gap-2"
                                      style={{
                                        borderColor: "#F0F0F0",
                                        minHeight: "70px",
                                      }}
                                    >
                                      {additionalMatch.peserta_a ? (
                                        <>
                                          <div className="flex-1 min-w-0">
                                            <p
                                              className="font-bold text-lg leading-tight mb-1"
                                              style={{
                                                color: "#000",
                                                wordBreak: "break-word",
                                              }}
                                            >
                                              {getParticipantName(
                                                additionalMatch.peserta_a
                                              )}
                                            </p>
                                            <p
                                              className="text-base leading-tight"
                                              style={{
                                                color: "#DC143C",
                                                opacity: 0.7,
                                              }}
                                            >
                                              {getDojoName(
                                                additionalMatch.peserta_a
                                              )}
                                            </p>
                                          </div>
                                          {(additionalMatch.skor_a > 0 ||
                                            additionalMatch.skor_b > 0) && (
                                            <div
                                              className="w-8 h-8 rounded flex items-center justify-center font-bold text-sm flex-shrink-0"
                                              style={{
                                                backgroundColor:
                                                  additionalMatch.skor_a >
                                                  additionalMatch.skor_b
                                                    ? "#22c55e"
                                                    : "#F0F0F0",
                                                color:
                                                  additionalMatch.skor_a >
                                                  additionalMatch.skor_b
                                                    ? "white"
                                                    : "#6b7280",
                                              }}
                                            >
                                              {additionalMatch.skor_a}
                                            </div>
                                          )}
                                        </>
                                      ) : (
                                        <div className="w-full text-center">
                                          <span
                                            className="text-xs font-bold px-3 py-1 rounded"
                                            style={{
                                              backgroundColor: "#DC143C",
                                              color: "white",
                                            }}
                                          >
                                            ⏳ Waiting for Match{" "}
                                            {lastNormalFightMatch?.nomor_partai ||
                                              "TBD"}
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    <div
                                      className="px-3 py-3 flex items-center justify-center"
                                      style={{
                                        minHeight: "70px",
                                        backgroundColor: "#FFFBEA",
                                      }}
                                    >
                                      {additionalMatch.peserta_b ? (
                                        <div className="w-full flex items-start justify-between gap-2">
                                          <div className="flex-1 min-w-0">
                                            <p
                                              className="font-bold text-lg leading-tight mb-1"
                                              style={{
                                                color: "#000",
                                                wordBreak: "break-word",
                                              }}
                                            >
                                              {getParticipantName(
                                                additionalMatch.peserta_b
                                              )}
                                            </p>
                                            <p
                                              className="text-base leading-tight"
                                              style={{
                                                color: "#EF4444",
                                                opacity: 0.7,
                                              }}
                                            >
                                              {getDojoName(
                                                additionalMatch.peserta_b
                                              )}
                                            </p>
                                          </div>
                                          {(additionalMatch.skor_a > 0 ||
                                            additionalMatch.skor_b > 0) && (
                                            <div
                                              className="w-8 h-8 rounded flex items-center justify-center font-bold text-sm flex-shrink-0"
                                              style={{
                                                backgroundColor:
                                                  additionalMatch.skor_b >
                                                  additionalMatch.skor_a
                                                    ? "#22c55e"
                                                    : "#F0F0F0",
                                                color:
                                                  additionalMatch.skor_b >
                                                  additionalMatch.skor_a
                                                    ? "white"
                                                    : "#6b7280",
                                              }}
                                            >
                                              {additionalMatch.skor_b}
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-sm text-gray-400">
                                          TBD
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="w-full">
                            <div
                              className="bg-white rounded-lg shadow-md border overflow-hidden"
                              style={{ borderColor: "#DC143C" }}
                            >
                              <div
                                className="px-4 py-3 border-b"
                                style={{
                                  backgroundColor: "#FFF5F5",
                                  borderColor: "#DC143C",
                                }}
                              >
                                <div className="flex items-center gap-2 justify-center">
                                  <Trophy
                                    size={24}
                                    style={{ color: "#DC143C" }}
                                  />
                                  <h3
                                    className="text-xl font-bold"
                                    style={{ color: "#DC143C" }}
                                  >
                                    LEADERBOARD
                                  </h3>
                                </div>
                              </div>

                              <div className="p-4">
                                {/* GOLD MEDALS */}
                                {leaderboard &&
                                  leaderboard.gold.length > 0 && (
                                    <div className="mb-6">
                                      <div className="flex items-center gap-2 mb-3 px-2">
                                        <h4
                                          className="font-bold text-base"
                                          style={{ color: "#000" }}
                                        >
                                          GOLD MEDALS (
                                          {leaderboard.gold.length})
                                        </h4>
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                        {leaderboard.gold.map(
                                          (participant, idx) => (
                                            <div
                                              key={participant.id}
                                              className="p-2 rounded border"
                                              style={{
                                                backgroundColor: "#FFFBEA",
                                                borderColor: "#F5B700",
                                              }}
                                            >
                                              <div className="flex items-start gap-2">
                                                <span
                                                  className="text-xs font-bold flex-shrink-0"
                                                  style={{ color: "#F5B700" }}
                                                >
                                                  {idx + 1}.
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                  <p
                                                    className="font-bold text-xs leading-tight truncate"
                                                    style={{ color: "#000" }}
                                                    title={participant.name}
                                                  >
                                                    {participant.name}
                                                  </p>
                                                  <p
                                                    className="text-xs leading-tight truncate"
                                                    style={{
                                                      color: "#DC143C",
                                                      opacity: 0.7,
                                                    }}
                                                    title={participant.dojo}
                                                  >
                                                    {participant.dojo}
                                                  </p>
                                                </div>
                                              </div>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  )}

                                {/* SILVER MEDALS */}
                                {leaderboard &&
                                  leaderboard.silver.length > 0 && (
                                    <div className="mb-6">
                                      <div className="flex items-center gap-2 mb-3 px-2">
                                        <h4
                                          className="font-bold text-base"
                                          style={{ color: "#000" }}
                                        >
                                          SILVER MEDALS (
                                          {leaderboard.silver.length})
                                        </h4>
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                        {leaderboard.silver.map(
                                          (participant, idx) => (
                                            <div
                                              key={participant.id}
                                              className="p-2 rounded border"
                                              style={{
                                                backgroundColor: "#F5F5F5",
                                                borderColor: "#C0C0C0",
                                              }}
                                            >
                                              <div className="flex items-start gap-2">
                                                <span
                                                  className="text-xs font-bold flex-shrink-0"
                                                  style={{ color: "#9CA3AF" }}
                                                >
                                                  {idx + 1}.
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                  <p
                                                    className="font-bold text-xs leading-tight truncate"
                                                    style={{ color: "#000" }}
                                                    title={participant.name}
                                                  >
                                                    {participant.name}
                                                  </p>
                                                  <p
                                                    className="text-xs leading-tight truncate"
                                                    style={{
                                                      color: "#DC143C",
                                                      opacity: 0.7,
                                                    }}
                                                    title={participant.dojo}
                                                  >
                                                    {participant.dojo}
                                                  </p>
                                                </div>
                                              </div>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  )}

                                {/* Empty State */}
                                {leaderboard &&
                                  leaderboard.gold.length === 0 && (
                                    <div className="text-center py-6">
                                      <Trophy
                                        size={40}
                                        style={{
                                          color: "#DC143C",
                                          opacity: 0.3,
                                        }}
                                        className="mx-auto mb-2"
                                      />
                                      <p
                                        className="text-sm"
                                        style={{
                                          color: "#050505",
                                          opacity: 0.5,
                                        }}
                                      >
                                        Belum ada hasil pertandingan
                                      </p>
                                    </div>
                                  )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )
        : // Empty state
          (
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
                    {loading
                      ? "Processing..."
                      : "Preview & Generate Bracket"}
                  </button>
                )}
              </div>
            </div>
          )}

      {/* Participant Preview Modal */}
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

      {/* Dojang Separation Modal */}
      {showDojangModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            {/* Header */}
            <div className="p-6 border-b" style={{ borderColor: "#990D35" }}>
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "#990D35" }}
                >
                  <Users size={20} style={{ color: "white" }} />
                </div>
                <div className="flex-1">
                  <h3
                    className="text-xl font-bold"
                    style={{ color: "#050505" }}
                  >
                    Dojang Separation
                  </h3>
                  <p
                    className="text-sm mt-1"
                    style={{ color: "#050505", opacity: 0.6 }}
                  >
                    {/* ⭐ CONDITIONAL TEXT */}
                    {window.location.pathname.includes("pemula")
                      ? "Pisahkan atlet se-dojang agar tidak bertemu (STRICT mode)"
                      : "Pisahkan atlet se-dojang di pool kiri-kanan (STRICT mode)"}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Toggle Enable/Disable */}
              <div
                className="flex items-center justify-between p-4 rounded-lg border-2 transition-all"
                style={{
                  borderColor: dojangSeparation.enabled
                    ? "#10B981"
                    : "rgba(153, 13, 53, 0.2)",
                }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p
                      className="font-bold text-base"
                      style={{ color: "#050505" }}
                    >
                      Aktifkan Pemisahan
                    </p>
                    {dojangSeparation.enabled && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-bold"
                        style={{ backgroundColor: "#10B981", color: "white" }}
                      >
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: "#050505", opacity: 0.6 }}
                  >
                    {window.location.pathname.includes("pemula")
                      ? "Atlet se-dojang tidak akan bertemu di semua match"
                      : "Atlet se-dojang tidak akan bertemu sampai Semi-Final"}
                  </p>
                </div>

                {/* Toggle Switch */}
                <button
                  onClick={() =>
                    setDojangSeparation((prev) => ({
                      ...prev,
                      enabled: !prev.enabled,
                    }))
                  }
                  className={`relative w-14 h-8 rounded-full transition-all ${
                    dojangSeparation.enabled ? "bg-green-500" : "bg-gray-300"
                  }`}
                  aria-label="Toggle dojang separation"
                >
                  <div
                    className={`absolute w-6 h-6 bg-white rounded-full shadow-md transform transition-transform top-1 ${
                      dojangSeparation.enabled
                        ? "translate-x-7"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Info Box - STRICT Mode Explanation */}
              {dojangSeparation.enabled && (
                <div
                  className="p-4 rounded-lg border-2"
                  style={{
                    backgroundColor: "rgba(59, 130, 246, 0.05)",
                    borderColor: "rgba(59, 130, 246, 0.2)",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: "#3B82F6" }}
                      >
                        <span className="text-white text-xs font-bold">ℹ️</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p
                        className="text-sm font-bold mb-1"
                        style={{ color: "#3B82F6" }}
                      >
                        Mode: STRICT
                      </p>
                      <p
                        className="text-xs leading-relaxed"
                        style={{ color: "#050505", opacity: 0.7 }}
                      >
                        {window.location.pathname.includes("pemula")
                          ? "Algoritma akan memastikan atlet dari dojang yang sama TIDAK bertemu di Round 1 (kecuali mathematically impossible)."
                          : "Atlet dari dojang yang sama akan dipisah ke pool KIRI dan KANAN. Mereka hanya bisa bertemu di Semi-Final atau Final."}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t flex gap-3 bg-gray-50">
              <button
                onClick={() => setShowDojangModal(false)}
                className="flex-1 py-2.5 px-4 rounded-lg border-2 font-medium transition-all hover:bg-white"
                style={{ borderColor: "#990D35", color: "#990D35" }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowDojangModal(false);
                  if (dojangSeparation.enabled) {
                    showNotification(
                      "success",
                      "Dojang Separation Enabled",
                      "Mode STRICT aktif. Generate atau Shuffle bracket untuk menerapkan.",
                      () => setShowModal(false)
                    );
                  }
                }}
                className="flex-1 py-2.5 px-4 rounded-lg font-medium transition-all hover:opacity-90 shadow-md"
                style={{ backgroundColor: "#990D35", color: "#F5FBEF" }}
              >
                {dojangSeparation.enabled ? "✓ Apply" : "OK"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================
    📱 RESPONSIVE CSS (Add to style tag)
    ============================================ */}
      <style>{`
  /* Responsive button text visibility */
  @media (max-width: 640px) {
    .hidden.sm\\:inline {
      display: none !important;
    }
    .sm\\:hidden {
      display: inline !important;
    }
  }

  @media (min-width: 641px) {
    .hidden.sm\\:inline {
      display: inline !important;
    }
    .sm\\:hidden {
      display: none !important;
    }
  }

  @media (max-width: 768px) {
    .hidden.md\\:inline {
      display: none !important;
    }
    .md\\:hidden {
      display: inline !important;
    }
  }

  @media (min-width: 769px) {
    .hidden.md\\:inline {
      display: inline !important;
    }
    .md\\:hidden {
      display: none !important;
    }
  }

  /* Button hover effects */
  button:not(:disabled):hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  /* Smooth transitions */
  button {
    transition: all 0.2s ease;
  }
`}</style>
      {editingMatch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="p-6 border-b" style={{ borderColor: "#990D35" }}>
                <h3 className="text-xl font-bold" style={{ color: "#050505" }}>
                Input Hasil Pertandingan
                </h3>
                <p className="text-sm mt-1" style={{ color: "#050505", opacity: 0.6 }}>
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
                    <label htmlFor="tanggalPertandingan" className="block text-sm font-medium text-gray-700">
                        Tanggal Pertandingan
                    </label>
                    <input
                        type="date"
                        id="tanggalPertandingan"
                        defaultValue={editingMatch.tanggal_pertandingan?.split('T')[0]}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                        <label htmlFor="nomorAntrian" className="block text-sm font-medium text-gray-700">
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
                        <label htmlFor="nomorLapangan" className="block text-sm font-medium text-gray-700">
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
                    const scoreA = parseInt((document.getElementById("scoreA") as HTMLInputElement).value) || 0;
                    const scoreB = parseInt((document.getElementById("scoreB") as HTMLInputElement).value) || 0;
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

export default TournamentBracketPemula;
