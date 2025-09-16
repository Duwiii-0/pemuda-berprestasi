// src/components/EditRegistrationModal.tsx - Improved Responsive Design
import { useState, useEffect } from "react";
import { X, AlertCircle, User, Users, Info, Clock } from 'lucide-react';
import Modal from "./modal";
import { LockedSelect } from "./lockSelect";
import GeneralButton from "./generalButton";
import toast from "react-hot-toast";
import { apiClient } from "../config/api";
import { useAuth } from "../context/authContext";

interface ApiResponse<T> {
  data: T;
  message?: string;
  status?: number;
}

type OptionType = { value: string; label: string };

interface EditRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant: any;
  kompetisiId: number;
  onSuccess: () => void;
}

interface KelasKejuaraan {
  id_kelas_kejuaraan: number;
  cabang: "KYORUGI" | "POOMSAE";
  kategori_event: {
    nama_kategori: string;
  };
  kelompok: {
    nama_kelompok: string;
  };
  kelas_berat?: {
    nama_kelas: string;
  };
  poomsae?: {
    nama_kelas: string;
  };
}

const EditRegistrationModal = ({
  isOpen,
  onClose,
  participant,
  kompetisiId,
  onSuccess
}: EditRegistrationModalProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [availableClasses, setAvailableClasses] = useState<KelasKejuaraan[]>([]);
  const [selectedClass, setSelectedClass] = useState<OptionType | null>(null);
  const [originalClass, setOriginalClass] = useState<OptionType | null>(null);

  // Extract participant info
  const isTeam = participant?.is_team;
  const participantName = isTeam
    ? participant?.anggota_tim?.map((m: any) => m.atlet.nama_atlet).join(" & ") || "Tim"
    : participant?.atlet?.nama_atlet || "Atlet";
  
  const currentClass = participant?.kelas_kejuaraan;
  const participantGender = isTeam ? "CAMPURAN" : participant?.atlet?.jenis_kelamin;
  const dojang = isTeam && participant?.anggota_tim?.length
    ? participant.anggota_tim[0]?.atlet?.dojang?.nama_dojang
    : participant?.atlet?.dojang?.nama_dojang;

  // Helper functions
  const getParticipantAge = (): number => {
    if (isTeam) {
      // For team, use youngest member's age
      const ages = participant?.anggota_tim?.map((member: any) => {
        const birthYear = new Date(member.atlet.tanggal_lahir).getFullYear();
        return new Date().getFullYear() - birthYear;
      }) || [];
      return Math.min(...ages) || 0;
    } else {
      const birthYear = new Date(participant?.atlet?.tanggal_lahir || '').getFullYear();
      return new Date().getFullYear() - birthYear;
    }
  };

  const getParticipantWeight = (): number => {
    if (isTeam) return 0;
    return participant?.atlet?.berat_badan || 0;
  };

  const buildClassLabel = (kelas: KelasKejuaraan) => {
    const parts = [
      kelas.cabang,
      kelas.kategori_event?.nama_kategori || "",
      kelas.kelompok?.nama_kelompok || "",
    ];

    if (kelas.cabang === "KYORUGI" && kelas.kelas_berat?.nama_kelas) {
      parts.push(kelas.kelas_berat.nama_kelas);
    } else if (kelas.cabang === "POOMSAE" && kelas.poomsae?.nama_kelas) {
      parts.push(kelas.poomsae.nama_kelas);
    }

    return parts.filter(Boolean).join(" - ");
  };

  // ✅ TEMPORARY: Use simple endpoint while backend is being implemented
  const fetchAvailableClasses = async () => {
    try {
      setLoading(true);
      
      // Try the new endpoint first, fallback to kompetisi endpoint
      try {
        const response = await apiClient.get<ApiResponse<KelasKejuaraan[]>>(
          `/kompetisi/${kompetisiId}/participants/${participant.id_peserta_kompetisi}/available-classes`
        );
        const classes = response.data.data || [];
        setAvailableClasses(classes);
        return;
      } catch (error: any) {
        console.log('New endpoint not available, falling back to kompetisi endpoint');
      }

      // Fallback: Use kompetisi endpoint
      const response = await apiClient.get<ApiResponse<any>>(
        `/kompetisi/${kompetisiId}`
      );

      if (response.data.data?.kelas_kejuaraan) {
        const allClasses = response.data.data.kelas_kejuaraan;
        
        // Basic client-side filtering
        const eligibleClasses = allClasses.filter((kelas: KelasKejuaraan) => {
          // Don't show current class
          if (kelas.id_kelas_kejuaraan === currentClass?.id_kelas_kejuaraan) {
            return false;
          }
          
          // Only show classes with same sport
          if (kelas.cabang !== participant?.kelas_kejuaraan?.cabang) {
            return false;
          }
          
          return true;
        });
        
        setAvailableClasses(eligibleClasses);
      } else {
        setAvailableClasses([]);
      }

    } catch (error: any) {
      console.error('Error fetching available classes:', error);
      toast.error('Gagal memuat kelas yang tersedia');
      setAvailableClasses([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch available classes when modal opens
  useEffect(() => {
    if (isOpen && participant) {
      fetchAvailableClasses();
      
      // Set current selection
      if (currentClass) {
        const currentClassLabel = buildClassLabel(currentClass);
        const currentOption = {
          value: currentClass.id_kelas_kejuaraan.toString(),
          label: currentClassLabel
        };
        setSelectedClass(currentOption);
        setOriginalClass(currentOption);
      }
    }
  }, [isOpen, participant]);

  const handleSave = async () => {
    if (!selectedClass || !participant) {
      toast.error("Silakan pilih kelas kejuaraan");
      return;
    }

    if (selectedClass.value === originalClass?.value) {
      toast.error("Tidak ada perubahan yang dilakukan");
      return;
    }

    try {
      setLoading(true);

      await apiClient.put<ApiResponse<any>>(
        `/kompetisi/${kompetisiId}/participants/${participant.id_peserta_kompetisi}/class`, 
        {
          kelas_kejuaraan_id: parseInt(selectedClass.value)
        }
      );

      toast.success("Kelas peserta berhasil diubah");
      onSuccess();
      onClose();

    } catch (error: any) {
      console.error('Error updating participant class:', error);
      const message = error.response?.data?.message || error.message || "Gagal mengubah kelas peserta";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedClass(originalClass);
    onClose();
  };

  const classOptions: OptionType[] = availableClasses.map(kelas => ({
    value: kelas.id_kelas_kejuaraan.toString(),
    label: buildClassLabel(kelas)
  }));

  const selectClassNames = {
    control: () => "border-2 border-red/30 rounded-xl h-12 px-3 text-inter bg-white hover:border-red/50 transition-colors",
    valueContainer: () => "px-2",
    placeholder: () => "text-red/50 text-inter",
    menu: () => "border-2 border-red/20 bg-white rounded-xl shadow-lg mt-1 z-50",
    menuList: () => "max-h-60 overflow-y-scroll py-2",
    option: ({ isFocused, isSelected }: any) =>
      [
        "px-4 py-3 cursor-pointer text-sm transition-colors",
        isFocused ? "bg-red/5 text-black" : "text-black/80",
        isSelected ? "bg-red text-white font-medium" : "",
      ].join(" "),
  };

  const ValidationMessage = () => {
    if (availableClasses.length === 0 && !loading) {
      return (
        <div className="bg-amber-50 rounded-xl p-4 border-l-4 border-amber-400">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <h4 className="font-plex font-semibold text-amber-800 mb-2">
                Tidak Ada Kelas Tersedia
              </h4>
              <p className="font-plex text-amber-700 text-sm mb-3">
                Tidak ada kelas lain yang sesuai dengan kriteria peserta ini.
              </p>
              
              <div className="space-y-2">
                <p className="font-plex text-amber-700 text-sm font-medium">
                  Kemungkinan penyebab:
                </p>
                <ul className="font-plex text-amber-700 text-xs space-y-1 ml-4 list-disc">
                  <li>Umur tidak sesuai dengan kelompok usia yang tersedia</li>
                  <li>Berat badan tidak sesuai (untuk Kyorugi)</li>
                  <li>Tidak dapat berpindah level (pemula ↔ prestasi)</li>
                  <li>Peserta sudah di kelas yang paling sesuai</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (availableClasses.length > 0) {
      return (
        <div className="bg-blue-50 rounded-xl p-3 border-l-4 border-blue-400">
          <div className="flex items-center gap-2">
            <Info size={16} className="text-blue-600 flex-shrink-0" />
            <p className="font-plex text-blue-700 text-sm">
              {availableClasses.length} kelas tersedia untuk peserta ini
            </p>
          </div>
        </div>
      );
    }

    return null;
  };

  if (!participant) return null;

  return (
    <Modal isOpen={isOpen}>
      <div className="bg-white w-full max-w-4xl mx-4 rounded-2xl shadow-2xl border border-gray-100 max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-4 lg:p-6 border-b border-gray-200 bg-gradient-to-r from-red/5 to-yellow/5">
          <div className="flex items-center gap-3">
            {isTeam ? (
              <Users className="text-red flex-shrink-0" size={24} />
            ) : (
              <User className="text-red flex-shrink-0" size={24} />
            )}
            <div className="min-w-0">
              <h2 className="font-bebas text-xl lg:text-2xl text-red tracking-wider">
                EDIT KELAS PESERTA
              </h2>
              <p className="font-plex text-black/60 text-sm">
                Ubah kelas kejuaraan untuk peserta
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-red/5 rounded-full transition-colors duration-200 flex-shrink-0"
          >
            <X size={20} className="text-black/40 hover:text-red" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="space-y-6">
            {/* Participant Info - Improved Layout */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-50/50 rounded-xl p-4 border border-gray-200">
              <h3 className="font-bebas text-lg text-black/80 mb-3">
                INFORMASI PESERTA
              </h3>
              
              {/* Mobile-first grid */}
              <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-4 text-sm font-plex">
                <div className="space-y-1">
                  <span className="text-black/50 text-xs uppercase tracking-wide">Nama</span>
                  <p className="font-medium text-black/80 break-words">{participantName}</p>
                </div>
                
                <div className="space-y-1">
                  <span className="text-black/50 text-xs uppercase tracking-wide">Dojang</span>
                  <p className="font-medium text-black/80 break-words">{dojang || "-"}</p>
                </div>
                
                <div className="space-y-1">
                  <span className="text-black/50 text-xs uppercase tracking-wide">Jenis</span>
                  <p className="font-medium text-black/80">{isTeam ? "Tim" : "Individu"}</p>
                </div>
                
                <div className="space-y-1">
                  <span className="text-black/50 text-xs uppercase tracking-wide">Status</span>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    participant.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                    participant.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {participant.status}
                  </span>
                </div>

                {!isTeam && (
                  <>
                    <div className="space-y-1">
                      <span className="text-black/50 text-xs uppercase tracking-wide">Umur</span>
                      <p className="font-medium text-black/80">{getParticipantAge()} tahun</p>
                    </div>
                    {getParticipantWeight() > 0 && (
                      <div className="space-y-1">
                        <span className="text-black/50 text-xs uppercase tracking-wide">Berat Badan</span>
                        <p className="font-medium text-black/80">{getParticipantWeight()} kg</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Current Class - More Compact */}
            <div className="bg-blue-50 rounded-xl p-4 border-l-4 border-blue-400">
              <div className="flex items-start gap-3">
                <Clock size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <h4 className="font-plex font-semibold text-blue-800 mb-1">Kelas Saat Ini</h4>
                  <p className="font-plex text-blue-700 text-sm break-words">
                    {originalClass?.label || "Tidak tersedia"}
                  </p>
                </div>
              </div>
            </div>

            {/* Status Warnings - Conditional */}
            {participant?.status === 'APPROVED' && (
              <div className="bg-red-50 rounded-xl p-4 border-l-4 border-red-400">
                <div className="flex items-start gap-3">
                  <AlertCircle size={18} className="text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <h4 className="font-plex font-semibold text-red-800 mb-1">
                      Peserta Sudah Disetujui
                    </h4>
                    <p className="font-plex text-red-700 text-sm">
                      Peserta ini sudah disetujui dan tidak dapat diubah kelasnya. 
                      Hubungi administrator jika diperlukan perubahan.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {user?.role === 'PELATIH' && (
              <div className="bg-amber-50 rounded-xl p-4 border-l-4 border-amber-400">
                <div className="flex items-start gap-3">
                  <Info size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <h4 className="font-plex font-semibold text-amber-800 mb-1">
                      Catatan Penting
                    </h4>
                    <p className="font-plex text-amber-700 text-sm">
                      Sebagai pelatih, Anda hanya dapat mengubah kelas peserta dari dojang sendiri 
                      selama masa pendaftaran.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Validation Message */}
            <ValidationMessage />

            {/* Class Selection */}
            <div className="space-y-3">
              <label className="block text-black/80 font-plex font-semibold">
                Pilih Kelas Baru <span className="text-red">*</span>
              </label>
              
              {loading ? (
                <div className="flex items-center justify-center h-12 bg-gray-50 rounded-xl">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-red border-t-transparent"></div>
                  <span className="ml-2 font-plex text-sm text-black/60">Memuat kelas...</span>
                </div>
              ) : (
                <LockedSelect
                  unstyled
                  options={classOptions}
                  value={selectedClass}
                  onChange={(value: OptionType | null) => setSelectedClass(value)}
                  placeholder="Pilih kelas kejuaraan baru..."
                  isSearchable
                  classNames={selectClassNames}
                  disabled={loading || classOptions.length === 0 || participant?.status === 'APPROVED'}
                  message={classOptions.length === 0 ? "Tidak ada kelas yang tersedia" : ""}
                />
              )}
            </div>

            {/* Change Preview */}
            {selectedClass && selectedClass.value !== originalClass?.value && (
              <div className="bg-green-50 rounded-xl p-4 border-l-4 border-green-400">
                <h4 className="font-plex font-semibold text-green-800 mb-2">Perubahan:</h4>
                <div className="font-plex text-sm text-green-700 space-y-1">
                  <p className="opacity-60 line-through break-words">{originalClass?.label}</p>
                  <p className="font-medium break-words">→ {selectedClass.label}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 p-4 lg:p-6 border-t border-gray-200 bg-gray-50/30">
          <button
            onClick={handleClose}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 border-2 border-gray-300 text-gray-700 font-plex font-medium rounded-xl hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
          >
            Batal
          </button>
          <GeneralButton
            label={loading ? "Menyimpan..." : "Simpan Perubahan"}
            onClick={handleSave}
            className={`w-full sm:w-auto px-6 py-2.5 font-plex font-medium rounded-xl transition-all duration-200 ${
              loading || !selectedClass || selectedClass.value === originalClass?.value || participant?.status === 'APPROVED'
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-red to-red/90 text-white hover:shadow-lg hover:scale-105'
            }`}
            disabled={loading || !selectedClass || selectedClass.value === originalClass?.value || participant?.status === 'APPROVED'}
          />
        </div>
      </div>
    </Modal>
  );
};

export default EditRegistrationModal;