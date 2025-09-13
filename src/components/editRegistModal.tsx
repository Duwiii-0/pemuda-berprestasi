import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import Select from 'react-select';
import toast from 'react-hot-toast';
import { apiClient } from '../config/api';

interface KelasKejuaraan {
  id_kelas_kejuaraan: number;
  cabang: 'POOMSAE' | 'KYORUGI';
  kategori_event: {
    nama_kategori: string;
  };
  kelompok?: {
    nama_kelompok: string;
    usia_min: number;
    usia_max: number;
  };
  kelas_berat?: {
    nama_kelas: string;
    jenis_kelamin: 'LAKI_LAKI' | 'PEREMPUAN';
    batas_min: number;
    batas_max: number;
  };
  poomsae?: {
    nama_kelas: string;
  };
}

interface Participant {
  id_peserta_kompetisi: number;
  is_team: boolean;
  atlet?: {
    nama_atlet: string;
    jenis_kelamin: 'LAKI_LAKI' | 'PEREMPUAN';
    berat_badan: number;
    tanggal_lahir: string;
  };
  anggota_tim?: Array<{
    atlet: {
      nama_atlet: string;
    };
  }>;
  kelas_kejuaraan: KelasKejuaraan;
}

interface EditRegistModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant: Participant | null;
  kompetisiId: number;
  onSuccess: () => void;
}

const EditRegistModal: React.FC<EditRegistModalProps> = ({
  isOpen,
  onClose,
  participant,
  kompetisiId,
  onSuccess
}) => {
  const [availableClasses, setAvailableClasses] = useState<KelasKejuaraan[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);

  // Fetch available classes when modal opens
  useEffect(() => {
    if (isOpen && kompetisiId) {
      fetchAvailableClasses();
    }
  }, [isOpen, kompetisiId]);

  // Reset selection when participant changes
  useEffect(() => {
    if (participant) {
      setSelectedClassId(participant.kelas_kejuaraan.id_kelas_kejuaraan);
    }
  }, [participant]);

  const fetchAvailableClasses = async () => {
    setLoadingClasses(true);
    try {
      const response = await apiClient.get(`/kompetisi/${kompetisiId}`);
      const kompetisiData = response.data?.data || response.data;
      
      if (kompetisiData?.kelas_kejuaraan) {
        setAvailableClasses(kompetisiData.kelas_kejuaraan);
      }
    } catch (error: any) {
      console.error('Error fetching classes:', error);
      toast.error('Gagal memuat daftar kelas kejuaraan');
    } finally {
      setLoadingClasses(false);
    }
  };

  const handleSubmit = async () => {
    if (!participant || !selectedClassId) {
      toast.error('Pilih kelas kejuaraan terlebih dahulu');
      return;
    }

    if (selectedClassId === participant.kelas_kejuaraan.id_kelas_kejuaraan) {
      toast.error('Pilih kelas yang berbeda dari kelas saat ini');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.put(
        `/kompetisi/${kompetisiId}/participants/${participant.id_peserta_kompetisi}/class`,
        { kelasKejuaraanId: selectedClassId }
      );

      toast.success(response.data?.message || 'Kelas peserta berhasil diubah');
      onSuccess();
      onClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Gagal mengubah kelas peserta';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getParticipantName = () => {
    if (!participant) return '';
    
    if (participant.is_team && participant.anggota_tim) {
      return participant.anggota_tim.map(member => member.atlet.nama_atlet).join(' & ');
    }
    
    return participant.atlet?.nama_atlet || 'Unknown';
  };

  const getCurrentClassLabel = () => {
    if (!participant) return '';
    
    const kelas = participant.kelas_kejuaraan;
    let label = `${kelas.cabang} - ${kelas.kategori_event.nama_kategori}`;
    
    if (kelas.kelompok) {
      label += ` (${kelas.kelompok.nama_kelompok})`;
    }
    
    if (kelas.kelas_berat) {
      label += ` - ${kelas.kelas_berat.nama_kelas}`;
    }
    
    if (kelas.poomsae) {
      label += ` - ${kelas.poomsae.nama_kelas}`;
    }
    
    return label;
  };

  const getClassOptions = () => {
    return availableClasses.map(kelas => {
      let label = `${kelas.cabang} - ${kelas.kategori_event.nama_kategori}`;
      
      if (kelas.kelompok) {
        label += ` (${kelas.kelompok.nama_kelompok})`;
      }
      
      if (kelas.kelas_berat) {
        label += ` - ${kelas.kelas_berat.nama_kelas}`;
      }
      
      if (kelas.poomsae) {
        label += ` - ${kelas.poomsae.nama_kelas}`;
      }

      return {
        value: kelas.id_kelas_kejuaraan,
        label,
        isDisabled: kelas.id_kelas_kejuaraan === participant?.kelas_kejuaraan.id_kelas_kejuaraan
      };
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Ubah Kelas Kejuaraan</h2>
              <p className="text-blue-100 mt-1">
                Peserta: {getParticipantName()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              disabled={loading}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Current Class Info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-semibold text-gray-800 mb-2">Kelas Saat Ini</h3>
            <div className="bg-white rounded-lg p-3 border">
              <p className="text-sm text-gray-600">{getCurrentClassLabel()}</p>
            </div>
          </div>

          {/* New Class Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-3">
              Pilih Kelas Baru <span className="text-red-500">*</span>
            </label>
            
            {loadingClasses ? (
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Memuat daftar kelas...</p>
              </div>
            ) : (
              <Select
                unstyled
                value={getClassOptions().find(opt => opt.value === selectedClassId)}
                onChange={(selected) => setSelectedClassId(selected?.value || null)}
                options={getClassOptions()}
                placeholder="Pilih kelas kejuaraan baru"
                noOptionsMessage={() => "Tidak ada kelas tersedia"}
                classNames={{
                  control: ({ isFocused }) =>
                    `w-full flex items-center border rounded-xl px-4 py-3 gap-2 transition-all duration-300 ${
                      isFocused 
                        ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-sm' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`,
                  valueContainer: () => "px-1",
                  placeholder: () => "text-gray-400 text-sm",
                  menu: () =>
                    "border border-gray-200 bg-white rounded-xl shadow-lg mt-2 overflow-hidden z-50",
                  menuList: () => "max-h-60 overflow-y-auto py-2",
                  option: ({ isFocused, isSelected, isDisabled }) => {
                    if (isDisabled) {
                      return "px-4 py-3 cursor-not-allowed text-gray-400 bg-gray-50 text-sm";
                    }
                    return [
                      "px-4 py-3 cursor-pointer text-sm transition-colors duration-200",
                      isFocused ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50",
                      isSelected ? "bg-blue-500 text-white" : "",
                    ].join(" ");
                  },
                }}
              />
            )}
          </div>

          {/* Warning Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex gap-3">
              <AlertCircle size={20} className="text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Perhatian:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Mengubah kelas akan menghapus jadwal pertandingan yang belum dimulai</li>
                  <li>• Status peserta akan kembali ke PENDING</li>
                  <li>• Pastikan peserta memenuhi syarat kelas yang baru</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedClassId || selectedClassId === participant?.kelas_kejuaraan.id_kelas_kejuaraan}
            className="px-6 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                Menyimpan...
              </>
            ) : (
              <>
                <Save size={16} />
                Simpan Perubahan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditRegistModal;