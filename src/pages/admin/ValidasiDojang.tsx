import React, { useState, useEffect } from 'react';
import { Eye, Loader, Building2, Search, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { useDojang } from '../../context/dojangContext';
import toast from 'react-hot-toast';

const ValidasiDojang: React.FC = () => {
  const { dojangs, refreshDojang, isLoading } = useDojang(); 
  const [selectedDojang, setSelectedDojang] = useState<number | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    refreshDojang().catch(() => toast.error('Gagal memuat data dojang'));
  }, []);

  const handleViewDetail = (id: number) => {
    setSelectedDojang(id);
    setShowDetailModal(true);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const filteredDojangs = dojangs.filter(d =>
    d.nama_dojang.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredDojangs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDojangs = filteredDojangs.slice(startIndex, endIndex);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader className="animate-spin text-blue-600" size={32} />
          <p className="text-gray-600">Memuat data dojang...</p>
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
            <Building2 
              size={32} 
              className="text-blue-500 sm:w-10 sm:h-10 lg:w-12 lg:h-12 flex-shrink-0" 
            />
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bebas text-black/90 leading-tight">
                Validasi Dojang
              </h1>
              <p className="text-black/60 text-sm sm:text-base lg:text-lg mt-1 sm:mt-2">
                Kelola pendaftaran dan data dojang
              </p>
            </div>
          </div>
        </div>

        {/* SEARCH + INFO - Layout yang sama dengan ValidasiPeserta */}
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
                  placeholder="Cari dojang..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm placeholder-gray-400 transition-colors"
                />
              </div>
            </div>

            {/* Info hasil */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 pt-2 border-t border-gray-100">
              <p className="text-gray-600 text-sm sm:text-base">
                Menampilkan <span className="font-semibold">{startIndex + 1}-{Math.min(endIndex, filteredDojangs.length)}</span> dari <span className="font-semibold">{filteredDojangs.length}</span> dojang
              </p>
              {totalPages > 1 && (
                <p className="text-gray-500 text-xs sm:text-sm">
                  Halaman {currentPage} dari {totalPages}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <>
          {/* Mobile Cards View - Design yang sama dengan ValidasiPeserta */}
          <div className="block lg:hidden space-y-4">
            {currentDojangs.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <Building2 size={52} className="mx-auto mb-4" />
                <p className="text-lg">Tidak ada dojang yang ditemukan</p>
                {searchTerm && (
                  <p className="text-sm mt-2">Coba ubah kata kunci pencarian Anda</p>
                )}
              </div>
            ) : (
              currentDojangs.map((d) => (
                <div
                  key={d.id_dojang}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Header Card */}
                  <div 
                    className="p-4 cursor-pointer"
                    onClick={() => handleViewDetail(d.id_dojang)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0 pr-3">
                        <h3 className="font-semibold text-base text-gray-800 leading-tight truncate">
                          {d.nama_dojang}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {d.provinsi || 'Provinsi tidak diketahui'}
                        </p>
                      </div>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0">
                        {d.jumlah_atlet || 0} Atlet
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-gray-500">Tanggal Daftar:</span>
                        <p className="text-gray-800 font-medium">{formatDate(d.created_at)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Jumlah Atlet:</span>
                        <p className="text-gray-800 font-medium">{d.jumlah_atlet || 0} orang</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 p-4 pt-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetail(d.id_dojang);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all text-sm font-medium"
                    >
                      <Eye size={16} />
                      Lihat Detail
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.success(`Hapus dojang ${d.nama_dojang}`);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all text-sm font-medium"
                    >
                      <Trash2 size={16} />
                      Hapus
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View - Layout yang konsisten */}
          <div className="hidden lg:block">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {filteredDojangs.length === 0 ? (
                <div className="py-16 text-center text-gray-400">
                  <Building2 size={52} className="mx-auto mb-4" />
                  <p className="text-lg">Tidak ada dojang yang ditemukan</p>
                  {searchTerm && (
                    <p className="text-sm mt-2">Coba ubah kata kunci pencarian Anda</p>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead className="bg-yellow-400">
                      <tr>
                        {["Nama Dojang", "Jumlah Atlet", "Provinsi", "Tanggal Daftar", "Aksi"].map((header) => (
                          <th
                            key={header}
                            className={`py-3 px-4 font-semibold text-gray-900 text-sm ${
                              header === "Aksi" || header === "Jumlah Atlet" ? "text-center" : "text-left"
                            }`}
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {currentDojangs.map((d) => (
                        <tr
                          key={d.id_dojang}
                          className="hover:bg-yellow-50 transition-colors cursor-pointer"
                          onClick={() => handleViewDetail(d.id_dojang)}
                        >
                          <td className="py-4 px-4 font-medium text-gray-800 text-sm">{d.nama_dojang}</td>
                          <td className="py-4 px-4 text-center text-gray-700 text-sm">{d.jumlah_atlet || 0}</td>
                          <td className="py-4 px-4 text-gray-700 text-sm">{d.provinsi || '-'}</td>
                          <td className="py-4 px-4 text-gray-700 text-sm text-center">{formatDate(d.created_at)}</td>
                          <td className="py-4 px-4">
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewDetail(d.id_dojang);
                                }}
                                className="flex items-center gap-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all text-xs font-medium"
                              >
                                <Eye size={14} />
                                Detail
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toast.success(`Hapus dojang ${d.nama_dojang}`);
                                }}
                                className="flex items-center gap-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all text-xs font-medium"
                              >
                                <Trash2 size={14} />
                                Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>

        {/* Pagination - Konsisten dengan design ValidasiPeserta */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mt-6">
            {/* Pagination Info */}
            <div className="text-sm text-gray-600 order-2 sm:order-1">
              Menampilkan {startIndex + 1} - {Math.min(endIndex, filteredDojangs.length)} dari {filteredDojangs.length} hasil
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
                          ? 'bg-blue-500 text-white'
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

        {/* Enhanced Modal - Modal styling yang konsisten */}
        {showDetailModal && selectedDojang && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex items-center justify-between rounded-t-xl">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Detail Dojang</h2>
                <button 
                  onClick={() => setShowDetailModal(false)} 
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                  ×
                </button>
              </div>
              <div className="p-4 sm:p-6">
                {(() => {
                  const dojang = dojangs.find(d => d.id_dojang === selectedDojang);
                  if (!dojang) return <p className="text-gray-500">Dojang tidak ditemukan</p>;
                  
                  return (
                    <div className="space-y-6">
                      {/* Basic Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h3 className="font-semibold text-gray-700 mb-2">Informasi Dasar</h3>
                          <div className="space-y-2 text-sm">
                            <div><span className="font-medium">Nama:</span> {dojang.nama_dojang}</div>
                            <div><span className="font-medium">Jumlah Atlet:</span> {dojang.jumlah_atlet || 0}</div>
                            <div><span className="font-medium">Provinsi:</span> {dojang.provinsi || '-'}</div>
                            <div><span className="font-medium">Tanggal Daftar:</span> {formatDate(dojang.created_at)}</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Raw Data */}
                      <div>
                        <h3 className="font-semibold text-gray-700 mb-2">Data Lengkap</h3>
                        <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-xs sm:text-sm text-gray-700 max-h-64">
                          {JSON.stringify(dojang, null, 2)}
                        </pre>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ValidasiDojang;