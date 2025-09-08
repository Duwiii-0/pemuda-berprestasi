import React, { useState, useEffect } from 'react';
import { Eye, Loader, Building2, Search } from 'lucide-react';
import { useDojang } from '../../context/dojangContext'; // pastikan context ada
import toast from 'react-hot-toast';

const ValidasiDojang: React.FC = () => {
  const { dojangs, refreshDojang, isLoading } = useDojang(); 
  const [selectedDojang, setSelectedDojang] = useState<number | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <Loader className="animate-spin text-blue-600 mx-auto mb-4" size={32} />
        <p className="text-gray-600">Memuat data dojang...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-full mx-auto space-y-10 px-48">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Building2 className="text-blue-500" size={60} />
          <div>
            <h1 className="text-7xl font-bebas text-black/90">Validasi Dojang</h1>
            <p className="text-black/60 text-xl mt-1">Kelola pendaftaran dojang</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
        <input
          type="text"
          placeholder="Cari dojang..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-4 rounded-3xl border border-gray-200 shadow-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-lg transition placeholder-gray-400"
        />
      </div>

      {/* Table */}
      <div className="bg-white/90 backdrop-blur-md border border-white/40 rounded-2xl shadow-lg overflow-hidden">
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
            <table className="w-full border-collapse text-left text-lg">
              <thead className="bg-yellow">
                <tr>
                  <th className="py-5 px-6 font-semibold text-black/80">Nama Dojang</th>
                  <th className="py-5 px-6 font-semibold text-black/80 text-center">Jumlah Atlet</th>
                  <th className="py-5 px-6 font-semibold text-black/80 text-center">Provinsi</th>
                  <th className="py-5 px-6 font-semibold text-black/80 text-center">Tanggal Daftar</th>
                  <th className="py-5 px-6 font-semibold text-black/80 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredDojangs.map((d) => (
                  <tr
                    key={d.id_dojang}
                    className="border-t border-gray-200 hover:bg-yellow/10 transition-colors cursor-pointer"
                    onClick={() => handleViewDetail(d.id_dojang)}
                  >
                    <td className="py-4 px-6 font-medium text-black/90">{d.nama_dojang}</td>
                    <td className="py-4 px-6 text-center text-black/70">{d.jumlah_atlet || 0}</td>
                    <td className="py-4 px-6 text-center text-black/70">{d.provinsi || '-'}</td>
                    <td className="py-4 px-6 text-center text-black/70">{formatDate(d.created_at)}</td>
                    <td className="py-4 px-6 flex justify-center">
                      <button
                        className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors flex items-center gap-2 justify-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          toast.success(`Hapus dojang ${d.nama_dojang}`);
                        }}
                      >
                        <Eye size={16} />
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal detail sederhana */}
      {showDetailModal && selectedDojang && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Detail Dojang</h2>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            <pre>{JSON.stringify(dojangs.find(d => d.id_dojang === selectedDojang), null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidasiDojang;
