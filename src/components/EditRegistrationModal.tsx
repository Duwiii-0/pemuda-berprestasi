// src/components/EditRegistrationModal.tsx
import { useState, useEffect } from "react";
import { X, AlertCircle, User, Users } from 'lucide-react';
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

  const getParticipantLevel = (): string => {
    return currentClass?.kategori_event?.nama_kategori || '';
  };

  // Age group validation
  const isValidAgeGroup = (kelas: KelasKejuaraan, age: number): boolean => {
    const kelompokNama = kelas.kelompok?.nama_kelompok?.toLowerCase() || '';
    
    // Age ranges based on typical Taekwondo competition rules
    const ageRanges = {
      'super pracadet': { min: 4, max: 8 },
      'super pra-cadet': { min: 4, max: 8 },
      'pracadet': { min: 8, max: 11 },
      'pra-cadet': { min: 8, max: 11 },
      'cadet': { min: 11, max: 14 },
      'junior': { min: 15, max: 17 },
      'senior': { min: 18, max: 99 },
    };

    for (const [groupName, range] of Object.entries(ageRanges)) {
      if (kelompokNama.includes(groupName.replace(' ', '').replace('-', ''))) {
        return age >= range.min && age <= range.max;
      }
    }

    return true; // If no specific age group found, allow it
  };

  // Weight class validation
  const isValidWeightClass = (kelas: KelasKejuaraan, weight: number): boolean => {
    if (kelas.cabang !== 'KYORUGI' || !kelas.kelas_berat?.nama_kelas || weight === 0) {
      return true;
    }

    const weightClassName = kelas.kelas_berat.nama_kelas.toLowerCase();
    
    // Extract weight limit from class name (e.g., "Under 54 kg" -> 54)
    const weightMatch = weightClassName.match(/under\s+(\d+)\s*kg/);
    if (weightMatch) {
      const weightLimit = parseInt(weightMatch[1]);
      return weight <= weightLimit;
    }

    // Handle weight ranges (e.g., "54-58 kg")
    const rangeMatch = weightClassName.match(/(\d+)-(\d+)\s*kg/);
    if (rangeMatch) {
      const minWeight = parseInt(rangeMatch[1]);
      const maxWeight = parseInt(rangeMatch[2]);
      return weight > minWeight && weight <= maxWeight;
    }

    // Handle "Above" or "Over" classes
    const aboveMatch = weightClassName.match(/(above|over)\s+(\d+)\s*kg/);
    if (aboveMatch) {
      const minWeight = parseInt(aboveMatch[2]);
      return weight > minWeight;
    }

    return true; // If can't parse weight, allow it
  };

  // Level switch validation
  const isValidLevelSwitch = (kelas: KelasKejuaraan, currentLevel?: string): boolean => {
    const newLevel = kelas.kategori_event?.nama_kategori?.toLowerCase() || '';
    const currentLevelLower = currentLevel?.toLowerCase() || '';
    
    // Prevent switching between pemula and prestasi
    if (currentLevelLower === 'pemula' && newLevel === 'prestasi') {
      return false;
    }
    
    if (currentLevelLower === 'prestasi' && newLevel === 'pemula') {
      return false;
    }
    
    return true;
  };

  // Main filtering logic
  const filterEligibleClasses = (classes: KelasKejuaraan[]): KelasKejuaraan[] => {
    const participantAge = getParticipantAge();
    const participantWeight = getParticipantWeight();
    const currentLevel = currentClass?.kategori_event?.nama_kategori;

    return classes.filter(kelas => {
      // 1. Age group validation
      if (!isValidAgeGroup(kelas, participantAge)) {
        return false;
      }

      // 2. Weight class validation (for KYORUGI individual only)
      if (kelas.cabang === 'KYORUGI' && !isTeam && !isValidWeightClass(kelas, participantWeight)) {
        return false;
      }

      // 3. Level consistency (prevent switching between pemula and prestasi)
      if (!isValidLevelSwitch(kelas, currentLevel)) {
        return false;
      }

      // 4. Don't show the current class in options
      if (kelas.id_kelas_kejuaraan === currentClass?.id_kelas_kejuaraan) {
        return false;
      }

      return true;
    });
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

  const fetchAvailableClasses = async () => {
    try {
      setLoading(true);
      
      // Get participant details for filtering
      const participantAge = getParticipantAge();
      const participantWeight = getParticipantWeight();
      const participantLevel = getParticipantLevel();
      const currentClassCategory = currentClass?.cabang;
      
      const response = await apiClient.get<ApiResponse<KelasKejuaraan[]>>(
        `/kompetisi/${kompetisiId}/kelas-kejuaraan/available`,
        {
          params: {
            participant_type: isTeam ? 'team' : 'individual',
            gender: participantGender,
            current_class_id: currentClass?.id_kelas_kejuaraan || '',
            age: participantAge,
            weight: participantWeight,
            level: participantLevel,
            current_category: currentClassCategory
          }
        }
      );

      let classes = response.data.data || [];
      
      // Apply client-side filtering as additional validation
      classes = filterEligibleClasses(classes);
      
      setAvailableClasses(classes);

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

  // Check if there's actually a change
  if (selectedClass.value === originalClass?.value) {
    toast.error("Tidak ada perubahan yang dilakukan");
    return;
  }

  try {
    setLoading(true);

    // Perbaiki URL sesuai dengan yang di error log
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

  // Validation message component
  const ValidationMessage = () => {
    if (availableClasses.length === 0 && !loading) {
      const participantAge = getParticipantAge();
      const participantWeight = getParticipantWeight();
      
      return (
        <div className="bg-amber-50 rounded-xl p-4 border-l-4 border-amber-400">
          <div className="flex items-start gap-2">
            <AlertCircle size={20} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-plex font-semibold text-amber-800 mb-1">Tidak Ada Kelas Tersedia</h4>
              <p className="font-plex text-amber-700 text-sm mb-2">
                Tidak ada kelas lain yang sesuai dengan kriteria peserta ini.
              </p>
              <div className="font-plex text-amber-700 text-sm">
                <p><strong>Informasi Peserta:</strong></p>
                <ul className="ml-4 list-disc mt-1">
                  <li>Umur: {participantAge} tahun</li>
                  {!isTeam && participantWeight > 0 && (
                    <li>Berat badan: {participantWeight} kg</li>
                  )}
                  <li>Level: {getParticipantLevel()}</li>
                  <li>Kategori saat ini: {currentClass?.cabang}</li>
                </ul>
              </div>
              <p className="font-plex text-amber-700 text-sm mt-2">
                <strong>Kemungkinan penyebab:</strong>
              </p>
              <ul className="font-plex text-amber-700 text-sm mt-1 ml-4 list-disc">
                <li>Umur tidak sesuai dengan kelompok usia lain</li>
                <li>Berat badan tidak sesuai dengan kelas berat lain</li>
                <li>Tidak dapat berpindah antara level pemula dan prestasi</li>
                <li>Semua kelas lain sudah penuh</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    if (availableClasses.length > 0) {
      return (
        <div className="bg-blue-50 rounded-xl p-3 border-l-4 border-blue-400">
          <p className="font-plex text-blue-700 text-sm">
            Menampilkan {availableClasses.length} kelas yang sesuai dengan kriteria peserta
          </p>
        </div>
      );
    }

    return null;
  };

  if (!participant) return null;

  return (
    <Modal isOpen={isOpen}>
      <div className="bg-gradient-to-b from-white via-white/95 to-white/90 w-full max-w-2xl mx-4 rounded-2xl shadow-2xl border border-red/10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-red/10">
          <div className="flex items-center gap-3">
            {isTeam ? (
              <Users className="text-red" size={24} />
            ) : (
              <User className="text-red" size={24} />
            )}
            <div>
              <h2 className="font-bebas text-2xl text-red tracking-wider">
                EDIT KELAS PESERTA
              </h2>
              <p className="font-plex text-black/60 text-sm">
                Ubah kelas kejuaraan untuk peserta
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-red/5 rounded-full transition-colors duration-200"
          >
            <X size={24} className="text-black/40 hover:text-red" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Participant Info */}
          <div className="bg-gradient-to-r from-red/5 via-yellow/5 to-red/5 rounded-xl p-4 border border-red/10">
            <h3 className="font-bebas text-lg text-black/80 mb-2">INFORMASI PESERTA</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm font-plex">
              <div>
                <span className="text-black/50">Nama:</span>
                <p className="font-medium text-black/80">{participantName}</p>
              </div>
              <div>
                <span className="text-black/50">Dojang:</span>
                <p className="font-medium text-black/80">{dojang || "-"}</p>
              </div>
              <div>
                <span className="text-black/50">Jenis:</span>
                <p className="font-medium text-black/80">{isTeam ? "Tim" : "Individu"}</p>
              </div>
              <div>
                <span className="text-black/50">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  participant.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                  participant.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {participant.status}
                </span>
              </div>
              {!isTeam && (
                <>
                  <div>
                    <span className="text-black/50">Umur:</span>
                    <p className="font-medium text-black/80">{getParticipantAge()} tahun</p>
                  </div>
                  {getParticipantWeight() > 0 && (
                    <div>
                      <span className="text-black/50">Berat Badan:</span>
                      <p className="font-medium text-black/80">{getParticipantWeight()} kg</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Current Class */}
          <div className="bg-blue-50 rounded-xl p-4 border-l-4 border-blue-400">
            <h4 className="font-plex font-semibold text-blue-800 mb-1">Kelas Saat Ini:</h4>
            <p className="font-plex text-blue-700 text-sm">
              {originalClass?.label || "Tidak tersedia"}
            </p>
          </div>

          {/* Permission Check */}
          {user?.role === 'PELATIH' && (
            <div className="bg-amber-50 rounded-xl p-4 border-l-4 border-amber-400">
              <div className="flex items-start gap-2">
                <AlertCircle size={20} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-plex font-semibold text-amber-800 mb-1">Catatan Penting:</h4>
                  <p className="font-plex text-amber-700 text-sm">
                    Sebagai pelatih, Anda hanya dapat mengubah kelas peserta dari dojang Anda sendiri 
                    dan hanya selama masa pendaftaran kompetisi.
                  </p>
                </div>
              </div>
            </div>
          )}
            {/* Approved Status Check */}
          {participant?.status === 'APPROVED' && (
  <div className="bg-red-50 rounded-xl p-4 border-l-4 border-red-400">
    <div className="flex items-start gap-2">
      <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
      <div>
        <h4 className="font-plex font-semibold text-red-800 mb-1">Peserta Sudah Disetujui</h4>
        <p className="font-plex text-red-700 text-sm">
          Peserta ini sudah disetujui dan tidak dapat diubah kelasnya. 
          Hubungi administrator jika diperlukan perubahan.
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
                disabled={loading || classOptions.length === 0}
                message={classOptions.length === 0 ? "Tidak ada kelas yang tersedia" : ""}
              />
            )}
          </div>

          {/* Change Preview */}
          {selectedClass && selectedClass.value !== originalClass?.value && (
            <div className="bg-green-50 rounded-xl p-4 border-l-4 border-green-400">
              <h4 className="font-plex font-semibold text-green-800 mb-1">Perubahan:</h4>
              <div className="font-plex text-sm text-green-700">
                <p><span className="line-through opacity-60">{originalClass?.label}</span></p>
                <p className="font-medium">→ {selectedClass.label}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-red/10 bg-gray-50/50">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 font-plex font-medium rounded-xl hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
          >
            Batal
          </button>
          <GeneralButton
            label={loading ? "Menyimpan..." : "Simpan Perubahan"}
            onClick={handleSave}
            className={`px-6 py-2.5 font-plex font-medium rounded-xl transition-all duration-200 flex items-center gap-2 ${
              loading || !selectedClass || selectedClass.value === originalClass?.value
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-red to-red/90 text-white hover:shadow-lg hover:scale-105'
            }`}
          />
          {(loading || (!selectedClass || selectedClass.value === originalClass?.value)) && (
            <div className="absolute inset-0 cursor-not-allowed" />
          )}
        </div>
      </div>
    </Modal>
  );
};

export default EditRegistrationModal;