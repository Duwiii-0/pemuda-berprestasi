import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Users, Award, TrendingUp, Search, Eye, UserPlus, ChevronLeft, ChevronRight } from 'lucide-react';
import NavbarDashboard from "../../components/navbar/navbarDashboard"
import { useAuth } from "../../context/authContext";
import { apiClient } from "../../config/api";
import { useLocation } from "react-router-dom";

interface StatsCardProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  value: string;
  color: string;
}

interface Atlit {
  id_atlet: string;
  nama_atlet: string;
  jenis_kelamin: "LAKI_LAKI" | "PEREMPUAN";
  provinsi?: string;
  age: number;
  tinggi_badan?: number;
  berat_badan?: number;
  tanggal_lahir?: string;
  pas_foto?: string;
}

const getPhotoUrl = (filename: string): string | null => {
  if (!filename) return null;
  return `${process.env.REACT_APP_API_BASE_URL || 'http://cjvmanagementevent.com'}/uploads/atlet/pas_foto/${filename}`;
};

const StatsCard: React.FC<StatsCardProps> = ({ icon: Icon, title, value, color }) => (
  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 lg:p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/50">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3 lg:gap-4">
        <div className={`p-2 lg:p-3 rounded-xl ${color}`}>
          <Icon size={20} className="text-white lg:w-6 lg:h-6" />
        </div>
        <div>
          <h3 className="font-plex font-medium text-black/60 text-xs lg:text-sm">{title}</h3>
          <p className="font-bebas text-xl lg:text-2xl text-black/80">{value}</p>
        </div>
      </div>
    </div>
  </div>
);

const DataAtlit = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [atlits, setAtlits] = useState<Atlit[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState<"all" | "LAKI_LAKI" | "PEREMPUAN">("all");
  const [loading, setLoading] = useState(false);
  
  // Pagination states - increased items per page
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25); // Increased from 10 to 25 for better UX
  
  const location = useLocation();

  // Fetch data function with proper response handling
  const fetchAtlits = async () => {
    try {
      setLoading(true);
      const id_dojang = user?.pelatih?.id_dojang;
      if (!id_dojang) {
        console.warn("No dojang ID found for user");
        return;
      }

      console.log("Fetching athletes for dojang:", id_dojang);
const response = await apiClient.get(`/atlet/dojang/${id_dojang}`);

console.log("API Response:", response);

// Handle multiple possible response structures
let atletData = [];

if (response.success && response.data) {
  // Structure: { success: true, data: [...] }
  atletData = Array.isArray(response.data) ? response.data : [];
} else if (Array.isArray(response.data)) {
  // Structure: { data: [...] }
  atletData = response.data;
} else if (Array.isArray(response)) {
  // Structure: [...] (direct array)
  atletData = response;
} else {
  // Fallback: empty array
  atletData = [];
}

setAtlits(atletData);
console.log(`Successfully loaded ${atletData.length} athletes`);
    } catch (err) {
      console.error("Error fetching athletes:", err);
      setAtlits([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and refresh handling
  useEffect(() => {
    if (location.state?.refresh) {
      fetchAtlits();
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    if (user?.pelatih?.id_dojang) {
      fetchAtlits();
    }
  }, [user]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Client-side filtering
  const filteredAtlits = atlits.filter(atlit => {
    const matchesSearch = atlit.nama_atlet.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         atlit.provinsi?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGender = genderFilter === "all" || atlit.jenis_kelamin === genderFilter;
    return matchesSearch && matchesGender;
  });

  // Client-side pagination
  const totalPages = Math.ceil(filteredAtlits.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAtlits = filteredAtlits.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, genderFilter]);

  // Stats calculation from all original data
  const totalAtlits = atlits.length;
  const lakiLakiCount = atlits.filter(a => a.jenis_kelamin === "LAKI_LAKI").length;
  const perempuanCount = atlits.filter(a => a.jenis_kelamin === "PEREMPUAN").length;
  const avgAge = atlits.length > 0 ? Math.round(atlits.reduce((sum, a) => sum + a.age, 0) / atlits.length) : 0;

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className="min-h-screen max-w-screen bg-gradient-to-br from-white via-red/5 to-yellow/10">
      {/* Desktop Navbar */}
      <NavbarDashboard />

      {/* Main Content */}
      <div className="lg:ml-72 min-h-screen">
        <div className="bg-white/40 backdrop-blur-md border-white/30 w-full min-h-screen flex flex-col gap-6 lg:gap-8 pt-6 lg:pt-8 pb-12 px-4 lg:px-8">
          
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-6">
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
            <div className="space-y-4 lg:space-y-6 flex-1 w-full">
              <div>
                <h1 className="font-bebas text-3xl sm:text-4xl lg:text-6xl xl:text-7xl text-black/80 tracking-wider">
                  DATA ATLIT
                </h1>
                <p className="font-plex text-black/60 text-base lg:text-lg mt-2">
                  Kelola data dan informasi atlet terdaftar
                </p>
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                <StatsCard 
                  icon={Users}
                  title="Total Atlet"
                  value={totalAtlits.toString()}
                  color="bg-gradient-to-br from-red to-red/80"
                />
                <StatsCard 
                  icon={Award}
                  title="Laki-laki"
                  value={lakiLakiCount.toString()}
                  color="bg-gradient-to-br from-blue-500 to-blue-600"
                />
                <StatsCard 
                  icon={Award}
                  title="Perempuan"
                  value={perempuanCount.toString()}
                  color="bg-gradient-to-br from-pink-500 to-pink-600"
                />
                <StatsCard 
                  icon={TrendingUp}
                  title="Rata-rata Umur"
                  value={`${avgAge} Tahun`}
                  color="bg-gradient-to-br from-yellow to-yellow/80"
                />
              </div>
            </div>
          </div>

          {/* Search and Filter Section */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-4 lg:p-6 shadow-xl border border-white/50">
            <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 lg:left-4 top-1/2 transform -translate-y-1/2 text-red/60" size={18} />
                  <input
                    type="text"
                    placeholder="Cari nama atlet atau provinsi..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 lg:pl-12 pr-4 py-2.5 lg:py-3 rounded-xl border-2 border-red/20 focus:border-red outline-none bg-white/80 backdrop-blur-sm font-plex text-sm lg:text-base"
                  />
                </div>
              </div>
              
              {/* Gender Filter */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setGenderFilter("all")}
                  className={`cursor-pointer px-3 lg:px-4 py-2.5 lg:py-3 rounded-xl font-plex text-xs lg:text-sm transition-all duration-300 whitespace-nowrap ${
                    genderFilter === "all"
                      ? "bg-red text-white"
                      : "bg-white/50 text-red border border-red/20 hover:bg-red/5"
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setGenderFilter("LAKI_LAKI")}
                  className={`cursor-pointer px-3 lg:px-4 py-2.5 lg:py-3 rounded-xl font-plex text-xs lg:text-sm transition-all duration-300 whitespace-nowrap ${
                    genderFilter === "LAKI_LAKI"
                      ? "bg-blue-500 text-white"
                      : "bg-white/50 text-blue-500 border border-blue-500/20 hover:bg-blue-500/5"
                  }`}
                >
                  Laki-laki
                </button>
                <button
                  onClick={() => setGenderFilter("PEREMPUAN")}
                  className={`cursor-pointer px-3 lg:px-4 py-2.5 lg:py-3 rounded-xl font-plex text-xs lg:text-sm transition-all duration-300 whitespace-nowrap ${
                    genderFilter === "PEREMPUAN"
                      ? "bg-pink-500 text-white"
                      : "bg-white/50 text-pink-500 border border-pink-500/20 hover:bg-pink-500/5"
                  }`}
                >
                  Perempuan
                </button>
              </div>
            </div>

            {/* Filter Summary */}
            {(searchTerm || genderFilter !== "all") && (
              <div className="mt-4 pt-4 border-t border-white/30">
                <div className="flex flex-wrap gap-2 items-center text-sm">
                  <span className="font-plex text-black/60">Filter aktif:</span>
                  {searchTerm && (
                    <span className="px-2 py-1 bg-red/10 text-red rounded-lg font-plex">
                      "{searchTerm}"
                    </span>
                  )}
                  {genderFilter !== "all" && (
                    <span className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded-lg font-plex">
                      {genderFilter === "LAKI_LAKI" ? "Laki-laki" : "Perempuan"}
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setGenderFilter("all");
                    }}
                    className="ml-2 text-xs text-red hover:text-red/80 underline"
                  >
                    Clear filter
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Table Section */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-4 lg:p-6 xl:p-8 shadow-xl border border-white/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 lg:gap-4 mb-4 lg:mb-6">
              <div className="flex gap-3 lg:gap-4 items-center">
                <div className="p-2 bg-red/10 rounded-xl">
                  <Users className="text-red" size={18} />
                </div>
                <div>
                  <h2 className="font-bebas text-xl lg:text-2xl text-black/80 tracking-wide">
                    DAFTAR ATLET
                  </h2>
                  <p className="font-plex text-sm text-black/60">
                    Menampilkan {paginatedAtlits.length} dari {filteredAtlits.length} atlet
                    {filteredAtlits.length !== totalAtlits && ` (Total: ${totalAtlits})`}
                  </p>
                </div>
              </div>
              {/* Action Buttons */}
              <div className="flex gap-2 lg:gap-3">
                <button 
                  onClick={() => navigate('/dashboard/TambahAtlit')}
                  className="font-plex font-medium px-4 lg:px-6 py-2.5 lg:py-3 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95 flex justify-center items-center cursor-pointer text-white bg-gradient-to-r from-red to-red/80 hover:from-red/90 hover:to-red/70 border-0 shadow-lg gap-2 text-sm lg:text-base"
                >
                  <UserPlus size={18} />
                  <span className="hidden sm:inline">Tambah Atlit</span>
                  <span className="sm:hidden">Tambah</span>
                </button>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red"></div>
                <p className="font-plex text-black/60 mt-2">Memuat data...</p>
              </div>
            )}

            {/* Desktop Table */}
            <div className="hidden lg:block overflow-hidden rounded-2xl border border-white/50">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-red to-red/80 text-white">
                      <th className="px-6 py-4 text-left font-bebas text-2xl tracking-wide">NAMA</th>
                      <th className="px-6 py-4 text-center font-bebas text-2xl tracking-wide">PROVINSI</th>
                      <th className="px-6 py-4 text-center font-bebas text-2xl tracking-wide">GENDER</th>
                      <th className="px-6 py-4 text-center font-bebas text-2xl tracking-wide">UMUR</th>
                      <th className="px-6 py-4 text-center font-bebas text-2xl tracking-wide">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/30">
                    {paginatedAtlits.map((atlit, index) => (
                      <tr
                        key={atlit.id_atlet}
                        className={`transition-all duration-200 hover:bg-red/10 cursor-pointer ${
                          index % 2 === 0 ? "bg-white/20" : "bg-white/10"
                        }`}
                        onClick={() => navigate(`/dashboard/atlit/${atlit.id_atlet}`)}
                      >
<td className="px-6 py-4">
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-red to-red/80 flex items-center justify-center text-white font-bebas shadow-lg">
      {atlit.pas_foto ? (
        <img 
          src={getPhotoUrl(atlit.pas_foto)} 
          alt={`Foto ${atlit.nama_atlet}`}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback ke initial jika gambar gagal load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const sibling = target.nextElementSibling as HTMLElement;
            if (sibling) sibling.style.display = 'flex';
          }}
        />
      ) : null}
      <span 
        className={`w-full h-full flex items-center justify-center ${atlit.pas_foto ? 'hidden' : ''}`}
        style={{ display: atlit.pas_foto ? 'none' : 'flex' }}
      >
        {atlit.nama_atlet.charAt(0).toUpperCase()}
      </span>
    </div>
    <div>
      <p className="font-plex font-semibold text-black/80">{atlit.nama_atlet}</p>
    </div>
  </div>
</td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-plex text-black/70">{atlit.provinsi || "-"}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-plex font-medium ${
                              atlit.jenis_kelamin === "LAKI_LAKI"
                                ? "bg-blue-100 text-blue-600"
                                : "bg-pink-100 text-pink-600"
                            }`}
                          >
                            {atlit.jenis_kelamin === "LAKI_LAKI" ? "Laki-laki" : "Perempuan"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-plex font-medium text-black/70">{atlit.age} Tahun</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/dashboard/atlit/${atlit.id_atlet}`);
                              }}
                              className="p-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-all duration-200"
                            >
                              <Eye size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-3">
              {paginatedAtlits.map((atlit, index) => (
                <div
                  key={atlit.id_atlet}
                  className="bg-white/80 rounded-xl p-4 shadow-md border border-white/50 transition-all duration-200 hover:shadow-lg cursor-pointer"
                  onClick={() => navigate(`/dashboard/atlit/${atlit.id_atlet}`)}
                >
                  <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3 flex-1">
  <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-red to-red/80 flex items-center justify-center text-white font-bebas text-lg shadow-lg">
    {atlit.pas_foto ? (
      <img 
        src={getPhotoUrl(atlit.pas_foto)} 
        alt={`Foto ${atlit.nama_atlet}`}
        className="w-full h-full object-cover"
        onError={(e) => {
          // Fallback ke initial jika gambar gagal load
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const sibling = target.nextElementSibling as HTMLElement;
          if (sibling) sibling.style.display = 'flex';
        }}
      />
    ) : null}
    <span 
      className={`w-full h-full flex items-center justify-center ${atlit.pas_foto ? 'hidden' : ''}`}
      style={{ display: atlit.pas_foto ? 'none' : 'flex' }}
    >
      {atlit.nama_atlet.charAt(0).toUpperCase()}
    </span>
  </div>
  <div className="flex-1 min-w-0">
    <p className="font-plex font-semibold text-black/80 truncate">{atlit.nama_atlet}</p>
    <p className="font-plex text-sm text-black/60">{atlit.provinsi || "Tidak diketahui"}</p>
    <div className="flex items-center gap-2 mt-1">
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-plex font-medium ${
          atlit.jenis_kelamin === "LAKI_LAKI"
            ? "bg-blue-100 text-blue-600"
            : "bg-pink-100 text-pink-600"
        }`}
      >
        {atlit.jenis_kelamin === "LAKI_LAKI" ? "L" : "P"}
      </span>
      <span className="font-plex text-xs text-black/60">{atlit.age} tahun</span>
    </div>
  </div>
</div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/dashboard/atlit/${atlit.id_atlet}`);
                      }}
                      className="p-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-all duration-200"
                    >
                      <Eye size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty state */}
            {!loading && filteredAtlits.length === 0 && (
              <div className="text-center py-8 lg:py-12">
                <Users className="mx-auto text-gray-400 mb-4" size={40} />
                <p className="font-plex text-gray-500">
                  {atlits.length === 0 
                    ? "Belum ada atlet yang terdaftar"
                    : "Tidak ada atlet yang sesuai dengan filter"
                  }
                </p>
                <p className="font-plex text-sm text-gray-400 mt-2">
                  {atlits.length === 0
                    ? "Silakan tambah atlet baru untuk memulai"
                    : "Coba ubah kriteria pencarian atau filter"
                  }
                </p>
              </div>
            )}

            {/* Pagination */}
            {!loading && filteredAtlits.length > 0 && totalPages > 1 && (
              <div className="mt-6 lg:mt-8">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Page Info */}
                  <div className="font-plex text-sm text-black/60">
                    Halaman {currentPage} dari {totalPages} 
                    ({startIndex + 1}-{Math.min(endIndex, filteredAtlits.length)} dari {filteredAtlits.length} atlet)
                  </div>
                  
                  {/* Pagination Controls */}
                  <div className="flex items-center gap-2">
                    {/* Previous Button */}
                    <button
                      onClick={handlePrevious}
                      disabled={currentPage === 1}
                      className="p-2 lg:p-2.5 rounded-lg border border-red/20 bg-white/50 text-red hover:bg-red/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      <ChevronLeft size={18} />
                    </button>

                    {/* Page Numbers */}
                    <div className="flex gap-1 lg:gap-2 max-w-xs overflow-x-auto">
                      {getPageNumbers().map((page, index) => (
                        <button
                          key={index}
                          onClick={() => typeof page === 'number' && handlePageChange(page)}
                          disabled={page === '...'}
                          className={`px-3 lg:px-4 py-2 lg:py-2.5 rounded-lg font-plex text-sm transition-all duration-200 whitespace-nowrap ${
                            page === currentPage
                              ? 'bg-red text-white'
                              : page === '...'
                              ? 'text-black/40 cursor-default'
                              : 'bg-white/50 text-red border border-red/20 hover:bg-red/5'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    {/* Next Button */}
                    <button
                      onClick={handleNext}
                      disabled={currentPage === totalPages}
                      className="p-2 lg:p-2.5 rounded-lg border border-red/20 bg-white/50 text-red hover:bg-red/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
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

export default DataAtlit;