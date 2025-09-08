// src/pages/admin/ValidasiPeserta.tsx
import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle, Loader, Eye, Trophy } from "lucide-react";
import { useKompetisi } from "../../context/KompetisiContext";
import { apiClient } from "../../config/api";
import { useAuth } from "../../context/authContext";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SelectTeamMemberModal from "../../components/selectTeamModal";
import Select from "react-select";

const ValidasiPeserta: React.FC = () => {
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      // Token handled by apiClient automatically
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
  const [filterCategory, setFilterCategory] = useState<"ALL" | "KYORUGI" | "POOMSAE">("ALL");
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
    fetchKompetisiList();
  }, []);

  useEffect(() => {
  }, [kompetisiList]);

  useEffect(() => {
    if (selectedKompetisiId) {
      console.log(
        `[ValidasiPeserta] Kompetisi dipilih, fetching peserta...`
      );
      fetchAtletByKompetisi(selectedKompetisiId);
    }
  }, [selectedKompetisiId]);

  // FIX: Ganti atletList dengan pesertaList
  useEffect(() => {
    
    // Debug struktur data lengkap
    if (pesertaList.length > 0) {
      
      // Cek apakah ada nested objects
      Object.keys(pesertaList[0]).forEach(key => {
        if (typeof (pesertaList[0] as any) [key] === 'object' && (pesertaList[0] as any) [key] !== null) {
        }
      });
            
    }
  }, [pesertaList]); // FIX: pesertaList bukan atletList

  const handleApproval = async (id: number) => {
  if (!selectedKompetisiId) return;
  setProcessing(id);
  try {
    await updatePesertaStatus(selectedKompetisiId, id, "APPROVED");
  } catch (err) {
    console.error("Gagal menyetujui peserta:");
  } finally {
    setProcessing(null);
  }
};

const handleRejection = async (id: number) => {
  if (!selectedKompetisiId) return;
  setProcessing(id);
  try {
    await updatePesertaStatus(selectedKompetisiId, id, "REJECTED");
  } catch (err) {
    console.error("Gagal menolak peserta:");
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
      <div className="p-4 sm:p-6 lg:p-8 max-w-full mx-auto space-y-6 sm:space-y-8 lg:space-y-10 sm:px-6 lg:px-24 xl:px-48 font-sans">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
          <Trophy size={40} className="text-yellow-500 sm:w-[60px] sm:h-[60px]" />
          <div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bebas text-black/90">List Kompetisi</h1>
            <p className="text-black/60 text-sm sm:text-lg lg:text-xl mt-1">Klik table untuk memvalidasi peserta kompetisi</p>
          </div>
        </div>
        
        {/* Bagian search */}
        <div className="relative max-w-full sm:max-w-md mb-6">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Cari kompetisi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 sm:py-4 rounded-3xl border border-gray-200 shadow-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-base sm:text-lg transition placeholder-gray-400"
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
<div className="p-4 sm:p-6 max-w-full mx-auto space-y-6 sm:space-y-8 lg:space-y-10 sm:px-6 lg:px-24 xl:px-48">
  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 text-gray-900">
    Validasi Peserta Kompetisi
  </h1>

  <button
    onClick={() => setSelectedKompetisiId(null)}
    className="mb-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm flex items-center gap-1"
  >
    ← Kembali ke Daftar Kompetisi
  </button>

{/* FILTER + SEARCH */}
<div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6">
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
    {/* Search */}
    <div className="relative sm:col-span-2">
      <Search
        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
        size={20}
      />
      <input
        type="text"
        placeholder="Cari peserta..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full pl-12 pr-4 py-3 sm:py-4 rounded-3xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm sm:text-base placeholder-gray-400 transition-colors"
      />
    </div>

    {/* Filter Status */}
    <div>
      <label className="block text-gray-600 text-xs sm:text-sm mb-1">Status</label>
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
      `w-full flex items-center border-2 border-gray-300 rounded-3xl px-3 sm:px-4 py-2 sm:py-3 gap-2 sm:gap-3 backdrop-blur-sm transition-all duration-300 hover:shadow-lg`,
    valueContainer: () => "px-1",
    placeholder: () => "text-gray-400 font-plex text-xs sm:text-sm",
    menu: () =>
      "border border-red/20 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl mt-2 overflow-hidden z-50",
    menuList: () => "max-h-32 overflow-y-auto",
    option: ({ isFocused, isSelected }) =>
      [
        "px-3 sm:px-4 py-2 sm:py-3 cursor-pointer font-plex text-xs sm:text-sm transition-colors duration-200 hover:text-red",
        isFocused ? "bg-red/10 text-red" : "text-black/80",
        isSelected ? "bg-red text-white" : "",
      ].join(" "),
  }}
/>
    </div>

    {/* Filter Kategori */}
    <div>
      <label className="block text-gray-600 text-xs sm:text-sm mb-1">Kategori</label>
<Select
  unstyled
  value={{ value: filterCategory, label: filterCategory === "ALL" ? "Semua Kategori" : filterCategory }}
  onChange={(selected) => setFilterCategory(selected?.value as any)}
  options={[
    { value: "ALL", label: "Semua Kategori" },
    { value: "POOMSAE", label: "POOMSAE" },
    { value: "KYORUGI", label: "KYORUGI" },
  ]}
  placeholder="Pilih kategori"
  classNames={{
    control: () =>
      `w-full flex items-center border-2 border-gray-300 rounded-3xl px-3 sm:px-4 py-2 sm:py-3 gap-2 sm:gap-3 backdrop-blur-sm transition-all duration-300 hover:shadow-lg`,
    valueContainer: () => "px-1",
    placeholder: () => "text-gray-400 font-plex text-xs sm:text-sm",
    menu: () => "border border-red/20 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl mt-2 overflow-hidden z-50",
    menuList: () => "max-h-32 overflow-y-auto",
    option: ({ isFocused, isSelected }) =>
      [
        "px-3 sm:px-4 py-2 sm:py-3 cursor-pointer font-plex text-xs sm:text-sm transition-colors duration-200 hover:text-red",
        isFocused ? "bg-red/10 text-red" : "text-black/80",
        isSelected ? "bg-red text-white" : ""
      ].join(" "),
  }}
/>
    </div>
  </div>
</div>

  {loadingAtlet ? (
    <p className="text-gray-500">Loading data peserta...</p>
  ) : (
    <>
      {/* Mobile Cards View */}
      <div className="block lg:hidden space-y-4">
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
            <div
              key={peserta.id_peserta_kompetisi}
              className="bg-white rounded-xl shadow-md p-4 border-l-4 border-yellow-400 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handlePesertaClick(peserta)}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-lg text-gray-800 flex-1 mr-2">{namaPeserta}</h3>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                    peserta.status === "PENDING"
                      ? "bg-yellow-100 text-yellow-800"
                      : peserta.status === "APPROVED"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {peserta.status}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div>
                  <span className="font-medium text-gray-600">Kategori:</span>
                  <p className="text-gray-800">{`${cabang} - ${level}`}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Dojang:</span>
                  <p className="text-gray-800">{dojang}</p>
                </div>
                {cabang === "KYORUGI" && kelasBerat !== "-" && (
                  <div>
                    <span className="font-medium text-gray-600">Kelas Berat:</span>
                    <p className="text-gray-800">{kelasBerat}</p>
                  </div>
                )}
                {cabang === "POOMSAE" && kelasPoomsae !== "-" && (
                  <div>
                    <span className="font-medium text-gray-600">Kelas Poomsae:</span>
                    <p className="text-gray-800">{kelasPoomsae}</p>
                  </div>
                )}
                <div>
                  <span className="font-medium text-gray-600">Kelompok Usia:</span>
                  <p className="text-gray-800">
                    {peserta.kelas_kejuaraan?.kelompok?.nama_kelompok || (peserta.atlet?.umur ? `${peserta.atlet.umur} th` : "-")}
                  </p>
                </div>
                {!isTeam && (
                  <div>
                    <span className="font-medium text-gray-600">Jenis Kelamin:</span>
                    <div className="mt-1">
                      {peserta.atlet?.jenis_kelamin ? getGenderBadge(peserta.atlet.jenis_kelamin) : "-"}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApproval(peserta.id_peserta_kompetisi);
                  }}
                  disabled={processing === peserta.id_peserta_kompetisi}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-all text-sm font-medium"
                >
                  {processing === peserta.id_peserta_kompetisi ? <Loader size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                  Setujui
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRejection(peserta.id_peserta_kompetisi);
                  }}
                  disabled={processing === peserta.id_peserta_kompetisi}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all text-sm font-medium"
                >
                  {processing === peserta.id_peserta_kompetisi ? <Loader size={16} className="animate-spin" /> : <XCircle size={16} />}
                  Tolak
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto bg-white rounded-xl shadow-md">
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
                      className="cursor-pointer flex items-center gap-1 px-3 md:px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all text-xs md:text-sm font-medium"
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
    </>
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