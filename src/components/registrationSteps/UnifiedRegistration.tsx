// src/components/registrationSteps/UnifiedRegistration.tsx - Fixed Version
import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Modal from "../modal";
import TextInput from "../textInput";
import { LockedSelect } from "../lockSelect";
import GeneralButton from "../../components/generalButton";
import toast from "react-hot-toast";
import { useRegistration } from "../../context/registrationContext";

type UnifiedRegistrationProps = {
  isOpen: boolean;
  onClose: () => void;
  kompetisiId?: number;
  kompetisiName?: string;
  biayaPendaftaran?: number;
};

type OptionType = { value: string; label: string };

const UnifiedRegistration = ({
  isOpen,
  onClose,
  kompetisiId = 1,
  kompetisiName = "Kejuaraan Karate Nasional 2024",
  biayaPendaftaran = 150000
}: UnifiedRegistrationProps) => {
  const { 
    addRegistration, 
    getRegistrationsByKompetisi, 
    atlitList, 
    selectedKompetisiClasses,
    fetchAtletList,
    fetchKompetisiClasses,
    fetchRegistrations,
    loading 
  } = useRegistration();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    styleType: null as "kyorugi" | "poomsae" | null,
    categoryType: null as "prestasi" | "pemula" | null,
    selectedAge: null as OptionType | null,
    selectedWeight: null as OptionType | null,
    selectedGender: null as OptionType | null,
    selectedAtlit: null as OptionType | null
  });

  const totalSteps = 3;

  // Load data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAtletList();
      if (kompetisiId) {
        fetchKompetisiClasses(kompetisiId);
        fetchRegistrations(kompetisiId);
      }
    }
  }, [isOpen, kompetisiId, fetchAtletList, fetchKompetisiClasses, fetchRegistrations]);

  // Get existing registrations for this competition
  const existingRegistrations = getRegistrationsByKompetisi(kompetisiId ?? 1);
  const registeredAtlitIds = existingRegistrations.map(reg => reg.atlitId);

  // Filter out already registered athletes and transform API data
  const availableAtlits = atlitList
    .filter(atlit => !registeredAtlitIds.includes(atlit.id_atlet))
    .map(atlit => ({
      id: atlit.id_atlet,
      name: atlit.nama_atlet,
      bb: atlit.berat_badan,
      tb: atlit.tinggi_badan,
      provinsi: atlit.provinsi,
      belt: atlit.belt,
      gender: atlit.jenis_kelamin === 'LAKI_LAKI' ? 'Laki-Laki' : 'Perempuan'
    }));

  // Dynamic options based on available classes from API
  const getAgeOptions = (): OptionType[] => {
    if (!formData.styleType || !formData.categoryType) return [];
    
    const ageCategories = selectedKompetisiClasses
      .filter(kelas => {
        const isCabangMatch = kelas.cabang.toLowerCase() === formData.styleType?.toLowerCase();
        const isKategoriMatch = kelas.kategori_event.nama_kategori.toLowerCase().includes(
          formData.categoryType?.toLowerCase() || ''
        );
        return isCabangMatch && isKategoriMatch && kelas.kelompok;
      })
      .map(kelas => ({
        value: kelas.kelompok!.nama_kelompok,
        label: `${kelas.kelompok!.nama_kelompok} (${kelas.kelompok!.usia_min}-${kelas.kelompok!.usia_max} tahun)`
      }))
      .filter((option, index, self) => 
        self.findIndex(o => o.value === option.value) === index
      );

    return ageCategories;
  };

  const getWeightOptions = (): OptionType[] => {
    if (formData.styleType !== "kyorugi" || formData.categoryType !== "prestasi" || !formData.selectedGender) {
      return [];
    }
    
    const weightCategories = selectedKompetisiClasses
      .filter(kelas => {
        const isCabangMatch = kelas.cabang.toLowerCase() === 'kyorugi';
        const isKategoriMatch = kelas.kategori_event.nama_kategori.toLowerCase().includes('prestasi');
        const isGenderMatch = kelas.kelas_berat?.gender === 
          (formData.selectedGender?.value === 'Laki-Laki' ? 'LAKI_LAKI' : 'PEREMPUAN');
        
        // Also check age group if available
        let isAgeMatch = true;
        if (formData.selectedAge && kelas.kelompok) {
          isAgeMatch = kelas.kelompok.nama_kelompok === formData.selectedAge.value;
        }
        
        return isCabangMatch && isKategoriMatch && isGenderMatch && isAgeMatch && kelas.kelas_berat;
      })
      .map(kelas => ({
        value: kelas.kelas_berat!.nama_kelas,
        label: `${kelas.kelas_berat!.nama_kelas} (${kelas.kelas_berat!.batas_min}-${kelas.kelas_berat!.batas_max} kg)`
      }))
      .filter((option, index, self) => 
        self.findIndex(o => o.value === option.value) === index
      );

    return weightCategories;
  };

  const genderOptions: OptionType[] = [
    { value: "Laki-Laki", label: "Laki-Laki" },
    { value: "Perempuan", label: "Perempuan" }
  ];

  const atlitOptions: OptionType[] = availableAtlits.map((atlit) => ({
    value: atlit.id.toString(),
    label: `${atlit.name} - ${atlit.provinsi}`,
  }));

  const selectedAtlitData = availableAtlits.find(
    (atlit) => atlit.id.toString() === formData.selectedAtlit?.value
  );

  const selectClassNames = {
    control: () => "border-2 border-red rounded-lg h-12 px-2 text-inter",
    valueContainer: () => "px-2",
    placeholder: () => "text-red/50 text-inter",
    menu: () => "border-2 border-red bg-white rounded-lg shadow-lg mt-1 z-50",
    menuList: () => "max-h-40 overflow-y-scroll",
    option: ({ isFocused, isSelected }: any) =>
      [
        "px-4 py-2 cursor-pointer",
        isFocused ? "bg-yellow/10 text-black" : "text-black",
        isSelected ? "bg-red text-white" : "text-black",
      ].join(" "),
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.styleType || !formData.categoryType) {
        toast.error("Anda harus memilih style dan kategori terlebih dahulu!");
        return;
      }
    }

    if (currentStep === 2) {
      if (!formData.selectedGender) {
        toast.error("Anda harus memilih gender terlebih dahulu!");
        return;
      }
      
      // For prestasi category, age is required
      if (formData.categoryType === "prestasi" && !formData.selectedAge) {
        toast.error("Anda harus memilih kelas umur untuk kategori prestasi!");
        return;
      }
      
      // For kyorugi prestasi, weight is required
      if (formData.styleType === "kyorugi" && formData.categoryType === "prestasi" && !formData.selectedWeight) {
        toast.error("Anda harus memilih kelas berat untuk kyorugi prestasi!");
        return;
      }
    }

    if (currentStep === 3) {
      if (!formData.selectedAtlit) {
        toast.error("Anda harus memilih atlit terlebih dahulu!");
        return;
      }
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      onClose();
    }
  };

  const resetDependentFields = (level: 'style' | 'category' | 'gender' | 'age') => {
    switch (level) {
      case 'style':
        setFormData(prev => ({
          ...prev,
          selectedAge: null,
          selectedWeight: null
        }));
        break;
      case 'category':
        setFormData(prev => ({
          ...prev,
          selectedAge: null,
          selectedWeight: null
        }));
        break;
      case 'gender':
        setFormData(prev => ({
          ...prev,
          selectedWeight: null
        }));
        break;
      case 'age':
        setFormData(prev => ({
          ...prev,
          selectedWeight: null
        }));
        break;
    }
  };

  const handleSubmit = async () => {
    if (!selectedAtlitData) {
      toast.error("Data atlet tidak ditemukan!");
      return;
    }

    if (!formData.selectedAtlit) {
      toast.error("Anda harus memilih atlit terlebih dahulu!");
      return;
    }

    // Validate weight category for kyorugi prestasi
    if (formData.styleType === "kyorugi" && formData.categoryType === "prestasi" && selectedAtlitData.bb) {
      const atlitWeight = selectedAtlitData.bb;
      const selectedWeightValue = formData.selectedWeight?.value;
      
      if (selectedWeightValue) {
        const matchingWeightClass = selectedKompetisiClasses.find(kelas => 
          kelas.kelas_berat?.nama_kelas === selectedWeightValue
        );
        
        if (matchingWeightClass && matchingWeightClass.kelas_berat) {
          const { batas_min, batas_max } = matchingWeightClass.kelas_berat;
          const isValidWeight = atlitWeight >= batas_min && atlitWeight <= batas_max;
          
          if (!isValidWeight) {
            toast.error(`Berat badan atlet (${atlitWeight}kg) tidak sesuai dengan kategori ${selectedWeightValue} (${batas_min}-${batas_max}kg)!`);
            return;
          }
        }
      }
    }

    const registrationData = {
      atlitId: selectedAtlitData.id,
      atlitName: selectedAtlitData.name,
      kompetisiId: kompetisiId ?? 1,
      kompetisiName: kompetisiName || '',
      styleType: formData.styleType!,
      categoryType: formData.categoryType!,
      gender: formData.selectedGender!.value as "Laki-Laki" | "Perempuan",
      ageCategory: formData.selectedAge?.value,
      weightCategory: formData.selectedWeight?.value,
      biayaPendaftaran
    };

    try {
      await addRegistration(registrationData);
      
      // Reset form
      setCurrentStep(1);
      setFormData({
        styleType: null,
        categoryType: null,
        selectedAge: null,
        selectedWeight: null,
        selectedGender: null,
        selectedAtlit: null
      });
      
      onClose();
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  const canProceedStep1 = formData.styleType && formData.categoryType;
  
  const canProceedStep2 = () => {
    if (!formData.selectedGender) return false;
    
    // For pemula, gender is sufficient
    if (formData.categoryType === "pemula") return true;
    
    // For prestasi, need age category
    if (formData.categoryType === "prestasi" && !formData.selectedAge) return false;
    
    // For kyorugi prestasi, need weight category too
    if (formData.styleType === "kyorugi" && formData.categoryType === "prestasi") {
      return !!formData.selectedWeight;
    }
    
    return true;
  };

  const canSubmit = canProceedStep2() && formData.selectedAtlit;

  // Show loading state
  if (loading.atlet || loading.classes) {
    return (
      <Modal isOpen={isOpen}>
        <div className="bg-gradient-to-b from-white/90 to-white/80 h-screen md:h-[85vh] w-screen md:w-[80vw] lg:w-[70vw] xl:w-[60vw] rounded-xl flex flex-col justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red"></div>
            <p className="mt-4 text-xl font-bebas text-red">Memuat data...</p>
          </div>
        </div>
      </Modal>
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-4xl md:text-6xl font-bebas text-red mb-2">
                Pilih Style & Kategori
              </h2>
              <p className="text-black/70 font-plex">Langkah 1 dari {totalSteps}</p>
            </div>

            <div className="space-y-8">
              <div>
                <label className="block text-black mb-4 text-xl font-bebas">
                  STYLE PERTANDINGAN
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button
                    onClick={() => {
                      setFormData({...formData, styleType: "kyorugi"});
                      resetDependentFields('style');
                    }}
                    className={`p-8 rounded-xl border-2 transition-all duration-300 font-bebas text-4xl ${
                      formData.styleType === "kyorugi"
                        ? 'border-red bg-red text-white scale-105'
                        : 'border-red bg-white text-red hover:bg-[#cec3bd]'
                    }`}
                  >
                    <div>KYORUGI</div>
                    <div className="font-plex text-lg mt-2">(Tarung/Sparring)</div>
                  </button>
                  <button
                    onClick={() => {
                      setFormData({...formData, styleType: "poomsae"});
                      resetDependentFields('style');
                    }}
                    className={`p-8 rounded-xl border-2 transition-all duration-300 font-bebas text-4xl ${
                      formData.styleType === "poomsae"
                        ? 'border-red bg-red text-white scale-105'
                        : 'border-red bg-white text-red hover:bg-[#cec3bd]'
                    }`}
                  >
                    <div>POOMSAE</div>
                    <div className="font-plex text-lg mt-2">(Seni/Forms)</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-black mb-4 text-xl font-bebas">
                  KATEGORI PESERTA
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button
                    onClick={() => {
                      setFormData({...formData, categoryType: "prestasi"});
                      resetDependentFields('category');
                    }}
                    className={`p-8 rounded-xl border-2 transition-all duration-300 font-bebas text-4xl ${
                      formData.categoryType === "prestasi"
                        ? 'border-red bg-red text-white scale-105'
                        : 'border-red bg-white text-red hover:bg-[#cec3bd]'
                    }`}
                  >
                    <div>PRESTASI</div>
                    <div className="font-plex text-lg mt-2">(Berpengalaman)</div>
                  </button>
                  <button
                    onClick={() => {
                      setFormData({...formData, categoryType: "pemula"});
                      resetDependentFields('category');
                    }}
                    className={`p-8 rounded-xl border-2 transition-all duration-300 font-bebas text-4xl ${
                      formData.categoryType === "pemula"
                        ? 'border-red bg-red text-white scale-105'
                        : 'border-red bg-white text-red hover:bg-[#cec3bd]'
                    }`}
                  >
                    <div>PEMULA</div>
                    <div className="font-plex text-lg mt-2">(Pemula/Beginner)</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        const ageOptions = getAgeOptions();
        const weightOptions = getWeightOptions();

        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-4xl md:text-6xl font-bebas text-red mb-2">
                Detail Kategori
              </h2>
              <p className="text-black/70 font-plex">Langkah 2 dari {totalSteps}</p>
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="font-plex text-green-700 text-sm">
                  <strong>{formData.styleType?.toUpperCase()}</strong> - <strong>{formData.categoryType?.toUpperCase()}</strong>
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Gender - Always required */}
              <div>
                <label className="block text-black mb-3 text-lg font-plex font-semibold pl-2">
                  Jenis Kelamin <span className="text-red">*</span>
                </label>
                <LockedSelect
                  unstyled
                  options={genderOptions}
                  value={formData.selectedGender}
                  onChange={(value: OptionType | null) => {
                    setFormData({...formData, selectedGender: value});
                    resetDependentFields('gender');
                  }}
                  placeholder="Pilih jenis kelamin..."
                  isSearchable={false}
                  classNames={selectClassNames}
                  disabled={false}
                  message=""
                />
              </div>

              {/* Age Category - Required for prestasi */}
              {formData.categoryType === "prestasi" && (
                <div>
                  <label className="block text-black mb-3 text-lg font-plex font-semibold pl-2">
                    Kelas Umur <span className="text-red">*</span>
                  </label>
                  <LockedSelect
                    unstyled
                    options={ageOptions}
                    value={formData.selectedAge}
                    onChange={(value: OptionType | null) => {
                      setFormData({...formData, selectedAge: value});
                      resetDependentFields('age');
                    }}
                    placeholder={ageOptions.length > 0 ? "Pilih kelas umur..." : "Tidak ada kelas umur tersedia"}
                    isSearchable
                    classNames={selectClassNames}
                    disabled={!formData.selectedGender || ageOptions.length === 0}
                    message={!formData.selectedGender ? "Harap pilih jenis kelamin terlebih dahulu" : ""}
                  />
                  {ageOptions.length === 0 && formData.selectedGender && (
                    <p className="text-xs text-orange-600 mt-2 pl-2">
                      Tidak ada kelas umur tersedia untuk kombinasi yang dipilih
                    </p>
                  )}
                </div>
              )}

              {/* Weight Category - Required for kyorugi prestasi */}
              {formData.styleType === "kyorugi" && formData.categoryType === "prestasi" && (
                <div>
                  <label className="block text-black mb-3 text-lg font-plex font-semibold pl-2">
                    Kelas Berat <span className="text-red">*</span>
                  </label>
                  <LockedSelect
                    unstyled
                    options={weightOptions}
                    value={formData.selectedWeight}
                    onChange={(value: OptionType | null) => setFormData({...formData, selectedWeight: value})}
                    placeholder={weightOptions.length > 0 ? "Pilih kelas berat..." : "Tidak ada kelas berat tersedia"}
                    isSearchable={false}
                    classNames={selectClassNames}
                    disabled={!formData.selectedAge || !formData.selectedGender || weightOptions.length === 0}
                    message={!formData.selectedAge || !formData.selectedGender ? "Harap lengkapi pilihan di atas terlebih dahulu" : ""}
                  />
                  {weightOptions.length === 0 && formData.selectedAge && formData.selectedGender && (
                    <p className="text-xs text-orange-600 mt-2 pl-2">
                      Tidak ada kelas berat tersedia untuk kombinasi yang dipilih
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2 pl-2">
                    * Kelas berat akan divalidasi dengan berat badan atlet
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-4xl md:text-6xl font-bebas text-red mb-2">
                Registrasi Atlit
              </h2>
              <p className="text-black/70 font-plex">Langkah 3 dari {totalSteps}</p>
            </div>

            <div className="space-y-6">
              {availableAtlits.length === 0 ? (
                <div className="text-center py-8 bg-yellow-50 rounded-lg">
                  <p className="font-plex text-yellow-700">
                    {atlitList.length === 0 ? 
                      "Tidak ada data atlet tersedia!" : 
                      "Semua atlet sudah terdaftar untuk kompetisi ini!"
                    }
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-black mb-3 text-lg font-plex font-semibold pl-2">
                      Nama Atlit <span className="text-red">*</span>
                    </label>
                    <LockedSelect
                      unstyled
                      options={atlitOptions}
                      value={formData.selectedAtlit}
                      onChange={(value: OptionType | null) => setFormData({...formData, selectedAtlit: value})}
                      placeholder="Pilih nama atlit..."
                      isSearchable
                      classNames={selectClassNames}
                      disabled={!canProceedStep2() || loading.atlet}
                      message="Harap lengkapi data sebelumnya terlebih dahulu"
                    />
                    {atlitOptions.length < atlitList.length && atlitList.length > 0 && (
                      <p className="text-xs text-blue-600 mt-2 pl-2">
                        {atlitList.length - atlitOptions.length} atlet sudah terdaftar untuk kompetisi ini
                      </p>
                    )}
                  </div>

                  {selectedAtlitData && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-black mb-3 text-lg font-plex font-semibold pl-2">
                            Berat Badan (kg)
                          </label>
                          <TextInput
                            value={selectedAtlitData.bb?.toString() || "Tidak tersedia"}
                            placeholder="Berat badan"
                            className="h-12 w-full bg-gray-50"
                            onChange={() => {}}
                            disabled
                          />
                        </div>

                        <div>
                          <label className="block text-black mb-3 text-lg font-plex font-semibold pl-2">
                            Tinggi Badan (cm)
                          </label>
                          <TextInput
                            value={selectedAtlitData.tb?.toString() || "Tidak tersedia"}
                            placeholder="Tinggi badan"
                            className="h-12 w-full bg-gray-50"
                            onChange={() => {}}
                            disabled
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-black mb-3 text-lg font-plex font-semibold pl-2">
                            Provinsi
                          </label>
                          <TextInput
                            value={selectedAtlitData.provinsi || "Tidak tersedia"}
                            className="h-12 w-full bg-gray-50"
                            onChange={() => {}}
                            disabled
                          />
                        </div>

                        <div>
                          <label className="block text-black mb-3 text-lg font-plex font-semibold pl-2">
                            Belt/Sabuk
                          </label>
                          <TextInput
                            value={selectedAtlitData.belt || "Tidak tersedia"}
                            className="h-12 w-full bg-gray-50"
                            onChange={() => {}}
                            disabled
                          />
                        </div>
                      </div>

                      {/* Weight validation warning */}
                      {formData.styleType === "kyorugi" && 
                       formData.categoryType === "prestasi" && 
                       formData.selectedWeight && 
                       selectedAtlitData.bb && (
                        <div className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                          <p className="font-plex text-orange-700 text-sm">
                            <strong>Validasi Berat Badan:</strong> 
                            {(() => {
                              const atlitWeight = selectedAtlitData.bb;
                              const selectedWeightValue = formData.selectedWeight.value;
                              
                              const matchingWeightClass = selectedKompetisiClasses.find(kelas => 
                                kelas.kelas_berat?.nama_kelas === selectedWeightValue
                              );
                              
                              if (matchingWeightClass && matchingWeightClass.kelas_berat) {
                                const { batas_min, batas_max } = matchingWeightClass.kelas_berat;
                                const isValid = atlitWeight >= batas_min && atlitWeight <= batas_max;
                                
                                return isValid 
                                  ? ` ✓ Sesuai (${atlitWeight}kg untuk kategori ${batas_min}-${batas_max}kg)`
                                  : ` ⚠️ Tidak sesuai (${atlitWeight}kg untuk kategori ${batas_min}-${batas_max}kg)`;
                              }
                              
                              return ` Validasi tidak dapat dilakukan`;
                            })()}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen}>
      <div className="bg-gradient-to-b from-white/90 to-white/80 h-screen md:h-[85vh] w-screen md:w-[80vw] lg:w-[70vw] xl:w-[60vw] rounded-xl flex flex-col justify-start items-center overflow-y-scroll font-plex">
        <div className="w-full p-8">
          {/* Header dengan tombol back dan progress */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-black/50 hover:text-black transition-colors duration-300"
              disabled={loading.registration}
            >
              <ArrowLeft size={30} />
              <span className="text-xl font-plex">Back</span>
            </button>
            
            {/* Progress indicator */}
            <div className="hidden md:flex items-center space-x-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-300 ${
                      step === currentStep 
                        ? 'bg-red text-white' 
                        : step < currentStep 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {step}
                  </div>
                  {step < 3 && (
                    <div 
                      className={`w-12 h-1 mx-2 transition-colors duration-300 ${
                        step < currentStep ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Konten langkah */}
          <div className="px-4">
            {renderStepContent()}
          </div>

          {/* Tombol navigasi */}
          <div className="flex justify-between mt-12 px-4">
            <div></div>
            <div className="flex gap-4">
              {currentStep < totalSteps ? (
                <div className="flex items-center gap-2">
                  <GeneralButton
                    label="Selanjutnya"
                    onClick={handleNext}
                    className={`h-12 px-8 rounded-lg font-semibold transition-colors duration-300 ${
                      (currentStep === 1 ? canProceedStep1 : canProceedStep2())
                        ? 'bg-red text-white hover:bg-yellow hover:text-black'
                        : 'bg-gray-300 border-2 border-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  />
                  <ArrowRight size={20} className="hidden md:block text-gray-400" />
                </div>
              ) : (
                <GeneralButton
                  label={loading.registration ? "Mendaftarkan..." : "Daftar Sekarang"}
                  onClick={handleSubmit}
                  className={`h-12 px-8 rounded-lg font-semibold transition-colors duration-300 ${
                    canSubmit && availableAtlits.length > 0 && !loading.registration
                      ? 'bg-green-500 border-2 border-green-500 text-white hover:bg-green-600'
                      : 'bg-gray-300 border-2 border-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  disabled={!canSubmit || availableAtlits.length === 0 || loading.registration}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default UnifiedRegistration;