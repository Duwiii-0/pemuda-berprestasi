import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, Users, Search, Clock, CheckCircle, Menu } from 'lucide-react';
import toast from "react-hot-toast";
import NavbarDashboard from "../../components/navbar/navbarDashboard";
import { useAuth } from "../../context/authContext";
import { useKompetisi } from "../../context/KompetisiContext";
import type { Kompetisi } from "../../context/KompetisiContext";
import Select from "react-select";

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
  const { kompetisiList, loadingKompetisi, fetchKompetisiList, fetchAtletByKompetisi, pesertaList } = useKompetisi();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "PENDAFTARAN" | "SEDANG_DIMULAI" | "SELESAI">("all");
  const [selectedKompetisi, setSelectedKompetisi] = useState<Kompetisi | null>(null);
  const [showPeserta, setShowPeserta] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchPeserta, setSearchPeserta] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [filterCategory, setFilterCategory] = useState<"ALL" | "KYORUGI" | "POOMSAE">("ALL");
  const [filterKelompokUsia, setFilterKelompokUsia] = useState<"ALL" | "Cadet" | "Junior" | "Senior">("ALL");

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

  const handleKompetisiClick = async (kompetisi: Kompetisi) => {
  setSelectedKompetisi(kompetisi);
  setShowPeserta(true);

  // kalau role pelatih, lemparkan id_dojang ke API
  const idDojang = user?.pelatih?.id_dojang;
  await fetchAtletByKompetisi(kompetisi.id_kompetisi, undefined, idDojang);
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

  // Halaman detail peserta
if (showPeserta && selectedKompetisi) {
  const peserta = pesertaList.map((peserta) => {
    const isTeam = peserta.is_team;

    const nama = isTeam
      ? peserta.anggota_tim?.map((m: any) => m.atlet.nama_atlet).join(", ")
      : peserta.atlet?.nama_atlet || "-";

    const gender = isTeam ? "Tim" : (peserta.atlet?.jenis_kelamin === "LAKI_LAKI" ? "Laki-Laki" : "Perempuan");

    // ambil kategori dari kelas kejuaraan
    const kategori = peserta.kelas_kejuaraan?.kategori_event?.nama_kategori || "-";
    const jenisKategori = peserta.kelas_kejuaraan?.kelompok?.nama_kelompok || "-";
    const status =
      peserta.status === "PENDING"
        ? "Pending"
        : peserta.status === "APPROVED"
        ? "Approved"
        : "Rejected";

    return {
      id: peserta.id_peserta_kompetisi,
      nama,
      gender,
      kategori,
      jenisKategori,
      status,
      atletId: isTeam ? null : peserta.atlet?.id_atlet,
    };
  });

  const displayedPesertas = pesertaList.filter((peserta) => {
    const namaPeserta = peserta.is_team
      ? peserta.anggota_tim?.map((a) => a.atlet.nama_atlet).join(" ") || ""
      : peserta.atlet?.nama_atlet || "";
    
    const matchesSearch = namaPeserta.toLowerCase().includes(searchPeserta.toLowerCase());
    const matchesStatus = filterStatus === "ALL" || peserta.status === filterStatus;
    
    const kategori = peserta.kelas_kejuaraan?.cabang?.toUpperCase() || "";
    const matchesCategory =
      filterCategory === "ALL" || kategori === filterCategory.toUpperCase();
    
    const kelompok = peserta.kelas_kejuaraan?.kelompok?.nama_kelompok || "";
    const matchesKelompok =
      filterKelompokUsia === "ALL" || kelompok.toLowerCase() === filterKelompokUsia.toLowerCase();
    
    return matchesSearch && matchesStatus && matchesCategory && matchesKelompok;
  });

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
              Daftar peserta yang terdaftar
            </p>
          </div>

          {/* Peserta Table */}
          <div className="w-full bg-white backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50">
            {/* Desktop Table View */}
            <div className="hidden lg:block">
              {/* Filter Section (selalu tampil) */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
                <div className="space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Cari peserta..."
                      value={searchPeserta}
                      onChange={(e) => setSearchPeserta(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm"
                    />
                  </div>
                
                  {/* Filters */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Status */}
                    <div>
                      <label className="block text-gray-600 text-xs mb-2 font-medium">Status</label>
                      <Select
                        unstyled
                        value={{
                          value: filterStatus,
                          label: filterStatus === "ALL" ? "Semua Status" : filterStatus,
                        }}
                        onChange={(selected) => setFilterStatus(selected?.value as any)}
                        options={[
                          { value: "ALL", label: "Semua Status" },
                          { value: "PENDING", label: "Pending" },
                          { value: "APPROVED", label: "Approved" },
                          { value: "REJECTED", label: "Rejected" },
                        ]}
                        classNames={{
                          control: () =>
                            `w-full flex items-center border border-gray-300 rounded-2xl px-3 py-3 gap-2 transition-all duration-300 hover:shadow-sm`,
                          menu: () =>
                            "border border-gray-200 bg-white rounded-xl shadow-lg mt-2 overflow-hidden z-50",
                          option: ({ isFocused, isSelected }) =>
                            [
                              "px-3 py-3 cursor-pointer text-sm transition-colors duration-200",
                              isFocused ? "bg-blue-50 text-blue-700" : "text-gray-800",
                              isSelected ? "bg-blue-500 text-white" : "",
                            ].join(" "),
                        }}
                      />
                    </div>
                      
                    {/* Kategori */}
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
                        classNames={{
                          control: () =>
                            `w-full flex items-center border border-gray-300 rounded-2xl px-3 py-3 gap-2 transition-all duration-300 hover:shadow-sm`,
                          menu: () =>
                            "border border-gray-200 bg-white rounded-xl shadow-lg mt-2 overflow-hidden z-50",
                        }}
                      />
                    </div>
                      
                    {/* Kelompok Usia */}
                    <div>
                      <label className="block text-gray-600 text-xs mb-2 font-medium">Kelompok Usia</label>
                      <Select
                        unstyled
                        value={{
                          value: filterKelompokUsia,
                          label: filterKelompokUsia === "ALL" ? "Semua Usia" : filterKelompokUsia,
                        }}
                        onChange={(selected) => setFilterKelompokUsia(selected?.value as any)}
                        options={[
                          { value: "ALL", label: "Semua Usia" },
                          { value: "Cadet", label: "Cadet" },
                          { value: "Junior", label: "Junior" },
                          { value: "Senior", label: "Senior" },
                        ]}
                        classNames={{
                          control: () =>
                            `w-full flex items-center border border-gray-300 rounded-2xl px-3 py-3 gap-2 transition-all duration-300 hover:shadow-sm`,
                          menu: () =>
                            "border border-gray-200 bg-white rounded-xl shadow-lg mt-2 overflow-hidden z-50",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
                      
              {/* Table Section */}
              <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
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
                            ? peserta.kelas_kejuaraan?.kelas_berat?.nama_kelas ||
                              (peserta.atlet?.berat_badan ? `${peserta.atlet.berat_badan} kg` : "-")
                            : "-";
                      
                        const kelasPoomsae =
                          cabang === "POOMSAE"
                            ? peserta.kelas_kejuaraan?.poomsae?.nama_kelas || peserta.atlet?.belt || "-"
                            : "-";
                      
                        const namaPeserta = isTeam
                          ? peserta.anggota_tim?.map((m: any) => m.atlet.nama_atlet).join(", ")
                          : peserta.atlet?.nama_atlet || "-";
                      
                        const dojang = isTeam && peserta.anggota_tim?.length
                          ? peserta.anggota_tim[0]?.atlet?.dojang?.nama_dojang || "-"
                          : peserta.atlet?.dojang?.nama_dojang || "-";
                      
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
                            <td className="py-4 px-4 font-medium text-gray-800 text-sm">{namaPeserta}</td>
                            <td className="py-4 px-4 text-gray-700 text-sm">{`${cabang} - ${level}`}</td>
                            <td className="py-4 px-4 text-gray-700 text-sm">{kelasBerat}</td>
                            <td className="py-4 px-4 text-center text-gray-700 text-sm">{kelasPoomsae}</td>
                            <td className="py-4 px-4 text-center text-gray-700 text-sm">
                              {peserta.kelas_kejuaraan?.kelompok?.nama_kelompok || "-"}
                            </td>
                            <td className="py-4 px-4 text-center text-sm">
                              {!isTeam ? (
                                peserta.atlet?.jenis_kelamin === "LAKI_LAKI"
                                  ? <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">Laki-Laki</span>
                                  : <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded-full text-xs">Perempuan</span>
                              ) : "-"}
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
                                    toast.success("Disetujui!");
                                    // TODO: panggil API approve
                                  }}
                                  className="flex items-center gap-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-xs font-medium"
                                >
                                  Setujui
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toast.error("Ditolak!");
                                    // TODO: panggil API reject
                                  }}
                                  className="flex items-center gap-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-xs font-medium"
                                >
                                  Tolak
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  
                {displayedPesertas.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    Tidak ada peserta ditemukan
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {displayedPesertas.map((peserta: any) => (
                <div
                  key={peserta.id_peserta_kompetisi}
                  className="bg-white rounded-xl shadow-md border border-gray-200 p-4"
                  onClick={() => {
                    if (!peserta.is_team && peserta.atlet?.id_atlet) {
                      navigate(`/dashboard/atlit/${peserta.atlet.id_atlet}`);
                    } else {
                      toast("Ini peserta tim, tidak ada detail personal");
                    }
                  }}
                >
                  <h3 className="font-bebas text-lg mb-2">{peserta.atlet?.nama_atlet || "Tim"}</h3>
                  <p className="text-sm text-gray-600"><b>Kategori:</b> {peserta.kelas_kejuaraan?.cabang} - {peserta.kelas_kejuaraan?.kategori_event?.nama_kategori}</p>
                  <p className="text-sm text-gray-600"><b>Kelas Berat:</b> {peserta.kelas_kejuaraan?.kelas_berat?.nama_kelas || "-"}</p>
                  <p className="text-sm text-gray-600"><b>Kelas Poomsae:</b> {peserta.kelas_kejuaraan?.poomsae?.nama_kelas || "-"}</p>
                  <p className="text-sm text-gray-600"><b>Kelompok Usia:</b> {peserta.kelas_kejuaraan?.kelompok?.nama_kelompok || "-"}</p>
                  <p className="text-sm text-gray-600"><b>Jenis Kelamin:</b> {peserta.atlet?.jenis_kelamin || "-"}</p>
                  <p className="text-sm text-gray-600"><b>Dojang:</b> {peserta.atlet?.dojang?.nama_dojang || "-"}</p>
                  <div className="flex justify-between items-center mt-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      peserta.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-800"
                        : peserta.status === "APPROVED"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {peserta.status}
                    </span>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 bg-green-500 text-white rounded-lg text-xs">Setujui</button>
                      <button className="px-3 py-1 bg-red-500 text-white rounded-lg text-xs">Tolak</button>
                    </div>
                  </div>
                </div>
              ))}
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
          <div className="overflow-x-hidden w-full bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/50">
            <div className="rounded-2xl overflow-hidden border border-white/50">
              <table className="w-full rounded-3xl">
                <thead className="bg-gradient-to-r from-red to-red/80 text-white rounded-2xl text-2xl tracking-wide">
                  <tr>
                    <th className="px-6 py-4 text-left font-bebas">Nama Kompetisi</th>
                    <th className="px-6 py-4 text-center font-bebas">Tanggal Mulai</th>
                    <th className="px-6 py-4 text-center font-bebas">Lokasi</th>
                    <th className="px-6 py-4 text-center font-bebas">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/30">
                  {filteredKompetisi.map((k) => (
                    <tr
                      key={k.id_kompetisi}
                      className="transition-all duration-200 hover:bg-red/10 cursor-pointer"
                      onClick={() => handleKompetisiClick(k)}
                    >
                      <td className="px-6 py-4 font-plex">{k.nama_event}</td>
                      <td className="px-6 py-4 text-center font-plex">{formatTanggal(k.tanggal_mulai)}</td>
                      <td className="px-6 py-4 text-center font-plex">{k.lokasi || "-"}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-md font-plex ${getStatusColor(k.status)}`}>
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
                <div className="text-center py-12">
                  <Trophy className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="font-plex text-gray-500">Tidak ada kompetisi yang ditemukan</p>
                  <p className="font-plex text-sm text-gray-400 mt-2">Coba ubah kriteria pencarian atau filter</p>
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