import { useState, useEffect } from 'react';
import { Search, Eye, Download, Menu, FileText, Filter, Users, CheckCircle, Loader, X } from 'lucide-react';
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
    fetchAllPendingPeserta(); // Fetch pending peserta di background
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
        
        // Filter PENDING di frontend (fallback jika backend tidak filter)
        const pendingOnly = allPeserta.filter((peserta: PesertaKompetisi) => {
          return peserta.status === 'PENDING';
        });
        
        console.log('🔍 After frontend filter:', pendingOnly.length, 'PENDING peserta');
        
        // Cek apakah backend sudah filter atau belum
        if (allPeserta.length !== pendingOnly.length) {
          console.warn('⚠️ Backend does NOT support status=PENDING filter!');
          console.warn(`   Received ${allPeserta.length} peserta, but only ${pendingOnly.length} are PENDING`);
          console.warn('   Consider asking backend developer to add status filter support');
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

  // Fetch all pending peserta saat page load (background fetch)
  

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
      
      // Jika cache kosong, fetch dulu
      if (pesertaCache.length === 0) {
        console.log('⚠️ Cache empty, fetching...');
        await fetchAllPendingPeserta();
      }

      console.time('⏱️ Filter Time');
      
      // Filter by dojang ID dari cache (INSTANT!)
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

  // Handle open modal
  const handleOpenPendingModal = (bukti: BuktiTransfer) => {
    setSelectedDojang(bukti);
    setShowPendingModal(true);
    setSelectedPesertas([]);
    fetchPendingPesertaByDojang(bukti.id_dojang);
  };

  // Handle checkbox toggle
  const handleTogglePeserta = (id: number) => {
    setSelectedPesertas(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedPesertas.length === pendingPesertas.length) {
      setSelectedPesertas([]);
    } else {
      setSelectedPesertas(pendingPesertas.map(p => p.id_peserta_kompetisi));
    }
  };

  // Handle approve selected menggunakan context
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

      // Menggunakan updatePesertaStatus dari context
      const promises = selectedPesertas.map(participantId =>
        updatePesertaStatus(kompetisiId, participantId, 'APPROVED')
      );

      await Promise.all(promises);
      
      toast.success(`${selectedPesertas.length} peserta berhasil di-approve`);

      // Clear cache agar data fresh
      setPesertaCache([]);
      console.log('💾 Cache cleared - Will fetch fresh data on next open');
      
      // Refresh list
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

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(bukti => 
        bukti.tb_dojang?.nama_dojang?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bukti.tb_pelatih?.nama_pelatih?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bukti.tb_dojang?.kota?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by dojang
    if (filterDojang !== 'ALL') {
      filtered = filtered.filter(bukti => {
        const dojangId = String(bukti.id_dojang);
        const filterValue = String(filterDojang);
        return dojangId === filterValue;
      });
    }

    setFilteredBukti(filtered);
  }, [searchTerm, filterDojang, buktiTransferList]);

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
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterDojang('ALL');
  };

  const activeFiltersCount = (searchTerm ? 1 : 0) + (filterDojang !== 'ALL' ? 1 : 0);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-white via-red/5 to-yellow/10">
      <NavbarDashboard />
      <div className="2xl:ml-48">
        <div className="px-4 lg:px-8 py-8 pb-16">
          {/* Mobile Menu Button */}
          <div className="lg:hidden mb-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-3 rounded-xl hover:bg-white/50 transition-all duration-300 border border-red/20"
            >
              <Menu size={24} className="text-red" />
            </button>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="font-bebas text-3xl lg:text-5xl text-black/80 tracking-wider">
              BUKTI TRANSFER
            </h1>
            <p className="font-plex text-black/60 text-lg mt-2">
              Total: {filteredBukti.length} dari {buktiTransferList.length} bukti transfer
            </p>
          </div>

          {/* Search and Filter Section */}
          <div className="mb-6 space-y-4">
            {/* Search Bar */}
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-red/60" size={20} />
              <input
                type="text"
                placeholder="Cari dojang, pelatih, atau kota..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-red/20 focus:border-red outline-none bg-white/80 backdrop-blur-sm font-plex"
              />
            </div>

            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-white/80 border-2 border-red/20 rounded-xl hover:bg-white transition-all duration-300 font-plex"
            >
              <Filter size={20} className="text-red" />
              <span className="font-medium text-black/80">
                Filter {activeFiltersCount > 0 && `(${activeFiltersCount})`}
              </span>
            </button>

            {/* Filter Panel */}
            {showFilters && (
              <div className="bg-white/80 backdrop-blur-sm border-2 border-red/20 rounded-xl p-6 space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bebas text-lg text-black/80 tracking-wide">FILTER OPTIONS</h3>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={resetFilters}
                      className="text-sm text-red hover:text-red/80 underline font-plex"
                    >
                      Reset Semua
                    </button>
                  )}
                </div>

                {/* Dojang Filter */}
                <div>
                  <label className="block text-sm font-medium text-black/70 mb-2 font-plex">
                    Filter by Dojang
                  </label>
                  <select
                    value={filterDojang}
                    onChange={(e) => setFilterDojang(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-red/20 rounded-lg focus:border-red outline-none bg-white/80 font-plex"
                  >
                    <option value="ALL">Semua Dojang</option>
                    {uniqueDojang.map((dojang: any) => (
                      <option key={dojang.id_dojang} value={String(dojang.id_dojang)}>
                        {dojang?.nama_dojang} {dojang?.kota && `- ${dojang.kota}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Active Filters Display */}
                {activeFiltersCount > 0 && (
                  <div className="pt-4 border-t border-red/10">
                    <p className="text-sm text-black/60 mb-2 font-plex">Filter Aktif:</p>
                    <div className="flex flex-wrap gap-2">
                      {searchTerm && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-red/10 text-red rounded-full text-sm font-plex">
                          Search: "{searchTerm}"
                          <button
                            onClick={() => setSearchTerm('')}
                            className="hover:text-red/80 font-bold"
                          >
                            ×
                          </button>
                        </span>
                      )}
                      {filterDojang !== 'ALL' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-red/10 text-red rounded-full text-sm font-plex">
                          Dojang: {uniqueDojang.find((d: any) => String(d.id_dojang) === filterDojang)?.nama_dojang}
                          <button
                            onClick={() => setFilterDojang('ALL')}
                            className="hover:text-red/80 font-bold"
                          >
                            ×
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <p className="font-plex text-lg text-black/60">Loading...</p>
            </div>
          )}

          {/* Bukti Transfer List */}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBukti.map((bukti) => (
                <div
                  key={bukti.id_bukti_transfer}
                  className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-red/20 overflow-hidden hover:shadow-xl transition-all duration-300"
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

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-bebas text-2xl text-black/80 mb-2">
                      {bukti.tb_dojang?.nama_dojang || 'Dojang Unknown'}
                    </h3>
                    
                    <div className="space-y-1 text-sm text-black/60 mb-4 font-plex">
                      <p>👤 {bukti.tb_pelatih?.nama_pelatih || '-'}</p>
                      <p>📍 {bukti.tb_dojang?.kota || '-'}</p>
                      <p>📅 {formatDate(bukti.created_at)}</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => window.open(getPreviewUrl(bukti.bukti_transfer_path), '_blank')}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-plex"
                        >
                          <Eye size={16} />
                          Lihat
                        </button>
                        <button
                          onClick={() => handleDownload(bukti.bukti_transfer_path)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-plex"
                        >
                          <Download size={16} />
                          Download
                        </button>
                      </div>
                      
                      {/* New Button: View Pending Peserta */}
                      <button
                        onClick={() => handleOpenPendingModal(bukti)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-plex"
                      >
                        <Users size={16} />
                        Lihat Peserta Pending
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredBukti.length === 0 && (
            <div className="text-center py-12 bg-white/60 backdrop-blur-sm rounded-xl border border-red/20">
              <FileText className="mx-auto text-red/40 mb-4" size={48} />
              <p className="font-plex text-black/60 mb-2">
                {searchTerm || filterDojang !== 'ALL'
                  ? 'Tidak ada bukti transfer yang sesuai dengan filter'
                  : 'Belum ada bukti transfer untuk kompetisi ini'
                }
              </p>
              {(searchTerm || filterDojang !== 'ALL') && (
                <button
                  onClick={resetFilters}
                  className="mt-4 px-4 py-2 bg-red text-white rounded-lg hover:bg-red/80 transition-colors font-plex"
                >
                  Reset Filter
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pending Peserta Modal */}
      {showPendingModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-red/20">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-bebas text-2xl text-black/80 tracking-wide">
                    PESERTA PENDING - {selectedDojang?.tb_dojang?.nama_dojang}
                  </h2>
                  <p className="font-plex text-sm text-black/60 mt-1">
                    {selectedDojang?.tb_dojang?.kota}
                  </p>
                </div>
                <button
                  onClick={() => setShowPendingModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} className="text-black/60" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingPeserta ? (
                <div className="text-center py-12">
                  <Loader className="animate-spin mx-auto text-red mb-2" size={32} />
                  <p className="font-plex text-black/60">Loading peserta...</p>
                </div>
              ) : pendingPesertas.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="mx-auto text-red/40 mb-4" size={48} />
                  <p className="font-plex text-black/60">
                    Tidak ada peserta pending untuk dojang ini
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Select All */}
                  <div className="flex items-center gap-3 p-4 bg-red/5 rounded-lg border border-red/20">
                    <input
                      type="checkbox"
                      checked={selectedPesertas.length === pendingPesertas.length && pendingPesertas.length > 0}
                      onChange={handleSelectAll}
                      className="w-5 h-5 text-red focus:ring-red rounded"
                    />
                    <span className="font-plex font-medium text-black/80">
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
                        className={`p-4 rounded-lg border-2 transition-all ${
                          selectedPesertas.includes(peserta.id_peserta_kompetisi)
                            ? 'border-red bg-red/5'
                            : 'border-gray-200 hover:border-red/40'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selectedPesertas.includes(peserta.id_peserta_kompetisi)}
                            onChange={() => handleTogglePeserta(peserta.id_peserta_kompetisi)}
                            className="w-5 h-5 text-red focus:ring-red rounded mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-plex font-semibold text-black/80">
                                {namaPeserta}
                              </h4>
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-plex font-medium rounded">
                                {peserta.status}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs font-plex text-black/60">
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                {kategori}
                              </span>
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                                {level}
                              </span>
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                                {kelompok}
                              </span>
                              {peserta.is_team && (
                                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded">
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
              <div className="p-6 border-t border-red/20 bg-gray-50">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-plex text-sm text-black/60">
                    {selectedPesertas.length} peserta dipilih
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowPendingModal(false)}
                      className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-plex"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleApproveSelected}
                      disabled={selectedPesertas.length === 0 || processing}
                      className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-plex flex items-center gap-2"
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