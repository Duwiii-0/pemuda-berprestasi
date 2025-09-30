import { useState, useEffect } from 'react';
import { Trophy, Search, Eye, Download, CheckCircle, XCircle, Clock, Menu, ChevronLeft, FileText } from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { useKompetisi, type Kompetisi } from '../../context/KompetisiContext';
import NavbarDashboard from '../../components/navbar/navbarDashboard';
import toast from 'react-hot-toast';

interface BuktiTransfer {
  id_bukti_transfer: number;
  id_dojang: number;
  id_pelatih: number;
  bukti_transfer_path: string;
  created_at: string;
  dojang?: {
    nama_dojang: string;
    kota: string;
  };
  pelatih?: {
    nama_pelatih: string;
    no_telp: string;
  };
}

const BuktiTf = () => {
  const { user, token } = useAuth();
  const { kompetisiList, fetchKompetisiList } = useKompetisi();
  
  const [selectedKompetisi, setSelectedKompetisi] = useState<Kompetisi | null>(null);
  const [buktiTransferList, setBuktiTransferList] = useState<BuktiTransfer[]>([]);
  const [filteredBukti, setFilteredBukti] = useState<BuktiTransfer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const API_BASE_URL = 'https://cjvmanagementevent.com';

  useEffect(() => {
    fetchKompetisiList();
  }, []);

  // Fetch bukti transfer berdasarkan kompetisi
  const fetchBuktiTransfer = async (kompetisiId: number) => {
    setLoading(true);
    try {
      // Get all bukti transfer
      const response = await fetch(`${API_BASE_URL}/api/bukti-transfer`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        const buktiList = result.data || [];
        
        // TODO: Filter by kompetisi if needed (depends on your data structure)
        // For now, show all bukti transfer
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

  const handleKompetisiSelect = (kompetisi: Kompetisi) => {
    setSelectedKompetisi(kompetisi);
    fetchBuktiTransfer(kompetisi.id_kompetisi);
  };

  const handleBack = () => {
    setSelectedKompetisi(null);
    setBuktiTransferList([]);
    setFilteredBukti([]);
    setSearchTerm('');
  };

  // Filter berdasarkan search
  useEffect(() => {
    if (searchTerm) {
      const filtered = buktiTransferList.filter(bukti => 
        bukti.dojang?.nama_dojang?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bukti.pelatih?.nama_pelatih?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBukti(filtered);
    } else {
      setFilteredBukti(buktiTransferList);
    }
  }, [searchTerm, buktiTransferList]);

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

  // Jika belum pilih kompetisi, tampilkan list kompetisi
  if (!selectedKompetisi) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-white via-red/5 to-yellow/10">
        <NavbarDashboard />
        <div className="lg:ml-72">
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
              <h1 className="font-bebas text-4xl lg:text-6xl text-black/80 tracking-wider">
                BUKTI TRANSFER
              </h1>
              <p className="font-plex text-black/60 text-lg mt-2">
                Pilih kompetisi untuk melihat bukti transfer dari pelatih
              </p>
            </div>

            {/* Kompetisi List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {kompetisiList.map((kompetisi) => (
                <div
                  key={kompetisi.id_kompetisi}
                  onClick={() => handleKompetisiSelect(kompetisi)}
                  className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-red/20 hover:border-red/40 hover:shadow-xl transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-red/10 rounded-xl">
                      <Trophy size={24} className="text-red" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bebas text-xl text-black/80 mb-2">
                        {kompetisi.nama_event}
                      </h3>
                      <p className="text-sm text-black/60 mb-1">
                        📍 {kompetisi.lokasi}
                      </p>
                      <p className="text-xs text-black/50">
                        {new Date(kompetisi.tanggal_mulai).toLocaleDateString('id-ID')} - 
                        {new Date(kompetisi.tanggal_selesai).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {kompetisiList.length === 0 && (
              <div className="text-center py-12 bg-white/60 backdrop-blur-sm rounded-xl border border-red/20">
                <Trophy className="mx-auto text-red/40 mb-4" size={48} />
                <p className="font-plex text-black/60">Tidak ada kompetisi tersedia</p>
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
  }

  // Jika sudah pilih kompetisi, tampilkan bukti transfer
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-white via-red/5 to-yellow/10">
      <NavbarDashboard />
      <div className="lg:ml-72">
        <div className="px-4 lg:px-8 py-8 pb-16">
          {/* Mobile Menu + Back Button */}
          <div className="flex items-center gap-4 mb-6">
            <div className="lg:hidden">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-3 rounded-xl hover:bg-white/50 transition-all duration-300 border border-red/20"
              >
                <Menu size={24} className="text-red" />
              </button>
            </div>
            
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-red hover:text-red/80 font-plex transition-colors"
            >
              <ChevronLeft size={20} />
              Kembali
            </button>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="font-bebas text-3xl lg:text-5xl text-black/80 tracking-wider">
              BUKTI TRANSFER - {selectedKompetisi.nama_event}
            </h1>
            <p className="font-plex text-black/60 text-lg mt-2">
              Total: {filteredBukti.length} bukti transfer
            </p>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-red/60" size={20} />
              <input
                type="text"
                placeholder="Cari dojang atau pelatih..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-red/20 focus:border-red outline-none bg-white/80 backdrop-blur-sm font-plex"
              />
            </div>
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
                    <h3 className="font-bebas text-lg text-black/80 mb-2">
                      {bukti.dojang?.nama_dojang || 'Dojang Unknown'}
                    </h3>
                    
                    <div className="space-y-1 text-sm text-black/60 mb-4">
                      <p>👤 {bukti.pelatih?.nama_pelatih || '-'}</p>
                      <p>📍 {bukti.dojang?.kota || '-'}</p>
                      <p>📅 {formatDate(bukti.created_at)}</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => window.open(getPreviewUrl(bukti.bukti_transfer_path), '_blank')}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <Eye size={16} />
                        Lihat
                      </button>
                      <button
                        onClick={() => handleDownload(bukti.bukti_transfer_path)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
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
              <p className="font-plex text-black/60">
                {searchTerm 
                  ? 'Tidak ada bukti transfer yang sesuai dengan pencarian'
                  : 'Belum ada bukti transfer untuk kompetisi ini'
                }
              </p>
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