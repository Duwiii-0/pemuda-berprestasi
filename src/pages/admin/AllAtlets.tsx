// src/pages/admin/AllAtlets.tsx
import React, { useState, useEffect } from "react";
import { Search, Users, Loader, Eye, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { useAtletContext, genderOptions } from "../../context/AtlitContext";
import { apiClient } from "../../config/api";
import { useAuth } from "../../context/authContext";
import { useNavigate } from "react-router-dom";
import Select from "react-select";

const AllAtlets: React.FC = () => {
  const { atlits, fetchAllAtlits } = useAtletContext();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGender, setFilterGender] = useState<"ALL" | "LAKI_LAKI" | "PEREMPUAN">("ALL");
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  const navigate = useNavigate();
  const [filterAgeCategory, setFilterAgeCategory] = useState<"ALL" | "Super Pra-cadet" | "Pracadet" | "Cadet" | "Junior" | "Senior" >("ALL");
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(100);

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

  const getAgeCategory = (umur: number | undefined): "Super Pra-cadet" | "Pracadet" | "Cadet" | "Junior" | "Senior" | undefined => {
    if (!umur) return undefined;
    if (umur >= 5 && umur <= 8) return "Super Pra-cadet";
    if (umur >= 9 && umur <= 11) return "Pracadet";
    if (umur >= 12 && umur <= 14) return "Cadet";
    if (umur >= 15 && umur <= 17) return "Junior";
    if (umur >= 18) return "Senior";
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
    { value: "Super Pra-cadet", label: "Super Pra-Cadet (2017-2020)" },
    { value: "Pracadet", label: "Pracadet (2014-2016)" },
    { value: "Cadet", label: "Cadet (2011-2013)" },
    { value: "Junior", label: "Junior (2008-2010)" },
    { value: "Senior", label: "Senior (2007 ke atas)" },
  ];

  const getGenderBadge = (gender: string) => {
    return gender === "LAKI_LAKI" ? (
      <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgba(153, 13, 53, 0.1)', color: '#990D35' }}>
        Laki-Laki
      </span>
    ) : (
      <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgba(245, 183, 0, 0.2)', color: '#050505' }}>
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5FBEF' }}>
        <div className="flex flex-col items-center gap-3">
          <Loader className="animate-spin" style={{ color: '#990D35' }} size={32} />
          <p style={{ color: '#050505', opacity: 0.6 }}>Memuat data atlet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5FBEF' }}>
      {/* CONTAINER UTAMA - Padding responsif yang sama dengan ValidasiPeserta */}
      <div className="px-4 py-6 sm:px-6 lg:px-8 xl:px-12 2xl:px-24 max-w-7xl mx-auto">
        
        {/* HEADER - Diperbaiki untuk mobile seperti ValidasiPeserta */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <Users 
              size={32} 
              className="sm:w-10 sm:h-10 lg:w-12 lg:h-12 flex-shrink-0" 
              style={{ color: '#990D35' }}
            />
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bebas leading-tight" style={{ color: '#050505' }}>
                Semua Atlet
              </h1>
              <p className="text-sm sm:text-base lg:text-lg mt-1 sm:mt-2" style={{ color: '#050505', opacity: 0.6 }}>
                Kelola data semua atlet yang terdaftar
              </p>
            </div>
          </div>
        </div>

        {/* ERROR STATE */}
        {error && (
          <div className="mb-6 border rounded-xl p-4" style={{ backgroundColor: 'rgba(153, 13, 53, 0.05)', borderColor: 'rgba(153, 13, 53, 0.2)' }}>
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" style={{ color: '#990D35' }} />
              <div className="flex-1">
                <p className="text-sm sm:text-base" style={{ color: '#990D35' }}>{error}</p>
                <button
                  onClick={fetchAllAtlits}
                  className="mt-2 font-semibold underline hover:no-underline text-sm"
                  style={{ color: '#990D35' }}
                >
                  Coba lagi
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FILTER + SEARCH - Layout yang sama dengan ValidasiPeserta */}
        <div className="rounded-xl shadow-sm border p-4 sm:p-6 mb-6" style={{ backgroundColor: '#F5FBEF', borderColor: '#990D35' }}>
          <div className="space-y-4">
            {/* Search - Full width di mobile */}
            <div className="w-full">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: '#050505', opacity: 0.4 }}
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Cari berdasarkan nama atlet..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border shadow-sm focus:ring-2 focus:border-transparent text-sm placeholder-gray-400 transition-colors"
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

            {/* Filter dalam grid 2 kolom di mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Filter Gender */}
              <div>
                <label className="block text-xs mb-2 font-medium" style={{ color: '#050505', opacity: 0.6 }}>Jenis Kelamin</label>
                <Select
              unstyled
              value={{
                value: filterGender,
                label:
                  filterGender === "ALL" ? "Semua Gender" : filterGender,
              }}
              onChange={(selected) => setFilterGender(selected?.value as any)}
              options={[
                { value: "ALL", label: "Semua Gender" },
                { value: "LAKI_LAKI", label: "Laki-Laki" },
                { value: "PEREMPUAN", label: "Perempuan" },
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

              {/* Filter Age Category */}
              <div>
                <label className="block text-xs mb-2 font-medium" style={{ color: '#050505', opacity: 0.6 }}>Kategori Umur</label>
                <Select
              unstyled
              value={{
                value: filterAgeCategory,
                label:
                  filterAgeCategory === "ALL" ? "Semua Usia" : filterAgeCategory,
              }}
              onChange={(selected) => setFilterAgeCategory(selected?.value as any)}
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
            </div>

            {/* Info hasil */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 pt-2 border-t" style={{ borderColor: 'rgba(153, 13, 53, 0.2)' }}>
              <p className="text-sm sm:text-base" style={{ color: '#050505', opacity: 0.6 }}>
                Menampilkan <span className="font-semibold">{startIndex + 1}-{Math.min(endIndex, filteredAtlits.length)}</span> dari <span className="font-semibold">{filteredAtlits.length}</span> atlet
              </p>
              <p className="text-xs sm:text-sm" style={{ color: '#050505', opacity: 0.5 }}>
                Halaman {currentPage} dari {totalPages}
              </p>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <Loader className="w-8 h-8 animate-spin" style={{ color: '#990D35' }} />
              <p className="text-sm sm:text-base" style={{ color: '#050505', opacity: 0.5 }}>Loading data atlet...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile Cards View - Design yang sama dengan ValidasiPeserta */}
            <div className="block lg:hidden space-y-4">
              {currentAtlits.map((atlet) => (
                <div
                  key={atlet.id_atlet}
                  className="rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow"
                  style={{ backgroundColor: '#F5FBEF', borderColor: '#990D35' }}
                >
                  {/* Header Card */}
                  <div 
                    className="p-4 cursor-pointer"
                    onClick={() => navigate(`/dashboard/atlit/${atlet.id_atlet}`)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0 pr-3">
                        <h3 className="font-semibold text-base leading-tight truncate" style={{ color: '#050505' }}>
                          {atlet.nama_atlet}
                        </h3>
                        <p className="text-sm mt-1" style={{ color: '#050505', opacity: 0.6 }}>
                          {getAgeCategory(atlet.umur) || 'Tidak diketahui'}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        {getGenderBadge(atlet.jenis_kelamin)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span style={{ color: '#050505', opacity: 0.5 }}>Tanggal Lahir:</span>
                        <p className="font-medium" style={{ color: '#050505' }}>{formatDate(atlet.tanggal_lahir)}</p>
                      </div>
                      <div>
                        <span style={{ color: '#050505', opacity: 0.5 }}>Umur:</span>
                        <p className="font-medium" style={{ color: '#050505' }}>{atlet.umur ?? '-'} tahun</p>
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
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-white rounded-lg hover:shadow-md transition-all text-sm font-medium"
                      style={{ backgroundColor: '#990D35' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(153, 13, 53, 0.9)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#990D35';
                      }}
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
              <div className="rounded-xl shadow-sm border overflow-hidden" style={{ backgroundColor: '#F5FBEF', borderColor: '#990D35' }}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead style={{ backgroundColor: '#F5B700' }}>
                      <tr>
                        {["Nama Atlet", "Jenis Kelamin", "Tanggal Lahir", "Umur", "Kategori Umur", "Aksi"].map((header) => (
                          <th
                            key={header}
                            className={`py-3 px-4 font-semibold text-sm ${
                              header === "Aksi" ? "text-center" : "text-left"
                            }`}
                            style={{ color: '#050505' }}
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: '#990D35' }}>
                      {currentAtlits.map((atlet) => (
                        <tr
                          key={atlet.id_atlet}
                          className="transition-colors cursor-pointer"
                          onClick={() => navigate(`/dashboard/atlit/${atlet.id_atlet}`)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(245, 183, 0, 0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <td className="py-4 px-4 font-medium text-sm" style={{ color: '#050505' }}>{atlet.nama_atlet}</td>
                          <td className="py-4 px-4 text-center">{getGenderBadge(atlet.jenis_kelamin)}</td>
                          <td className="py-4 px-4 text-sm" style={{ color: '#050505', opacity: 0.7 }}>{formatDate(atlet.tanggal_lahir)}</td>
                          <td className="py-4 px-4 text-sm text-center" style={{ color: '#050505', opacity: 0.7 }}>{atlet.umur ?? '-'} tahun</td>
                          <td className="py-4 px-4 text-sm text-center" style={{ color: '#050505', opacity: 0.7 }}>
                            {getAgeCategory(atlet.umur) || '-'}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/dashboard/atlit/${atlet.id_atlet}`);
                              }}
                              className="inline-flex items-center gap-2 px-3 py-2 text-white rounded-lg hover:shadow-md transition-colors text-sm font-medium"
                              style={{ backgroundColor: '#990D35' }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(153, 13, 53, 0.9)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#990D35';
                              }}
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
              <div className="py-16 text-center" style={{ color: '#050505', opacity: 0.4 }}>
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl shadow-sm border p-4 sm:p-6 mt-6" style={{ backgroundColor: '#F5FBEF', borderColor: '#990D35' }}>
            {/* Pagination Info */}
            <div className="text-sm order-2 sm:order-1" style={{ color: '#050505', opacity: 0.6 }}>
              Menampilkan {startIndex + 1} - {Math.min(endIndex, filteredAtlits.length)} dari {filteredAtlits.length} hasil
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2">
              {/* Previous Button */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-2 sm:px-3 py-2 rounded-lg border hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
                style={{ 
                  borderColor: '#990D35', 
                  backgroundColor: '#F5FBEF', 
                  color: '#050505' 
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = 'rgba(153, 13, 53, 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = '#F5FBEF';
                  }
                }}
              >
                <ChevronLeft size={16} />
                <span className="hidden sm:inline">Prev</span>
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {getPageNumbers().map((pageNum, index) => (
                  pageNum === '...' ? (
                    <span key={`ellipsis-${index}`} className="px-2 py-2 text-sm sm:text-base" style={{ color: '#050505', opacity: 0.4 }}>...</span>
                  ) : (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum as number)}
                      className={`px-2 sm:px-3 py-2 rounded-lg transition-colors text-sm sm:text-base min-w-[32px] sm:min-w-[40px]`}
                      style={{
                        backgroundColor: currentPage === pageNum ? '#990D35' : '#F5FBEF',
                        color: currentPage === pageNum ? '#F5FBEF' : '#050505',
                        border: currentPage === pageNum ? 'none' : `1px solid #990D35`
                      }}
                      onMouseEnter={(e) => {
                        if (currentPage !== pageNum) {
                          e.currentTarget.style.backgroundColor = 'rgba(153, 13, 53, 0.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (currentPage !== pageNum) {
                          e.currentTarget.style.backgroundColor = '#F5FBEF';
                        }
                      }}
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
                className="flex items-center gap-1 px-2 sm:px-3 py-2 rounded-lg border hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
                style={{ 
                  borderColor: '#990D35', 
                  backgroundColor: '#F5FBEF', 
                  color: '#050505' 
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = 'rgba(153, 13, 53, 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = '#F5FBEF';
                  }
                }}
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