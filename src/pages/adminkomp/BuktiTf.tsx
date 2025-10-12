import { useState, useEffect } from 'react';
import { Search, Eye, Download, Menu, FileText, Filter } from 'lucide-react';
import { useAuth } from '../../context/authContext';
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
  
  const [buktiTransferList, setBuktiTransferList] = useState<BuktiTransfer[]>([]);
  const [filteredBukti, setFilteredBukti] = useState<BuktiTransfer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDojang, setFilterDojang] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const API_BASE_URL = 'https://cjvmanagementevent.com';

  // Fetch bukti transfer saat component mount
  useEffect(() => {
    fetchBuktiTransfer();
  }, []);

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

  // Get unique dojang list for filter dropdown
  const uniqueDojang = Array.from(
    new Map(
      buktiTransferList
        .filter(bukti => bukti.tb_dojang?.nama_dojang)
        .map(bukti => [bukti.id_dojang, { id_dojang: bukti.id_dojang, ...bukti.tb_dojang }])
    ).values()
  );

  // Debug: Log data untuk cek struktur
  useEffect(() => {
    if (buktiTransferList.length > 0) {
      console.log('🔍 Debug - Sample bukti:', buktiTransferList[0]);
      console.log('🔍 Debug - id_dojang type:', typeof buktiTransferList[0].id_dojang);
      console.log('🔍 Debug - Unique dojang:', uniqueDojang);
    }
  }, [buktiTransferList]);

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
      console.log('🔍 Filtering by dojang:', filterDojang);
      filtered = filtered.filter(bukti => {
        const dojangId = String(bukti.id_dojang);
        const filterValue = String(filterDojang);
        console.log('🔍 Comparing:', dojangId, '===', filterValue, '?', dojangId === filterValue);
        return dojangId === filterValue;
      });
      console.log('🔍 Filtered result count:', filtered.length);
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
                          Dojang: {uniqueDojang.find((d: any) => d.id_dojang?.toString() === filterDojang)?.nama_dojang}
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