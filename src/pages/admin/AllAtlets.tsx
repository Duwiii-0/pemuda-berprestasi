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
    return gender === "LAKI_LAKI" ? (
      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
        Laki-Laki
      </span>
    ) : (
      <span className="bg-pink-100 text-pink-800 px-2 py-1 rounded-full text-xs font-medium">
        Perempuan
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader className="animate-spin text-blue-600" size={32} />
          <p className="text-gray-600">Memuat data atlet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* CONTAINER UTAMA - Padding responsif yang sama dengan ValidasiPeserta */}
      <div className="px-4 py-6 sm:px-6 lg:px-8 xl:px-12 2xl:px-24 max-w-7xl mx-auto">
        
        {/* HEADER - Diperbaiki untuk mobile seperti ValidasiPeserta */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <Users 
              size={32} 
              className="text-red-500 sm:w-10 sm:h-10 lg:w-12 lg:h-12 flex-shrink-0" 
            />
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bebas text-black/90 leading-tight">
                Semua Atlet
              </h1>
              <p className="text-black/60 text-sm sm:text-base lg:text-lg mt-1 sm:mt-2">
                Kelola data semua atlet yang terdaftar
              </p>
            </div>
          </div>
        </div>

        {/* ERROR STATE */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-700 text-sm sm:text-base">{error}</p>
                <button
                  onClick={fetchAllAtlits}
                  className="mt-2 text-red-600 font-semibold underline hover:no-underline text-sm"
                >
                  Coba lagi
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FILTER + SEARCH - Layout yang sama dengan ValidasiPeserta */}
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
                  placeholder="Cari berdasarkan nama atlet..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-red-400 focus:border-transparent text-sm placeholder-gray-400 transition-colors"
                />
              </div>
            </div>

            {/* Filter dalam grid 2 kolom di mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Filter Gender */}
              <div>
                <label className="block text-gray-600 text-xs mb-2 font-medium">Jenis Kelamin</label>
                <select
                  value={filterGender}
                  onChange={(e) => setFilterGender(e.target.value as any)}
                  className="w-full px-3 py-3 rounded-2xl border border-gray-300 bg-white shadow-sm focus:ring-2 focus:ring-red-400 focus:border-transparent text-sm transition-colors"
                >
                  <option value="ALL">Semua Jenis Kelamin</option>
                  {genderOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Age Category */}
              <div>
                <label className="block text-gray-600 text-xs mb-2 font-medium">Kategori Umur</label>
                <select
                  value={filterAgeCategory}
                  onChange={(e) => setFilterAgeCategory(e.target.value as any)}
                  className="w-full px-3 py-3 rounded-2xl border border-gray-300 bg-white shadow-sm focus:ring-2 focus:ring-red-400 focus:border-transparent text-sm transition-colors"
                >
                  {ageCategories.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Info hasil */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 pt-2 border-t border-gray-100">
              <p className="text-gray-600 text-sm sm:text-base">
                Menampilkan <span className="font-semibold">{startIndex + 1}-{Math.min(endIndex, filteredAtlits.length)}</span> dari <span className="font-semibold">{filteredAtlits.length}</span> atlet
              </p>
              <p className="text-gray-500 text-xs sm:text-sm">
                Halaman {currentPage} dari {totalPages}
              </p>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <Loader className="w-8 h-8 animate-spin text-red-500" />
              <p className="text-gray-500 text-sm sm:text-base">Loading data atlet...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile Cards View - Design yang sama dengan ValidasiPeserta */}
            <div className="block lg:hidden space-y-4">
              {currentAtlits.map((atlet) => (
                <div
                  key={atlet.id_atlet}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Header Card */}
                  <div 
                    className="p-4 cursor-pointer"
                    onClick={() => navigate(`/dashboard/atlit/${atlet.id_atlet}`)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0 pr-3">
                        <h3 className="font-semibold text-base text-gray-800 leading-tight truncate">
                          {atlet.nama_atlet}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {getAgeCategory(atlet.umur) || 'Tidak diketahui'}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        {getGenderBadge(atlet.jenis_kelamin)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-gray-500">Tanggal Lahir:</span>
                        <p className="text-gray-800 font-medium">{formatDate(atlet.tanggal_lahir)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Umur:</span>
                        <p className="text-gray-800 font-medium">{atlet.umur ?? '-'} tahun</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Button */}
                  <div className="flex gap-2 p-4 pt-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/dashboard/atlit/${atlet.id_atlet}`);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all text-sm font-medium"
                    >
                      <Eye size={16} />
                      Lihat Detail
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View - Layout yang lebih konsisten */}
            <div className="hidden lg:block">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead className="bg-yellow-400">
                      <tr>
                        {["Nama Atlet", "Jenis Kelamin", "Tanggal Lahir", "Umur", "Kategori Umur", "Aksi"].map((header) => (
                          <th
                            key={header}
                            className={`py-3 px-4 font-semibold text-gray-900 text-sm ${
                              header === "Aksi" ? "text-center" : "text-left"
                            }`}
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {currentAtlits.map((atlet) => (
                        <tr
                          key={atlet.id_atlet}
                          className="hover:bg-yellow-50 transition-colors cursor-pointer"
                          onClick={() => navigate(`/dashboard/atlit/${atlet.id_atlet}`)}
                        >
                          <td className="py-4 px-4 font-medium text-gray-800 text-sm">{atlet.nama_atlet}</td>
                          <td className="py-4 px-4 text-center">{getGenderBadge(atlet.jenis_kelamin)}</td>
                          <td className="py-4 px-4 text-gray-700 text-sm">{formatDate(atlet.tanggal_lahir)}</td>
                          <td className="py-4 px-4 text-gray-700 text-sm text-center">{atlet.umur ?? '-'} tahun</td>
                          <td className="py-4 px-4 text-gray-700 text-sm text-center">
                            {getAgeCategory(atlet.umur) || '-'}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/dashboard/atlit/${atlet.id_atlet}`);
                              }}
                              className="inline-flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                            >
                              <Eye size={16} />
                              Detail
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Empty State - Konsisten untuk mobile dan desktop */}
            {filteredAtlits.length === 0 && (
              <div className="py-16 text-center text-gray-400">
                <Users size={52} className="mx-auto mb-4" />
                <p className="text-lg">Tidak ada atlet yang ditemukan</p>
                {(searchTerm || filterGender !== "ALL" || filterAgeCategory !== "ALL") && (
                  <p className="text-sm mt-2">Coba ubah filter pencarian Anda</p>
                )}
              </div>
            )}
          </>
        )}

        {/* Pagination - Konsisten dengan design ValidasiPeserta */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mt-6">
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
    </div>
  );
};

export default AllAtlets;