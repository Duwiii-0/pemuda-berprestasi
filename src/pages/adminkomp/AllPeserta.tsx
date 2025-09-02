// src/pages/admin/AllPeserta.tsx
import React, { useEffect, useState } from "react";
import { CheckCircle, XCircle, Loader, Search, Users } from "lucide-react";
import { useAuth } from "../../context/authContext";
import { useKompetisi } from "../../context/KompetisiContext";
import { setAuthToken } from "../../../pemuda-berprestasi-mvp/src/config/api";
import Select from "react-select";
import { useNavigate } from "react-router-dom";
import SelectTeamMemberModal from "../../components/selectTeamModal";


const AllPeserta: React.FC = () => {
  const { token, user } = useAuth();
  const { pesertaList, fetchAtletByKompetisi, updatePesertaStatus, loadingAtlet } = useKompetisi();
  const navigate = useNavigate();
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any[]>([]);

  const [processing, setProcessing] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [filterCategory, setFilterCategory] = useState<"ALL" | "KYORUGI" | "POOMSAE">("ALL");
  const [filterKelasBerat, setFilterKelasBerat] = useState<string | null>(null);
  const [filterKelasUsia, setFilterKelasUsia] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<"pemula" | "prestasi" | null>(null);

  const kompetisiId = user?.role === "ADMIN_KOMPETISI" ? user?.admin_kompetisi?.id_kompetisi : null;


  type CategoryOption = { value: "ALL" | "KYORUGI" | "POOMSAE"; label: string };

  const handleRowClick = (peserta: any) => {
    if (peserta.is_team) {
      setSelectedTeam(peserta.anggota_tim.map((a: any) => a.atlet));
      setTeamModalOpen(true);
    } else if (peserta.atlet?.id_atlet) {
      navigate(`/dashboard/atlit/${peserta.atlet.id_atlet}`);
    }
  };


  useEffect(() => {
    if (token) setAuthToken(token);
  }, [token]);

  useEffect(() => {
    if (kompetisiId) fetchAtletByKompetisi(kompetisiId);
  }, [kompetisiId]);

  if (user?.role !== "ADMIN_KOMPETISI") {
    return (
      <div className="p-6 text-red-600 font-semibold">
        Akses ditolak. Hanya Admin Kompetisi yang dapat melihat daftar peserta.
      </div>
    );
  }

  if (!kompetisiId) {
    return (
      <div className="p-6 text-gray-600">⚠ Tidak ada kompetisi terkait akun ini.</div>
    );
  }

  const handleApproval = async (id: number) => {
    if (!kompetisiId) return;
    setProcessing(id);
    try {
      await updatePesertaStatus(kompetisiId, id, "APPROVED");
    } finally {
      setProcessing(null);
    }
  };

  const handleRejection = async (id: number) => {
    if (!kompetisiId) return;
    setProcessing(id);
    try {
      await updatePesertaStatus(kompetisiId, id, "REJECTED");
    } finally {
      setProcessing(null);
    }
  };

  const displayedPesertas = pesertaList.filter((peserta: any) => {
  // Nama peserta (team atau individu)
  const namaPeserta = peserta.is_team
    ? peserta.anggota_tim?.map((a: any) => a.atlet.nama_atlet).join(" ") || ""
    : peserta.atlet?.nama_atlet || "";

  const matchesSearch = namaPeserta.toLowerCase().includes(searchTerm.toLowerCase());

  // Status
  const pesertaStatus = peserta.status?.toUpperCase() || "";
  const matchesStatus = filterStatus === "ALL" || pesertaStatus === filterStatus.toUpperCase();

  // Kategori / cabang
  const kategori = peserta.kelas_kejuaraan?.cabang?.toUpperCase() || "";
  const matchesCategory = filterCategory === "ALL" || kategori === filterCategory.toUpperCase();

  // Kelas berat
  const kelasBerat = peserta.kelas_kejuaraan?.kelas_berat?.nama_kelas?.toUpperCase() || "";
  const matchesKelasBerat = !filterKelasBerat || kelasBerat === filterKelasBerat.toUpperCase();

  // Kelas usia / kelompok
  const kelasUsia = peserta.kelas_kejuaraan?.kelompok?.nama_kelompok?.toUpperCase() || "";
  const matchesKelasUsia = !filterKelasUsia || kelasUsia === filterKelasUsia.toUpperCase();

  // Level / kategori event
  const level = peserta.kelas_kejuaraan?.kategori_event?.nama_kategori?.toUpperCase() || "";
  const matchesLevel = !filterLevel || level === filterLevel.toUpperCase();

  return matchesSearch && matchesStatus && matchesCategory && matchesKelasBerat && matchesKelasUsia && matchesLevel;
});


  return (
  <div className="p-8 max-w-full mx-auto space-y-10">
    {/* Header */}
    <div className="flex items-center gap-4 mb-8">
      <Users className="text-red-500" size={60} />
      <div>
        <h1 className="text-5xl font-bold text-black/90">Daftar Peserta Sriwijaya Cup</h1>
        <p className="text-black/60 text-lg mt-1">Kelola semua peserta kompetisi Sriwijaya kompetisi</p>
      </div>
    </div>

    {/* FILTER & SEARCH */}
    <div className="bg-white/90 backdrop-blur-md border border-white/40 rounded-2xl p-6 shadow-lg mb-6 z-50">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        {/* Search */}
        <div className="relative md:col-span-2">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
          <input
            type="text"
            placeholder="Cari peserta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-4 py-4 rounded-3xl border border-gray-200 shadow-lg focus:ring-2 focus:ring-red-400 focus:border-transparent text-lg transition placeholder-gray-400"
          />
        </div>

        {/* Filter Status */}
<Select
  unstyled
  value={{
    value: filterStatus,
    label:
      filterStatus === "ALL"
        ? "Semua Status"
        : filterStatus.charAt(0) + filterStatus.slice(1).toLowerCase(),
  }}
  onChange={(selected) => setFilterStatus(selected?.value as any)}
  options={[
    { value: "ALL", label: "Semua Status" },
    { value: "PENDING", label: "Pending" },
    { value: "APPROVED", label: "Approved" },
    { value: "REJECTED", label: "Rejected" },
  ]}
  placeholder="Pilih status"
  classNames={{
    control: () =>
      `w-full py-4 flex items-center border-2 border-gray-300 rounded-3xl px-4 py-3 gap-3 backdrop-blur-sm transition-all duration-300 hover:shadow-lg`,
    valueContainer: () => "px-1",
    placeholder: () => "text-gray-400 font-plex text-sm",
    menu: () =>
      "border border-red/20 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl mt-2 overflow-hidden z-50",
    menuList: () => "max-h-32 overflow-y-auto",
    option: ({ isFocused, isSelected }) =>
      [
        "px-4 py-3 cursor-pointer font-plex text-sm transition-colors duration-200 hover:text-red",
        isFocused ? "bg-red/10 text-red" : "text-black/80",
        isSelected ? "bg-red text-white" : "",
      ].join(" "),
  }}
  menuPortalTarget={document.body}
/>


{/* Filter Kategori */}
<Select<CategoryOption>
  unstyled
  value={{
    value: filterCategory || "ALL",
    label: filterCategory === "ALL" ? "Semua Kategori" : filterCategory,
  }}
  onChange={(selected) => setFilterCategory(selected?.value || "ALL")}
  options={[
    { value: "ALL", label: "Semua Kategori" },
    { value: "KYORUGI", label: "KYORUGI" },
    { value: "POOMSAE", label: "POOMSAE" },
  ]}
  placeholder="Pilih kategori"
  classNames={{
    control: () =>
      `w-full py-4 flex items-center border-2 border-gray-300 rounded-3xl px-4 py-3 gap-3 backdrop-blur-sm transition-all duration-300 hover:shadow-lg`,
    valueContainer: () => "px-1",
    placeholder: () => "text-gray-400 font-plex text-sm",
    menu: () =>
      "border border-red/20 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl mt-2 overflow-hidden z-50",
    menuList: () => "max-h-32 overflow-y-auto",
    option: ({ isFocused, isSelected }) =>
      [
        "px-4 py-3 cursor-pointer font-plex text-sm transition-colors duration-200 hover:text-red",
        isFocused ? "bg-red/10 text-red" : "text-black/80",
        isSelected ? "bg-red text-white" : "",
      ].join(" "),
  }}
  menuPortalTarget={document.body}
/>

{/* Filter Level */}
<Select
  unstyled
  value={{ value: filterLevel || null, label: filterLevel || "Semua" }}
  onChange={(selected) => setFilterLevel(selected?.value as "pemula" | "prestasi" | null || null)}
  options={[
    { value: null, label: "Semua" },
    { value: "pemula", label: "Pemula" },
    { value: "prestasi", label: "Prestasi" },
  ]}
  placeholder="Pilih level"
  classNames={{
    control: () =>
      `w-full py-4 flex items-center border-2 border-gray-300 rounded-3xl px-4 py-3 gap-3 backdrop-blur-sm transition-all duration-300 hover:shadow-lg`,
    valueContainer: () => "px-1",
    placeholder: () => "text-gray-400 font-plex text-sm",
    menu: () =>
      "border border-red/20 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl mt-2 overflow-hidden z-50",
    menuList: () => "max-h-32 overflow-y-auto",
    option: ({ isFocused, isSelected }) =>
      [
        "px-4 py-3 cursor-pointer font-plex text-sm transition-colors duration-200 hover:text-red",
        isFocused ? "bg-red/10 text-red" : "text-black/80",
        isSelected ? "bg-red text-white" : "",
      ].join(" "),
  }}
  menuPortalTarget={document.body}
/>
      </div>
    </div>

    {/* TABLE */}
    <div className="bg-white/90 backdrop-blur-md border border-white/40 rounded-2xl shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-base border-collapse">
          <thead className="bg-yellow">
  <tr>
    {[
      "Nama Peserta",
      "Kategori",
      "Level",
      "Kelas",
      "Usia/Kelompok",
      "Jenis Kelamin",
      "Dojang",
      "Status",
      "Aksi",
    ].map((h) => {
      const isCenter = ["Usia/Kelompok", "Jenis Kelamin", "Status", "Aksi"].includes(h);
      return (
        <th
          key={h}
          className={`py-5 px-6 font-semibold text-black/80 ${isCenter ? "text-center" : "text-left"}`}
        >
          {h}
        </th>
      );
    })}
  </tr>
</thead>

<tbody>
  {displayedPesertas.length === 0 && !loadingAtlet ? (
    <tr>
      <td colSpan={9} className="py-16 text-center text-gray-400">
        <Users size={52} className="mx-auto mb-4" />
        Tidak ada peserta yang ditemukan
      </td>
    </tr>
  ) : (
    displayedPesertas.map((peserta: any) => {
      const isTeam = peserta.is_team;

      const namaPeserta = isTeam
        ? peserta.anggota_tim?.map((m: any) => m.atlet.nama_atlet).join(", ")
        : peserta.atlet?.nama_atlet || "-";

      const cabang = peserta.kelas_kejuaraan?.cabang || "-";
      const levelEvent = peserta.kelas_kejuaraan?.kategori_event?.nama_kategori || "-";

      const kelasBerat =
        cabang === "KYORUGI"
          ? peserta.kelas_kejuaraan?.kelas_berat?.nama_kelas || (peserta.atlet?.berat_badan ? `${peserta.atlet.berat_badan} kg` : "-")
          : "-";

      const kelasPoomsae =
        cabang === "POOMSAE"
          ? peserta.kelas_kejuaraan?.poomsae?.nama_kelas || peserta.atlet?.belt || "-"
          : "-";

      const kelasUsia = peserta.kelas_kejuaraan?.kelompok?.nama_kelompok || (peserta.atlet?.umur ? `${peserta.atlet.umur} th` : "-");

      const jenisKelamin = !isTeam ? peserta.atlet?.jenis_kelamin || "-" : "-";

      const dojang = isTeam && peserta.anggota_tim?.length
        ? peserta.anggota_tim[0]?.atlet?.dojang?.nama_dojang || "-"
        : peserta.atlet?.dojang?.nama_dojang || "-";

      const statusBadge = (status: string) => {
        const map = {
          PENDING: "bg-yellow-100 text-yellow-800",
          APPROVED: "bg-green-100 text-green-800",
          REJECTED: "bg-red-100 text-red-800",
        };
        return (
          <span className={`px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-semibold ${map[status as keyof typeof map]}`}>
            {status}
          </span>
        );
      };

      return (
        <tr
          key={peserta.id_peserta_kompetisi}
          className="border-b border-gray-200 hover:bg-yellow-50 transition-colors cursor-pointer"
          onClick={() => handleRowClick(peserta)}
        >
          <td className="py-2 md:py-4 px-4 md:px-6 font-medium text-gray-800 text-sm md:text-base">{namaPeserta}</td>
          <td className="py-2 md:py-4 px-4 md:px-6 text-gray-700 text-sm md:text-base">{`${cabang}`}</td>
          <td className="py-2 md:py-4 px-4 md:px-6 text-gray-700 text-sm md:text-base">{levelEvent}</td>
          <td className="py-2 md:py-4 px-4 md:px-6 text-gray-700 text-sm md:text-base">{kelasBerat || kelasPoomsae}</td>
          <td className="py-2 md:py-4 px-4 md:px-6 text-center text-gray-700 text-sm md:text-base">{kelasUsia}</td>
          <td className="py-2 md:py-4 px-4 md:px-6 text-center text-gray-700 text-sm md:text-base">{jenisKelamin}</td>
          <td className="py-2 md:py-4 px-4 md:px-6 text-gray-700 text-sm md:text-base">{dojang}</td>
          <td className="py-2 md:py-4 px-4 md:px-6 text-center">{statusBadge(peserta.status)}</td>
          <td className="py-2 md:py-4 px-4 md:px-6 flex gap-2 justify-center">
            <button
              onClick={(e) => { e.stopPropagation(); handleApproval(peserta.id_peserta_kompetisi); }}
              disabled={processing === peserta.id_peserta_kompetisi}
              className="flex items-center gap-1 px-3 md:px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-all text-xs md:text-sm font-medium"
            >
              {processing === peserta.id_peserta_kompetisi ? <Loader size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              Setujui
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleRejection(peserta.id_peserta_kompetisi); }}
              disabled={processing === peserta.id_peserta_kompetisi}
              className="flex items-center gap-1 px-3 md:px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all text-xs md:text-sm font-medium"
            >
              {processing === peserta.id_peserta_kompetisi ? <Loader size={16} className="animate-spin" /> : <XCircle size={16} />}
              Tolak
            </button>
          </td>
        </tr>
      );
      
    })
  )}
</tbody>

        </table>
      </div>
    </div>
    <SelectTeamMemberModal
  isOpen={teamModalOpen}
  anggotaTim={selectedTeam}
  onClose={() => setTeamModalOpen(false)}
  onSelect={(atlet) => {
    navigate(`/dashboard/atlit/${atlet.id_atlet}`);
    setTeamModalOpen(false);
  }}
/>
  </div>
);

};

export default AllPeserta;
