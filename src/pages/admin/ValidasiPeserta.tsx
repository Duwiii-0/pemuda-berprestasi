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
import { useDojang } from "../../context/dojangContext";

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
    atletPagination,
    setAtletPage,
    setAtletLimit,
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
  const [filterKelompokUsia, setFilterKelompokUsia] = useState<"ALL" | "Super Pra-cadet" | "Pracadet" | "Cadet" | "Junior" | "Senior" >("ALL");
  const [filterLevel, setFilterLevel] = useState<"ALL" | "pemula" | "prestasi" | null>(null);
  const [filterDojang, setFilterDojang] = useState<string>("ALL");
  const [filterKelasBerat, setFilterKelasBerat] = useState<"ALL" | string>("ALL");
  const { dojangOptions, refreshDojang, isLoading } = useDojang();
  const [currentDisplayPage, setCurrentDisplayPage] = useState(1); // Visual pagination
  const [itemsPerDisplayPage] = useState(25); // Show 25 items per page visually

const kelasBeratOptions = [
  { value: "ALL", label: "Semua Kelas" },

  // Under
  { value: "Under 18 kg", label: "Under 18 kg" },
  { value: "Under 19 kg", label: "Under 19 kg" },
  { value: "Under 20 kg", label: "Under 20 kg" },
  { value: "Under 21 kg", label: "Under 21 kg" },
  { value: "Under 22 kg", label: "Under 22 kg" },
  { value: "Under 23 kg", label: "Under 23 kg" },
  { value: "Under 24 kg", label: "Under 24 kg" },
  { value: "Under 25 kg", label: "Under 25 kg" },
  { value: "Under 26 kg", label: "Under 26 kg" },
  { value: "Under 27 kg", label: "Under 27 kg" },
  { value: "Under 28 kg", label: "Under 28 kg" },
  { value: "Under 29 kg", label: "Under 29 kg" },
  { value: "Under 30 kg", label: "Under 30 kg" },
  { value: "Under 32 kg", label: "Under 32 kg" },
  { value: "Under 33 kg", label: "Under 33 kg" },
  { value: "Under 35 kg", label: "Under 35 kg" },
  { value: "Under 36 kg", label: "Under 36 kg" },
  { value: "Under 37 kg", label: "Under 37 kg" },
  { value: "Under 38 kg", label: "Under 38 kg" },
  { value: "Under 39 kg", label: "Under 39 kg" },
  { value: "Under 41 kg", label: "Under 41 kg" },
  { value: "Under 42 kg", label: "Under 42 kg" },
  { value: "Under 44 kg", label: "Under 44 kg" },
  { value: "Under 45 kg", label: "Under 45 kg" },
  { value: "Under 46 kg", label: "Under 46 kg" },
  { value: "Under 47 kg", label: "Under 47 kg" },
  { value: "Under 48 kg", label: "Under 48 kg" },
  { value: "Under 49 kg", label: "Under 49 kg" },
  { value: "Under 51 kg", label: "Under 51 kg" },
  { value: "Under 52 kg", label: "Under 52 kg" },
  { value: "Under 53 kg", label: "Under 53 kg" },
  { value: "Under 54 kg", label: "Under 54 kg" },
  { value: "Under 55 kg", label: "Under 55 kg" },
  { value: "Under 57 kg", label: "Under 57 kg" },
  { value: "Under 59 kg", label: "Under 59 kg" },
  { value: "Under 61 kg", label: "Under 61 kg" },
  { value: "Under 62 kg", label: "Under 62 kg" },
  { value: "Under 63 kg", label: "Under 63 kg" },
  { value: "Under 65 kg", label: "Under 65 kg" },
  { value: "Under 67 kg", label: "Under 67 kg" },
  { value: "Under 68 kg", label: "Under 68 kg" },
  { value: "Under 73 kg", label: "Under 73 kg" },
  { value: "Under 74 kg", label: "Under 74 kg" },
  { value: "Under 78 kg", label: "Under 78 kg" },
  { value: "Under 80 kg", label: "Under 80 kg" },
  { value: "Under 87 kg", label: "Under 87 kg" },

  // Over
  { value: "Over 32 kg", label: "Over 32 kg" },
  { value: "Over 33 kg", label: "Over 33 kg" },
  { value: "Over 38 kg", label: "Over 38 kg" },
  { value: "Over 39 kg", label: "Over 39 kg" },
  { value: "Over 59 kg", label: "Over 59 kg" },
  { value: "Over 65 kg", label: "Over 65 kg" },
  { value: "Over 68 kg", label: "Over 68 kg" },
  { value: "Over 73 kg", label: "Over 73 kg" },
  { value: "Over 78 kg", label: "Over 78 kg" },
  { value: "Over 87 kg", label: "Over 87 kg" },
  { value: "Over 200 kg", label: "Over 200 kg" }, // fallback kalau mau tandai batas akhir
];


  const handlePesertaClick = (peserta: any) => {
    if (peserta.is_team) {
      setSelectedTeam(peserta); // simpan data tim
      setTeamModalOpen(true);    // buka modal
    } else if (peserta.atlet?.id_atlet) {
      navigate(`/dashboard/atlit/${peserta.atlet.id_atlet}`);
    }
  };

  useEffect(() => {
      refreshDojang();
    }, []);
    
  useEffect(() => {
    fetchKompetisiList();
  }, []);

  useEffect(() => {
  }, [kompetisiList]);

  // FIXED: Set limit ONCE on mount and fetch all data
  useEffect(() => {
    if (selectedKompetisiId) {
      console.log(`🔄 [ValidasiPeserta] Setting limit to 10000...`);
      setAtletLimit(10000); // Load ALL data
      setCurrentDisplayPage(1); // Reset display page
      // Wait a bit for state to update, then fetch
      setTimeout(() => {
        console.log(`🔄 [ValidasiPeserta] Fetching all data...`);
        fetchAtletByKompetisi(selectedKompetisiId);
      }, 100);
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
      <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
        Laki-Laki
      </span>
    ) : (
      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
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
      <div className="min-h-screen bg-white">
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
                <p className="text-black/60 text-sm sm:text-base lg:text-lg mt-1 sm:mt-2 font-inter">
                  Klik tabel untuk memvalidasi peserta kompetisi
                </p>
              </div>
            </div>
          </div>
          
          {/* SEARCH BAR - Diperbaiki untuk mobile */}
          <div className="mb-6">
            <div className="relative max-w-full sm:max-w-md">
              <Search
                className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-black/60"
                size={18}
              />
              <input
                type="text"
                placeholder="Cari kompetisi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 rounded-2xl sm:rounded-3xl border border-black/10 shadow-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm sm:text-base transition placeholder-black/40 bg-white font-inter"
              />
            </div>
          </div>
          
          {/* TABEL KOMPETISI */}
          {loadingKompetisi ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <Loader className="w-8 h-8 animate-spin text-yellow-500" />
                <p className="text-black/60 text-sm sm:text-base font-inter">Loading data kompetisi...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block sm:hidden space-y-4">
                {filteredKompetisi.map((k) => (
                  <div
                    key={k.id_kompetisi}
                    className="bg-white rounded-xl shadow-sm border border-black/10 p-4 hover:shadow-md transition-shadow hover:border-yellow-500/30"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-base text-black flex-1 pr-2 leading-tight font-plex">
                        {k.nama_event}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 font-inter ${
                          k.status === "PENDAFTARAN"
                            ? "bg-yellow-100 text-yellow-800"
                            : k.status === "SEDANG_DIMULAI"
                            ? "bg-red-100 text-red-800"
                            : k.status === "SELESAI"
                            ? "bg-black/10 text-black/60"
                            : "bg-black/10 text-black/60"
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
                      <p className="text-sm text-black/60 font-inter">
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
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm font-inter"
                    >
                      <Eye size={16} />
                      Pilih Kompetisi
                    </button>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block">
                <div className="bg-white rounded-xl shadow-sm border border-black/10 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                      <thead className="bg-yellow-500">
                        <tr>
                          <th className="py-3 px-4 lg:px-6 text-left font-semibold text-black text-sm lg:text-base font-plex">
                            Nama Event
                          </th>
                          <th className="py-3 px-4 lg:px-6 text-left font-semibold text-black text-sm lg:text-base font-plex">
                            Tanggal Mulai
                          </th>
                          <th className="py-3 px-4 lg:px-6 text-left font-semibold text-black text-sm lg:text-base font-plex">
                            Status
                          </th>
                          <th className="py-3 px-4 lg:px-6 text-center font-semibold text-black text-sm lg:text-base font-plex">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/10">
                        {filteredKompetisi.map((k) => (
                          <tr
                            key={k.id_kompetisi}
                            className="hover:bg-yellow-50 transition-colors"
                          >
                            <td className="py-4 px-4 lg:px-6 font-medium text-black text-sm lg:text-base font-plex">
                              {k.nama_event}
                            </td>
                            <td className="py-4 px-4 lg:px-6 text-black/70 text-sm lg:text-base font-inter">
                              {new Date(k.tanggal_mulai).toLocaleDateString("id-ID")}
                            </td>
                            <td className="py-4 px-4 lg:px-6">
                              <span
                                className={`inline-flex px-2 py-1 rounded-full text-xs font-medium font-inter ${
                                  k.status === "PENDAFTARAN"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : k.status === "SEDANG_DIMULAI"
                                    ? "bg-red-100 text-red-800"
                                    : k.status === "SELESAI"
                                    ? "bg-black/10 text-black/60"
                                    : "bg-black/10 text-black/60"
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
                                className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium font-inter"
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
  const filteredPesertas = pesertaList.filter((peserta) => {
  const namaPeserta = peserta.is_team
    ? peserta.anggota_tim?.map((a) => a.atlet.nama_atlet).join(" ") || ""
    : peserta.atlet?.nama_atlet || "";

  const matchesSearch = namaPeserta.toLowerCase().includes(searchTerm.toLowerCase());
  const matchesStatus = filterStatus === "ALL" || peserta.status === filterStatus;

  // kategori dari kelas_kejuaraan.cabang ("POOMSAE" | "KYORUGI")
  const kategori = peserta.kelas_kejuaraan?.cabang?.toUpperCase() || "";
  const matchesCategory =
    filterCategory === "ALL" || kategori === filterCategory.toUpperCase();

  const level = peserta.kelas_kejuaraan?.kategori_event?.nama_kategori?.toLowerCase() || "";
  const matchesLevel = !filterLevel || filterLevel === "ALL" || level === filterLevel;

  const matchesKelompok =
    filterKelompokUsia === "ALL" ||
    peserta.kelas_kejuaraan?.kelompok?.nama_kelompok.toLowerCase().includes(filterKelompokUsia.toLowerCase());

 const pesertaDojang = peserta.is_team
      ? peserta.anggota_tim?.[0]?.atlet?.dojang?.id_dojang?.toString() || ""
      : peserta.atlet?.dojang?.id_dojang?.toString() || "";

    const matchesDojang = filterDojang === "ALL" || pesertaDojang === filterDojang;

  const kelasBerat = peserta.kelas_kejuaraan?.kelas_berat?.nama_kelas || (peserta.atlet?.berat_badan ? `${peserta.atlet.berat_badan} kg` : "-");
  const matchesKelasBerat = filterKelasBerat === "ALL" || kelasBerat === filterKelasBerat;

    return matchesSearch && matchesStatus && matchesCategory && matchesLevel && matchesKelompok && matchesDojang && matchesKelasBerat;
});

  // Calculate visual pagination (25 per page)
  const totalFilteredItems = filteredPesertas.length;
  const totalDisplayPages = Math.ceil(totalFilteredItems / itemsPerDisplayPage);
  const startIndex = (currentDisplayPage - 1) * itemsPerDisplayPage;
  const endIndex = startIndex + itemsPerDisplayPage;
  const displayedPesertas = filteredPesertas.slice(startIndex, endIndex);

  // Pagination helper
  const getPageNumbers = () => {
    const pageNumbers: (number | string)[] = [];
    const maxVisiblePages = 5;
    
    if (totalDisplayPages <= maxVisiblePages) {
      for (let i = 1; i <= totalDisplayPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentDisplayPage <= 3) {
        for (let i = 1; i <= 4; i++) pageNumbers.push(i);
        pageNumbers.push('...');
        pageNumbers.push(totalDisplayPages);
      } else if (currentDisplayPage >= totalDisplayPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = totalDisplayPages - 3; i <= totalDisplayPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = currentDisplayPage - 1; i <= currentDisplayPage + 1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalDisplayPages);
      }
    }
    return pageNumbers;
  };



  return (
<div className="min-h-screen bg-white">
  {/* CONTAINER UTAMA */}
  <div className="px-4 py-6 sm:px-6 lg:px-8 xl:px-12 2xl:px-24 max-w-7xl mx-auto">
    
    {/* HEADER - Diperbaiki untuk mobile */}
    <div className="mb-6 sm:mb-8">
      <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-black mb-4 font-bebas leading-wider">
        Validasi Peserta Kompetisi
      </h1>
      
      <button
        onClick={() => setSelectedKompetisiId(null)}
        className="inline-flex items-center gap-2 px-3 py-2 bg-black/10 hover:bg-black/20 text-black rounded-lg text-sm transition-colors font-inter"
      >
        ← Kembali ke Daftar Kompetisi
      </button>
    </div>

    {/* FILTER + SEARCH - Diperbaiki layout mobile */}
    <div className="bg-white rounded-xl shadow-sm border border-black/10 p-4 sm:p-6 mb-6">
      <div className="space-y-4">
        {/* Search - Full width di mobile */}
        <div className="w-full">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-black/60"
              size={18}
            />
            <input
              type="text"
              placeholder="Cari peserta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-black/20 shadow-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm placeholder-black/40 transition-colors font-inter"
            />
          </div>
        </div>

        {/* Filter dalam grid 2 kolom di mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Filter Status */}
          <div>
            <label className="block text-black/60 text-xs mb-2 font-medium font-inter">Status</label>
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
                  `w-full flex items-center border border-black/20 rounded-2xl px-3 py-3 gap-2 transition-all duration-300 hover:shadow-sm focus-within:border-yellow-500 focus-within:ring-2 focus-within:ring-yellow-500/20`,
                valueContainer: () => "px-1",
                placeholder: () => "text-black/40 text-sm font-inter",
                menu: () =>
                  "border border-black/10 bg-white rounded-xl shadow-lg mt-2 overflow-hidden z-50",
                menuList: () => "max-h-40 overflow-y-auto",
                option: ({ isFocused, isSelected }) =>
                  [
                    "px-3 py-3 cursor-pointer text-sm transition-colors duration-200 font-inter",
                    isFocused ? "bg-yellow-50 text-black" : "text-black/70",
                    isSelected ? "bg-yellow-500 text-black" : "",
                  ].join(" "),
              }}
            />
          </div>

          {/* Filter Kategori */}
          <div>
            <label className="block text-black/60 text-xs mb-2 font-medium font-inter">Kategori</label>
            <Select
              unstyled
              value={{ value: filterCategory, label: filterCategory === "ALL" ? "Semua Kategori" : filterCategory }}
              onChange={(selected) => setFilterCategory(selected?.value as any)}
              options={[
                { value: "ALL", label: "Semua Kategori" },
                { value: "POOMSAE", label: "POOMSAE" },
                { value: "KYORUGI", label: "KYORUGI" },
              ]}
              placeholder="Kyorugi/Poomsae"
              classNames={{
                control: () =>
                  `w-full flex items-center border border-black/20 rounded-2xl px-3 py-3 gap-2 transition-all duration-300 hover:shadow-sm focus-within:border-yellow-500 focus-within:ring-2 focus-within:ring-yellow-500/20`,
                valueContainer: () => "px-1",
                placeholder: () => "text-black/40 text-sm font-inter",
                menu: () => "border border-black/10 bg-white rounded-xl shadow-lg mt-2 overflow-hidden z-50",
                menuList: () => "max-h-40 overflow-y-auto",
                option: ({ isFocused, isSelected }) =>
                  [
                    "px-3 py-3 cursor-pointer text-sm transition-colors duration-200 font-inter",
                    isFocused ? "bg-yellow-50 text-black" : "text-black/70",
                    isSelected ? "bg-yellow-500 text-black" : ""
                  ].join(" "),
              }}
            />
          </div>

          <div>
            <label className="block text-black/60 text-xs mb-2 font-medium font-inter">Kelompok Usia</label>
            <Select
              unstyled
              value={{
                value: filterKelompokUsia,
                label:
                  filterKelompokUsia === "ALL" ? "Semua Usia" : filterKelompokUsia,
              }}
              onChange={(selected) => setFilterKelompokUsia(selected?.value as any)}
              options={[
                { value: "ALL", label: "Semua Kelompok Umur" },
                { value: "Super Pra-cadet", label: "Super Pra-Cadet (2017-2020)" },
                { value: "Pracadet", label: "Pracadet (2014-2016)" },
                { value: "Cadet", label: "Cadet (2011-2013)" },
                { value: "Junior", label: "Junior (2008-2010)" },
                { value: "Senior", label: "Senior (2007 ke atas)" },
              ]}
              placeholder="Pilih kelompok usia"
              classNames={{
                control: () =>
                  `w-full flex items-center border border-black/20 rounded-2xl px-3 py-3 gap-2 transition-all duration-300 hover:shadow-sm focus-within:border-yellow-500 focus-within:ring-2 focus-within:ring-yellow-500/20`,
                valueContainer: () => "px-1",
                placeholder: () => "text-black/40 text-sm font-inter",
                menu: () =>
                  "border border-black/10 bg-white rounded-xl shadow-lg mt-2 overflow-hidden z-50",
                menuList: () => "max-h-40 overflow-y-auto",
                option: ({ isFocused, isSelected }) =>
                  [
                    "px-3 py-3 cursor-pointer text-sm transition-colors duration-200 font-inter",
                    isFocused ? "bg-yellow-50 text-black" : "text-black/70",
                    isSelected ? "bg-yellow-500 text-black" : "",
                  ].join(" "),
              }}
            />
          </div>

          <div>
            <label className="block text-black/60 text-xs mb-2 font-medium font-inter">Level</label>
            <Select
              unstyled
              value={{
                value: filterLevel,
                label:
                  !filterLevel || filterLevel === "ALL"
                    ? "Semua Level"
                    : filterLevel.charAt(0).toUpperCase() + filterLevel.slice(1),
              }}
              onChange={(selected) => setFilterLevel(selected?.value as any)}
              options={[
                { value: "ALL", label: "Semua Level" },
                { value: "pemula", label: "Pemula" },
                { value: "prestasi", label: "Prestasi" },
              ]}
              placeholder="Pilih level"
              classNames={{
                control: () =>
                  `w-full flex items-center border border-black/20 rounded-2xl px-3 py-3 gap-2 transition-all duration-300 hover:shadow-sm focus-within:border-yellow-500 focus-within:ring-2 focus-within:ring-yellow-500/20`,
                valueContainer: () => "px-1",
                placeholder: () => "text-black/40 text-sm font-inter",
                menu: () =>
                  "border border-black/10 bg-white rounded-xl shadow-lg mt-2 overflow-hidden z-50",
                menuList: () => "max-h-40 overflow-y-auto",
                option: ({ isFocused, isSelected }) =>
                  [
                    "px-3 py-3 cursor-pointer text-sm transition-colors duration-200 font-inter",
                    isFocused ? "bg-yellow-50 text-black" : "text-black/70",
                    isSelected ? "bg-yellow-500 text-black" : "",
                  ].join(" "),
              }}
            />
          </div>

          <div>
            <label className="block text-black/60 text-xs mb-2 font-medium font-inter">Kelas Berat</label>
            <Select
              unstyled
              value={{
                value: filterKelasBerat,
                label: filterKelasBerat === "ALL" ? "Semua Kelas Berat" : filterKelasBerat,
              }}
              onChange={(selected) => setFilterKelasBerat(selected?.value as any)}
              options={kelasBeratOptions}
              placeholder="Pilih kelas berat"
              classNames={{
                control: () =>
                  `w-full flex items-center border border-black/20 rounded-2xl px-3 py-3 gap-2 transition-all duration-300 hover:shadow-sm focus-within:border-yellow-500 focus-within:ring-2 focus-within:ring-yellow-500/20`,
                valueContainer: () => "px-1",
                placeholder: () => "text-black/40 text-sm font-inter",
                menu: () =>
                  "border border-black/10 bg-white rounded-xl shadow-lg mt-2 overflow-hidden z-50",
                menuList: () => "max-h-40 overflow-y-auto",
                option: ({ isFocused, isSelected }) =>
                  [
                    "px-3 py-3 cursor-pointer text-sm transition-colors duration-200 font-inter",
                    isFocused ? "bg-yellow-50 text-black" : "text-black/70",
                    isSelected ? "bg-yellow-500 text-black" : "",
                  ].join(" "),
              }}
            />
          </div>
          <div>
            <label className="block text-black/60 text-xs mb-2 font-medium font-inter">Dojang</label>
            <Select
              unstyled
              value={
                filterDojang === "ALL"
                  ? { value: "ALL", label: "Semua Dojang" }
                  : dojangOptions.find((opt) => opt.value === filterDojang)
              }
              onChange={(selected) => setFilterDojang(selected?.value || "ALL")}
              options={[{ value: "ALL", label: "Semua Dojang" }, ...dojangOptions]}
              placeholder="Pilih Dojang"
              classNames={{
                control: () =>
                  `w-full flex items-center border border-black/20 rounded-2xl px-3 py-3 gap-2 transition-all duration-300 hover:shadow-sm focus-within:border-yellow-500 focus-within:ring-2 focus-within:ring-yellow-500/20`,
                valueContainer: () => "px-1",
                placeholder: () => "text-black/40 text-sm font-inter",
                menu: () =>
                  "border border-black/10 bg-white rounded-xl shadow-lg mt-2 overflow-hidden z-50",
                menuList: () => "max-h-40 overflow-y-auto",
                option: ({ isFocused, isSelected }) =>
                  [
                    "px-3 py-3 cursor-pointer text-sm transition-colors duration-200 font-inter",
                    isFocused ? "bg-yellow-50 text-black" : "text-black/70",
                    isSelected ? "bg-yellow-500 text-black" : "",
                  ].join(" "),
              }}
            />
          </div>
        </div>
        {/* Count Peserta & Items Per Page */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <p className="text-black/70 text-sm sm:text-base font-inter">
            Menampilkan <span className="font-semibold">{startIndex + 1}-{Math.min(endIndex, totalFilteredItems)}</span>{" "}
            dari <span className="font-semibold">{totalFilteredItems}</span> peserta
          </p>
        </div>
      </div>
    </div>

    {/* CONTENT */}
    {loadingAtlet ? (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-8 h-8 animate-spin text-yellow-500" />
          <p className="text-black/60 text-sm sm:text-base font-inter">Loading data peserta...</p>
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
                ? peserta.kelas_kejuaraan?.kelas_berat?.nama_kelas 
                : "-";
            const kelasPoomsae =
              cabang === "POOMSAE"
                ? peserta.kelas_kejuaraan?.poomsae?.nama_kelas
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
                className="bg-white rounded-xl shadow-sm border border-black/10 overflow-hidden hover:shadow-md hover:border-yellow-500/30 transition-all"
              >
                {/* Header Card */}
                <div 
                  className="p-4 cursor-pointer"
                  onClick={() => handlePesertaClick(peserta)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0 pr-3">
                      <h3 className="font-semibold text-base text-black leading-tight truncate font-plex">
                        {namaPeserta}
                      </h3>
                      <p className="text-sm text-black/60 mt-1 font-inter">
                        {`${cabang} - ${level}`}
                      </p>
                    </div>
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 font-inter ${
                        peserta.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : peserta.status === "APPROVED"
                          ? "bg-yellow-500 text-black"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {peserta.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-black/50 font-inter">Dojang:</span>
                      <p className="text-black font-medium truncate font-plex">{dojang}</p>
                    </div>
                    {cabang === "KYORUGI" && kelasBerat !== "-" && (
                      <div>
                        <span className="text-black/50 font-inter">Kelas Berat:</span>
                        <p className="text-black font-medium font-plex">{kelasBerat}</p>
                      </div>
                    )}
                    {cabang === "POOMSAE" && kelasPoomsae !== "-" && (
                      <div>
                        <span className="text-black/50 font-inter">Kelas Poomsae:</span>
                        <p className="text-black font-medium font-plex">{kelasPoomsae}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-black/50 font-inter">Kelompok Usia:</span>
                      <p className="text-black font-medium font-plex">
                        {peserta.kelas_kejuaraan?.kelompok?.nama_kelompok}
                      </p>
                    </div>
                    {!isTeam && (
                      <div>
                        <span className="text-black/50 font-inter">Jenis Kelamin:</span>
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
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 disabled:opacity-50 transition-all text-sm font-medium font-inter"
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
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all text-sm font-medium font-inter"
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
          <div className="bg-white rounded-xl shadow-sm border border-black/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead className="bg-yellow-500">
                  <tr>
                    {["Nama", "Kategori", "Kelas Berat", "Kelas Poomsae", "Kelompok Usia", "Jenis Kelamin", "Nama Dojang", "Status", "Aksi"].map((header) => (
                      <th
                        key={header}
                        className={`py-3 px-4 font-semibold text-black text-sm font-plex ${
                          header === "Status" || header === "Aksi" ? "text-center" : "text-left"
                        }`}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10">
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
                        <td className="py-4 px-4 font-medium text-black text-sm font-plex">{namaPeserta}</td>
                        <td className="py-4 px-4 text-black/70 text-sm font-inter">{`${cabang} - ${level}`}</td>
                        <td className="py-4 px-4 text-black/70 text-sm font-inter">{kelasBerat}</td>
                        <td className="py-4 px-4 text-center text-black/70 text-sm font-inter">{kelasPoomsae}</td>
                        <td className="py-4 px-4 text-center text-black/70 text-sm font-inter">
                          {peserta.kelas_kejuaraan?.kelompok?.nama_kelompok || "-"  }
                        </td>
                        <td className="py-4 px-4 text-center">
                          {!isTeam 
                            ? (peserta.atlet?.jenis_kelamin ? getGenderBadge(peserta.atlet.jenis_kelamin) : "-")
                            : "-"}
                        </td>
                        <td className="py-4 px-4 text-black/70 text-sm font-inter">{dojang}</td>
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium font-inter ${
                              peserta.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-800"
                                : peserta.status === "APPROVED"
                                ? "bg-yellow-500 text-black"
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
                              className="flex items-center gap-1 px-3 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 disabled:opacity-50 transition-all text-xs font-medium font-inter"
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
                              className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all text-xs font-medium font-inter"
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

        {/* Pagination Controls */}
        {totalDisplayPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6 flex-wrap">
            <button
              onClick={() => setCurrentDisplayPage(Math.max(1, currentDisplayPage - 1))}
              disabled={currentDisplayPage === 1}
              className="px-4 py-2 rounded-lg border border-black/20 hover:bg-black/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            
            {getPageNumbers().map((pageNum, idx) => {
              if (pageNum === '...') {
                return <span key={`ellipsis-${idx}`} className="px-2 text-black/40">...</span>;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentDisplayPage(pageNum as number)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    currentDisplayPage === pageNum
                      ? 'bg-yellow-500 text-black border-yellow-500 font-semibold'
                      : 'border-black/20 hover:bg-black/5'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => setCurrentDisplayPage(Math.min(totalDisplayPages, currentDisplayPage + 1))}
              disabled={currentDisplayPage === totalDisplayPages}
              className="px-4 py-2 rounded-lg border border-black/20 hover:bg-black/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
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