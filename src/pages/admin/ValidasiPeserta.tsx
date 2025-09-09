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
  const [filterKelompokUsia, setFilterKelompokUsia] = useState<"ALL" | "Cadet" | "Junior" | "Senior">("ALL");

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
      <div className="min-h-screen bg-gray-50">
        {/* CONTAINER UTAMA - Padding responsif yang lebih baik */}
        <div className="px-4 py-6 sm:px-6 lg:px-8 xl:px-12 2xl:px-24 max-w-7xl mx-auto">
          
          {/* HEADER - Diperbaiki untuk mobile */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <Trophy 
                size={32} 
                className="text-yellow-500 sm:w-10 sm:h-10 lg:w-12 lg:h-12 flex-shrink-0" 
              />
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bebas text-black/90 leading-tight">
                  List Kompetisi
                </h1>
                <p className="text-black/60 text-sm sm:text-base lg:text-lg mt-1 sm:mt-2">
                  Klik tabel untuk memvalidasi peserta kompetisi
                </p>
              </div>
            </div>
          </div>
          
          {/* SEARCH BAR - Diperbaiki untuk mobile */}
          <div className="mb-6">
            <div className="relative max-w-full sm:max-w-md">
              <Search
                className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Cari kompetisi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 rounded-2xl sm:rounded-3xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-sm sm:text-base transition placeholder-gray-400"
              />
            </div>
          </div>
          
          {/* TABEL KOMPETISI */}
          {loadingKompetisi ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <Loader className="w-8 h-8 animate-spin text-yellow-500" />
                <p className="text-gray-500 text-sm sm:text-base">Loading data kompetisi...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block sm:hidden space-y-4">
                {filteredKompetisi.map((k) => (
                  <div
                    key={k.id_kompetisi}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-base text-gray-800 flex-1 pr-2 leading-tight">
                        {k.nama_event}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                          k.status === "PENDAFTARAN"
                            ? "bg-green-100 text-green-700"
                            : k.status === "SEDANG_DIMULAI"
                            ? "bg-yellow-100 text-yellow-700"
                            : k.status === "SELESAI"
                            ? "bg-gray-100 text-gray-600"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {k.status
                          .toLowerCase()
                          .split("_")
                          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(" ")}
                      </span>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Tanggal:</span>{" "}
                        {new Date(k.tanggal_mulai).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => setSelectedKompetisiId(k.id_kompetisi)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm"
                    >
                      <Eye size={16} />
                      Pilih Kompetisi
                    </button>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                      <thead className="bg-yellow-400">
                        <tr>
                          <th className="py-3 px-4 lg:px-6 text-left font-semibold text-gray-900 text-sm lg:text-base">
                            Nama Event
                          </th>
                          <th className="py-3 px-4 lg:px-6 text-left font-semibold text-gray-900 text-sm lg:text-base">
                            Tanggal Mulai
                          </th>
                          <th className="py-3 px-4 lg:px-6 text-left font-semibold text-gray-900 text-sm lg:text-base">
                            Status
                          </th>
                          <th className="py-3 px-4 lg:px-6 text-center font-semibold text-gray-900 text-sm lg:text-base">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredKompetisi.map((k) => (
                          <tr
                            key={k.id_kompetisi}
                            className="hover:bg-yellow-50 transition-colors"
                          >
                            <td className="py-4 px-4 lg:px-6 font-medium text-gray-800 text-sm lg:text-base">
                              {k.nama_event}
                            </td>
                            <td className="py-4 px-4 lg:px-6 text-gray-700 text-sm lg:text-base">
                              {new Date(k.tanggal_mulai).toLocaleDateString("id-ID")}
                            </td>
                            <td className="py-4 px-4 lg:px-6">
                              <span
                                className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                  k.status === "PENDAFTARAN"
                                    ? "bg-green-100 text-green-700"
                                    : k.status === "SEDANG_DIMULAI"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : k.status === "SELESAI"
                                    ? "bg-gray-100 text-gray-600"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {k.status
                                  .toLowerCase()
                                  .split("_")
                                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                                  .join(" ")}
                              </span>
                            </td>
                            <td className="py-4 px-4 lg:px-6 text-center">
                              <button
                                onClick={() => setSelectedKompetisiId(k.id_kompetisi)}
                                className="inline-flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                              >
                                <Eye size={16} />
                                Pilih
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
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

    const matchesKelompok =
      filterKelompokUsia === "ALL" || peserta.kelas_kejuaraan?.kelompok?.nama_kelompok.toLowerCase() === filterKelompokUsia.toLowerCase();

  return matchesSearch && matchesStatus && matchesCategory && matchesKelompok;
});


  return (
<div className="min-h-screen bg-gray-50">
  {/* CONTAINER UTAMA */}
  <div className="px-4 py-6 sm:px-6 lg:px-8 xl:px-12 2xl:px-24 max-w-7xl mx-auto">
    
    {/* HEADER - Diperbaiki untuk mobile */}
    <div className="mb-6 sm:mb-8">
      <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 mb-4 leading-tight">
        Validasi Peserta Kompetisi
      </h1>
      
      <button
        onClick={() => setSelectedKompetisiId(null)}
        className="inline-flex items-center gap-2 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm transition-colors"
      >
        ← Kembali ke Daftar Kompetisi
      </button>
    </div>

    {/* FILTER + SEARCH - Diperbaiki layout mobile */}
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
      <div className="space-y-4">
        {/* Search - Full width di mobile */}
        <div className="w-full">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Cari peserta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm placeholder-gray-400 transition-colors"
            />
          </div>
        </div>

        {/* Filter dalam grid 2 kolom di mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Filter Status */}
          <div>
            <label className="block text-gray-600 text-xs mb-2 font-medium">Status</label>
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
                  `w-full flex items-center border border-gray-300 rounded-2xl px-3 py-3 gap-2 transition-all duration-300 hover:shadow-sm`,
                valueContainer: () => "px-1",
                placeholder: () => "text-gray-400 text-sm",
                menu: () =>
                  "border border-gray-200 bg-white rounded-xl shadow-lg mt-2 overflow-hidden z-50",
                menuList: () => "max-h-40 overflow-y-auto",
                option: ({ isFocused, isSelected }) =>
                  [
                    "px-3 py-3 cursor-pointer text-sm transition-colors duration-200",
                    isFocused ? "bg-blue-50 text-blue-700" : "text-gray-800",
                    isSelected ? "bg-blue-500 text-white" : "",
                  ].join(" "),
              }}
            />
          </div>

          {/* Filter Kategori */}
          <div>
            <label className="block text-gray-600 text-xs mb-2 font-medium">Kategori</label>
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
                  `w-full flex items-center border border-gray-300 rounded-2xl px-3 py-3 gap-2 transition-all duration-300 hover:shadow-sm`,
                valueContainer: () => "px-1",
                placeholder: () => "text-gray-400 text-sm",
                menu: () => "border border-gray-200 bg-white rounded-xl shadow-lg mt-2 overflow-hidden z-50",
                menuList: () => "max-h-40 overflow-y-auto",
                option: ({ isFocused, isSelected }) =>
                  [
                    "px-3 py-3 cursor-pointer text-sm transition-colors duration-200",
                    isFocused ? "bg-blue-50 text-blue-700" : "text-gray-800",
                    isSelected ? "bg-blue-500 text-white" : ""
                  ].join(" "),
              }}
            />
          </div>

          <div>
            <label className="block text-gray-600 text-xs mb-2 font-medium">Kelompok Usia</label>
            <Select
              unstyled
              value={{
                value: filterKelompokUsia,
                label:
                  filterKelompokUsia === "ALL" ? "Semua Usia" : filterKelompokUsia,
              }}
              onChange={(selected) => setFilterKelompokUsia(selected?.value as any)}
              options={[
                { value: "ALL", label: "Semua Usia" },
                { value: "Cadet", label: "Cadet" },
                { value: "Junior", label: "Junior" },
                { value: "Senior", label: "Senior" },
              ]}
              placeholder="Pilih kelompok usia"
              classNames={{
                control: () =>
                  `w-full flex items-center border border-gray-300 rounded-2xl px-3 py-3 gap-2 transition-all duration-300 hover:shadow-sm`,
                valueContainer: () => "px-1",
                placeholder: () => "text-gray-400 text-sm",
                menu: () =>
                  "border border-gray-200 bg-white rounded-xl shadow-lg mt-2 overflow-hidden z-50",
                menuList: () => "max-h-40 overflow-y-auto",
                option: ({ isFocused, isSelected }) =>
                  [
                    "px-3 py-3 cursor-pointer text-sm transition-colors duration-200",
                    isFocused ? "bg-blue-50 text-blue-700" : "text-gray-800",
                    isSelected ? "bg-blue-500 text-white" : "",
                  ].join(" "),
              }}
            />
          </div>
        </div>
      </div>
    </div>

    {/* CONTENT */}
    {loadingAtlet ? (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-gray-500 text-sm sm:text-base">Loading data peserta...</p>
        </div>
      </div>
    ) : (
      <>
        {/* Mobile Cards View - Diperbaiki desain */}
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
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Header Card */}
                <div 
                  className="p-4 cursor-pointer"
                  onClick={() => handlePesertaClick(peserta)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0 pr-3">
                      <h3 className="font-semibold text-base text-gray-800 leading-tight truncate">
                        {namaPeserta}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {`${cabang} - ${level}`}
                      </p>
                    </div>
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
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
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-gray-500">Dojang:</span>
                      <p className="text-gray-800 font-medium truncate">{dojang}</p>
                    </div>
                    {cabang === "KYORUGI" && kelasBerat !== "-" && (
                      <div>
                        <span className="text-gray-500">Kelas Berat:</span>
                        <p className="text-gray-800 font-medium">{kelasBerat}</p>
                      </div>
                    )}
                    {cabang === "POOMSAE" && kelasPoomsae !== "-" && (
                      <div>
                        <span className="text-gray-500">Kelas Poomsae:</span>
                        <p className="text-gray-800 font-medium">{kelasPoomsae}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500">Kelompok Usia:</span>
                      <p className="text-gray-800 font-medium">
                        {peserta.kelas_kejuaraan?.kelompok?.nama_kelompok}
                      </p>
                    </div>
                    {!isTeam && (
                      <div>
                        <span className="text-gray-500">Jenis Kelamin:</span>
                        <div className="mt-1">
                          {peserta.atlet?.jenis_kelamin ? getGenderBadge(peserta.atlet.jenis_kelamin) : "-"}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2 p-4 pt-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApproval(peserta.id_peserta_kompetisi);
                    }}
                    disabled={processing === peserta.id_peserta_kompetisi}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-all text-sm font-medium"
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
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-all text-sm font-medium"
                  >
                    {processing === peserta.id_peserta_kompetisi ? <Loader size={16} className="animate-spin" /> : <XCircle size={16} />}
                    Tolak
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Table View - Layout yang lebih baik */}
        <div className="hidden lg:block">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead className="bg-yellow-400">
                  <tr>
                    {["Nama", "Kategori", "Kelas Berat", "Kelas Poomsae", "Kelompok Usia", "Jenis Kelamin", "Nama Dojang", "Status", "Aksi"].map((header) => (
                      <th
                        key={header}
                        className={`py-3 px-4 font-semibold text-gray-900 text-sm ${
                          header === "Status" || header === "Aksi" ? "text-center" : "text-left"
                        }`}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
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
                        className="hover:bg-yellow-50 transition-colors cursor-pointer"
                        onClick={() => handlePesertaClick(peserta)}
                      >
                        <td className="py-4 px-4 font-medium text-gray-800 text-sm">{namaPeserta}</td>
                        <td className="py-4 px-4 text-gray-700 text-sm">{`${cabang} - ${level}`}</td>
                        <td className="py-4 px-4 text-gray-700 text-sm">{kelasBerat}</td>
                        <td className="py-4 px-4 text-center text-gray-700 text-sm">{kelasPoomsae}</td>
                        <td className="py-4 px-4 text-center text-gray-700 text-sm">
                          {peserta.kelas_kejuaraan?.kelompok?.nama_kelompok || "-"  }
                        </td>
                        <td className="py-4 px-4 text-center">
                          {!isTeam 
                            ? (peserta.atlet?.jenis_kelamin ? getGenderBadge(peserta.atlet.jenis_kelamin) : "-")
                            : "-"}
                        </td>
                        <td className="py-4 px-4 text-gray-700 text-sm">{dojang}</td>
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
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
                        <td className="py-4 px-4">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApproval(peserta.id_peserta_kompetisi);
                              }}
                              disabled={processing === peserta.id_peserta_kompetisi}
                              className="flex items-center gap-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-all text-xs font-medium"
                            >
                              {processing === peserta.id_peserta_kompetisi ? <Loader size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                              Setujui
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRejection(peserta.id_peserta_kompetisi);
                              }}
                              disabled={processing === peserta.id_peserta_kompetisi}
                              className="flex items-center gap-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-all text-xs font-medium"
                            >
                              {processing === peserta.id_peserta_kompetisi ? <Loader size={14} className="animate-spin" /> : <XCircle size={14} />}
                              Tolak
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </>
    )}

    {/* MODAL */}
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
</div>
  );
};

export default ValidasiPeserta;