import React, { useState, useEffect } from 'react';
import { Eye, Loader, Building2, Search, ChevronLeft, ChevronRight, Trash2, Users, MapPin, Calendar, X } from 'lucide-react';
import { useDojang } from '../../context/dojangContext';
import toast from 'react-hot-toast';
import AlertModal from '../../components/alertModal'; // Added import
import { apiClient as api } from '../../config/api'; // Added import

const ValidasiDojang: React.FC = () => {
  const { dojangs, refreshDojang, isLoading } = useDojang(); 
  const [selectedDojang, setSelectedDojang] = useState<number | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAlertOpen, setIsAlertOpen] = useState(false); // Added state
  const [dojangToDelete, setDojangToDelete] = useState<any | null>(null); // Added state
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(21);

  useEffect(() => {
    refreshDojang().catch(() => toast.error('Gagal memuat data dojang'));
  }, []);

  const handleViewDetail = (id: number) => {
    setSelectedDojang(id);
    setShowDetailModal(true);
  };

  const handleDeleteClick = (dojang: any) => { // Added function
    setDojangToDelete(dojang);
    setIsAlertOpen(true);
  };

  const handleConfirmDelete = async () => { // Added function
    if (!dojangToDelete) return;

    const toastId = toast.loading('Menghapus dojang...');
    try {
      await api.delete(`/dojang/${dojangToDelete.id_dojang}`);
      toast.success(`Dojang ${dojangToDelete.nama_dojang} berhasil dihapus.`, { id: toastId });
      await refreshDojang();
    } catch (error: any) {
      console.error('Error deleting dojang:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Gagal menghapus dojang.';
      toast.error(errorMessage, { id: toastId });
    } finally {
      setIsAlertOpen(false);
      setDojangToDelete(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const filteredDojangs = dojangs.filter(d =>
    d.nama_dojang.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.provinsi && d.provinsi.toLowerCase().includes(searchTerm.toLowerCase()))
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

  const totalAtlet = dojangs.reduce((sum, d) => sum + (d.jumlah_atlet || 0), 0);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5FBEF' }}>
        <div className="flex flex-col items-center gap-3">
          <Loader className="animate-spin" style={{ color: '#990D35' }} size={32} />
          <p style={{ color: '#050505', opacity: 0.6 }}>Memuat data dojang...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5FBEF' }}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-full">
        
        {/* HEADER */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div 
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ 
                background: 'linear-gradient(135deg, #990D35 0%, #7A0A2B 100%)'
              }}
            >
              <Building2 
                size={32} 
                className="sm:w-8 sm:h-8" 
                style={{ color: 'white' }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bebas leading-tight mb-1" style={{ color: '#050505' }}>
                VALIDASI DOJANG
              </h1>
              <p className="text-sm sm:text-base" style={{ color: '#050505', opacity: 0.6 }}>
                Kelola pendaftaran dan data dojang
              </p>
            </div>
          </div>
        </div>

        {/* STATISTICS CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          {/* Total Dojang */}
          <div 
            className="rounded-2xl shadow-md border p-5 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1" 
            style={{ 
              backgroundColor: '#F5FBEF', 
              borderColor: 'rgba(153, 13, 53, 0.1)',
              background: 'linear-gradient(135deg, #F5FBEF 0%, rgba(153, 13, 53, 0.02) 100%)'
            }}
          >
            <div className="flex flex-col gap-3">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                style={{ background: 'linear-gradient(135deg, #990D35 0%, #7A0A2B 100%)' }}
              >
                <Building2 size={24} style={{ color: 'white' }} />
              </div>
              <div>
                <p className="text-2xl font-bold mb-1" style={{ color: '#050505' }}>
                  {dojangs.length}
                </p>
                <p className="text-xs font-medium" style={{ color: '#050505', opacity: 0.6 }}>
                  Total Dojang
                </p>
              </div>
            </div>
          </div>
          
          {/* Total Atlet */}
          <div 
            className="rounded-2xl shadow-md border p-5 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1" 
            style={{ 
              backgroundColor: '#F5FBEF', 
              borderColor: 'rgba(245, 183, 0, 0.2)',
              background: 'linear-gradient(135deg, #F5FBEF 0%, rgba(245, 183, 0, 0.03) 100%)'
            }}
          >
            <div className="flex flex-col gap-3">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                style={{ background: 'linear-gradient(135deg, #F5B700 0%, #D19B00 100%)' }}
              >
                <Users size={24} style={{ color: 'white' }} />
              </div>
              <div>
                <p className="text-2xl font-bold mb-1" style={{ color: '#050505' }}>
                  {totalAtlet}
                </p>
                <p className="text-xs font-medium" style={{ color: '#050505', opacity: 0.6 }}>
                  Total Atlet
                </p>
              </div>
            </div>
          </div>
          
          {/* Rata-rata Atlet */}
          <div 
            className="rounded-2xl shadow-md border p-5 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1" 
            style={{ 
              backgroundColor: '#F5FBEF', 
              borderColor: 'rgba(153, 13, 53, 0.1)',
              background: 'linear-gradient(135deg, #F5FBEF 0%, rgba(153, 13, 53, 0.02) 100%)'
            }}
          >
            <div className="flex flex-col gap-3">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                style={{ background: 'linear-gradient(135deg, #990D35 0%, #7A0A2B 100%)' }}
              >
                <Users size={24} style={{ color: 'white' }} />
              </div>
              <div>
                <p className="text-2xl font-bold mb-1" style={{ color: '#050505' }}>
                  {dojangs.length > 0 ? Math.round(totalAtlet / dojangs.length) : 0}
                </p>
                <p className="text-xs font-medium" style={{ color: '#050505', opacity: 0.6 }}>
                  Rata-rata/Dojang
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SEARCH + FILTER */}
        <div 
          className="rounded-2xl shadow-md border p-6 sm:p-8 mb-8 hover:shadow-lg transition-all duration-300" 
          style={{ 
            backgroundColor: '#F5FBEF', 
            borderColor: 'rgba(153, 13, 53, 0.1)',
            background: 'linear-gradient(135deg, #F5FBEF 0%, rgba(153, 13, 53, 0.01) 100%)'
          }}
        >
          <div className="space-y-5">
            {/* Search */}
            <div className="w-full">
              <div className="relative">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  style={{ color: '#990D35', opacity: 0.5 }}
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Cari nama dojang atau provinsi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border-2 shadow-sm text-sm font-medium focus:outline-none focus:ring-2 transition-all"
                  style={{ 
                    borderColor: 'rgba(153, 13, 53, 0.2)', 
                    backgroundColor: 'white',
                    color: '#050505'
                  }}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 pt-4 border-t" style={{ borderColor: 'rgba(153, 13, 53, 0.1)' }}>
              <p className="text-sm font-medium" style={{ color: '#050505', opacity: 0.6 }}>
                Menampilkan <span className="font-bold" style={{ color: '#990D35' }}>{filteredDojangs.length}</span> dari <span className="font-bold" style={{ color: '#990D35' }}>{dojangs.length}</span> dojang
              </p>
            </div>
          </div>
        </div>

        {/* CONTENT - Dojang Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentDojangs.map((d) => (
            <div
              key={d.id_dojang}
              className="rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
              style={{ 
                backgroundColor: '#F5FBEF', 
                border: '1px solid rgba(153, 13, 53, 0.1)',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              }}
              onClick={() => handleViewDetail(d.id_dojang)}
            >
              {/* Header */}
              <div 
                className="p-5 border-b"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(153, 13, 53, 0.08) 0%, rgba(153, 13, 53, 0.04) 100%)',
                  borderColor: 'rgba(153, 13, 53, 0.1)'
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                      style={{ backgroundColor: '#990D35' }}
                    >
                      <Building2 size={20} style={{ color: 'white' }} />
                    </div>
                    <span 
                      className="px-3 py-1.5 rounded-full text-xs font-bold shadow-sm"
                      style={{ 
                        background: (d.jumlah_atlet || 0) >= 25 
                          ? 'linear-gradient(135deg, #990D35 0%, #990D35 100%)'
                          : 'linear-gradient(135deg, #990D35 0%, #990D35 100%)',
                        color: 'white'
                      }}
                    >
                      {d.jumlah_atlet || 0} Atlet
                    </span>
                  </div>
                </div>
                
                <h3 className="font-bold text-base leading-tight mb-2" style={{ color: '#050505' }}>
                  {d.nama_dojang}
                </h3>
              </div>

              {/* Content */}
              <div className="p-5 space-y-4">
                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-start gap-2">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: 'rgba(153, 13, 53, 0.1)' }}
                    >
                      <MapPin size={16} style={{ color: '#990D35' }} />
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: '#050505', opacity: 0.5 }}>
                        Provinsi
                      </p>
                      <p className="text-sm font-bold" style={{ color: '#050505' }}>
                        {d.provinsi || '-'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: 'rgba(153, 13, 53, 0.1)' }}
                    >
                      <Calendar size={16} style={{ color: '#990D35' }} />
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: '#050505', opacity: 0.5 }}>
                        Terdaftar
                      </p>
                      <p className="text-sm font-bold" style={{ color: '#050505' }}>
                        {formatDate(d.created_at)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(153, 13, 53, 0.04)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold" style={{ color: '#050505' }}>
                      Kapasitas Atlet
                    </span>
                    <span className="text-xs font-medium" style={{ color: '#050505', opacity: 0.6 }}>
                      {d.jumlah_atlet || 0}/200
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-2.5 rounded-full transition-all duration-500"
                      style={{ 
                        background: (d.jumlah_atlet || 0) >= 100
                          ? 'linear-gradient(90deg, #22c55e 0%, #10b981 100%)'
                          : 'linear-gradient(90deg, #F5B700 0%, #F59E0B 100%)',
                        width: `${((d.jumlah_atlet || 0) / 200) * 100}%`
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-5 pt-0 flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetail(d.id_dojang);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold transition-all shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                  style={{ 
                    background: 'linear-gradient(135deg, #990D35 0%, #7A0A2B 100%)',
                    color: 'white'
                  }}
                >
                  <Eye size={18} />
                  <span>Detail</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(d);
                  }}
                  className="px-4 py-3.5 rounded-xl font-bold transition-all shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                  style={{ 
                    background: 'linear-gradient(135deg, #990D35 0%, #7A0A2B 100%)',
                    color: 'white'
                  }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredDojangs.length === 0 && (
          <div className="text-center py-16" style={{ color: '#050505', opacity: 0.4 }}>
            <Building2 size={64} className="mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Tidak ada dojang ditemukan</h3>
            <p className="text-base">
              {dojangs.length === 0 
                ? "Belum ada dojang terdaftar"
                : "Coba ubah kata kunci pencarian"
              }
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl shadow-md border p-6 mt-8" 
            style={{ 
              backgroundColor: '#F5FBEF', 
              borderColor: 'rgba(153, 13, 53, 0.1)',
              background: 'linear-gradient(135deg, #F5FBEF 0%, rgba(153, 13, 53, 0.01) 100%)'
            }}
          >
            <div className="text-sm font-medium" style={{ color: '#050505', opacity: 0.6 }}>
              Menampilkan {startIndex + 1} - {Math.min(endIndex, filteredDojangs.length)} dari {filteredDojangs.length} hasil
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-4 py-2 rounded-xl border-2 font-bold hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                style={{ 
                  borderColor: '#990D35', 
                  backgroundColor: '#F5FBEF', 
                  color: '#050505' 
                }}
              >
                <ChevronLeft size={16} />
                Prev
              </button>

              <div className="flex items-center gap-1">
                {getPageNumbers().map((pageNum, index) => (
                  pageNum === '...' ? (
                    <span key={`ellipsis-${index}`} className="px-3 py-2 text-sm" style={{ color: '#050505', opacity: 0.4 }}>...</span>
                  ) : (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum as number)}
                      className="px-4 py-2 rounded-xl transition-all text-sm font-bold min-w-[40px]"
                      style={{
                        background: currentPage === pageNum 
                          ? 'linear-gradient(135deg, #990D35 0%, #7A0A2B 100%)'
                          : '#F5FBEF',
                        color: currentPage === pageNum ? 'white' : '#050505',
                        border: currentPage === pageNum ? 'none' : '2px solid #990D35'
                      }}
                    >
                      {pageNum}
                    </button>
                  )
                ))}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-4 py-2 rounded-xl border-2 font-bold hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                style={{ 
                  borderColor: '#990D35', 
                  backgroundColor: '#F5FBEF', 
                  color: '#050505' 
                }}
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Enhanced Modal */}
        {showDetailModal && selectedDojang && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetailModal(false)}>
            <div 
              className="rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" 
              style={{ backgroundColor: '#F5FBEF' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div 
                className="sticky top-0 border-b p-6 flex items-center justify-between rounded-t-2xl z-10"
                style={{ 
                  backgroundColor: '#F5FBEF', 
                  borderColor: 'rgba(153, 13, 53, 0.1)',
                  background: 'linear-gradient(135deg, rgba(153, 13, 53, 0.08) 0%, rgba(153, 13, 53, 0.04) 100%)'
                }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                    style={{ background: 'linear-gradient(135deg, #990D35 0%, #7A0A2B 100%)' }}
                  >
                    <Building2 size={24} style={{ color: 'white' }} />
                  </div>
                  <h2 className="text-2xl font-bold" style={{ color: '#050505' }}>Detail Dojang</h2>
                </div>
                <button 
                  onClick={() => setShowDetailModal(false)} 
                  className="w-10 h-10 flex items-center justify-center rounded-xl hover:shadow-md transition-all"
                  style={{ 
                    backgroundColor: 'rgba(153, 13, 53, 0.1)',
                    color: '#990D35'
                  }}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                {(() => {
                  const dojang = dojangs.find(d => d.id_dojang === selectedDojang);
                  if (!dojang) return <p style={{ color: '#050505', opacity: 0.5 }}>Dojang tidak ditemukan</p>;
                  
                  return (
                    <div className="space-y-6">
                      {/* Info Cards Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div 
                          className="p-5 rounded-xl border"
                          style={{ 
                            backgroundColor: 'rgba(153, 13, 53, 0.04)',
                            borderColor: 'rgba(153, 13, 53, 0.1)'
                          }}
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div 
                              className="w-10 h-10 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: '#990D35' }}
                            >
                              <Building2 size={20} style={{ color: 'white' }} />
                            </div>
                            <h3 className="font-bold" style={{ color: '#050505' }}>Informasi Dojang</h3>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span style={{ opacity: 0.6 }}>Nama:</span>
                              <span className="font-semibold">{dojang.nama_dojang}</span>
                            </div>
                            <div className="flex justify-between">
                              <span style={{ opacity: 0.6 }}>Provinsi:</span>
                              <span className="font-semibold">{dojang.provinsi || '-'}</span>
                            </div>
                          </div>
                        </div>

                        <div 
                          className="p-5 rounded-xl border"
                          style={{ 
                            backgroundColor: 'rgba(245, 183, 0, 0.04)',
                            borderColor: 'rgba(245, 183, 0, 0.2)'
                          }}
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div 
                              className="w-10 h-10 rounded-lg flex items-center justify-center"
                              style={{ background: 'linear-gradient(135deg, #F5B700 0%, #D19B00 100%)' }}
                            >
                              <Users size={20} style={{ color: 'white' }} />
                            </div>
                            <h3 className="font-bold" style={{ color: '#050505' }}>Statistik Atlet</h3>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span style={{ opacity: 0.6 }}>Total Atlet:</span>
                              <span className="font-semibold">{dojang.jumlah_atlet || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span style={{ opacity: 0.6 }}>Terdaftar:</span>
                              <span className="font-semibold">{formatDate(dojang.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Raw Data */}
                      <div>
                        <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: '#050505' }}>
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: 'rgba(153, 13, 53, 0.1)' }}
                          >
                            <Eye size={16} style={{ color: '#990D35' }} />
                          </div>
                          Data Lengkap
                        </h3>
                        <pre 
                          className="p-4 rounded-xl overflow-auto text-xs sm:text-sm max-h-64 border" 
                          style={{ 
                            backgroundColor: 'rgba(153, 13, 53, 0.04)', 
                            color: '#050505', 
                            opacity: 0.7,
                            borderColor: 'rgba(153, 13, 53, 0.1)'
                          }}
                        >
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

    {/* Alert Modal for Delete Confirmation */}
    <AlertModal
      isOpen={isAlertOpen}
      onClose={() => setIsAlertOpen(false)}
      onConfirm={handleConfirmDelete}
      message={
        dojangToDelete
          ? `Anda yakin ingin menghapus dojang "${dojangToDelete.nama_dojang}"?`
          : 'Apakah Anda yakin?'
      }
    />
    </div>
  );
};

export default ValidasiDojang;