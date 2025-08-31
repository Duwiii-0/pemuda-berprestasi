// src/pages/admin/ValidasiPeserta.tsx
import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle, Loader, Eye, Trophy } from "lucide-react";
import { useKompetisi } from "../../context/KompetisiContext";
import { setAuthToken } from "../../../pemuda-berprestasi-mvp/src/config/api";
import { useAuth } from "../../context/authContext";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SelectTeamMemberModal from "../../components/selectTeamModal";

const ValidasiPeserta: React.FC = () => {
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      setAuthToken(token);
    }
  }, [token]);

  const {
    kompetisiList,
    fetchKompetisiList,
    loadingKompetisi,
    pesertaList, // KONSISTEN: gunakan pesertaList
    fetchAtletByKompetisi,
    loadingAtlet,
    updatePesertaStatus,
  } = useKompetisi();

  const [processing, setProcessing] = useState<number | null>(null);
  const [selectedKompetisiId, setSelectedKompetisiId] = useState<number | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [filterCategory, setFilterCategory] = useState<"ALL" | "DOJANG" | "POOMSAE">("ALL");
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const navigate = useNavigate();

  const handlePesertaClick = (peserta: any) => {
    if (peserta.is_team) {
      setSelectedTeam(peserta); // simpan data tim
      setTeamModalOpen(true);    // buka modal
    } else if (peserta.atlet?.id_atlet) {
      navigate(`/dashboard/atlit/${peserta.atlet.id_atlet}`);
    }
  };

  useEffect(() => {
    console.log("[ValidasiPeserta] Fetching kompetisi list...");
    fetchKompetisiList();
  }, []);

  useEffect(() => {
    console.log("[ValidasiPeserta] Kompetisi list updated:", kompetisiList);
  }, [kompetisiList]);

  useEffect(() => {
    if (selectedKompetisiId) {
      console.log(
        `[ValidasiPeserta] Kompetisi dipilih ID: ${selectedKompetisiId}, fetching peserta...`
      );
      fetchAtletByKompetisi(selectedKompetisiId);
    }
  }, [selectedKompetisiId]);

  // FIX: Ganti atletList dengan pesertaList
  useEffect(() => {
    console.log("[ValidasiPeserta] Peserta list state updated:", pesertaList);
    
    // Debug struktur data lengkap
    if (pesertaList.length > 0) {
      console.log("=== DEBUGGING STRUKTUR DATA ===");
      console.log("Sample data item 0:", pesertaList[0]);
      console.log("Available keys:", Object.keys(pesertaList[0]));
      
      // Cek apakah ada nested objects
      Object.keys(pesertaList[0]).forEach(key => {
        if (typeof (pesertaList[0] as any) [key] === 'object' && (pesertaList[0] as any) [key] !== null) {
          console.log(`Nested object in ${key}:`, (pesertaList[0] as any)[key]);
        }
      });
      
      // Cek item yang is_team: false (individual)
      const individualPeserta = pesertaList.find(item => !item.is_team);
      if (individualPeserta) {
        console.log("Individual peserta sample:", individualPeserta);
      }
      
      // Cek item yang is_team: true (tim)
      const teamPeserta = pesertaList.find(item => item.is_team);
      if (teamPeserta) {
        console.log("Team peserta sample:", teamPeserta);
      }
      console.log("=== END DEBUGGING ===");
    }
  }, [pesertaList]); // FIX: pesertaList bukan atletList

  const handleApproval = async (id: number) => {
  if (!selectedKompetisiId) return;
  setProcessing(id);
  try {
    await updatePesertaStatus(selectedKompetisiId, id, "APPROVED");
    console.log(`[ValidasiPeserta] Peserta ID ${id} sudah disetujui.`);
  } catch (err) {
    console.error("Gagal menyetujui peserta:", err);
  } finally {
    setProcessing(null);
  }
};

const handleRejection = async (id: number) => {
  if (!selectedKompetisiId) return;
  setProcessing(id);
  try {
    await updatePesertaStatus(selectedKompetisiId, id, "REJECTED");
    console.log(`[ValidasiPeserta] Peserta ID ${id} sudah ditolak.`);
  } catch (err) {
    console.error("Gagal menolak peserta:", err);
  } finally {
    setProcessing(null);
  }
};


  const getGenderBadge = (gender: string) =>
    gender === "LAKI_LAKI" ? (
      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
        Laki-Laki
      </span>
    ) : (
      <span className="bg-pink-100 text-pink-800 px-2 py-1 rounded-full text-xs">
        Perempuan
      </span>
    );
  
  const filteredKompetisi = kompetisiList.filter((k) =>
    k.nama_event.toLowerCase().includes(searchTerm.toLowerCase())
  );


  if (!selectedKompetisiId) {
    console.log(
      "[ValidasiPeserta] Tidak ada kompetisi dipilih, menampilkan list."
    );
    return (
      <div className="p-8 max-w-full mx-auto space-y-10 px-48 font-sans">
        {/* HEADER */}
        <div className="flex items-center gap-3 mb-6">
          <Trophy size={60} className="text-yellow-500" />
          <div>
            <h1 className="text-7xl font-bebas text-black/90">List Kompetisi</h1>
            <p className="text-black/60 text-xl mt-1">Klik table untuk memvalidasi peserta kompetisi</p>
          </div>
        </div>
        {/* Bagian search */}
        <div className="relative max-w-md mb-6">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={22}
          />
          <input
            type="text"
            placeholder="Cari kompetisi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-3xl border border-gray-200 shadow-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-lg transition placeholder-gray-400"
          />
        </div>
      {loadingKompetisi ? (
            <p className="text-gray-500">Loading data kompetisi...</p>
          ) : (
            <div className="overflow-x-auto bg-white rounded-xl shadow-md">
              <table className="w-full min-w-[600px]">
                <thead className="bg-yellow-400 text-gray-900">
                  <tr>
                    <th className="py-2 md:py-3 px-4 md:px-6 text-left font-semibold text-sm md:text-base">Nama Event</th>
                    <th className="py-2 md:py-3 px-4 md:px-6 text-left font-semibold text-sm md:text-base">Tanggal Mulai</th>
                    <th className="py-2 md:py-3 px-4 md:px-6 text-left font-semibold text-sm md:text-base">Status</th>
                    <th className="py-2 md:py-3 px-4 md:px-6 text-left font-semibold text-sm md:text-base">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredKompetisi.map((k) => (
                    <tr
                      key={k.id_kompetisi}
                      className="border-t border-gray-200 hover:bg-yellow-50 transition-colors cursor-pointer"
                    >
                      <td className="py-2 md:py-4 px-4 md:px-6 font-medium text-gray-800 text-sm md:text-base">{k.nama_event}</td>
                      <td className="py-2 md:py-4 px-4 md:px-6 text-gray-700 text-sm md:text-base">
                        {new Date(k.tanggal_mulai).toLocaleDateString("id-ID")}
                      </td>
                      <td className="py-2 md:py-4 px-4 md:px-6 text-sm md:text-base">
                        <span
                          className={`px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-semibold ${
                            k.status === "PENDAFTARAN"
                              ? "bg-green-100 text-green-800"
                              : k.status === "SEDANG_DIMULAI"
                              ? "bg-yellow-100 text-yellow-800"
                              : k.status === "SELESAI"
                              ? "bg-gray-100 text-gray-600"
                              : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {k.status
                            .toLowerCase()
                            .split("_")
                            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(" ")}
                        </span>
                      </td>
                      <td className="py-2 md:py-4 px-4 md:px-6">
                        <button
                          onClick={() => setSelectedKompetisiId(k.id_kompetisi)}
                          className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2 text-sm md:text-base"
                        >
                          <Eye size={16} /> Pilih
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    );
  }

  // FIX: Ganti atletList dengan pesertaList
  console.log(
    "[ValidasiPeserta] Menampilkan peserta kompetisi ID:",
    selectedKompetisiId,
    pesertaList
  );

  // FIX: Update filtering logic untuk pesertaList
  const displayedPesertas = pesertaList.filter((peserta) => {
  const namaPeserta = peserta.is_team
    ? peserta.anggota_tim?.map((a) => a.atlet.nama_atlet).join(" ") || ""
    : peserta.atlet?.nama_atlet || "";

  const matchesSearch = namaPeserta.toLowerCase().includes(searchTerm.toLowerCase());
  const matchesStatus = filterStatus === "ALL" || peserta.status === filterStatus;

  // kategori dari kelas_kejuaraan.cabang ("POOMSAE" | "KYORUGI")
  const kategori = peserta.kelas_kejuaraan?.cabang?.toUpperCase() || "";
  const matchesCategory =
    filterCategory === "ALL" || kategori === filterCategory.toUpperCase();

  return matchesSearch && matchesStatus && matchesCategory;
});


  return (
<div className="p-6 max-w-full mx-auto space-y-10 px-48 ">
  <h1 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
    Validasi Peserta Kompetisi
  </h1>

  <button
    onClick={() => setSelectedKompetisiId(null)}
    className="mb-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm flex items-center gap-1"
  >
    ← Kembali ke Daftar Kompetisi
  </button>

{/* FILTER + SEARCH */}
<div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
    {/* Search */}
    <div className="relative md:col-span-2">
      <Search
        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
        size={20}
      />
      <input
        type="text"
        placeholder="Cari peserta..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full pl-10 pr-4 py-3 rounded-full border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm md:text-base placeholder-gray-400 transition-colors"
      />
    </div>

    {/* Filter Status */}
    <div>
      <label className="block text-gray-600 text-xs md:text-sm mb-1">Status</label>
      <select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value as any)}
        className="w-full px-4 py-3 rounded-full border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm md:text-base transition-colors"
      >
        {["ALL", "PENDING", "APPROVED", "REJECTED"].map((s) => (
          <option key={s} value={s}>
            {s === "ALL" ? "Semua Status" : s}
          </option>
        ))}
      </select>
    </div>

    {/* Filter Kategori */}
    <div>
      <label className="block text-gray-600 text-xs md:text-sm mb-1">Kategori</label>
      <select
        value={filterCategory}
        onChange={(e) => setFilterCategory(e.target.value as any)}
        className="w-full px-4 py-3 rounded-full border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm md:text-base transition-colors"
      >
        {["ALL", "POOMSAE", "KYORUGI"].map((c) => (
          <option key={c} value={c}>
            {c === "ALL" ? "Semua Kategori" : c}
          </option>
        ))}
      </select>
    </div>
  </div>
</div>

  {loadingAtlet ? (
    <p className="text-gray-500">Loading data peserta...</p>
  ) : (
    <div className="overflow-x-auto bg-white rounded-xl shadow-md">
      <table className="w-full min-w-[800px]">
        <thead className="bg-yellow-400 text-gray-900">
<tr>
  {["Nama", "Kategori", "Kelas Berat", "Kelas Poomsae", "Kelompok Usia", "Jenis Kelamin", "Nama Dojang", "Status", "Aksi"].map((header) => (
    <th
      key={header}
      className={`py-2 md:py-3 px-4 md:px-6 font-semibold text-sm md:text-base ${
        header === "Status" || header === "Aksi" ? "text-center" : "text-left"
      }`}
    >
      {header}
    </th>
  ))}
</tr>
        </thead>
        <tbody>
          {displayedPesertas.map((peserta: any) => {
            const isTeam = peserta.is_team;
            const cabang = peserta.kelas_kejuaraan?.cabang || "-";
            const level = peserta.kelas_kejuaraan?.kategori_event?.nama_kategori || "-";
            const kelasBerat =
              cabang === "KYORUGI"
                ? peserta.kelas_kejuaraan?.kelas_berat?.nama_kelas || (peserta.atlet?.berat_badan ? `${peserta.atlet.berat_badan} kg` : "-")
                : "-";
            const kelasPoomsae =
              cabang === "POOMSAE"
                ? peserta.kelas_kejuaraan?.poomsae?.nama_kelas || peserta.atlet?.belt || "-"
                : "-";
            const namaPeserta = isTeam
              ? peserta.anggota_tim?.map((m: any) => m.atlet.nama_atlet).join(", ")
              : peserta.atlet?.nama_atlet || "-";
            const dojang =
              isTeam && peserta.anggota_tim?.length
                ? peserta.anggota_tim[0]?.atlet?.dojang?.nama_dojang || "-"
                : peserta.atlet?.dojang?.nama_dojang || "-";

            return (
              <tr
                key={peserta.id_peserta_kompetisi}
                className="border-b border-gray-200 hover:bg-yellow-50 transition-colors cursor-pointer"
                onClick={() => handlePesertaClick(peserta)}
              >
                <td className="py-2 md:py-4 px-4 md:px-6 font-medium text-gray-800 text-sm md:text-base">{namaPeserta}</td>
                <td className="py-2 md:py-4 px-4 md:px-6 text-gray-700 text-sm md:text-base">{`${cabang} - ${level}`}</td>
                <td className="py-2 md:py-4 px-4 md:px-6 text-gray-700 text-sm md:text-base">{kelasBerat}</td>
                <td className="py-2 md:py-4 px-4 md:px-6 text-center text-gray-700 text-sm md:text-base">{kelasPoomsae}</td>
                <td className="py-2 md:py-4 px-4 md:px-6 text-center text-gray-700 text-sm md:text-base">
                  {peserta.kelas_kejuaraan?.kelompok?.nama_kelompok || (peserta.atlet?.umur ? `${peserta.atlet.umur} th` : "-")}
                </td>
                <td className="py-2 md:py-4 px-4 md:px-6 text-center">
                  {!isTeam 
                    ? (peserta.atlet?.jenis_kelamin ? getGenderBadge(peserta.atlet.jenis_kelamin) : "-")
                    : "-"}
                </td>
                <td className="py-2 md:py-4 px-4 md:px-6 text-gray-700 text-sm md:text-base">{dojang}</td>
                <td className="py-2 md:py-4 px-4 md:px-6 text-center">
                  <span
                    className={`px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-semibold ${
                      peserta.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-800"
                        : peserta.status === "APPROVED"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {peserta.status}
                  </span>
                </td>
                <td className="py-2 md:py-4 px-4 md:px-6 flex gap-2 justify-center">
                  <button
                      onClick={(e) => {
                          e.stopPropagation(); // <-- ini penting
                          handleApproval(peserta.id_peserta_kompetisi);
                        }}
                    disabled={processing === peserta.id_peserta_kompetisi}
                    className="cursor-pointer flex items-center gap-1 px-3 md:px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-all text-xs md:text-sm font-medium"
                  >
                    {processing === peserta.id_peserta_kompetisi ? <Loader size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                    Setujui
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // <-- ini penting
                      handleRejection(peserta.id_peserta_kompetisi);
                    }}
                    disabled={processing === peserta.id_peserta_kompetisi}
                    className="cursor-pointer flex items-center gap-1 px-3 md:px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-all text-xs md:text-sm font-medium"
                  >
                    {processing === peserta.id_peserta_kompetisi ? <Loader size={16} className="animate-spin" /> : <XCircle size={16} />}
                    Tolak
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  )}

  <SelectTeamMemberModal
    isOpen={teamModalOpen}
    anggotaTim={selectedTeam?.anggota_tim?.map((a: any) => a.atlet) || []}
    onClose={() => setTeamModalOpen(false)}
    onSelect={(atlet) => {
      setTeamModalOpen(false);
      if (atlet.id_atlet) {
        navigate(`/dashboard/atlit/${atlet.id_atlet}`);
      }
    }}
  />
</div>
  )
};

export default ValidasiPeserta;