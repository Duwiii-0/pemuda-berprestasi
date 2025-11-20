import React, { useState, useEffect } from 'react';
import { X, Loader, Edit, AlertTriangle } from 'lucide-react';
import { apiClient } from '../config/api';
import toast from 'react-hot-toast';

interface EditRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant: any;
  kompetisiId: number;
  onSuccess: () => void;
}

const EditRegistrationModal: React.FC<EditRegistrationModalProps> = ({
  isOpen,
  onClose,
  participant,
  kompetisiId,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    kelasKejuaraanId: '',
    currentClassName: '',
    status: ''
  });

  // Fetch available classes saat modal dibuka
  useEffect(() => {
    if (isOpen && participant) {
      initializeModal();
    }
  }, [isOpen, participant]);

  const initializeModal = async () => {
    if (!participant) return;

    // Format current class name
    const currentKelas = participant.kelas_kejuaraan;
    let currentClassName = '';
    
    if (currentKelas) {
      currentClassName += currentKelas.cabang;
      currentClassName += ` - ${currentKelas.kategori_event?.nama_kategori}`;
      if (currentKelas.kelompok) {
        currentClassName += ` - ${currentKelas.kelompok.nama_kelompok}`;
      }
      if (currentKelas.kelas_berat) {
        currentClassName += ` - ${currentKelas.kelas_berat.nama_kelas}`;
      }
      if (currentKelas.poomsae) {
        currentClassName += ` - ${currentKelas.poomsae.nama_kelas}`;
      }
    }
    
    setFormData({
      kelasKejuaraanId: currentKelas?.id_kelas_kejuaraan?.toString() || '',
      currentClassName: currentClassName,
      status: participant.status || 'PENDING'
    });
    
    // Fetch available classes
    await fetchAvailableClasses();
  };

  const fetchAvailableClasses = async () => {
    setLoadingClasses(true);
    try {
      const response = await apiClient.get(
        `/kompetisi/${kompetisiId}/peserta/${participant.id_peserta_kompetisi}/classes`
      );
      
      if (response.data && response.data.availableClasses) {
        setAvailableClasses(response.data.availableClasses);
      }
    } catch (error: any) {
      console.error('Error fetching classes:', error);
      toast.error('Gagal memuat daftar kelas');
    } finally {
      setLoadingClasses(false);
    }
  };

  const handleSubmit = async () => {
    if (!participant) return;

    const isChangingClass = formData.kelasKejuaraanId && 
      formData.kelasKejuaraanId !== participant.kelas_kejuaraan?.id_kelas_kejuaraan?.toString();
    
    const isChangingStatus = formData.status !== participant.status;

    if (!isChangingClass && !isChangingStatus) {
      toast.error('Tidak ada perubahan yang dilakukan!');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {};

      if (isChangingClass && formData.kelasKejuaraanId) {
        payload.kelas_kejuaraan_id = Number(formData.kelasKejuaraanId);
      }

      if (isChangingStatus) {
        payload.status = formData.status;
      }

      await apiClient.put(
        `/kompetisi/${kompetisiId}/peserta/${participant.id_peserta_kompetisi}`,
        payload
      );

      toast.success('Data peserta berhasil diupdate!');
      onSuccess();
      onClose();
      
    } catch (error: any) {
      console.error('Error updating:', error);
      const errorMsg = error.response?.data?.message || 'Gagal mengupdate peserta';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !participant) return null;

  const participantName = participant.is_team
    ? participant.anggota_tim?.map((m: any) => m.atlet.nama_atlet).join(", ")
    : participant.atlet?.nama_atlet;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#3B82F6' }}>
                <Edit size={24} style={{ color: 'white' }} />
              </div>
              <div>
                <h3 className="text-2xl font-bold" style={{ color: '#050505' }}>
                  Edit Peserta
                </h3>
                <p className="text-sm" style={{ color: '#050505', opacity: 0.6 }}>
                  {participantName}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-black/5 rounded-full transition-colors"
              disabled={loading}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Current Class Info */}
          <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
            <p className="text-sm font-semibold text-blue-900 mb-1">Kelas Saat Ini:</p>
            <p className="text-sm text-blue-800">{formData.currentClassName || 'Tidak ada kelas'}</p>
          </div>

          {/* Warning if APPROVED */}
          {participant.status === 'APPROVED' && (
            <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500 flex items-start gap-3">
              <AlertTriangle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-yellow-900">Perhatian!</p>
                <p className="text-sm text-yellow-800">
                  Peserta ini sudah disetujui. Perubahan hanya bisa dilakukan oleh Admin.
                </p>
              </div>
            </div>
          )}

          {/* Kelas Kejuaraan Dropdown */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#050505' }}>
              Ubah Kelas Kejuaraan <span className="text-red-500">*</span>
            </label>
            
            {loadingClasses ? (
              <div className="flex items-center justify-center py-4">
                <Loader className="animate-spin" size={24} style={{ color: '#3B82F6' }} />
                <span className="ml-2 text-sm" style={{ color: '#050505', opacity: 0.6 }}>
                  Memuat kelas...
                </span>
              </div>
            ) : (
              <>
                <select
                  value={formData.kelasKejuaraanId}
                  onChange={(e) => setFormData({ ...formData, kelasKejuaraanId: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2"
                  style={{ borderColor: '#990D35', backgroundColor: '#F5FBEF' }}
                  disabled={loading}
                >
                  <option value="">-- Pilih Kelas Baru --</option>
                  {availableClasses.map((kelas) => (
                    <option 
                      key={kelas.value} 
                      value={kelas.value}
                      disabled={kelas.isCurrentClass}
                    >
                      {kelas.label} {kelas.isCurrentClass ? '(Kelas Saat Ini)' : ''}
                    </option>
                  ))}
                </select>
                
                <p className="text-xs mt-2" style={{ color: '#050505', opacity: 0.5 }}>
                  Format: Kategori - Level - Kelompok Usia - Kelas Berat/Poomsae
                </p>

                {availableClasses.length === 0 && (
                  <p className="text-sm text-red-600 mt-2">
                    Tidak ada kelas lain yang tersedia untuk peserta ini
                  </p>
                )}
              </>
            )}
          </div>

          {/* Status Peserta */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#050505' }}>
              Status Peserta
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2"
              style={{ borderColor: '#990D35', backgroundColor: '#F5FBEF' }}
              disabled={loading}
            >
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>

          {/* Preview Selected Class */}
          {formData.kelasKejuaraanId && 
           formData.kelasKejuaraanId !== participant.kelas_kejuaraan?.id_kelas_kejuaraan?.toString() && (
            <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
              <p className="text-sm font-semibold text-green-900 mb-2">Kelas Baru:</p>
              {availableClasses.find(k => k.value === formData.kelasKejuaraanId)?.details && (
                <div className="grid grid-cols-2 gap-2 text-xs text-green-800">
                  <div>
                    <span className="font-semibold">Kategori:</span>{' '}
                    {availableClasses.find(k => k.value === formData.kelasKejuaraanId)?.details.cabang}
                  </div>
                  <div>
                    <span className="font-semibold">Level:</span>{' '}
                    {availableClasses.find(k => k.value === formData.kelasKejuaraanId)?.details.level}
                  </div>
                  <div>
                    <span className="font-semibold">Usia:</span>{' '}
                    {availableClasses.find(k => k.value === formData.kelasKejuaraanId)?.details.kelompokUsia}
                  </div>
                  <div>
                    <span className="font-semibold">Berat:</span>{' '}
                    {availableClasses.find(k => k.value === formData.kelasKejuaraanId)?.details.kelasBerat}
                  </div>
                  {availableClasses.find(k => k.value === formData.kelasKejuaraanId)?.details.kelasPoomsae !== '-' && (
                    <div className="col-span-2">
                      <span className="font-semibold">Poomsae:</span>{' '}
                      {availableClasses.find(k => k.value === formData.kelasKejuaraanId)?.details.kelasPoomsae}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 px-4 rounded-xl font-semibold transition-all hover:bg-white border-2"
            style={{ borderColor: '#990D35', color: '#990D35', backgroundColor: 'white' }}
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.kelasKejuaraanId || loadingClasses}
            className="flex-1 py-3 px-4 rounded-xl font-semibold transition-all hover:opacity-90 shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: '#3B82F6', color: 'white' }}
          >
            {loading ? (
              <>
                <Loader size={18} className="animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Edit size={18} />
                <span>Simpan Perubahan</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditRegistrationModal;