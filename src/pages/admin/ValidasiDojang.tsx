import React, { useState, useEffect } from 'react';
import { Eye, Loader, Building2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
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
      <div className="p-6 flex flex-col items-center justify-center min-h-96">
        <Loader className="animate-spin text-blue-600 mb-4" size={32} />
        <p className="text-gray-600">Memuat data dojang...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-full mx-auto space-y-6 sm:space-y-8 lg:space-y-10 sm:px-6 lg:px-24 xl:px-48">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3 sm:gap-4">
          <Building2 className="text-blue-500 flex-shrink-0" size={40} />
          <div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bebas text-black/90">Validasi Dojang</h1>
            <p className="text-black/60 text-sm sm:text-lg lg:text-xl mt-1">Kelola pendaftaran dojang</p>
          </div>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="space-y-4">
        <div className="relative max-w-full sm:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Cari dojang..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 sm:py-4 rounded-3xl border border-gray-200 shadow-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm sm:text-lg transition placeholder-gray-400"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-sm sm:text-base text-gray-600">
          <p>
            Menampilkan <span className="font-semibold">{startIndex + 1}-{Math.min(endIndex, filteredDojangs.length)}</span> dari <span className="font-semibold">{filteredDojangs.length}</span> dojang
          </p>
          {totalPages > 1 && (
            <p className="text-gray-500 text-xs sm:text-sm">
              Halaman {currentPage} dari {totalPages}
            </p>
          )}
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="block lg:hidden space-y-4">
        {currentDojangs.length === 0 ? (
          <div className="text-center py-16 bg-white/90 backdrop-blur-md border border-white/40 rounded-2xl shadow-lg">
            <div className="text-gray-300 mb-4">
              <Building2 size={64} className="mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Tidak ada dojang</h3>
            <p className="text-gray-500 mb-4">Semua dojang telah diproses atau belum ada pendaftaran baru</p>
          </div>
        ) : (
          currentDojangs.map((d) => (
            <div
              key={d.id_dojang}
              className="bg-white/90 backdrop-blur-md border border-white/40 rounded-2xl shadow-lg p-4 cursor-pointer hover:shadow-xl transition-shadow border-l-4 border-l-blue-500"
              onClick={() => handleViewDetail(d.id_dojang)}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-lg text-black/90 flex-1 mr-2">{d.nama_dojang}</h3>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                  {d.jumlah_atlet || 0} Atlet
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div>
                  <span className="font-medium text-gray-600">Provinsi:</span>
                  <p className="text-gray-800">{d.provinsi || '-'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Tanggal Daftar:</span>
                  <p className="text-gray-800">{formatDate(d.created_at)}</p>
                </div>
              </div>
              
              <div className="flex gap-2 pt-3 border-t border-gray-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetail(d.id_dojang);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all text-sm font-medium"
                >
                  <Eye size={16} />
                  Detail
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toast.success(`Hapus dojang ${d.nama_dojang}`);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all text-sm font-medium"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-white/90 backdrop-blur-md border border-white/40 rounded-2xl shadow-lg overflow-hidden">
        {filteredDojangs.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-300 mb-4">
              <Building2 size={64} className="mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Tidak ada dojang</h3>
            <p className="text-gray-500 mb-4">Semua dojang telah diproses atau belum ada pendaftaran baru</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-base lg:text-lg">
              <thead className="bg-yellow">
                <tr>
                  <th className="py-4 lg:py-5 px-4 lg:px-6 font-semibold text-black/80">Nama Dojang</th>
                  <th className="py-4 lg:py-5 px-4 lg:px-6 font-semibold text-black/80 text-center">Jumlah Atlet</th>
                  <th className="py-4 lg:py-5 px-4 lg:px-6 font-semibold text-black/80 text-center">Provinsi</th>
                  <th className="py-4 lg:py-5 px-4 lg:px-6 font-semibold text-black/80 text-center">Tanggal Daftar</th>
                  <th className="py-4 lg:py-5 px-4 lg:px-6 font-semibold text-black/80 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {currentDojangs.map((d) => (
                  <tr
                    key={d.id_dojang}
                    className="border-t border-gray-200 hover:bg-yellow/10 transition-colors cursor-pointer"
                    onClick={() => handleViewDetail(d.id_dojang)}
                  >
                    <td className="py-3 lg:py-4 px-4 lg:px-6 font-medium text-black/90">{d.nama_dojang}</td>
                    <td className="py-3 lg:py-4 px-4 lg:px-6 text-center text-black/70">{d.jumlah_atlet || 0}</td>
                    <td className="py-3 lg:py-4 px-4 lg:px-6 text-center text-black/70">{d.provinsi || '-'}</td>
                    <td className="py-3 lg:py-4 px-4 lg:px-6 text-center text-black/70">{formatDate(d.created_at)}</td>
                    <td className="py-3 lg:py-4 px-4 lg:px-6">
                      <div className="flex justify-center gap-2">
                        <button
                          className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 text-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetail(d.id_dojang);
                          }}
                        >
                          <Eye size={16} />
                          Detail
                        </button>
                        <button
                          className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toast.success(`Hapus dojang ${d.nama_dojang}`);
                          }}
                        >
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/90 backdrop-blur-md border border-white/40 rounded-2xl p-4 sm:p-6 shadow-lg">
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

      {/* Enhanced Modal */}
      {showDetailModal && selectedDojang && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-bold">Detail Dojang</h2>
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
                if (!dojang) return <p>Dojang tidak ditemukan</p>;
                
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
                      <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-xs sm:text-sm">
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
  );
};

export default ValidasiDojang;