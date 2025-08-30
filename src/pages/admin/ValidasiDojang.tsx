import React, { useState, useEffect } from 'react';
import { Eye, Loader, Building2 } from 'lucide-react';
import { useDojang } from '../../context/dojangContext'; // pastikan context ada
import toast from 'react-hot-toast';

const ValidasiDojang: React.FC = () => {
  const { dojangs, refreshDojang, isLoading } = useDojang(); 
  const [selectedDojang, setSelectedDojang] = useState<number | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Fetch data dojang saat component mount
  useEffect(() => {
  refreshDojang().catch((err: unknown) => toast.error('Gagal memuat data dojang'));
}, []);


  const handleViewDetail = (id: number) => {
    setSelectedDojang(id);
    setShowDetailModal(true);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <Loader className="animate-spin text-blue-600 mx-auto mb-4" size={32} />
        <p className="text-gray-600">Memuat data dojang...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="text-gray-600" size={24} />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Validasi Dojang</h1>
            <p className="text-gray-600">Kelola pendaftaran dojang</p>
          </div>
        </div>
        <button 
          onClick={() => refreshDojang().catch(() => toast.error('Gagal refresh'))}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Loader size={16} />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {dojangs.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-300 mb-4">
              <Building2 size={64} className="mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Tidak ada dojang</h3>
            <p className="text-gray-500 mb-4">Semua dojang telah diproses atau belum ada pendaftaran baru</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Nama Dojang</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Jumlah Atlet</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Provinsi</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Tanggal Daftar</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {dojangs.map((d) => (
                  <tr
                    key={d.id_dojang}
                    className="border-t border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedDojang(d.id_dojang);
                      setShowDetailModal(true);
                    }}
                  >
                    <td className="py-4 px-6 font-medium text-gray-900">{d.nama_dojang}</td>
                    <td className="py-4 px-6 text-gray-600">{d.jumlah_atlet || 0}</td>
                    <td className="py-4 px-6 text-gray-600">{d.provinsi || '-'}</td>
                    <td className="py-4 px-6 text-gray-600">{formatDate(d.created_at)}</td>
                    <td className="py-4 px-6">
                      <button
                        className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                      >
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
