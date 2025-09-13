import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, Users, Search, Clock, CheckCircle, Menu, ChevronLeft, ChevronRight, Edit, Trash } from 'lucide-react';
import toast from "react-hot-toast";
import NavbarDashboard from "../../components/navbar/navbarDashboard";
import { useAuth } from "../../context/authContext";
import { useKompetisi } from "../../context/KompetisiContext";
import { useDojang } from "../../context/dojangContext";
import UnifiedRegistration from "../../components/registrationSteps/UnifiedRegistration";
import type { Kompetisi } from "../../context/KompetisiContext";
import Select from "react-select";
import { kelasBeratOptionsMap } from "../../dummy/beratOptions";



interface StatsCardProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  value: string;
  color: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ icon: Icon, title, value, color }) => (
  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
      <div>
        <h3 className="font-plex text-sm text-black/60">{title}</h3>
        <p className="font-bebas text-2xl text-black/80">{value}</p>
      </div>
    </div>
  </div>
);

const DataKompetisi = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { kompetisiList, loadingKompetisi, fetchKompetisiList, fetchAtletByKompetisi, pesertaList, deleteParticipant } = useKompetisi();
  const { dojangOptions, refreshDojang } = useDojang();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "PENDAFTARAN" | "SEDANG_DIMULAI" | "SELESAI">("all");
  const [selectedKompetisi, setSelectedKompetisi] = useState<Kompetisi | null>(null);
  const [showPeserta, setShowPeserta] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deletingParticipants, setDeletingParticipants] = useState<Set<number>>(new Set());
  // State untuk modal registrasi
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  
  // Filtering states untuk halaman peserta
  const [searchPeserta, setSearchPeserta] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [filterCategory, setFilterCategory] = useState<"ALL" | "KYORUGI" | "POOMSAE">("ALL");
  const [filterKelompokUsia, setFilterKelompokUsia] = useState<"ALL" | "Super pracadet" | "Pracadet" | "Cadet" | "Junior" | "Senior" >("ALL");
  const [filterKelasBerat, setFilterKelasBerat] = useState<string>("ALL");
  const [filterLevel, setFilterLevel] = useState<"ALL" | "pemula" | "prestasi">("ALL");
  const [filterGender, setFilterGender] = useState<"ALL" | "LAKI_LAKI" | "PEREMPUAN">("ALL");
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(100);

  useEffect(() => {
    refreshDojang();
  }, []);

  useEffect(() => {
    // Token handled by apiClient automatically
  }, [token]);

  useEffect(() => {
    fetchKompetisiList();
  }, []);

  // Close mobile sidebar on window resize
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchPeserta, filterStatus, filterCategory, filterKelasBerat, filterKelompokUsia, filterLevel, filterGender]);

  const handleKompetisiClick = async (kompetisi: Kompetisi) => {
    setSelectedKompetisi(kompetisi);
    setShowPeserta(true);

    // kalau role pelatih, lemparkan id_dojang ke API
    const idDojang = user?.pelatih?.id_dojang;
    await fetchAtletByKompetisi(kompetisi.id_kompetisi, undefined, idDojang);
  };

   const handleDeleteParticipant = async (kompetisiId: number, participantId: number, participantName: string, participantStatus: string) => {
  // Check if participant is approved - prevent deletion
  if (participantStatus === "APPROVED") {
    toast.error("Hubungi admin untuk menghapus registrasi peserta yang sudah di approved");
    return;
  }

  // Konfirmasi delete
  const isConfirmed = window.confirm(
    `Apakah Anda yakin ingin menghapus peserta "${participantName}" dari kompetisi ini?`
  );
  
  if (!isConfirmed) return;

  // Set loading state for this specific participant
  setDeletingParticipants(prev => new Set(prev).add(participantId));

  try {
    await deleteParticipant(kompetisiId, participantId);
    toast.success(`Peserta "${participantName}" berhasil dihapus dari kompetisi`);
  } catch (error: any) {
    toast.error(error.message || "Gagal menghapus peserta");
  } finally {
    // Remove loading state
    setDeletingParticipants(prev => {
      const newSet = new Set(prev);
      newSet.delete(participantId);
      return newSet;
    });
  }
};

  const formatTanggal = (date: string | Date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDAFTARAN": return "bg-green-100 text-green-600";
      case "SEDANG_DIMULAI": return "bg-yellow-100 text-yellow-600";
      case "SELESAI": return "bg-gray-100 text-gray-600";
      default: return "bg-gray-100 text-gray-600";
    }
  };


  const kelasBeratOptions = [
  { value: "ALL", label: "Semua Kelas" },

  // Under
  { value: "Under 18 kg", label: "Under 18 kg" },
  { value: "Under 19 kg", label: "Under 19 kg" },
  { value: "Under 20 kg", label: "Under 20 kg" },
  { value: "Under 21 kg", label: "Under 21 kg" },
  { value: "Under 22 kg", label: "Under 22 kg" },
  ]


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

  // Hitung statistik berdasarkan status
  const stats = {
    total: kompetisiList.length,
    pendaftaran: kompetisiList.filter(k => k.status === "PENDAFTARAN").length,
    sedangBerlangsung: kompetisiList.filter(k => k.status === "SEDANG_DIMULAI").length,
    selesai: kompetisiList.filter(k => k.status === "SELESAI").length
  };

  const filteredKompetisi = kompetisiList.filter(k => {
    const matchesSearch = k.nama_event.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (k.lokasi?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === "all" || k.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filter peserta dengan logika yang sama seperti AllPeserta
  const displayedPesertas = pesertaList.filter((peserta: any) => {
    // Nama peserta (team atau individu)
    const namaPeserta = peserta.is_team
      ? peserta.anggota_tim?.map((a: any) => a.atlet.nama_atlet).join(" ") || ""
      : peserta.atlet?.nama_atlet || "";

    const matchesSearch = namaPeserta.toLowerCase().includes(searchPeserta.toLowerCase());

    // Status
    const pesertaStatus = peserta.status?.toUpperCase() || "";
    const matchesStatus = filterStatus === "ALL" || pesertaStatus === filterStatus.toUpperCase();

    // Kategori / cabang
    const kategori = peserta.kelas_kejuaraan?.cabang?.toUpperCase() || "";
    const matchesCategory = filterCategory === "ALL" || kategori === filterCategory.toUpperCase();

    // Kelas berat
    const kelasBerat = peserta.kelas_kejuaraan?.kelas_berat?.nama_kelas?.toUpperCase() || "";
    const matchesKelasBerat = filterKelasBerat === "ALL" || kelasBerat === filterKelasBerat.toUpperCase();

    // Kelas usia / kelompok
    const kelasUsia = peserta.kelas_kejuaraan?.kelompok?.nama_kelompok?.toUpperCase() || "";
    const matchesKelasUsia = filterKelompokUsia === "ALL" || kelasUsia === filterKelompokUsia.toUpperCase();

    // Level / kategori event
    const level = peserta.kelas_kejuaraan?.kategori_event?.nama_kategori?.toUpperCase() || "";
    const matchesLevel = filterLevel === "ALL" || level === filterLevel.toUpperCase();

    // gender
    const genderPeserta = peserta.atlet?.jenis_kelamin || "-";
    const matchesGender = filterGender === "ALL" || genderPeserta === filterGender.toUpperCase();

    return matchesSearch && matchesStatus && matchesCategory && matchesKelasBerat && matchesKelasUsia && matchesLevel && matchesGender;
  });

  // Pagination logic
  const totalPages = Math.ceil(displayedPesertas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPesertas = displayedPesertas.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 100;
    
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

  // Handler untuk menutup modal registrasi dan refresh data
  const handleRegistrationClose = () => {
    setShowRegistrationModal(false);
    // Refresh data peserta setelah registrasi berhasil
    if (selectedKompetisi) {
      const idDojang = user?.pelatih?.id_dojang;
      fetchAtletByKompetisi(selectedKompetisi.id_kompetisi, undefined, idDojang);
    }
  };

  // Loading state with proper layout
  if (loadingKompetisi) {
    return (
      <div className="min-h-screen max-w-screen bg-gradient-to-br from-white via-red/5 to-yellow/10">
        <NavbarDashboard />
        <div className="lg:ml-72 w-full min-h-screen flex items-center justify-center">
          <p className="font-plex text-lg text-black/60">Loading...</p>
        </div>
      </div>
    );
  }

  // Halaman detail peserta dengan filtering terintegrasi
  if (showPeserta && selectedKompetisi) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-white via-red/5 to-yellow/10">
        <NavbarDashboard />
        <div className="lg:ml-72">
          <div className="px-4 lg:px-8 py-8 pb-16">
            {/* Mobile Menu Button + Back Button */}
            <div className="flex items-center gap-4 mb-6">
              {/* Mobile Menu Button */}
              <div className="lg:hidden">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-3 rounded-xl hover:bg-white/50 transition-all duration-300 border border-red/20"
                  aria-label="Open menu"
                >
                  <Menu size={24} className="text-red" />
                </button>
              </div>
              
              {/* Back Button */}
              <button
                onClick={() => setShowPeserta(false)}
                className="text-red hover:text-red/80 font-plex transition-colors duration-200"
              >
                ← Kembali
              </button>
            </div>

            {/* Header */}
            <div className="mb-8">
              <h1 className="font-bebas text-4xl lg:text-6xl text-black/80 tracking-wider">
                {selectedKompetisi.nama_event}
              </h1>
              <p className="font-plex text-black/60 text-lg mt-2">
                Validasi peserta yang terdaftar
              </p>
            </div>

            {/* FILTER + SEARCH - Sama seperti AllPeserta */}
            <div className="rounded-xl shadow-sm border p-4 sm:p-6 mb-6" style={{ backgroundColor: '#F5FBEF', borderColor: '#990D35' }}>
              <div className="space-y-4">
                {/* Search - Full width */}
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
                      value={searchPeserta}
                      onChange={(e) => setSearchPeserta(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border shadow-sm focus:ring-2 focus:border-transparent text-sm placeholder-gray-400 transition-colors"
                      style={{ 
                        borderColor: '#990D35', 
                        backgroundColor: '#F5FBEF',
                        color: '#050505'
                      }}
                      onFocus={(e) => {
                        e.target.style.outline = 'none';
                        e.target.style.boxShadow = '0 0 0 2px rgba(153, 13, 53, 0.2)';
                      }}
                      onBlur={(e) => {
                        e.target.style.boxShadow = '';
                      }}
                    />
                  </div>
                </div>

                {/* Filter dalam grid responsif */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                  {/* Filter Status */}
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs mb-2 font-medium" style={{ color: '#050505', opacity: 0.6 }}>Status</label>
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
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs mb-2 font-medium" style={{ color: '#050505', opacity: 0.6 }}>Kategori</label>
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

                  {/* Filter Level */}
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs mb-2 font-medium" style={{ color: '#050505', opacity: 0.6 }}>Level</label>
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

                  {/* Filter Kelompok Usia */}
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs mb-2 font-medium" style={{ color: '#050505', opacity: 0.6 }}>Usia</label>
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
                        { value: "Super pracadet", label: "Super Pra-Cadet (2017-2020)" },
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

                  {/* Filter gender */}
                  <div className="col-span-4 sm:col-span-3 lg:col-span-1">
                    <label className="block text-xs mb-2 font-medium" style={{ color: '#050505', opacity: 0.6 }}>Dojang</label>
                    <Select
                      unstyled
                      value={{
                        value: filterGender,
                        label:
                          filterGender === "ALL"
                            ? "Semua Jenis Kelamin"
                            : filterGender === "LAKI_LAKI"
                            ? "Laki-Laki"
                            : "Perempuan",
                      }}
                      onChange={(selected) => setFilterGender(selected?.value as any)}
                      options={[
                        { value: "ALL", label: "Semua Jenis Kelamin" },
                        { value: "LAKI_LAKI", label: "Laki-Laki" },
                        { value: "PEREMPUAN", label: "Perempuan" },
                      ]}
                      placeholder="Pilih jenis kelamin"
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

                  {/* Filter Kelas Berat */}
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs mb-2 font-medium" style={{ color: '#050505', opacity: 0.6 }}>
                      Kelas Berat
                    </label>
                    <Select
                      unstyled
                      options={Object.values(kelasBeratOptionsMap).flat()}
                      value={Object.values(kelasBeratOptionsMap).flat().find(opt => opt.value === filterKelasBerat)}
                      onChange={(selected) => setFilterKelasBerat(selected?.value as any)}
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
                </div>

                {/* Info hasil */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 pt-2 border-t" style={{ borderColor: 'rgba(153, 13, 53, 0.2)' }}>
                  <p className="text-sm" style={{ color: '#050505', opacity: 0.6 }}>
                    Menampilkan <span className="font-semibold">{startIndex + 1}-{Math.min(endIndex, displayedPesertas.length)}</span> dari <span className="font-semibold">{displayedPesertas.length}</span> peserta
                  </p>
                  <p className="text-xs sm:text-sm" style={{ color: '#050505', opacity: 0.5 }}>
                    Halaman {currentPage} dari {totalPages}
                  </p>
                </div>
              </div>
            </div>
            
             {/* Registration Button */}
            <div className="mb-6">
              <div className="bg-gradient-to-r from-red/5 via-yellow/5 to-red/5 rounded-2xl border border-red/20 shadow-sm overflow-hidden">
                <div className="p-4 lg:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Content */}
                    <div className="text-center lg:text-left">
                      <h3 className="font-bebas text-xl lg:text-2xl text-black/80 mb-1">
                        Daftarkan Atlet Baru
                      </h3>
                      <p className="font-plex text-sm lg:text-base text-black/60">
                        Tambahkan atlet ke kompetisi {selectedKompetisi.nama_event}
                      </p>
                    </div>
                    
                    {/* Button */}
                    <div className="flex justify-center lg:justify-end">
                      <button
                        onClick={() => setShowRegistrationModal(true)}
                        className="bg-gradient-to-r from-red to-red/90 hover:from-red/90 hover:to-red text-white font-plex font-semibold px-6 lg:px-8 py-3 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105 flex items-center gap-2 min-w-[180px] lg:min-w-[200px] justify-center"
                      >
                        <Users size={20} />
                        <span>Daftar Atlet</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Peserta Table */}
            <div className="w-full bg-white backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50">
              {/* Desktop Table View */}
              <div className="hidden lg:block">
                {displayedPesertas.length > 0 ? (
                  <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
                    <table className="w-full min-w-[1200px]">
                      <thead className="bg-yellow-400">
                        <tr>
                          {[
                            "Nama",
                            "Kategori",
                            "Level",
                            "Kelas Berat",
                            "Kelas Poomsae",
                            "Kelompok Usia",
                            "Jenis Kelamin",
                            "Nama Dojang",
                            "Status",
                            "Aksi", // 👈 Tambahan
                          ].map((header) => (
                            <th
                              key={header}
                              className={`py-3 px-4 font-semibold text-gray-900 text-sm ${
                                header === "Status" || header === "Aksi"
                                  ? "text-center"
                                  : "text-left"
                              }`}
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {currentPesertas.map((peserta: any) => {
                          const isTeam = peserta.is_team;
                          const cabang = peserta.kelas_kejuaraan?.cabang || "-";
                          const level =
                            peserta.kelas_kejuaraan?.kategori_event?.nama_kategori || "-";
                        
                          const kelasBerat =
                            cabang === "KYORUGI"
                              ? peserta.kelas_kejuaraan?.kelas_berat?.nama_kelas || "-"
                              : "-";
                        
                          const kelasPoomsae =
                            cabang === "POOMSAE"
                              ? peserta.kelas_kejuaraan?.poomsae?.nama_kelas || "-"
                              : "-";
                        
                          const namaPeserta = isTeam
                            ? peserta.anggota_tim
                                ?.map((m: any) => m.atlet.nama_atlet)
                                .join(", ")
                            : peserta.atlet?.nama_atlet || "-";
                        
                          const dojang =
                            isTeam && peserta.anggota_tim?.length
                              ? peserta.anggota_tim[0]?.atlet?.dojang?.nama_dojang || "-"
                              : peserta.atlet?.dojang?.nama_dojang || "-";
                        
                          const kelompokUsia =
                            !peserta.kelas_kejuaraan?.kelompok?.nama_kelompok ||
                            peserta.kelas_kejuaraan.kelompok.nama_kelompok.toLowerCase() ===
                              "pemula"
                              ? "-"
                              : peserta.kelas_kejuaraan.kelompok.nama_kelompok;
                          
                          const isDeleting = deletingParticipants.has(peserta.id_peserta_kompetisi);

                          return (
                            <tr
                              key={peserta.id_peserta_kompetisi}
                              className="hover:bg-yellow-50 transition-colors cursor-pointer"
                              onClick={() => {
                                if (!isTeam && peserta.atlet?.id_atlet) {
                                  navigate(`/dashboard/atlit/${peserta.atlet.id_atlet}`);
                                } else {
                                  toast("Ini peserta tim, tidak ada detail personal");
                                }
                              }}
                            >
                              <td className="py-4 px-4 font-medium text-gray-800 text-sm">
                                {namaPeserta}
                              </td>
                              <td className="py-4 px-4 text-gray-700 text-sm">{cabang}</td>
                              <td className="py-4 px-4 text-gray-700 text-sm">{level}</td>
                              <td className="py-4 px-4 text-gray-700 text-sm">{kelasBerat}</td>
                              <td className="py-4 px-4 text-center text-gray-700 text-sm">
                                {kelasPoomsae}
                              </td>
                              <td className="py-4 px-4 text-center text-gray-700 text-sm">
                                {kelompokUsia || "-"}
                              </td>
                              <td className="py-4 px-4 text-center text-sm">
                                {!isTeam ? (
                                  peserta.atlet?.jenis_kelamin === "LAKI_LAKI" ? (
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                                      Laki-Laki
                                    </span>
                                  ) : (
                                    <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded-full text-xs">
                                      Perempuan
                                    </span>
                                  )
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="py-4 px-4 text-gray-700 text-sm">{dojang}</td>
                              <td className="py-4 px-4 text-center">
                                {getStatusBadge(peserta.status)}
                              </td>
                              {/* 👇 Tambahan kolom Aksi */}
                              <td className="py-4 px-4 text-center flex justify-center gap-3">
                                <button className="text-blue-600 hover:text-blue-800 cursor-pointer hover:scale-102" onClick={(e) => {e.stopPropagation(); toast.error("Fitur ini akan segera tersedia")}}>
                                  <Edit size={18} />
                                </button>
                                <button 
                                    className={`text-red-600 hover:text-red-800 cursor-pointer hover:scale-102 transition-colors ${
                                      isDeleting ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!isDeleting) {
                                        handleDeleteParticipant(
                                          selectedKompetisi.id_kompetisi, 
                                          peserta.id_peserta_kompetisi,
                                          namaPeserta
                                        );
                                      }
                                    }}
                                    disabled={isDeleting}
                                    title={isDeleting ? "Menghapus..." : "Hapus peserta"}
                                  >
                                    <Trash size={18} />
                                  </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Users size={52} className="mx-auto mb-4" />
                    <p className="text-lg">Tidak ada peserta ditemukan</p>
                    {(searchPeserta || filterStatus !== "ALL" || filterCategory !== "ALL" || filterKelompokUsia !== "ALL" || filterLevel || filterGender !== "ALL" || filterKelasBerat !== "ALL") && (
                      <p className="text-sm mt-2">Coba ubah filter pencarian Anda</p>
                    )}
                  </div>
                )}
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4">
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
                  const kelasBerat =
  cabang === "KYORUGI"
    ? peserta.kelas_kejuaraan?.kelas_berat?.nama_kelas || "-"
    : "-";

const kelasPoomsae =
  cabang === "POOMSAE"
    ? peserta.kelas_kejuaraan?.poomsae?.nama_kelas || "-"
    : "-";

                  return (
                    <div
                      key={peserta.id_peserta_kompetisi}
                      className="bg-white rounded-xl shadow-md border border-gray-200 p-4"
                      onClick={() => {
                        if (!isTeam && peserta.atlet?.id_atlet) {
                          navigate(`/dashboard/atlit/${peserta.atlet.id_atlet}`);
                        } else {
                          toast("Ini peserta tim, tidak ada detail personal");
                        }
                      }}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 min-w-0 pr-3">
                          <h3 className="font-bebas text-lg leading-tight">{namaPeserta}</h3>
                          <p className="text-sm text-gray-600 mt-1">{cabang} - {levelEvent}</p>
                        </div>
                        <div className="flex-shrink-0">
                          {getStatusBadge(peserta.status)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                        <div>
                          <span className="text-gray-500">Kelas:</span>
                          <p className="font-medium text-gray-800">{kelasUsia}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Dojang:</span>
                          <p className="font-medium text-gray-800 truncate">{dojang}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Kelas Berat:</span>
                          <p className="font-medium text-gray-800">{kelasBerat}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Kelas Poomsae:</span>
                          <p className="font-medium text-gray-800">
                              {kelasPoomsae}                            
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {displayedPesertas.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Users size={52} className="mx-auto mb-4" />
                    <p className="text-lg">Tidak ada peserta ditemukan</p>
                    {(searchPeserta || filterStatus !== "ALL" || filterCategory !== "ALL" || filterKelompokUsia !== "ALL" || filterLevel || filterGender !== "ALL" || filterKelasBerat !== "ALL") && (
                      <p className="text-sm mt-2">Coba ubah filter pencarian Anda</p>
                    )}
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mt-6">
                  {/* Pagination Info */}
                  <div className="text-sm order-2 sm:order-1 text-gray-600">
                    Menampilkan {startIndex + 1} - {Math.min(endIndex, displayedPesertas.length)} dari {displayedPesertas.length} hasil
                  </div>

                  {/* Pagination Controls */}
                  <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2">
                    {/* Previous Button */}
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1 px-2 sm:px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                      <ChevronLeft size={16} />
                      <span className="hidden sm:inline">Prev</span>
                    </button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                      {getPageNumbers().map((pageNum, index) => (
                        pageNum === '...' ? (
                          <span key={`ellipsis-${index}`} className="px-2 py-2 text-sm text-gray-400">...</span>
                        ) : (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum as number)}
                            className={`px-2 sm:px-3 py-2 rounded-lg transition-colors text-sm min-w-[32px] sm:min-w-[40px] ${
                              currentPage === pageNum
                                ? 'bg-blue-500 text-white'
                                : 'border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      ))}
                    </div>

                    {/* Next Button */}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1 px-2 sm:px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Modal Registrasi */}
        <UnifiedRegistration
          isOpen={showRegistrationModal}
          onClose={handleRegistrationClose}
          kompetisiId={selectedKompetisi.id_kompetisi}
          kompetisiName={selectedKompetisi.nama_event}
          biayaPendaftaran={(selectedKompetisi as any).biaya_pendaftaran}
        />
        
        {/* Mobile Sidebar */}
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="lg:hidden z-50">
              <NavbarDashboard mobile onClose={() => setSidebarOpen(false)} />
            </div>
          </>
        )}
      </div>
    );
  }

  // Halaman utama daftar kompetisi dengan search + filter
  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-white via-red/5 to-yellow/10">
      <NavbarDashboard />
      <div className="lg:ml-72 max-w-full">
        <div className="px-4 lg:px-8 py-8 pb-16">
          {/* Mobile Menu Button */}
          <div className="lg:hidden mb-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-3 rounded-xl hover:bg-white/50 transition-all duration-300 border border-red/20"
              aria-label="Open menu"
            >
              <Menu size={24} className="text-red" />
            </button>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="font-bebas text-4xl lg:text-6xl xl:text-7xl text-black/80 tracking-wider">
              DATA KOMPETISI
            </h1>
            <p className="font-plex text-black/60 text-lg mt-2">
              Lihat info kompetisi dan peserta yang terdaftar
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              icon={Trophy}
              title="Total Kompetisi"
              value={stats.total.toString()}
              color="bg-gradient-to-r from-red to-red/80"
            />
            <StatsCard
              icon={Users}
              title="Masa Pendaftaran"
              value={stats.pendaftaran.toString()}
              color="bg-gradient-to-r from-green-500 to-green-600"
            />
            <StatsCard
              icon={Clock}
              title="Sedang Berlangsung"
              value={stats.sedangBerlangsung.toString()}
              color="bg-gradient-to-r from-yellow-500 to-yellow-600"
            />
            <StatsCard
              icon={CheckCircle}
              title="Sudah Selesai"
              value={stats.selesai.toString()}
              color="bg-gradient-to-r from-gray-500 to-gray-600"
            />
          </div>

          {/* Search & Status Filter */}
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50 mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-red/60" size={20} />
                  <input
                    type="text"
                    placeholder="Cari nama kompetisi atau lokasi..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-red/20 focus:border-red outline-none bg-white/80 backdrop-blur-sm font-plex"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex gap-2 flex-wrap">
                {["all", "PENDAFTARAN", "SEDANG_DIMULAI", "SELESAI"].map((status) => {
                  const isActive = statusFilter === status;
                
                  let buttonClass = "";
                  switch (status) {
                    case "PENDAFTARAN":
                      buttonClass = isActive
                        ? "bg-green-100 text-green-600 border border-green-200"
                        : "text-green-600 border border-green-600 hover:bg-green-50";
                      break;
                    case "SEDANG_DIMULAI":
                      buttonClass = isActive
                        ? "bg-yellow-100 text-yellow-600 border border-yellow-200"
                        : "text-yellow-600 border border-yellow-600 hover:bg-yellow-50";
                      break;
                    case "SELESAI":
                      buttonClass = isActive
                        ? "bg-gray-100 text-gray-600 border border-gray-200"
                        : "text-gray-600 border border-gray-600 hover:bg-gray-50";
                      break;
                    default: // all
                      buttonClass = isActive
                        ? "bg-red text-white border border-red-200"
                        : "text-red border border-red-600 hover:bg-red-50";
                      break;
                  }
                
                  return (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status as any)}
                      className={`cursor-pointer px-4 py-3 rounded-xl font-plex text-sm transition-all duration-300 ${buttonClass}`}
                    >
                      {status === "all"
                        ? "Semua"
                        : status === "PENDAFTARAN"
                        ? "Pendaftaran"
                        : status === "SEDANG_DIMULAI"
                        ? "Sedang Dimulai"
                        : "Selesai"}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Tabel Kompetisi */}
          <div className="overflow-x-hidden w-full bg-white/60 backdrop-blur-sm rounded-2xl p-4 lg:p-6 shadow-xl border border-white/50">
            {/* Desktop Table View */}
            <div className="hidden lg:block">
              <div className="rounded-2xl overflow-hidden border border-red/20">
                <table className="w-full rounded-3xl">
                  <thead className="bg-gradient-to-r from-red to-red/80 text-white">
                    <tr>
                      <th className="px-6 py-4 text-left font-bebas text-xl tracking-wider">Nama Kompetisi</th>
                      <th className="px-6 py-4 text-center font-bebas text-xl tracking-wider">Tanggal Mulai</th>
                      <th className="px-6 py-4 text-center font-bebas text-xl tracking-wider">Tanggal Selesai</th>
                      <th className="px-6 py-4 text-center font-bebas text-xl tracking-wider">Lokasi</th>
                      <th className="px-6 py-4 text-center font-bebas text-xl tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red/10 bg-white/50 backdrop-blur-sm">
                    {filteredKompetisi.map((k) => (
                      <tr
                        key={k.id_kompetisi}
                        className="transition-all duration-200 hover:bg-red/5 cursor-pointer"
                        onClick={() => handleKompetisiClick(k)}
                      >
                        <td className="px-6 py-4 font-plex text-black/80">{k.nama_event}</td>
                        <td className="px-6 py-4 text-center font-plex text-black/70">{formatTanggal(k.tanggal_mulai)}</td>
                        <td className="px-6 py-4 text-center font-plex text-black/70">{formatTanggal(k.tanggal_selesai)}</td>
                        <td className="px-6 py-4 text-center font-plex text-black/70">{k.lokasi || "-"}</td>
                        <td className="px-6 py-4 text-center">
                          <span 
                            className={`
                              px-4 py-1.5 rounded-full text-sm font-plex font-medium 
                              ${k.status === "PENDAFTARAN" 
                                ? "bg-green-100 text-green-600 border border-green-200" 
                                : k.status === "SEDANG_DIMULAI" 
                                ? "bg-yellow-100 text-yellow-600 border border-yellow-200"
                                : "bg-gray-100 text-gray-600 border border-gray-200"}
                            `}
                          >
                            {k.status === "PENDAFTARAN"
                              ? "Pendaftaran"
                              : k.status === "SEDANG_DIMULAI"
                              ? "Sedang Dimulai"
                              : "Selesai"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredKompetisi.length === 0 && (
                  <div className="text-center py-12 bg-white/50 backdrop-blur-sm">
                    <Trophy className="mx-auto text-red/40 mb-4" size={48} />
                    <p className="font-plex text-black/60">Tidak ada kompetisi yang ditemukan</p>
                    <p className="font-plex text-sm text-black/40 mt-2">Coba ubah kriteria pencarian atau filter</p>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {filteredKompetisi.map((k) => (
                <div
                  key={k.id_kompetisi}
                  className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-red/20 hover:bg-red/5 transition-colors cursor-pointer"
                  onClick={() => handleKompetisiClick(k)}
                >
                  {/* Competition Name */}
                  <h3 className="font-bebas text-xl text-black/80 mb-2">
                    {k.nama_event}
                  </h3>

                  {/* Status Badge */}
                  <div className="mb-3">
                    <span 
                      className={`
                        inline-block px-4 py-1.5 rounded-full text-sm font-plex font-medium
                        ${k.status === "PENDAFTARAN" 
                          ? "bg-green-100 text-green-600 border border-green-200" 
                          : k.status === "SEDANG_DIMULAI" 
                          ? "bg-yellow-100 text-yellow-600 border border-yellow-200"
                          : "bg-gray-100 text-gray-600 border border-gray-200"}
                      `}
                    >
                      {k.status === "PENDAFTARAN"
                        ? "Pendaftaran"
                        : k.status === "SEDANG_DIMULAI"
                        ? "Sedang Dimulai"
                        : "Selesai"}
                    </span>
                  </div>

                  {/* Competition Details */}
                  <div className="space-y-2.5 text-sm font-plex">
                    <div className="flex items-start gap-2">
                      <span className="text-black/50 min-w-[100px]">Tanggal Mulai</span>
                      <span className="text-black/70">: {formatTanggal(k.tanggal_mulai)}</span>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <span className="text-black/50 min-w-[100px]">Tanggal Selesai</span>
                      <span className="text-black/70">: {formatTanggal(k.tanggal_selesai)}</span>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <span className="text-black/50 min-w-[100px]">Lokasi</span>
                      <span className="text-black/70">: {k.lokasi || "-"}</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Empty State for Mobile */}
              {filteredKompetisi.length === 0 && (
                <div className="text-center py-8 bg-white/80 backdrop-blur-sm rounded-xl border border-red/20">
                  <Trophy className="mx-auto text-red/40 mb-3" size={40} />
                  <p className="font-plex text-black/60 text-sm">
                    Tidak ada kompetisi yang ditemukan
                  </p>
                  <p className="font-plex text-xs text-black/40 mt-1">
                    Coba ubah kriteria pencarian atau filter
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="lg:hidden z-50">
            <NavbarDashboard mobile onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
};

export default DataKompetisi;