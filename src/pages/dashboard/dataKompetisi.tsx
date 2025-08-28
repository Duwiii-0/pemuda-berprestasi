// src/pages/dashboard/dataKompetisi.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Trophy, Calendar, Users, MapPin, Search, UserPlus, CheckCircle, XCircle } from 'lucide-react';
import NavbarDashboard from "../../components/navbar/navbarDashboard";
import UnifiedRegistration from "../../components/registrationSteps/UnifiedRegistration";
import AlertModal from "../../components/alertModal";
import toast from "react-hot-toast";
import { useRegistration } from "../../context/registrationContext";
import { useKompetisi } from "../../context/KompetisiContext";
import type { Kompetisi } from "../../context/KompetisiContext";

interface StatsCardProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  value: string;
  color: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ icon: Icon, title, value, color }) => (
  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/50">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
        <div>
          <h3 className="font-plex font-medium text-black/60 text-sm">{title}</h3>
          <p className="font-bebas text-2xl text-black/80">{value}</p>
        </div>
      </div>
    </div>
  </div>
);

const DataKompetisi = () => {
  const navigate = useNavigate();
  const { kompetisiList, loading, error, fetchKompetisiList } = useKompetisi();
  const { getRegistrationsByKompetisi, updateKompetisiParticipants, cancelRegistration } = useRegistration();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "PENDAFTARAN" | "SEDANG_DIMULAI" | "SELESAI">("all");
  const [selectedKompetisi, setSelectedKompetisi] = useState<Kompetisi | null>(null);
  const [showPeserta, setShowPeserta] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [genderFilter, setGenderFilter] = useState<"all" | "Laki-Laki" | "Perempuan">("all");
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [registrationToCancel, setRegistrationToCancel] = useState<string | null>(null);

  useEffect(() => {
    fetchKompetisiList();
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleKompetisiClick = (kompetisi: Kompetisi) => {
    setSelectedKompetisi(kompetisi);
    setShowPeserta(true);
  };

  const handleOpenRegistration = (kompetisi: Kompetisi) => {
    setSelectedKompetisi(kompetisi);
    setShowRegistrationModal(true);
  };

  const handleCloseRegistration = () => {
    setShowRegistrationModal(false);
    setSelectedKompetisi(null);
  };

  const handleCancelClick = (registrationId: string) => {
    setRegistrationToCancel(registrationId);
    setShowAlertModal(true);
  };

  const handleConfirmCancel = () => {
    if (registrationToCancel !== null) {
      cancelRegistration(registrationToCancel);
      toast.success("Atlet berhasil dibatalkan dari kompetisi");
    }
    setShowAlertModal(false);
    setRegistrationToCancel(null);
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
      case "SEDANG_DIMULAI": return "bg-yellow-100 text-yellow-600 ";
      case "SELESAI": return "bg-gray-100 text-gray-600";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  const getRegistrationStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-100 text-green-600";
      case "registered": return "bg-yellow-100 text-yellow-600";
      case "cancelled": return "bg-red-100 text-red-600";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  // Filtered competitions
  const filteredKompetisi = kompetisiList.filter(k => {
    const matchesSearch = k.nama_event.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (k.lokasi?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === "all" || k.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const totalKompetisi = kompetisiList.length;
  const aktifCount = kompetisiList.filter(k => k.status === "SEDANG_DIMULAI").length;
  const akanDatangCount = kompetisiList.filter(k => k.status === "PENDAFTARAN").length;
  const totalPeserta = kompetisiList.reduce((sum, k) => sum + updateKompetisiParticipants(k.id_penyelenggara), 0);

  if (loading) return (
    <div className="min-h-screen w-full bg-gradient-to-br from-white via-red/5 to-yellow/10 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red"></div>
        <p className="mt-4 font-plex text-black/60">Loading...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen w-full bg-gradient-to-br from-white via-red/5 to-yellow/10 flex items-center justify-center">
      <div className="text-center">
        <p className="font-plex text-red-500 text-lg">{error}</p>
      </div>
    </div>
  );

  // Get registrations for selected competition
  const selectedKompetisiRegistrations = selectedKompetisi 
    ? getRegistrationsByKompetisi(selectedKompetisi.id_penyelenggara)
    : [];

  // Filter registrations based on search and gender
  const filteredRegistrations = selectedKompetisiRegistrations.filter(registration => {
    const matchesSearch = registration.atlitName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGender = genderFilter === "all" || registration.gender === genderFilter;
    return matchesSearch && matchesGender;
  });

  // Halaman detail peserta kompetisi
  if (showPeserta && selectedKompetisi) {
    // Stats untuk halaman peserta
    const totalRegistrations = selectedKompetisiRegistrations.length;
    const lakiLakiCount = selectedKompetisiRegistrations.filter(r => r.gender === "Laki-Laki").length;
    const perempuanCount = selectedKompetisiRegistrations.filter(r => r.gender === "Perempuan").length;
    const confirmedCount = selectedKompetisiRegistrations.filter(r => r.status === "confirmed").length;

    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-white via-red/5 to-yellow/10">
        <NavbarDashboard />
        <div className="lg:ml-64 min-h-screen">
          <div className="overflow-y-auto bg-white/40 backdrop-blur-md border-white/30 w-full h-screen flex flex-col gap-8 pt-8 pb-12 px-8">
            
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="space-y-6 flex-1">
                <div>
                  <button 
                    onClick={() => {
                      setShowPeserta(false);
                      setSearchTerm("");
                      setGenderFilter("all");
                    }}
                    className="text-red hover:text-red/80 font-plex mb-4 flex items-center gap-2"
                  >
                    ← Kembali ke Daftar Kompetisi
                  </button>
                  <h1 className="font-bebas text-4xl lg:text-6xl xl:text-7xl text-black/80 tracking-wider">
                    PESERTA KOMPETISI
                  </h1>
                  <p className="font-plex text-black/60 text-lg mt-2">
                    {selectedKompetisi.nama_event}
                  </p>
                  <div className="flex flex-wrap gap-4 mt-3">
                    <p className="font-plex text-black/50 text-sm flex items-center gap-1">
                      <Calendar size={16} />
                      {formatTanggal(selectedKompetisi.tanggal_mulai)}
                    </p>
                    <p className="font-plex text-black/50 text-sm flex items-center gap-1">
                      <MapPin size={16} />
                      {selectedKompetisi.lokasi}
                    </p>
                    <span className={`px-3 py-1 rounded-full text-xs font-plex font-medium ${getStatusColor(selectedKompetisi.status)}`}>
                      {selectedKompetisi.status}
                    </span>
                  </div>
                </div>

                {/* Quick Stats untuk peserta */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <StatsCard 
                    icon={Users}
                    title="Total Pendaftar"
                    value={totalRegistrations.toString()}
                    color="bg-gradient-to-br from-red to-red/80"
                  />
                  <StatsCard 
                    icon={Users}
                    title="Laki-laki"
                    value={lakiLakiCount.toString()}
                    color="bg-gradient-to-br from-blue-500 to-blue-600"
                  />
                  <StatsCard 
                    icon={Users}
                    title="Perempuan"
                    value={perempuanCount.toString()}
                    color="bg-gradient-to-br from-pink-500 to-pink-600"
                  />
                  <StatsCard 
                    icon={CheckCircle}
                    title="Terkonfirmasi"
                    value={confirmedCount.toString()}
                    color="bg-gradient-to-br from-green-500 to-green-600"
                  />
                </div>
              </div>
            </div>

            {/* Search and Filter Section untuk peserta */}
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-red/60" size={20} />
                    <input
                      type="text"
                      placeholder="Cari nama atlet..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-red/20 focus:border-red outline-none bg-white/80 backdrop-blur-sm font-plex"
                    />
                  </div>
                </div>
                
                {/* Gender Filter */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setGenderFilter("all")}
                    className={`px-4 py-3 rounded-xl font-plex text-sm transition-all duration-300 ${
                      genderFilter === "all"
                        ? "bg-red text-white"
                        : "bg-white/50 text-red border border-red/20 hover:bg-red/5"
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    onClick={() => setGenderFilter("Laki-Laki")}
                    className={`px-4 py-3 rounded-xl font-plex text-sm transition-all duration-300 ${
                      genderFilter === "Laki-Laki"
                        ? "bg-blue-500 text-white"
                        : "bg-white/50 text-blue-500 border border-blue-500/20 hover:bg-blue-500/5"
                    }`}
                  >
                    Laki-laki
                  </button>
                  <button
                    onClick={() => setGenderFilter("Perempuan")}
                    className={`px-4 py-3 rounded-xl font-plex text-sm transition-all duration-300 ${
                      genderFilter === "Perempuan"
                        ? "bg-pink-500 text-white"
                        : "bg-white/50 text-pink-500 border border-pink-500/20 hover:bg-pink-500/5"
                    }`}
                  >
                    Perempuan
                  </button>
                </div>
              </div>
            </div>

            {/* Table Section untuk peserta */}
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-red/10 rounded-xl">
                  <Users className="text-red" size={20} />
                </div>
                <h2 className="font-bebas text-2xl text-black/80 tracking-wide">
                  DAFTAR PESERTA ({filteredRegistrations.length})
                </h2>
                <div className="flex gap-3 ml-auto mr-1">
                  <button
                    onClick={() => handleOpenRegistration(selectedKompetisi)}
                    className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl font-plex font-medium hover:shadow-lg transition-all duration-300 flex items-center gap-2"
                  >
                    <UserPlus size={20} />
                    Daftar Atlet
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-hidden rounded-2xl border border-white/50">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-red to-red/80 text-white">
                        <th className="px-6 py-4 text-left font-bebas text-lg tracking-wide">NAMA ATLET</th>
                        <th className="px-6 py-4 text-center font-bebas text-lg tracking-wide">KATEGORI</th>
                        <th className="px-6 py-4 text-center font-bebas text-lg tracking-wide">GENDER</th>
                        <th className="px-6 py-4 text-center font-bebas text-lg tracking-wide">STATUS</th>
                        <th className="px-6 py-4 text-center font-bebas text-lg tracking-wide">TGL DAFTAR</th>
                        <th className="px-6 py-4 text-center font-bebas text-lg tracking-wide">AKSI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/30">
                      {filteredRegistrations.map((registration, index) => (
                        <tr
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/dashboard/atlit/${registration.atlitId}`);
                          }}
                          key={registration.id}
                          className={`cursor-pointer transition-all duration-200 hover:bg-yellow/5 ${
                            index % 2 === 0 ? "bg-white/20" : "bg-white/10"
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red to-red/80 flex items-center justify-center text-white font-bebas">
                                {registration.atlitName.charAt(0)}
                              </div>
                              <div>
                                <p className="font-plex font-semibold text-black/80">{registration.atlitName}</p>
                                <p className="font-plex text-sm text-black/60">ID Atlet: {registration.atlitId}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="space-y-1">
                              <span className="block font-plex text-sm font-medium text-black/80">
                                {registration.styleType.toUpperCase()} - {registration.categoryType.toUpperCase()}
                              </span>
                              {registration.ageCategory && (
                                <span className="block text-xs text-black/60">
                                  {registration.ageCategory}
                                </span>
                              )}
                              {registration.weightCategory && (
                                <span className="block text-xs text-black/60">
                                  {registration.weightCategory} kg
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-plex font-medium ${
                                registration.gender === "Laki-Laki"
                                  ? "bg-blue-100 text-blue-600"
                                  : "bg-pink-100 text-pink-600"
                              }`}
                            >
                              {registration.gender}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-plex font-medium capitalize ${getRegistrationStatusColor(registration.status)}`}
                            >
                               {registration.status === 'confirmed' && 'Terkonfirmasi'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-plex text-black/70 text-sm">
                              {formatTanggal(registration.registrationDate)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex justify-center gap-2">
                              {registration.status === 'confirmed' && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancelClick(registration.id);
                                  }}
                                  className="flex items-center gap-4 p-2 px-4 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all duration-200"
                                  title="Batalkan"
                                >
                                  <XCircle size={16} />
                                  <span>Batalkan</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Empty state */}
              {filteredRegistrations.length === 0 && (
                <div className="text-center py-12">
                  <Users className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="font-plex text-gray-500">
                    {selectedKompetisiRegistrations.length === 0 
                      ? "Belum ada atlet yang mendaftar untuk kompetisi ini"
                      : "Tidak ada peserta yang sesuai dengan kriteria pencarian"
                    }
                  </p>
                  {selectedKompetisiRegistrations.length === 0 && (
                    <button
                      onClick={() => handleOpenRegistration(selectedKompetisi)}
                      className="mt-4 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2 rounded-lg font-plex font-medium hover:shadow-lg transition-all duration-300 flex items-center gap-2 mx-auto"
                    >
                      <UserPlus size={16} />
                      Daftar Atlet Sekarang
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <AlertModal
          isOpen={showAlertModal}
          onClose={() => setShowAlertModal(false)}
          onConfirm={handleConfirmCancel}
          message="Apakah Anda yakin ingin membatalkan atlet ini? Atlet akan dikeluarkan dari kompetisi."
        />
      </div>
    );
  }

  // Halaman utama daftar kompetisi
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-white via-red/5 to-yellow/10">
      <NavbarDashboard />

      {/* Registration Modal */}
      {showRegistrationModal && selectedKompetisi && (
        <UnifiedRegistration
          isOpen={showRegistrationModal}
          onClose={handleCloseRegistration}
          kompetisiId={selectedKompetisi.id_penyelenggara}
          kompetisiName={selectedKompetisi.nama_event}
          biayaPendaftaran={0} // bisa ambil dari API nanti
        />
      )}

      {/* Main Content */}
      <div className="lg:ml-64 min-h-screen">
        <div className="overflow-y-auto bg-white/40 backdrop-blur-md border-white/30 w-full h-screen flex flex-col gap-8 pt-8 pb-12 px-8">
          
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
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

            {/* Title and Stats */}
            <div className="space-y-6 flex-1">
              <div>
                <h1 className="font-bebas text-4xl lg:text-6xl xl:text-7xl text-black/80 tracking-wider">
                  DATA KOMPETISI
                </h1>
                <p className="font-plex text-black/60 text-lg mt-2">
                  Kelola data kompetisi dan turnamen karate
                </p>
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatsCard 
                  icon={Trophy}
                  title="Total Kompetisi"
                  value={totalKompetisi.toString()}
                  color="bg-gradient-to-br from-red to-red/80"
                />
                <StatsCard 
                  icon={Calendar}
                  title="Sedang Aktif"
                  value={aktifCount.toString()}
                  color="bg-gradient-to-br from-green-500 to-green-600"
                />
                <StatsCard 
                  icon={Calendar}
                  title="Akan Datang"
                  value={akanDatangCount.toString()}
                  color="bg-gradient-to-br from-blue-500 to-blue-600"
                />
                <StatsCard 
                  icon={Users}
                  title="Total Peserta"
                  value={totalPeserta.toString()}
                  color="bg-gradient-to-br from-yellow to-yellow/80"
                />
              </div>
            </div>
          </div>

          {/* Search and Filter Section */}
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-red/60" size={20} />
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
              <div className="flex gap-2">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`cursor-pointer px-4 py-3 rounded-xl font-plex text-sm transition-all duration-300 ${
                    statusFilter === "all"
                      ? "bg-red text-white"
                      : "bg-white/50 text-red border border-red/20 hover:bg-red/5"
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setStatusFilter("PENDAFTARAN")}
                  className={`cursor-pointer px-4 py-3 rounded-xl font-plex text-sm transition-all duration-300 ${
                    statusFilter === "PENDAFTARAN"
                      ? "bg-yellow-500 text-white"
                      : "bg-white/50 text-yellow-500 border border-yellow-500/20 hover:bg-yellow-500/5"
                  }`}
                >
                  Pendaftaran
                </button>
                <button
                  onClick={() => setStatusFilter("SEDANG_DIMULAI")}
                  className={`cursor-pointer px-4 py-3 rounded-xl font-plex text-sm transition-all duration-300 ${
                    statusFilter === "SEDANG_DIMULAI"
                      ? "bg-green-500 text-white"
                      : "bg-white/50 text-green-500 border border-green-500/20 hover:bg-green-500/5"
                  }`}
                >
                  Sedang Dimulai
                </button>
                <button
                  onClick={() => setStatusFilter("SELESAI")}
                  className={`cursor-pointer px-4 py-3 rounded-xl font-plex text-sm transition-all duration-300 ${
                    statusFilter === "SELESAI"
                      ? "bg-gray-500 text-white"
                      : "bg-white/50 text-gray-500 border border-gray-500/20 hover:bg-gray-500/5"
                  }`}
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red/10 rounded-xl">
                  <Trophy className="text-red" size={20} />
                </div>
                <h2 className="font-bebas text-2xl text-black/80 tracking-wide">
                  DAFTAR KOMPETISI ({filteredKompetisi.length})
                </h2>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-2xl border border-white/50">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-red to-red/80 text-white">
                      <th className="px-6 py-4 text-left font-bebas text-lg tracking-wide">NAMA KOMPETISI</th>
                      <th className="px-6 py-4 text-center font-bebas text-lg tracking-wide">TANGGAL MULAI</th>
                      <th className="px-6 py-4 text-center font-bebas text-lg tracking-wide">LOKASI</th>
                      <th className="px-6 py-4 text-center font-bebas text-lg tracking-wide">STATUS</th>
                      <th className="px-6 py-4 text-center font-bebas text-lg tracking-wide">PESERTA</th>
                      <th className="px-6 py-4 text-center font-bebas text-lg tracking-wide">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/30">
                    {filteredKompetisi.map((kompetisi, index) => {
                      const pesertaTerdaftar = updateKompetisiParticipants(kompetisi.id_penyelenggara);
                      return (
                        <tr
                          key={kompetisi.id_penyelenggara}
                          className={`transition-all duration-300 hover:bg-yellow/5 cursor-pointer ${
                            index % 2 === 0 ? "bg-white/20" : "bg-white/10"
                          }`}
                          onClick={() => handleKompetisiClick(kompetisi)}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div>
                                <p className="font-plex font-semibold text-black/80">{kompetisi.nama_event}</p>
                                <p className="font-plex text-sm text-black/60">ID: {kompetisi.id_penyelenggara}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-plex text-black/70">{formatTanggal(kompetisi.tanggal_mulai)}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <MapPin size={16} className="text-black/50" />
                              <span className="font-plex text-black/70">{kompetisi.lokasi || 'Belum ditentukan'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-plex font-medium ${getStatusColor(kompetisi.status)}`}
                            >
                              {kompetisi.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex flex-col items-center">
                              <span className="font-plex font-medium text-black/70">
                                {pesertaTerdaftar}
                              </span>
                              <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
                                <div 
                                  className="bg-red h-2 rounded-full transition-all duration-300"
                                  style={{width: `${Math.min((pesertaTerdaftar / 100) * 100, 100)}%`}}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex justify-center gap-2">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenRegistration(kompetisi);
                                }}
                                className="flex items-center gap-2 p-2 px-4 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-all duration-200"
                                title="Daftar Atlet"
                              >
                                <UserPlus size={16} />
                                <span>Tambah Atlet</span>
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

            {/* Empty state */}
            {filteredKompetisi.length === 0 && (
              <div className="text-center py-12">
                <Trophy className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="font-plex text-gray-500">Tidak ada kompetisi yang ditemukan</p>
                <p className="font-plex text-sm text-gray-400 mt-2">Coba ubah kriteria pencarian atau filter</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
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