import { useState, useEffect } from 'react';
import { Search, Eye, Download, Menu, FileText, Filter, Users, CheckCircle, Loader, X, Image as ImageIcon, Calendar, Phone, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { useKompetisi } from '../../context/KompetisiContext';
import type { PesertaKompetisi } from '../../context/KompetisiContext';
import NavbarDashboard from '../../components/navbar/navbarDashboard';
import toast from 'react-hot-toast';

interface BuktiTransfer {
  id_bukti_transfer: number;
  id_dojang: number;
  id_pelatih: number;
  bukti_transfer_path: string;
  created_at: string;
  tb_dojang?: {
    nama_dojang: string;
    kota: string;
  };
  tb_pelatih?: {
    nama_pelatih: string;
    no_telp: string;
  };
}

const BuktiTf = () => {
  const { user, token } = useAuth();
  const { updatePesertaStatus } = useKompetisi();
  
  const [buktiTransferList, setBuktiTransferList] = useState<BuktiTransfer[]>([]);
  const [filteredBukti, setFilteredBukti] = useState<BuktiTransfer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDojang, setFilterDojang] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Cache untuk peserta (agar tidak fetch ulang)
  const [pesertaCache, setPesertaCache] = useState<PesertaKompetisi[]>([]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9);
  
  // Modal states
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [selectedDojang, setSelectedDojang] = useState<BuktiTransfer | null>(null);
  const [pendingPesertas, setPendingPesertas] = useState<PesertaKompetisi[]>([]);
  const [loadingPeserta, setLoadingPeserta] = useState(false);
  const [selectedPesertas, setSelectedPesertas] = useState<number[]>([]);
  const [processing, setProcessing] = useState(false);

  const API_BASE_URL = 'https://cjvmanagementevent.com';

  // Fetch bukti transfer dan peserta pending saat component mount
  useEffect(() => {
    fetchBuktiTransfer();
    fetchAllPendingPeserta();
  }, []);

  // Fetch all pending peserta saat page load (background fetch)
  const fetchAllPendingPeserta = async () => {
    try {
      const kompetisiId = user?.admin_kompetisi?.id_kompetisi;
      
      if (!kompetisiId) {
        console.log('⚠️ No kompetisi ID found');
        return;
      }

      console.log('🚀 Background fetch - Loading all pending peserta...');
      const url = `${API_BASE_URL}/api/kompetisi/${kompetisiId}/atlet?limit=1000&status=PENDING`;
      console.time('⏱️ Background Fetch Time');

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.timeEnd('⏱️ Background Fetch Time');

      if (response.ok) {
        const result = await response.json();
        const allPeserta = Array.isArray(result) ? result : (result.data || []);
        
        console.log('📥 Received', allPeserta.length, 'peserta from API');
        
        const pendingOnly = allPeserta.filter((peserta: PesertaKompetisi) => {
          return peserta.status === 'PENDING';
        });
        
        console.log('🔍 After frontend filter:', pendingOnly.length, 'PENDING peserta');
        
        if (allPeserta.length !== pendingOnly.length) {
          console.warn('⚠️ Backend does NOT support status=PENDING filter!');
          console.warn(`   Received ${allPeserta.length} peserta, but only ${pendingOnly.length} are PENDING`);
        } else {
          console.log('✅ Backend supports status filter');
        }
        
        setPesertaCache(pendingOnly);
        console.log('✅ Cached', pendingOnly.length, 'PENDING peserta');
      } else {
        console.error('❌ Background fetch failed:', response.status);
      }
    } catch (error) {
      console.error('❌ Background fetch error:', error);
    }
  };

  const fetchBuktiTransfer = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/bukti-transfer/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('📋 Bukti Transfer Response:', result);
        const buktiList = result.data || [];
        
        if (buktiList.length > 0) {
          console.log('📋 Sample bukti transfer:', buktiList[0]);
        }
        
        setBuktiTransferList(buktiList);
        setFilteredBukti(buktiList);
      }
    } catch (error) {
      console.error('Error fetching bukti transfer:', error);
      toast.error('Gagal mengambil data bukti transfer');
    } finally {
      setLoading(false);
    }
  };

  // Fetch peserta pending by dojang - INSTANT karena data sudah di-cache
  const fetchPendingPesertaByDojang = async (dojangId: number) => {
    setLoadingPeserta(true);
    try {
      console.log('🔍 Filtering peserta for Dojang ID:', dojangId);
      
      if (pesertaCache.length === 0) {
        console.log('⚠️ Cache empty, fetching...');
        await fetchAllPendingPeserta();
      }

      console.time('⏱️ Filter Time');
      
      const filteredPeserta = pesertaCache.filter((peserta: PesertaKompetisi) => {
        const pesertaDojangId = peserta.is_team
          ? peserta.anggota_tim?.[0]?.atlet?.dojang?.id_dojang
          : peserta.atlet?.dojang?.id_dojang;
        
        return pesertaDojangId === dojangId;
      });

      console.timeEnd('⏱️ Filter Time');
      console.log('✅ Found', filteredPeserta.length, 'peserta for dojang', dojangId);
      
      setPendingPesertas(filteredPeserta);
    } catch (error) {
      console.error('❌ Error:', error);
      toast.error('Gagal mengambil data peserta pending');
      setPendingPesertas([]);
    } finally {
      setLoadingPeserta(false);
    }
  };

  const handleOpenPendingModal = (bukti: BuktiTransfer) => {
    setSelectedDojang(bukti);
    setShowPendingModal(true);
    setSelectedPesertas([]);
    fetchPendingPesertaByDojang(bukti.id_dojang);
  };

  const handleTogglePeserta = (id: number) => {
    setSelectedPesertas(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedPesertas.length === pendingPesertas.length) {
      setSelectedPesertas([]);
    } else {
      setSelectedPesertas(pendingPesertas.map(p => p.id_peserta_kompetisi));
    }
  };

  const handleApproveSelected = async () => {
    if (selectedPesertas.length === 0) {
      toast.error('Pilih minimal satu peserta');
      return;
    }

    setProcessing(true);
    try {
      const kompetisiId = user?.admin_kompetisi?.id_kompetisi;
      if (!kompetisiId) {
        toast.error('ID Kompetisi tidak ditemukan');
        return;
      }

      const promises = selectedPesertas.map(participantId =>
        updatePesertaStatus(kompetisiId, participantId, 'APPROVED')
      );

      await Promise.all(promises);
      
      toast.success(`${selectedPesertas.length} peserta berhasil di-approve`);

      setPesertaCache([]);
      console.log('💾 Cache cleared - Will fetch fresh data on next open');
      
      fetchAllPendingPeserta();

      await fetchPendingPesertaByDojang(selectedDojang!.id_dojang);
      setSelectedPesertas([]);
      
      setShowPendingModal(false);

    } catch (error) {
      console.error('Error approving peserta:', error);
      toast.error('Gagal approve peserta');
    } finally {
      setProcessing(false);
    }
  };

  // Get unique dojang list for filter dropdown
  const uniqueDojang = Array.from(
    new Map(
      buktiTransferList
        .filter(bukti => bukti.tb_dojang?.nama_dojang)
        .map(bukti => [bukti.id_dojang, { id_dojang: bukti.id_dojang, ...bukti.tb_dojang }])
    ).values()
  );

  // Filter berdasarkan search dan dojang
  useEffect(() => {
    let filtered = buktiTransferList;

    if (searchTerm) {
      filtered = filtered.filter(bukti => 
        bukti.tb_dojang?.nama_dojang?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bukti.tb_pelatih?.nama_pelatih?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bukti.tb_dojang?.kota?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterDojang !== 'ALL') {
      filtered = filtered.filter(bukti => {
        const dojangId = String(bukti.id_dojang);
        const filterValue = String(filterDojang);
        return dojangId === filterValue;
      });
    }

    setFilteredBukti(filtered);
    setCurrentPage(1);
  }, [searchTerm, filterDojang, buktiTransferList]);

  // Pagination
  const totalPages = Math.ceil(filteredBukti.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBukti = filteredBukti.slice(startIndex, endIndex);

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

  const getPreviewUrl = (filename: string) => {
    return `${API_BASE_URL}/uploads/pelatih/BuktiTf/${filename}`;
  };

  const handleDownload = (filename: string) => {
    const downloadUrl = `${API_BASE_URL}/uploads/pelatih/BuktiTf/${filename}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterDojang('ALL');
  };

  const activeFiltersCount = (searchTerm ? 1 : 0) + (filterDojang !== 'ALL' ? 1 : 0);

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: '#F5FBEF' }}>
      <NavbarDashboard />
      <div className="2xl:ml-48">
        <div className="px-4 lg:px-8 py-8 pb-16">
          {/* Mobile Menu Button */}
          <div className="lg:hidden mb-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-3 rounded-xl hover:shadow-md transition-all duration-300 border"
              style={{ borderColor: 'rgba(153, 13, 53, 0.2)', backgroundColor: '#F5FBEF' }}
            >
              <Menu size={24} style={{ color: '#990D35' }} />
            </button>
          </div>

          {/* HEADER */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              <div 
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shadow-lg"
                style={{ 
                  background: 'linear-gradient(135deg, #990D35 0%, #7A0A2B 100%)'
                }}
              >
                <ImageIcon 
                  size={32} 
                  className="sm:w-8 sm:h-8" 
                  style={{ color: 'white' }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bebas leading-tight mb-1" style={{ color: '#050505' }}>
                  BUKTI TRANSFER
                </h1>
                <p className="text-sm sm:text-base" style={{ color: '#050505', opacity: 0.6 }}>
                  Kelola dan verifikasi bukti pembayaran
                </p>
              </div>
            </div>
          </div>

          {/* STATISTICS CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
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
                  <ImageIcon size={24} style={{ color: 'white' }} />
                </div>
                <div>
                  <p className="text-2xl font-bold mb-1" style={{ color: '#050505' }}>
                    {buktiTransferList.length}
                  </p>
                  <p className="text-xs font-medium" style={{ color: '#050505', opacity: 0.6 }}>
                    Total Bukti
                  </p>
                </div>
              </div>
            </div>
            
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
                    {uniqueDojang.length}
                  </p>
                  <p className="text-xs font-medium" style={{ color: '#050505', opacity: 0.6 }}>
                    Total Dojang
                  </p>
                </div>
              </div>
            </div>
            
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
                  <CheckCircle size={24} style={{ color: 'white' }} />
                </div>
                <div>
                  <p className="text-2xl font-bold mb-1" style={{ color: '#050505' }}>
                    {filteredBukti.length}
                  </p>
                  <p className="text-xs font-medium" style={{ color: '#050505', opacity: 0.6 }}>
                    Filtered
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
              <div className="w-full">
                <div className="relative">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2"
                    style={{ color: '#990D35', opacity: 0.5 }}
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Cari dojang, pelatih, atau kota..."
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

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-bold hover:shadow-md transition-all"
                style={{ 
                  borderColor: '#990D35', 
                  backgroundColor: '#F5FBEF', 
                  color: '#050505' 
                }}
              >
                <Filter size={20} style={{ color: '#990D35' }} />
                <span>Filter {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
              </button>

              {showFilters && (
                <div className="rounded-xl border p-6 space-y-4" style={{ backgroundColor: 'rgba(153, 13, 53, 0.04)', borderColor: 'rgba(153, 13, 53, 0.1)' }}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg" style={{ color: '#050505' }}>FILTER OPTIONS</h3>
                    {activeFiltersCount > 0 && (
                      <button
                        onClick={resetFilters}
                        className="text-sm font-medium underline"
                        style={{ color: '#990D35' }}
                      >
                        Reset Semua
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#050505', opacity: 0.7 }}>
                      Filter by Dojang
                    </label>
                    <select
                      value={filterDojang}
                      onChange={(e) => setFilterDojang(e.target.value)}
                      className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none text-sm font-medium"
                      style={{ 
                        borderColor: 'rgba(153, 13, 53, 0.2)', 
                        backgroundColor: 'white',
                        color: '#050505'
                      }}
                    >
                      <option value="ALL">Semua Dojang</option>
                      {uniqueDojang.map((dojang: any) => (
                        <option key={dojang.id_dojang} value={String(dojang.id_dojang)}>
                          {dojang?.nama_dojang} {dojang?.kota && `- ${dojang.kota}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {activeFiltersCount > 0 && (
                    <div className="pt-4 border-t" style={{ borderColor: 'rgba(153, 13, 53, 0.1)' }}>
                      <p className="text-sm mb-2" style={{ color: '#050505', opacity: 0.6 }}>Filter Aktif:</p>
                      <div className="flex flex-wrap gap-2">
                        {searchTerm && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: 'rgba(153, 13, 53, 0.1)', color: '#990D35' }}>
                            Search: "{searchTerm}"
                            <button onClick={() => setSearchTerm('')} className="font-bold">×</button>
                          </span>
                        )}
                        {filterDojang !== 'ALL' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: 'rgba(153, 13, 53, 0.1)', color: '#990D35' }}>
                            Dojang: {uniqueDojang.find((d: any) => String(d.id_dojang) === filterDojang)?.nama_dojang}
                            <button onClick={() => setFilterDojang('ALL')} className="font-bold">×</button>
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t" style={{ borderColor: 'rgba(153, 13, 53, 0.1)' }}>
                <p className="text-sm font-medium" style={{ color: '#050505', opacity: 0.6 }}>
                  Menampilkan <span className="font-bold" style={{ color: '#990D35' }}>{filteredBukti.length}</span> dari <span className="font-bold" style={{ color: '#990D35' }}>{buktiTransferList.length}</span> bukti transfer
                </p>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <Loader className="animate-spin mx-auto mb-2" size={32} style={{ color: '#990D35' }} />
              <p className="font-medium" style={{ color: '#050505', opacity: 0.6 }}>Loading...</p>
            </div>
          )}

          {/* Bukti Transfer Cards */}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentBukti.map((bukti) => (
                <div
                  key={bukti.id_bukti_transfer}
                  className="rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                  style={{ 
                    backgroundColor: '#F5FBEF', 
                    border: '1px solid rgba(153, 13, 53, 0.1)',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }}
                >
                  {/* Image Preview */}
                  <div className="relative h-48 bg-gray-100">
                    <img
                      src={getPreviewUrl(bukti.bukti_transfer_path)}
                      alt="Bukti Transfer"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=No+Image';
                      }}
                    />
                  </div>

                  {/* Header */}
                  <div 
                    className="p-5 border-b"
                    style={{ 
                      background: 'linear-gradient(135deg, rgba(153, 13, 53, 0.08) 0%, rgba(153, 13, 53, 0.04) 100%)',
                      borderColor: 'rgba(153, 13, 53, 0.1)'
                    }}
                  >
                    <h3 className="font-bold text-lg mb-2" style={{ color: '#050505' }}>
                      {bukti.tb_dojang?.nama_dojang || 'Dojang Unknown'}
                    </h3>
                  </div>

                  {/* Content */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'rgba(153, 13, 53, 0.1)' }}
                      >
                        <Users size={16} style={{ color: '#990D35' }} />
                      </div>
                      <span className="font-medium" style={{ color: '#050505' }}>
                        {bukti.tb_pelatih?.nama_pelatih || '-'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'rgba(153, 13, 53, 0.1)' }}
                      >
                        <MapPin size={16} style={{ color: '#990D35' }} />
                      </div>
                      <span className="font-medium" style={{ color: '#050505' }}>
                        {bukti.tb_dojang?.kota || '-'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'rgba(153, 13, 53, 0.1)' }}
                      >
                        <Calendar size={16} style={{ color: '#990D35' }} />
                      </div>
                      <span className="font-medium" style={{ color: '#050505' }}>
                        {formatDate(bukti.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-5 pt-0 space-y-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => window.open(getPreviewUrl(bukti.bukti_transfer_path), '_blank')}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold transition-all shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                        style={{ 
                          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                          color: 'white'
                        }}
                      >
                        <Eye size={16} />
                        <span className="text-sm">Lihat</span>
                      </button>
                      <button
                        onClick={() => handleDownload(bukti.bukti_transfer_path)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold transition-all shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                        style={{ 
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: 'white'
                        }}
                      >
                        <Download size={16} />
                        <span className="text-sm">Download</span>
                      </button>
                    </div>
                    
                    <button
                      onClick={() => handleOpenPendingModal(bukti)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold transition-all shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                      style={{ 
                        background: 'linear-gradient(135deg, #990D35 0%, #7A0A2B 100%)',
                        color: 'white'
                      }}
                    >
                      <Users size={16} />
                      <span className="text-sm">Lihat Peserta Pending</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredBukti.length === 0 && (
            <div className="text-center py-16" style={{ color: '#050505', opacity: 0.4 }}>
              <FileText size={64} className="mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Tidak ada bukti transfer ditemukan</h3>
              <p className="text-base mb-4">
                {searchTerm || filterDojang !== 'ALL'
                  ? 'Coba ubah kata kunci pencarian'
                  : 'Belum ada bukti transfer untuk kompetisi ini'
                }
              </p>
              {(searchTerm || filterDojang !== 'ALL') && (
                <button
                  onClick={resetFilters}
                  className="px-6 py-2 rounded-xl font-bold hover:shadow-md transition-all"
                  style={{ 
                    background: 'linear-gradient(135deg, #990D35 0%, #7A0A2B 100%)',
                    color: 'white'
                  }}
                >
                  Reset Filter
                </button>
              )}
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
                Menampilkan {startIndex + 1} - {Math.min(endIndex, filteredBukti.length)} dari {filteredBukti.length} hasil
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
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
                        onClick={() => setCurrentPage(pageNum as number)}
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
                  onClick={() => setCurrentPage(currentPage + 1)}
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

          {/* Pending Peserta Modal */}
          {showPendingModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowPendingModal(false)}>
              <div 
                className="rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl" 
                style={{ backgroundColor: '#F5FBEF' }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div 
                  className="p-6 border-b flex items-center justify-between"
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
                      <Users size={24} style={{ color: 'white' }} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold" style={{ color: '#050505' }}>
                        PESERTA PENDING
                      </h2>
                      <p className="text-sm" style={{ color: '#050505', opacity: 0.6 }}>
                        {selectedDojang?.tb_dojang?.nama_dojang} - {selectedDojang?.tb_dojang?.kota}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPendingModal(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl hover:shadow-md transition-all"
                    style={{ 
                      backgroundColor: 'rgba(153, 13, 53, 0.1)',
                      color: '#990D35'
                    }}
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {loadingPeserta ? (
                    <div className="text-center py-12">
                      <Loader className="animate-spin mx-auto mb-2" size={32} style={{ color: '#990D35' }} />
                      <p className="font-medium" style={{ color: '#050505', opacity: 0.6 }}>Loading peserta...</p>
                    </div>
                  ) : pendingPesertas.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="mx-auto mb-4" size={48} style={{ color: '#990D35', opacity: 0.4 }} />
                      <p className="font-medium" style={{ color: '#050505', opacity: 0.6 }}>
                        Tidak ada peserta pending untuk dojang ini
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Select All */}
                      <div 
                        className="flex items-center gap-3 p-4 rounded-lg border"
                        style={{ backgroundColor: 'rgba(153, 13, 53, 0.05)', borderColor: 'rgba(153, 13, 53, 0.2)' }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedPesertas.length === pendingPesertas.length && pendingPesertas.length > 0}
                          onChange={handleSelectAll}
                          className="w-5 h-5 rounded"
                          style={{ accentColor: '#990D35' }}
                        />
                        <span className="font-bold" style={{ color: '#050505' }}>
                          Pilih Semua ({pendingPesertas.length} peserta)
                        </span>
                      </div>

                      {/* Peserta List */}
                      {pendingPesertas.map((peserta) => {
                        const namaPeserta = peserta.is_team
                          ? peserta.anggota_tim?.map(a => a.atlet.nama_atlet).join(', ')
                          : peserta.atlet?.nama_atlet || '-';
                        
                        const kategori = peserta.kelas_kejuaraan?.cabang || '-';
                        const level = peserta.kelas_kejuaraan?.kategori_event?.nama_kategori || '-';
                        const kelompok = peserta.kelas_kejuaraan?.kelompok?.nama_kelompok || '-';

                        return (
                          <div
                            key={peserta.id_peserta_kompetisi}
                            className="p-4 rounded-lg border-2 transition-all"
                            style={{
                              borderColor: selectedPesertas.includes(peserta.id_peserta_kompetisi)
                                ? '#990D35'
                                : 'rgba(153, 13, 53, 0.2)',
                              backgroundColor: selectedPesertas.includes(peserta.id_peserta_kompetisi)
                                ? 'rgba(153, 13, 53, 0.05)'
                                : '#F5FBEF'
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={selectedPesertas.includes(peserta.id_peserta_kompetisi)}
                                onChange={() => handleTogglePeserta(peserta.id_peserta_kompetisi)}
                                className="w-5 h-5 rounded mt-1"
                                style={{ accentColor: '#990D35' }}
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-bold" style={{ color: '#050505' }}>
                                    {namaPeserta}
                                  </h4>
                                  <span 
                                    className="px-2 py-1 text-xs font-bold rounded"
                                    style={{ background: 'linear-gradient(135deg, #F5B700 0%, #D19B00 100%)', color: 'white' }}
                                  >
                                    {peserta.status}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs font-medium">
                                  <span 
                                    className="px-2 py-1 rounded"
                                    style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}
                                  >
                                    {kategori}
                                  </span>
                                  <span 
                                    className="px-2 py-1 rounded"
                                    style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}
                                  >
                                    {level}
                                  </span>
                                  <span 
                                    className="px-2 py-1 rounded"
                                    style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}
                                  >
                                    {kelompok}
                                  </span>
                                  {peserta.is_team && (
                                    <span 
                                      className="px-2 py-1 rounded"
                                      style={{ backgroundColor: 'rgba(249, 115, 22, 0.1)', color: '#f97316' }}
                                    >
                                      Team
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                {pendingPesertas.length > 0 && (
                  <div 
                    className="p-6 border-t"
                    style={{ backgroundColor: 'rgba(153, 13, 53, 0.04)', borderColor: 'rgba(153, 13, 53, 0.1)' }}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-medium" style={{ color: '#050505', opacity: 0.6 }}>
                        {selectedPesertas.length} peserta dipilih
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowPendingModal(false)}
                          className="px-6 py-2 border-2 rounded-lg font-bold hover:shadow-md transition-all"
                          style={{ 
                            borderColor: 'rgba(153, 13, 53, 0.3)', 
                            color: '#050505',
                            backgroundColor: '#F5FBEF'
                          }}
                        >
                          Batal
                        </button>
                        <button
                          onClick={handleApproveSelected}
                          disabled={selectedPesertas.length === 0 || processing}
                          className="px-6 py-2 rounded-lg font-bold hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                          style={{ 
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white'
                          }}
                        >
                          {processing ? (
                            <>
                              <Loader size={16} className="animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <CheckCircle size={16} />
                              Approve ({selectedPesertas.length})
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
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

export default BuktiTf;