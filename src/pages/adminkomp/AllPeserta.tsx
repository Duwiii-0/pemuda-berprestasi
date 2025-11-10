// src/pages/adminkomp/AllPeserta.tsx
import React, { useEffect, useState } from "react";
import { CheckCircle, XCircle, Loader, Search, Users, AlertTriangle, ChevronLeft, ChevronRight, Download, Trash2 } from "lucide-react";
import { useAuth } from "../../context/authContext";
import { useKompetisi } from "../../context/KompetisiContext";
import { apiClient } from "../../config/api";
import { useNavigate } from "react-router-dom";
import SelectTeamMemberModal from "../../components/selectTeamModal";
import { useDojang } from "../../context/dojangContext";
import { kelasBeratOptionsMap } from "../../dummy/beratOptions";
import * as XLSX from 'xlsx';

const AllPeserta: React.FC = () => {
  const { token, user } = useAuth();
  const { pesertaList, fetchAtletByKompetisi, updatePesertaStatus, loadingAtlet } = useKompetisi();
  const navigate = useNavigate();
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any[]>([]);

  const [processing, setProcessing] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [filterCategory, setFilterCategory] = useState<"ALL" | "KYORUGI" | "POOMSAE">("ALL");
  const [filterKelasBerat, setFilterKelasBerat] = useState<string>("ALL");
  const [filterKelasUsia, setFilterKelasUsia] = useState<"ALL" | "Super pracadet" | "Pracadet" | "Cadet" | "Junior" | "Senior" >("ALL");
  const [filterLevel, setFilterLevel] = useState<"pemula" | "prestasi" | null>(null);
  const [filterDojang, setFilterDojang] = useState<string>("ALL");
  const { dojangOptions, refreshDojang, isLoading } = useDojang();

  // ✅ PERBAIKAN: Pagination states dengan opsi yang bisa diatur
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25); // ✅ Default 25
  const [isExporting, setIsExporting] = useState(false);

  // ✅ Modal konfirmasi delete
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pesertaToDelete, setPesertaToDelete] = useState<any>(null);

  useEffect(() => {
    refreshDojang();
  }, []);

  const kompetisiId = user?.role === "ADMIN_KOMPETISI" ? user?.admin_kompetisi?.id_kompetisi : null;

  const handleRowClick = (peserta: any) => {
    if (peserta.is_team) {
      setSelectedTeam(peserta.anggota_tim.map((a: any) => a.atlet));
      setTeamModalOpen(true);
    } else if (peserta.atlet?.id_atlet) {
      navigate(`/dashboard/atlit/${peserta.atlet.id_atlet}`);
    }
  };

  useEffect(() => {
    if (kompetisiId) fetchAtletByKompetisi(kompetisiId);
  }, [kompetisiId]);

  // ✅ FUNGSI DELETE PESERTA
  const handleDeletePeserta = async (peserta: any) => {
    setPesertaToDelete(peserta);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!pesertaToDelete || !kompetisiId) return;

    setDeleting(pesertaToDelete.id_peserta_kompetisi);
    
    try {
      const response = await apiClient.delete(
        `/kompetisi/${kompetisiId}/peserta/${pesertaToDelete.id_peserta_kompetisi}`
      );

      if (response.status === 200) {
        // Refresh data setelah delete
        await fetchAtletByKompetisi(kompetisiId);
        
        // Show success notification (you can use your notification system)
        alert('Peserta berhasil dihapus dari database');
      }
    } catch (error: any) {
      console.error('Error deleting peserta:', error);
      alert(error.response?.data?.message || 'Gagal menghapus peserta');
    } finally {
      setDeleting(null);
      setShowDeleteModal(false);
      setPesertaToDelete(null);
    }
  };

  // Export Excel Function
  const handleExportExcel = () => {
    setIsExporting(true);
    
    try {
      const kompetisiInfo = user?.admin_kompetisi || pesertaList[0]?.kelas_kejuaraan?.kompetisi;
      
      const currentDate = new Date().toLocaleDateString('id-ID', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
      
      const headerInfo = [
        ['LAPORAN DATA PESERTA KOMPETISI'],
        ['Nama Event', kompetisiInfo?.nama_event || 'Sriwijaya International Taekwondo Championship 2025'],
        ['Lokasi', kompetisiInfo?.lokasi || 'GOR Ranau JSC Palembang'],
        ['Tanggal Export', currentDate],
        ['Total Peserta', displayedPesertas.length.toString()],
        [],
      ];

      const exportData = displayedPesertas.map((peserta: any, index: number) => {
        const isTeam = peserta.is_team;
        
        const namaPeserta = isTeam
          ? peserta.anggota_tim?.map((m: any) => m.atlet.nama_atlet).join(", ")
          : peserta.atlet?.nama_atlet || "-";
        
        const cabang = peserta.kelas_kejuaraan?.cabang || "-";
        const levelEvent = peserta.kelas_kejuaraan?.kategori_event?.nama_kategori || "-";
        
        const kelasBerat = cabang === "KYORUGI"
          ? peserta.kelas_kejuaraan?.kelas_berat?.nama_kelas || "-"
          : "-";
        
        const kelasPoomsae = cabang === "POOMSAE"
          ? peserta.kelas_kejuaraan?.poomsae?.nama_kelas || "-"
          : "-";
        
        const kelasUsia = peserta.kelas_kejuaraan?.kelompok?.nama_kelompok || "-";
        
        const jenisKelamin = !isTeam 
          ? (peserta.atlet?.jenis_kelamin === "LAKI_LAKI" ? "Laki-Laki" : peserta.atlet?.jenis_kelamin === "PEREMPUAN" ? "Perempuan" : "-")
          : "-";
        
        const dojang = isTeam && peserta.anggota_tim?.length
          ? peserta.anggota_tim[0]?.atlet?.dojang?.nama_dojang || "-"
          : peserta.atlet?.dojang?.nama_dojang || "-";
        
        const tanggalLahir = !isTeam 
          ? peserta.atlet?.tanggal_lahir || "-"
          : "-";
        
        const beratBadan = !isTeam 
          ? peserta.atlet?.berat_badan ? `${peserta.atlet.berat_badan} kg` : "-"
          : "-";
        
        const tingiBadan = !isTeam 
          ? peserta.atlet?.tinggi_badan ? `${peserta.atlet.tinggi_badan} cm` : "-"
          : "-";
        
        const sabuk = !isTeam 
          ? (peserta.atlet?.sabuk?.nama_sabuk || peserta.atlet?.belt || "-")
          : "-";

        const anggotaTimDetail = isTeam && peserta.anggota_tim?.length
          ? peserta.anggota_tim.map((m: any, i: number) => 
              `${i + 1}. ${m.atlet.nama_atlet} (${m.atlet.dojang?.nama_dojang || "-"})`
            ).join("; ")
          : "-";

        return {
          "No": index + 1,
          "Nama Peserta": namaPeserta,
          "Tipe": isTeam ? "Tim" : "Individu",
          "Kategori": cabang,
          "Level": levelEvent,
          "Kelas Berat": kelasBerat,
          "Kelas Poomsae": kelasPoomsae,
          "Kelompok Usia": kelasUsia,
          "Jenis Kelamin": jenisKelamin,
          "Tanggal Lahir": tanggalLahir,
          "Berat Badan": beratBadan,
          "Tinggi Badan": tingiBadan,
          "Sabuk": sabuk,
          "Dojang": dojang,
          "Status": peserta.status,
          "Anggota Tim": anggotaTimDetail,
        };
      });

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(headerInfo);
      
      XLSX.utils.sheet_add_json(worksheet, exportData, { 
        origin: `A${headerInfo.length + 1}`,
        skipHeader: false 
      });
      
      const columnWidths = [
        { wch: 5 }, { wch: 30 }, { wch: 10 }, { wch: 12 }, { wch: 10 },
        { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 15 },
        { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 25 }, { wch: 12 }, { wch: 50 },
      ];
      worksheet['!cols'] = columnWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, "Data Peserta");

      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `Data_Peserta_Sriwijaya_Cup_${timestamp}.xlsx`;

      XLSX.writeFile(workbook, fileName);

    } catch (error) {   
      console.error('Error exporting to Excel:', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (user?.role !== "ADMIN_KOMPETISI") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F5FBEF' }}>
        <div className="rounded-xl shadow-sm border p-6 max-w-md w-full" style={{ backgroundColor: 'rgba(153, 13, 53, 0.05)', borderColor: 'rgba(153, 13, 53, 0.2)' }}>
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" style={{ color: '#990D35' }} />
            <p className="text-sm sm:text-base" style={{ color: '#990D35' }}>
              Akses ditolak. Hanya Admin Kompetisi yang dapat melihat daftar peserta.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!kompetisiId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F5FBEF' }}>
        <div className="rounded-xl shadow-sm border p-6 max-w-md w-full" style={{ backgroundColor: '#F5FBEF', borderColor: '#990D35' }}>
          <p className="text-sm sm:text-base" style={{ color: '#050505', opacity: 0.6 }}>
            ⚠ Tidak ada kompetisi terkait akun ini.
          </p>
        </div>
      </div>
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
    const namaPeserta = peserta.is_team
      ? peserta.anggota_tim?.map((a: any) => a.atlet.nama_atlet).join(" ") || ""
      : peserta.atlet?.nama_atlet || "";

    const matchesSearch = namaPeserta.toLowerCase().includes(searchTerm.toLowerCase());
    const pesertaStatus = peserta.status?.toUpperCase() || "";
    const matchesStatus = filterStatus === "ALL" || pesertaStatus === filterStatus.toUpperCase();
    const kategori = peserta.kelas_kejuaraan?.cabang?.toUpperCase() || "";
    const matchesCategory = filterCategory === "ALL" || kategori === filterCategory.toUpperCase();
    const kelasBerat = peserta.kelas_kejuaraan?.kelas_berat?.nama_kelas?.toUpperCase() || "";
    const matchesKelasBerat = filterKelasBerat === "ALL" || kelasBerat === filterKelasBerat.toUpperCase();
    const kelasUsia = peserta.kelas_kejuaraan?.kelompok?.nama_kelompok?.toUpperCase() || "";
    const matchesKelasUsia = filterKelasUsia === "ALL" || kelasUsia === filterKelasUsia.toUpperCase();
    const level = peserta.kelas_kejuaraan?.kategori_event?.nama_kategori?.toUpperCase() || "";
    const matchesLevel = !filterLevel || level === filterLevel.toUpperCase();
    const pesertaDojang = peserta.is_team
      ? peserta.anggota_tim?.[0]?.atlet?.dojang?.id_dojang?.toString() || ""
      : peserta.atlet?.dojang?.id_dojang?.toString() || "";
    const matchesDojang = filterDojang === "ALL" || pesertaDojang === filterDojang;

    return matchesSearch && matchesStatus && matchesCategory && matchesKelasBerat && matchesKelasUsia && matchesLevel && matchesDojang;
  });

  // ✅ PERBAIKAN: Pagination logic
  const totalPages = Math.ceil(displayedPesertas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPesertas = displayedPesertas.slice(startIndex, endIndex);

  // Reset to first page when filters or items per page change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterCategory, filterKelasBerat, filterKelasUsia, filterLevel, filterDojang, itemsPerPage]);

  const statusOptions = [
    { value: "ALL", label: "Semua Status" },
    { value: "PENDING", label: "Pending" },
    { value: "APPROVED", label: "Approved" },
    { value: "REJECTED", label: "Rejected" },
  ];

  const categoryOptions = [
    { value: "ALL", label: "Semua Kategori" },
    { value: "KYORUGI", label: "KYORUGI" },
    { value: "POOMSAE", label: "POOMSAE" },
  ];

  const levelOptions = [
    { value: null, label: "Semua Level" },
    { value: "pemula", label: "Pemula" },
    { value: "prestasi", label: "Prestasi" },
  ];

  const ageOptions = [
    { value: "ALL", label: "Semua Kelompok Umur" },
    { value: "Super Pra-cadet", label: "Super Pra-Cadet (2017-2020)" },
    { value: "Pracadet", label: "Pracadet (2014-2016)" },
    { value: "Cadet", label: "Cadet (2011-2013)" },
    { value: "Junior", label: "Junior (2008-2010)" },
    { value: "Senior", label: "Senior (2007 ke atas)" },
  ];

  // ✅ PERBAIKAN: Opsi items per page
  const itemsPerPageOptions = [
    { value: 25, label: "25 per halaman" },
    { value: 50, label: "50 per halaman" },
    { value: 100, label: "100 per halaman" },
  ];

  const getStatusBadge = (status: string) => {
    const statusMap = {
      PENDING: { bg: 'rgba(245, 183, 0, 0.2)', text: '#050505' },
      APPROVED: { bg: 'rgba(34, 197, 94, 0.2)', text: '#059669' },
      REJECTED: { bg: 'rgba(153, 13, 53, 0.1)', text: '#990D35' },
    };
    const colors = statusMap[status as keyof typeof statusMap] || statusMap.PENDING;
    
    return (
      <span
        className="px-2 py-1 rounded-full text-xs font-medium"
        style={{ backgroundColor: colors.bg, color: colors.text }}
      >
        {status}
      </span>
    );
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };

  if (loadingAtlet) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F5FBEF' }}>
        <div className="flex flex-col items-center gap-3">
          <Loader className="animate-spin" style={{ color: '#990D35' }} size={32} />
          <p style={{ color: '#050505', opacity: 0.6 }}>Memuat data peserta...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5FBEF' }}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-full">
        
        {/* HEADER */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-start sm:items-center gap-3 sm:gap-4">
              <Users 
                size={28} 
                className="sm:w-8 sm:h-8 lg:w-10 lg:h-10 flex-shrink-0" 
                style={{ color: '#990D35' }}
              />
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bebas leading-tight" style={{ color: '#050505' }}>
                  Daftar Peserta Sriwijaya International Taekwondo Championship 2025
                </h1>
                <p className="text-sm sm:text-base mt-1" style={{ color: '#050505', opacity: 0.6 }}>
                  Kelola semua peserta kompetisi Sriwijaya International Taekwondo Championship 2025
                </p>
              </div>
            </div>
            
            <button
              onClick={handleExportExcel}
              disabled={isExporting || displayedPesertas.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium whitespace-nowrap"
              style={{ 
                backgroundColor: '#990D35',
                color: '#F5FBEF',
                borderColor: '#990D35'
              }}
            >
              {isExporting ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <Download size={18} />
                  <span className="hidden sm:inline">Export Excel</span>
                  <span className="sm:hidden">Export</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* FILTER + SEARCH */}
        <div className="rounded-xl shadow-sm border p-4 sm:p-6 mb-6" style={{ backgroundColor: '#F5FBEF', borderColor: '#990D35' }}>
          <div className="space-y-4">
            <div className="w-full">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: '#050505', opacity: 0.4 }}
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Cari peserta..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border shadow-sm focus:ring-2 focus:border-transparent text-sm placeholder-gray-400 transition-colors"
                  style={{ 
                    borderColor: '#990D35', 
                    backgroundColor: '#F5FBEF',
                    color: '#050505'
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs mb-2 font-medium" style={{ color: '#050505', opacity: 0.6 }}>Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl border shadow-sm focus:ring-2 focus:border-transparent text-sm transition-colors"
                  style={{ borderColor: '#990D35', backgroundColor: '#F5FBEF', color: '#050505' }}
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs mb-2 font-medium" style={{ color: '#050505', opacity: 0.6 }}>Kategori</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl border shadow-sm focus:ring-2 focus:border-transparent text-sm transition-colors"
                  style={{ borderColor: '#990D35', backgroundColor: '#F5FBEF', color: '#050505' }}
                >
                  {categoryOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs mb-2 font-medium" style={{ color: '#050505', opacity: 0.6 }}>Level</label>
                <select
                  value={filterLevel || ""}
                  onChange={(e) => setFilterLevel(e.target.value as "pemula" | "prestasi" | null || null)}
                  className="w-full px-3 py-2.5 rounded-xl border shadow-sm focus:ring-2 focus:border-transparent text-sm transition-colors"
                  style={{ borderColor: '#990D35', backgroundColor: '#F5FBEF', color: '#050505' }}
                >
                  {levelOptions.map((opt) => (
                    <option key={opt.value || "null"} value={opt.value || ""}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs mb-2 font-medium" style={{ color: '#050505', opacity: 0.6 }}>Usia</label>
                <select
                  value={filterKelasUsia}
                  onChange={(e) => setFilterKelasUsia(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl border shadow-sm focus:ring-2 focus:border-transparent text-sm transition-colors"
                  style={{ borderColor: '#990D35', backgroundColor: '#F5FBEF', color: '#050505' }}
                >
                  {ageOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-4 sm:col-span-3 lg:col-span-1">
                <label className="block text-xs mb-2 font-medium" style={{ color: '#050505', opacity: 0.6 }}>Dojang</label>
                <select
                  value={filterDojang}
                  onChange={(e) => setFilterDojang(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border shadow-sm focus:ring-2 focus:border-transparent text-sm transition-colors"
                  style={{ borderColor: '#990D35', backgroundColor: '#F5FBEF', color: '#050505' }}
                >
                  <option value="ALL">Semua Dojang</option>
                  {dojangOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs mb-2 font-medium" style={{ color: '#050505', opacity: 0.6 }}>Kelas Berat</label>
                <select
                  value={filterKelasBerat}
                  onChange={(e) => setFilterKelasBerat(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border shadow-sm focus:ring-2 focus:border-transparent text-sm transition-colors"
                  style={{ borderColor: '#990D35', backgroundColor: '#F5FBEF', color: '#050505' }}
                >
                  {kelasBeratOptionsMap[filterKelasUsia || "ALL"].map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* ✅ PERBAIKAN: Info hasil dengan items per page selector */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pt-2 border-t" style={{ borderColor: 'rgba(153, 13, 53, 0.2)' }}>
              <div className="flex items-center gap-3">
                <p className="text-sm" style={{ color: '#050505', opacity: 0.6 }}>
                  Menampilkan <span className="font-semibold">{startIndex + 1}-{Math.min(endIndex, displayedPesertas.length)}</span> dari <span className="font-semibold">{displayedPesertas.length}</span> peserta
                </p>
              </div>
              
              {/* Items per page selector */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium" style={{ color: '#050505', opacity: 0.6 }}>Tampilkan:</label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="px-3 py-1.5 rounded-lg border shadow-sm text-sm transition-colors"
                  style={{ borderColor: '#990D35', backgroundColor: '#F5FBEF', color: '#050505' }}
                >
                  {itemsPerPageOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <>
          {/* Mobile Cards View */}
          <div className="block lg:hidden space-y-4">
            {currentPesertas.map((peserta: any) => {
              const isTeam = peserta.is_team;
              const namaPeserta = isTeam
                ? peserta.anggota_tim?.map((m: any) => m.atlet.nama_atlet).join(", ")
                : peserta.atlet?.nama_atlet || "-";

              const cabang = peserta.kelas_kejuaraan?.cabang || "-";
              const levelEvent = peserta.kelas_kejuaraan?.kategori_event?.nama_kategori || "-";
              const kelasUsia = peserta.kelas_kejuaraan?.kelompok?.nama_kelompok || "-";
              const dojang = isTeam && peserta.anggota_tim?.length
                ? peserta.anggota_tim[0]?.atlet?.dojang?.nama_dojang || "-"
                : peserta.atlet?.dojang?.nama_dojang || "-";

              return (
                <div
                  key={peserta.id_peserta_kompetisi}
                  className="rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow"
                  style={{ backgroundColor: '#F5FBEF', borderColor: '#990D35' }}
                >
                  <div 
                    className="p-4 cursor-pointer"
                    onClick={() => handleRowClick(peserta)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0 pr-3">
                        <h3 className="font-semibold text-base leading-tight" style={{ color: '#050505' }}>
                          {namaPeserta}
                        </h3>
                        <p className="text-sm mt-1" style={{ color: '#050505', opacity: 0.6 }}>
                          {cabang} - {levelEvent}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        {getStatusBadge(peserta.status)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span style={{ color: '#050505', opacity: 0.5 }}>Kelas:</span>
                        <p className="font-medium" style={{ color: '#050505' }}>{kelasUsia}</p>
                      </div>
                      <div>
                        <span style={{ color: '#050505', opacity: 0.5 }}>Dojang:</span>
                        <p className="font-medium truncate" style={{ color: '#050505' }}>{dojang}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* ✅ PERBAIKAN: Action Buttons dengan Delete */}
                  <div className="flex gap-2 p-4 pt-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleApproval(peserta.id_peserta_kompetisi); }}
                      disabled={processing === peserta.id_peserta_kompetisi}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-all text-sm font-medium"
                    >
                      {processing === peserta.id_peserta_kompetisi ? <Loader size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                      <span className="hidden xs:inline">Setujui</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRejection(peserta.id_peserta_kompetisi); }}
                      disabled={processing === peserta.id_peserta_kompetisi}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-white rounded-lg hover:shadow-md disabled:opacity-50 transition-all text-sm font-medium"
                      style={{ backgroundColor: '#990D35' }}
                    >
                      {processing === peserta.id_peserta_kompetisi ? <Loader size={16} className="animate-spin" /> : <XCircle size={16} />}
                      <span className="hidden xs:inline">Tolak</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeletePeserta(peserta); }}
                      disabled={deleting === peserta.id_peserta_kompetisi}
                      className="flex items-center justify-center gap-2 px-3 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all text-sm font-medium"
                    >
                      {deleting === peserta.id_peserta_kompetisi ? <Loader size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <div className="rounded-xl shadow-sm border overflow-hidden" style={{ backgroundColor: '#F5FBEF', borderColor: '#990D35' }}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead style={{ backgroundColor: '#F5B700' }}>
                    <tr>
                      {[
                        "Nama Peserta",
                        "Kategori", 
                        "Level",
                        "Kelas Berat",
                        "Kelas Poomsae",
                        "Kelompok Usia",
                        "Jenis Kelamin",
                        "Dojang",
                        "Status",
                        "Aksi",
                      ].map((header) => (
                        <th
                          key={header}
                          className={`py-3 px-4 font-semibold text-sm ${
                            ["Dojang","Usia/Kelompok", "Jenis Kelamin", "Status", "Aksi"].includes(header) ? "text-center" : "text-left"
                          }`}
                          style={{ color: '#050505' }}
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: '#990D35' }}>
                    {currentPesertas.map((peserta: any) => {
                      const isTeam = peserta.is_team;
                      const namaPeserta = isTeam
                        ? peserta.anggota_tim?.map((m: any) => m.atlet.nama_atlet).join(", ")
                        : peserta.atlet?.nama_atlet || "-";
                      const cabang = peserta.kelas_kejuaraan?.cabang || "-";
                      const levelEvent = peserta.kelas_kejuaraan?.kategori_event?.nama_kategori || "-";
                      const kelasBerat = cabang === "KYORUGI"
                        ? peserta.kelas_kejuaraan?.kelas_berat?.nama_kelas || "-"
                        : "-";
                      const kelasUsia = peserta.kelas_kejuaraan?.kelompok?.nama_kelompok || "-";
                      const jenisKelamin = !isTeam ? peserta.atlet?.jenis_kelamin || "-" : "-";
                      const dojang = isTeam && peserta.anggota_tim?.length
                        ? peserta.anggota_tim[0]?.atlet?.dojang?.nama_dojang || "-"
                        : peserta.atlet?.dojang?.nama_dojang || "-";

                      return (
                        <tr
                          key={peserta.id_peserta_kompetisi}
                          className="transition-colors cursor-pointer"
                          onClick={() => handleRowClick(peserta)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(245, 183, 0, 0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <td className="py-3 px-4 font-medium text-sm" style={{ color: '#050505' }}>
                            <div className="max-w-[200px] truncate" title={namaPeserta}>
                              {namaPeserta}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm" style={{ color: '#050505', opacity: 0.7 }}>{cabang}</td>
                          <td className="py-3 px-4 text-sm" style={{ color: '#050505', opacity: 0.7 }}>{levelEvent}</td>
                          <td className="py-3 px-4 text-sm" style={{ color: '#050505', opacity: 0.7 }}>{kelasBerat}</td>
                          <td className="py-3 px-4 text-sm" style={{ color: '#050505', opacity: 0.7 }}>
                            {peserta.kelas_kejuaraan?.cabang === "POOMSAE"
                              ? peserta.kelas_kejuaraan?.poomsae?.nama_kelas || "-"
                              : "-"}
                          </td>
                          <td className="py-3 px-4 text-center text-sm" style={{ color: '#050505', opacity: 0.7 }}>{kelasUsia}</td>
                          <td className="py-3 px-4 text-center text-sm" style={{ color: '#050505', opacity: 0.7 }}>{jenisKelamin === "LAKI_LAKI" ? "Laki-Laki" : jenisKelamin === "PEREMPUAN" ? "Perempuan" : "-"}</td>
                          <td className="py-3 px-4 text-sm text-center" style={{ color: '#050505', opacity: 0.7 }}>
                            <div className="max-w-[150px] truncate" title={dojang}>
                              {dojang}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">{getStatusBadge(peserta.status)}</td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleApproval(peserta.id_peserta_kompetisi); }}
                                disabled={processing === peserta.id_peserta_kompetisi}
                                className="inline-flex items-center gap-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-all text-sm font-medium"
                                title="Setujui peserta"
                              >
                                {processing === peserta.id_peserta_kompetisi ? <Loader size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                <span className="hidden xl:inline">Setujui</span>
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleRejection(peserta.id_peserta_kompetisi); }}
                                disabled={processing === peserta.id_peserta_kompetisi}
                                className="inline-flex items-center gap-1 px-3 py-2 text-white rounded-lg hover:shadow-md disabled:opacity-50 transition-all text-sm font-medium"
                                style={{ backgroundColor: '#990D35' }}
                                title="Tolak peserta"
                              >
                                {processing === peserta.id_peserta_kompetisi ? <Loader size={16} className="animate-spin" /> : <XCircle size={16} />}
                                <span className="hidden xl:inline">Tolak</span>
                              </button>
                              {/* ✅ PERBAIKAN: Tombol Delete */}
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeletePeserta(peserta); }}
                                disabled={deleting === peserta.id_peserta_kompetisi}
                                className="inline-flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all text-sm font-medium"
                                title="Hapus peserta"
                              >
                                {deleting === peserta.id_peserta_kompetisi ? <Loader size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                <span className="hidden xl:inline">Hapus</span>
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

          {/* Empty State */}
          {displayedPesertas.length === 0 && (
            <div className="py-16 text-center" style={{ color: '#050505', opacity: 0.4 }}>
              <Users size={52} className="mx-auto mb-4" />
              <p className="text-lg">Tidak ada peserta yang ditemukan</p>
              {(searchTerm || filterStatus !== "ALL" || filterCategory !== "ALL" || filterKelasUsia !== "ALL" || filterLevel || filterDojang !== "ALL") && (
                <p className="text-sm mt-2">Coba ubah filter pencarian Anda</p>
              )}
            </div>
          )}
        </>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl shadow-sm border p-4 sm:p-6 mt-6" style={{ backgroundColor: '#F5FBEF', borderColor: '#990D35' }}>
            <div className="text-sm order-2 sm:order-1" style={{ color: '#050505', opacity: 0.6 }}>
              Menampilkan {startIndex + 1} - {Math.min(endIndex, displayedPesertas.length)} dari {displayedPesertas.length} hasil
            </div>

            <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-2 sm:px-3 py-2 rounded-lg border hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                style={{ borderColor: '#990D35', backgroundColor: '#F5FBEF', color: '#050505' }}
              >
                <ChevronLeft size={16} />
                <span className="hidden sm:inline">Prev</span>
              </button>

              <div className="flex items-center gap-1">
                {getPageNumbers().map((pageNum, index) => (
                  pageNum === '...' ? (
                    <span key={`ellipsis-${index}`} className="px-2 py-2 text-sm" style={{ color: '#050505', opacity: 0.4 }}>...</span>
                  ) : (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum as number)}
                      className={`px-2 sm:px-3 py-2 rounded-lg transition-colors text-sm min-w-[32px] sm:min-w-[40px]`}
                      style={{
                        backgroundColor: currentPage === pageNum ? '#990D35' : '#F5FBEF',
                        color: currentPage === pageNum ? '#F5FBEF' : '#050505',
                        border: currentPage === pageNum ? 'none' : `1px solid #990D35`
                      }}
                    >
                      {pageNum}
                    </button>
                  )
                ))}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-2 sm:px-3 py-2 rounded-lg border hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                style={{ borderColor: '#990D35', backgroundColor: '#F5FBEF', color: '#050505' }}
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ✅ MODAL DELETE CONFIRMATION */}
        {showDeleteModal && pesertaToDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
              <div className="p-6 flex flex-col items-center" style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)' }}>
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: '#DC2626' }}
                >
                  <Trash2 size={40} style={{ color: 'white' }} />
                </div>
                
                <h3 className="text-2xl font-bold text-center mb-2" style={{ color: '#050505' }}>
                  Hapus Peserta?
                </h3>
                
                <p className="text-center text-base leading-relaxed mb-4" style={{ color: '#050505', opacity: 0.7 }}>
                  Apakah Anda yakin ingin menghapus peserta <strong>{pesertaToDelete.is_team 
                    ? pesertaToDelete.anggota_tim?.map((m: any) => m.atlet.nama_atlet).join(", ")
                    : pesertaToDelete.atlet?.nama_atlet}</strong> dari database?
                </p>
                
                <p className="text-center text-base" style={{ color: '#DC2626' }}>
                  Aksi ini tidak dapat dibatalkan!
                </p>
              </div>
              
              <div className="p-6 bg-gray-50 flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setPesertaToDelete(null);
                  }}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold transition-all hover:bg-white border-2"
                  style={{ borderColor: '#990D35', color: '#990D35', backgroundColor: 'white' }}
                >
                  Batal
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting !== null}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold transition-all hover:opacity-90 shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#DC2626', color: 'white' }}
                >
                  {deleting !== null ? (
                    <>
                      <Loader size={18} className="animate-spin" />
                      <span>Menghapus...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={18} />
                      <span>Ya, Hapus</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

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
    </div>
  );
};

export default AllPeserta;