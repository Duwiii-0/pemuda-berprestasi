import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Trophy, Calendar, Users, MapPin, Search, Eye, Edit, Plus } from 'lucide-react';
import NavbarDashboard from "../../components/navbar/navbarDashboard"

interface KompetisiData {
  id: number;
  nama: string;
  tanggal: string;
  lokasi: string;
  kategori: string;
  status: "Aktif" | "Selesai" | "Akan Datang";
  pesertaTerdaftar: number;
  maxPeserta: number;
  biayaPendaftaran: number;
}

// Data atlet yang sama seperti di halaman data atlit
interface AtlitData {
  id: number;
  name: string;
  provinsi: string;
  gender: "Laki-Laki" | "Perempuan";
  umur: number;
  belt?: string;
  phone?: string;
  alamat?: string;
  nik?: string;
  bb?: number;
  tb?: number;
  kompetisiId?: number; // Tambahan untuk relasi kompetisi
}

interface StatsCardProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  value: string;
  color: string;
}

// Mock data kompetisi
const dummyKompetisi: KompetisiData[] = [
  { 
    id: 1, 
    nama: "Kejuaraan Karate Nasional 2024", 
    tanggal: "2024-12-15", 
    lokasi: "Jakarta", 
    kategori: "Nasional", 
    status: "Akan Datang", 
    pesertaTerdaftar: 3, 
    maxPeserta: 100, 
    biayaPendaftaran: 150000 
  },
  { 
    id: 2, 
    nama: "Turnamen Karate Jawa Barat", 
    tanggal: "2024-11-20", 
    lokasi: "Bandung", 
    kategori: "Regional", 
    status: "Aktif", 
    pesertaTerdaftar: 2, 
    maxPeserta: 80, 
    biayaPendaftaran: 100000 
  },
  { 
    id: 3, 
    nama: "Open Tournament Jakarta", 
    tanggal: "2024-10-10", 
    lokasi: "Jakarta", 
    kategori: "Lokal", 
    status: "Selesai", 
    pesertaTerdaftar: 1, 
    maxPeserta: 50, 
    biayaPendaftaran: 75000 
  },
];

// Data atlet dengan kompetisi yang mereka ikuti
const dummyAtlits: AtlitData[] = [
  { id: 1, name: "Rizky Purnama", provinsi: "Jawa Barat", gender: "Laki-Laki", umur: 20, belt: "hitam", kompetisiId: 1 },
  { id: 2, name: "Aulia", provinsi: "DKI Jakarta", gender: "Perempuan", umur: 19, belt: "putih", kompetisiId: 1 },
  { id: 3, name: "Andi", provinsi: "DKI Jakarta", gender: "Laki-Laki", umur: 20, belt: "hitam", kompetisiId: 1 },
  { id: 4, name: "Siti", provinsi: "Jawa Barat", gender: "Perempuan", umur: 21, belt: "putih", kompetisiId: 2 },
  { id: 5, name: "Budi Santoso", provinsi: "Jawa Tengah", gender: "Laki-Laki", umur: 22, belt: "hitam", kompetisiId: 2 },
  { id: 6, name: "Maya Sari", provinsi: "Jawa Timur", gender: "Perempuan", umur: 18, belt: "putih", kompetisiId: 3 },
];

const StatsCard: React.FC<StatsCardProps> = ({ icon: Icon, title, value, color }) => (
  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/50">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
        <div>
          <h3 className="font-inter font-medium text-black/60 text-sm">{title}</h3>
          <p className="font-bebas text-2xl text-black/80">{value}</p>
        </div>
      </div>
    </div>
  </div>
);

const DataKompetisi = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "Aktif" | "Selesai" | "Akan Datang">("all");
  const [selectedKompetisi, setSelectedKompetisi] = useState<number | null>(null);
  const [showPeserta, setShowPeserta] = useState(false);
  const [genderFilter, setGenderFilter] = useState<"all" | "Laki-Laki" | "Perempuan">("all");

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Filter logic untuk kompetisi
  const filteredKompetisi = dummyKompetisi.filter(kompetisi => {
    const matchesSearch = kompetisi.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         kompetisi.lokasi.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || kompetisi.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats calculations
  const totalKompetisi = dummyKompetisi.length;
  const aktifCount = dummyKompetisi.filter(k => k.status === "Aktif").length;
  const akanDatangCount = dummyKompetisi.filter(k => k.status === "Akan Datang").length;
  const totalPeserta = dummyKompetisi.reduce((sum, k) => sum + k.pesertaTerdaftar, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Aktif":
        return "bg-green-100 text-green-600";
      case "Selesai":
        return "bg-gray-100 text-gray-600";
      case "Akan Datang":
        return "bg-blue-100 text-blue-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(amount);
  };

  const formatTanggal = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleKompetisiClick = (kompetisiId: number) => {
    setSelectedKompetisi(kompetisiId);
    setShowPeserta(true);
  };

  // Filter atlet berdasarkan kompetisi yang dipilih
  const atlitKompetisi = selectedKompetisi 
    ? dummyAtlits.filter(atlit => atlit.kompetisiId === selectedKompetisi)
    : [];

  // Filter atlet berdasarkan search dan gender
  const filteredAtlitKompetisi = atlitKompetisi.filter(atlit => {
    const matchesSearch = atlit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         atlit.provinsi.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGender = genderFilter === "all" || atlit.gender === genderFilter;
    return matchesSearch && matchesGender;
  });

  const kompetisiTerpilih = selectedKompetisi 
    ? dummyKompetisi.find(k => k.id === selectedKompetisi)
    : null;

  // Halaman detail peserta kompetisi
  if (showPeserta && selectedKompetisi) {
    // Stats untuk halaman peserta
    const totalAtlitKompetisi = atlitKompetisi.length;
    const lakiLakiCount = atlitKompetisi.filter(a => a.gender === "Laki-Laki").length;
    const perempuanCount = atlitKompetisi.filter(a => a.gender === "Perempuan").length;
    const avgAge = totalAtlitKompetisi > 0 ? Math.round(atlitKompetisi.reduce((sum, a) => sum + a.umur, 0) / totalAtlitKompetisi) : 0;

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
                    className="text-red hover:text-red/80 font-inter mb-4 flex items-center gap-2"
                  >
                    ← Kembali ke Daftar Kompetisi
                  </button>
                  <h1 className="font-bebas text-4xl lg:text-6xl xl:text-7xl text-black/80 tracking-wider">
                    PESERTA KOMPETISI
                  </h1>
                  <p className="font-inter text-black/60 text-lg mt-2">
                    {kompetisiTerpilih?.nama}
                  </p>
                  <div className="flex flex-wrap gap-4 mt-3">
                    <p className="font-inter text-black/50 text-sm flex items-center gap-1">
                      <Calendar size={16} />
                      {formatTanggal(kompetisiTerpilih?.tanggal || "")}
                    </p>
                    <p className="font-inter text-black/50 text-sm flex items-center gap-1">
                      <MapPin size={16} />
                      {kompetisiTerpilih?.lokasi}
                    </p>
                    <span className={`px-3 py-1 rounded-full text-xs font-inter font-medium ${getStatusColor(kompetisiTerpilih?.status || "")}`}>
                      {kompetisiTerpilih?.status}
                    </span>
                  </div>
                </div>

                {/* Quick Stats untuk peserta */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <StatsCard 
                    icon={Users}
                    title="Total Peserta"
                    value={totalAtlitKompetisi.toString()}
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
                    icon={Trophy}
                    title="Rata-rata Umur"
                    value={totalAtlitKompetisi > 0 ? `${avgAge} thn` : "0 thn"}
                    color="bg-gradient-to-br from-yellow to-yellow/80"
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
                      placeholder="Cari nama atlet atau provinsi..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-red/20 focus:border-red outline-none bg-white/80 backdrop-blur-sm font-inter"
                    />
                  </div>
                </div>
                
                {/* Gender Filter */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setGenderFilter("all")}
                    className={`px-4 py-3 rounded-xl font-inter text-sm transition-all duration-300 ${
                      genderFilter === "all"
                        ? "bg-red text-white"
                        : "bg-white/50 text-red border border-red/20 hover:bg-red/5"
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    onClick={() => setGenderFilter("Laki-Laki")}
                    className={`px-4 py-3 rounded-xl font-inter text-sm transition-all duration-300 ${
                      genderFilter === "Laki-Laki"
                        ? "bg-blue-500 text-white"
                        : "bg-white/50 text-blue-500 border border-blue-500/20 hover:bg-blue-500/5"
                    }`}
                  >
                    Laki-laki
                  </button>
                  <button
                    onClick={() => setGenderFilter("Perempuan")}
                    className={`px-4 py-3 rounded-xl font-inter text-sm transition-all duration-300 ${
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
                  DAFTAR ATLET PESERTA ({filteredAtlitKompetisi.length})
                </h2>
              </div>

              {/* Table */}
              <div className="overflow-hidden rounded-2xl border border-white/50">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-red to-red/80 text-white">
                        <th className="px-6 py-4 text-left font-bebas text-lg tracking-wide">NAMA</th>
                        <th className="px-6 py-4 text-center font-bebas text-lg tracking-wide">PROVINSI</th>
                        <th className="px-6 py-4 text-center font-bebas text-lg tracking-wide">GENDER</th>
                        <th className="px-6 py-4 text-center font-bebas text-lg tracking-wide">UMUR</th>
                        <th className="px-6 py-4 text-center font-bebas text-lg tracking-wide">BELT</th>
                        <th className="px-6 py-4 text-center font-bebas text-lg tracking-wide">AKSI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/30">
                      {filteredAtlitKompetisi.map((atlit, index) => (
                        <tr
                          key={atlit.id}
                          className={`transition-all duration-200 hover:bg-white/50 cursor-pointer ${
                            index % 2 === 0 ? "bg-white/20" : "bg-white/10"
                          }`}
                          onClick={() => navigate(`/dashboard/atlit/${atlit.id}`)}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red to-red/80 flex items-center justify-center text-white font-bebas">
                                {atlit.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-inter font-semibold text-black/80">{atlit.name}</p>
                                <p className="font-inter text-sm text-black/60">ID: {atlit.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-inter text-black/70">{atlit.provinsi}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-inter font-medium ${
                                atlit.gender === "Laki-Laki"
                                  ? "bg-blue-100 text-blue-600"
                                  : "bg-pink-100 text-pink-600"
                              }`}
                            >
                              {atlit.gender}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-inter font-medium text-black/70">{atlit.umur} thn</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="px-3 py-1 rounded-full text-xs font-inter font-medium bg-yellow-100 text-yellow-600 capitalize">
                              {atlit.belt}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex justify-center gap-2">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/dashboard/atlit/${atlit.id}`);
                                }}
                                className="p-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-all duration-200"
                              >
                                <Eye size={16} />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/dashboard/atlit/edit/${atlit.id}`);
                                }}
                                className="p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-all duration-200"
                              >
                                <Edit size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Empty state */}
              {filteredAtlitKompetisi.length === 0 && (
                <div className="text-center py-12">
                  <Users className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="font-inter text-gray-500">
                    {atlitKompetisi.length === 0 
                      ? "Belum ada atlet yang didaftarkan untuk kompetisi ini"
                      : "Tidak ada atlet yang sesuai dengan kriteria pencarian"
                    }
                  </p>
                  {atlitKompetisi.length > 0 && (
                    <p className="font-inter text-sm text-gray-400 mt-2">Coba ubah kriteria pencarian atau filter</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Halaman utama daftar kompetisi
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-white via-red/5 to-yellow/10">
      {/* Desktop Navbar */}
      <NavbarDashboard />

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
                <p className="font-inter text-black/60 text-lg mt-2">
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
                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-red/20 focus:border-red outline-none bg-white/80 backdrop-blur-sm font-inter"
                  />
                </div>
              </div>
              
              {/* Status Filter */}
              <div className="flex gap-2">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`cursor-pointer px-4 py-3 rounded-xl font-inter text-sm transition-all duration-300 ${
                    statusFilter === "all"
                      ? "bg-red text-white"
                      : "bg-white/50 text-red border border-red/20 hover:bg-red/5"
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setStatusFilter("Aktif")}
                  className={`cursor-pointer px-4 py-3 rounded-xl font-inter text-sm transition-all duration-300 ${
                    statusFilter === "Aktif"
                      ? "bg-green-500 text-white"
                      : "bg-white/50 text-green-500 border border-green-500/20 hover:bg-green-500/5"
                  }`}
                >
                  Aktif
                </button>
                <button
                  onClick={() => setStatusFilter("Akan Datang")}
                  className={`cursor-pointer px-4 py-3 rounded-xl font-inter text-sm transition-all duration-300 ${
                    statusFilter === "Akan Datang"
                      ? "bg-blue-500 text-white"
                      : "bg-white/50 text-blue-500 border border-blue-500/20 hover:bg-blue-500/5"
                  }`}
                >
                  Akan Datang
                </button>
                <button
                  onClick={() => setStatusFilter("Selesai")}
                  className={`cursor-pointer px-4 py-3 rounded-xl font-inter text-sm transition-all duration-300 ${
                    statusFilter === "Selesai"
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
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red/10 rounded-xl">
                <Trophy className="text-red" size={20} />
              </div>
              <h2 className="font-bebas text-2xl text-black/80 tracking-wide">
                DAFTAR KOMPETISI ({filteredKompetisi.length})
              </h2>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-2xl border border-white/50">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-red to-red/80 text-white">
                      <th className="px-6 py-4 text-left font-bebas text-lg tracking-wide">NAMA KOMPETISI</th>
                      <th className="px-6 py-4 text-center font-bebas text-lg tracking-wide">TANGGAL</th>
                      <th className="px-6 py-4 text-center font-bebas text-lg tracking-wide">LOKASI</th>
                      <th className="px-6 py-4 text-center font-bebas text-lg tracking-wide">STATUS</th>
                      <th className="px-6 py-4 text-center font-bebas text-lg tracking-wide">PESERTA</th>
                      <th className="px-6 py-4 text-center font-bebas text-lg tracking-wide">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/30">
                    {filteredKompetisi.map((kompetisi, index) => (
                      <tr
                        key={kompetisi.id}
                        className={`transition-all duration-200 hover:bg-white/50 cursor-pointer ${
                          index % 2 === 0 ? "bg-white/20" : "bg-white/10"
                        }`}
                        onClick={() => handleKompetisiClick(kompetisi.id)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red to-red/80 flex items-center justify-center text-white font-bebas">
                              {kompetisi.nama.charAt(0)}
                            </div>
                            <div>
                              <p className="font-inter font-semibold text-black/80">{kompetisi.nama}</p>
                              <p className="font-inter text-sm text-black/60">{kompetisi.kategori}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-inter text-black/70">{formatTanggal(kompetisi.tanggal)}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <MapPin size={16} className="text-black/50" />
                            <span className="font-inter text-black/70">{kompetisi.lokasi}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-inter font-medium ${getStatusColor(kompetisi.status)}`}
                          >
                            {kompetisi.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-inter font-medium text-black/70">
                            {kompetisi.pesertaTerdaftar}/{kompetisi.maxPeserta}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleKompetisiClick(kompetisi.id);
                              }}
                              className="p-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-all duration-200"
                              title="Lihat Peserta"
                            >
                              <Users size={16} />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/dashboard/kompetisi/${kompetisi.id}`);
                              }}
                              className="p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-all duration-200"
                              title="Edit Kompetisi"
                            >
                              <Edit size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Empty state */}
            {filteredKompetisi.length === 0 && (
              <div className="text-center py-12">
                <Trophy className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="font-inter text-gray-500">Tidak ada kompetisi yang ditemukan</p>
                <p className="font-inter text-sm text-gray-400 mt-2">Coba ubah kriteria pencarian atau filter</p>
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