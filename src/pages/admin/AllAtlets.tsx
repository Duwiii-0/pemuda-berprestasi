// src/pages/admin/AllAtlets.tsx
import React, { useState, useEffect } from "react";
import { Search, Users, Loader, Eye, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { useAtletContext, genderOptions } from "../../context/AtlitContext";
import { apiClient } from "../../config/api";
import { useAuth } from "../../context/authContext";
import { useNavigate } from "react-router-dom";

const AllAtlets: React.FC = () => {
  const { atlits, fetchAllAtlits } = useAtletContext();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGender, setFilterGender] = useState<"ALL" | "LAKI_LAKI" | "PEREMPUAN">("ALL");
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  const navigate = useNavigate();
  const [filterAgeCategory, setFilterAgeCategory] = useState<"ALL" | "CADET" | "JUNIOR" | "SENIOR">("ALL");
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Set token global sekali aja
  useEffect(() => {
    // Token handled by apiClient automatically
  }, [token]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        await fetchAllAtlits();
      } catch (err: any) {
        console.error("Error fetching athletes:");
        setError("Gagal memuat data atlet");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getAgeCategory = (umur: number | undefined): "CADET" | "JUNIOR" | "SENIOR" | undefined => {
    if (!umur) return undefined;
    if (umur >= 10 && umur <= 12) return "CADET";
    if (umur >= 13 && umur <= 15) return "JUNIOR";
    if (umur >= 16) return "SENIOR";
  };

  const filteredAtlits = atlits.filter((atlet) => {
    const matchesSearch = atlet.nama_atlet.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGender = filterGender === "ALL" || atlet.jenis_kelamin === filterGender;

    const category = getAgeCategory(atlet.umur);
    const matchesAgeCategory = filterAgeCategory === "ALL" || category === filterAgeCategory;

    return matchesSearch && matchesGender && matchesAgeCategory;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredAtlits.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAtlits = filteredAtlits.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterGender, filterAgeCategory]);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "Invalid date";
    }
  };

  const ageCategories = [
    { value: "ALL", label: "Semua Kelompok Umur" },
    { value: "CADET", label: "Cadet (2011-2013)" },
    { value: "JUNIOR", label: "Junior (2008-2010)" },
    { value: "SENIOR", label: "Senior (2007 ke atas)" },
  ];

  const getGenderBadge = (gender: string) => {
    const styles = {
      LAKI_LAKI: "bg-blue-100 text-blue-800 border border-blue-200",
      PEREMPUAN: "bg-pink-100 text-pink-800 border border-pink-200",
    };
    return (
      <span className={`text-xs px-2 py-1 rounded-full font-medium ${styles[gender as keyof typeof styles]}`}>
        {gender === "LAKI_LAKI" ? "Laki-Laki" : "Perempuan"}
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

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-96">
        <Loader className="animate-spin text-blue-600 mb-4" size={32} />
        <p className="text-gray-600">Memuat data atlet...</p>
      </div>
    );
  }

  return (
<div className="p-4 sm:p-6 lg:p-8 max-w-full mx-auto space-y-6 sm:space-y-8 lg:space-y-10 sm:px-6 lg:px-24 xl:px-48">
  {/* Header */}
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div className="flex items-start sm:items-center gap-3 sm:gap-4">
      <Users className="text-red-500 flex-shrink-0" size={40} />
      <div>
        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bebas text-black/90">Semua Atlet</h1>
        <p className="text-black/60 text-sm sm:text-lg lg:text-xl mt-1">Kelola data semua atlet</p>
      </div>
    </div>
  </div>

  {error && (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 bg-red-50 border border-red-300 rounded-2xl text-red-700">
      <AlertTriangle size={22} className="flex-shrink-0" />
      <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <span className="text-sm sm:text-base">{error}</span>
        <button
          onClick={fetchAllAtlits}
          className="text-red-600 font-semibold underline hover:no-underline text-sm sm:text-base"
        >
          Coba lagi
        </button>
      </div>
    </div>
  )}

{/* Filters */}
<div className="bg-white/90 backdrop-blur-md border border-white/40 rounded-2xl p-4 sm:p-6 shadow-lg space-y-4 sm:space-y-5">
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
    {/* Search */}
    <div className="relative sm:col-span-2">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
      <input
        type="text"
        placeholder="Cari berdasarkan nama atlet..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full pl-12 pr-4 py-3 sm:py-4 rounded-3xl border border-gray-200 shadow-lg focus:ring-2 focus:ring-red-400 focus:border-transparent text-sm sm:text-lg transition placeholder-gray-400"
      />
    </div>

    {/* Gender Filter */}
    <select
      value={filterGender}
      onChange={(e) => setFilterGender(e.target.value as any)}
      className="w-full px-3 sm:px-4 py-3 sm:py-4 rounded-3xl border-2 border-gray-300 bg-white/80 backdrop-blur-sm shadow-lg text-sm sm:text-base font-plex transition-all duration-300 hover:shadow-xl hover:border-red/40 focus:outline-none focus:border-red focus:shadow-red/10"
    >
      <option value="ALL">Semua Jenis Kelamin</option>
      {genderOptions.map((opt) => (
        <option key={opt.value} value={opt.value} className="text-sm sm:text-lg">
          {opt.label}
        </option>
      ))}
    </select>

    {/* Age Category Filter */}
    <select
      value={filterAgeCategory}
      onChange={(e) => setFilterAgeCategory(e.target.value as any)}
      className="w-full px-3 sm:px-4 py-3 sm:py-4 rounded-3xl border-2 border-gray-300 bg-white/80 backdrop-blur-sm shadow-lg text-sm sm:text-base font-plex transition-all duration-300 hover:shadow-xl hover:border-red/40 focus:outline-none focus:border-red focus:shadow-red/10"
    >
      {ageCategories.map((opt) => (
        <option key={opt.value} value={opt.value} className="text-sm sm:text-lg">
          {opt.label}
        </option>
      ))}
    </select>
  </div>

  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
    <p className="text-gray-600 text-sm sm:text-base">
      Menampilkan <span className="font-semibold">{startIndex + 1}-{Math.min(endIndex, filteredAtlits.length)}</span> dari <span className="font-semibold">{filteredAtlits.length}</span> atlet
    </p>
    <p className="text-gray-500 text-xs sm:text-sm">
      Halaman {currentPage} dari {totalPages}
    </p>
  </div>
</div>

  {/* Mobile Cards View */}
  <div className="block lg:hidden space-y-4">
    {currentAtlits.map((atlet) => (
      <div
        key={atlet.id_atlet}
        className="bg-white/90 backdrop-blur-md border border-white/40 rounded-2xl shadow-lg p-4 cursor-pointer hover:shadow-xl transition-shadow border-l-4 border-l-red-500"
        onClick={() => navigate(`/dashboard/atlit/${atlet.id_atlet}`)}
      >
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-lg text-black/90 flex-1 mr-2">{atlet.nama_atlet}</h3>
          <div className="flex-shrink-0">
            {getGenderBadge(atlet.jenis_kelamin)}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div>
            <span className="font-medium text-gray-600">Tanggal Lahir:</span>
            <p className="text-gray-800">{formatDate(atlet.tanggal_lahir)}</p>
          </div>
          <div>
            <span className="font-medium text-gray-600">Umur:</span>
            <p className="text-gray-800">{atlet.umur ?? '-'} tahun</p>
          </div>
          <div>
            <span className="font-medium text-gray-600">Kategori Umur:</span>
            <p className="text-gray-800">
              {getAgeCategory(atlet.umur) || '-'}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2 pt-3 border-t border-gray-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/dashboard/atlit/${atlet.id_atlet}`);
            }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-700 transition-all text-sm font-medium"
          >
            <Eye size={16} />
            Lihat Detail
          </button>
        </div>
      </div>
    ))}
  </div>

  {/* Desktop Table */}
  <div className="hidden lg:block bg-white/90 backdrop-blur-md border border-white/40 rounded-2xl shadow-lg overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-base lg:text-lg">
        <thead className="bg-yellow">
          <tr>
            <th className="py-4 lg:py-5 px-4 lg:px-6 font-semibold text-black/80">Nama Atlet</th>
            <th className="py-4 lg:py-5 px-4 lg:px-6 font-semibold text-black/80 text-center">Jenis Kelamin</th>
            <th className="py-4 lg:py-5 px-4 lg:px-6 font-semibold text-black/80 text-center">Tanggal Lahir</th>
            <th className="py-4 lg:py-5 px-4 lg:px-6 font-semibold text-black/80 text-center">Umur</th>
            <th className="py-4 lg:py-5 px-4 lg:px-6 font-semibold text-black/80 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {currentAtlits.map((atlet) => (
            <tr 
              key={atlet.id_atlet} 
              onClick={() => navigate(`/dashboard/atlit/${atlet.id_atlet}`)} 
              className="border-t border-gray-200 hover:bg-yellow/10 transition cursor-pointer"
            >
              <td className="py-3 lg:py-4 px-4 lg:px-6 font-medium text-black/90">{atlet.nama_atlet}</td>
              <td className="py-3 lg:py-4 px-4 lg:px-6 text-center">{getGenderBadge(atlet.jenis_kelamin)}</td>
              <td className="py-3 lg:py-4 px-4 lg:px-6 text-black/70 text-center">{formatDate(atlet.tanggal_lahir)}</td>
              <td className="py-3 lg:py-4 px-4 lg:px-6 text-black/70 text-center">{atlet.umur ?? '-'}</td>
              <td className="py-3 lg:py-4 px-4 lg:px-6 text-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/dashboard/atlit/${atlet.id_atlet}`);
                  }}
                  className="cursor-pointer p-2 text-white hover:bg-red-700 rounded-lg transition flex items-center gap-2 bg-red-500 px-3 lg:px-4 text-sm lg:text-base"
                  title="Lihat Detail"
                >
                  <Eye size={18} />
                  Detail
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {filteredAtlits.length === 0 && !loading && (
      <div className="py-16 text-center text-gray-400">
        <Users size={52} className="mx-auto mb-4" />
        <p className="text-lg">Tidak ada atlet yang ditemukan</p>
      </div>
    )}
  </div>

  {/* Mobile Empty State */}
  {filteredAtlits.length === 0 && !loading && (
    <div className="block lg:hidden py-16 text-center text-gray-400">
      <Users size={52} className="mx-auto mb-4" />
      <p className="text-lg">Tidak ada atlet yang ditemukan</p>
    </div>
  )}

  {/* Pagination */}
  {totalPages > 1 && (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/90 backdrop-blur-md border border-white/40 rounded-2xl p-4 sm:p-6 shadow-lg">
      {/* Pagination Info */}
      <div className="text-sm text-gray-600 order-2 sm:order-1">
        Menampilkan {startIndex + 1} - {Math.min(endIndex, filteredAtlits.length)} dari {filteredAtlits.length} hasil
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2">
        {/* Previous Button */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1 px-2 sm:px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
        >
          <ChevronLeft size={16} />
          <span className="hidden sm:inline">Prev</span>
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((pageNum, index) => (
            pageNum === '...' ? (
              <span key={`ellipsis-${index}`} className="px-2 py-2 text-gray-400 text-sm sm:text-base">...</span>
            ) : (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum as number)}
                className={`px-2 sm:px-3 py-2 rounded-lg transition-colors text-sm sm:text-base min-w-[32px] sm:min-w-[40px] ${
                  currentPage === pageNum
                    ? 'bg-red-500 text-white'
                    : 'border border-gray-300 bg-white hover:bg-gray-50'
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
          className="flex items-center gap-1 px-2 sm:px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )}
</div>
  );
};

export default AllAtlets;