// src/components/registrationSteps/UnifiedRegistration.tsx
import { useState } from "react";
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Modal from "../modal";
import TextInput from "../textInput";
import { LockedSelect } from "../lockSelect";
import { dummyAtlits } from "../../dummy/dummyAtlit";
import GeneralButton from "../../components/generalButton";
import toast from "react-hot-toast";
type UnifiedRegistrationProps = {
  isOpen: boolean;
  onClose: () => void;
  kompetisiId?: number;
  kompetisiName?: string;
  biayaPendaftaran?: number;
};

type OptionType = { value: string; label: string };

// Type untuk registration object
type RegistrationType = {
  atlitId: number;
  kompetisiId: number;
  // tambahkan properti lain sesuai kebutuhan
};

const UnifiedRegistration = ({
  isOpen,
  onClose,
  kompetisiId = 1, // default value
  kompetisiName = "Kejuaraan Karate Nasional 2024",
  biayaPendaftaran = 150000
}: UnifiedRegistrationProps) => {
  // Temporary mock functions until you implement the actual registration system
  const addRegistration = (data: any) => {
    console.log("Registration data:", data);
    toast.success("Pendaftaran berhasil!");
  };
  
  const getRegistrationsByKompetisi = (id: number): RegistrationType[] => {
    // Return empty array for now - replace with actual implementation later
    return [];
  };
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

  // Get existing registrations for this competition
  const existingRegistrations = getRegistrationsByKompetisi(kompetisiId ?? 1);
  const registeredAtlitIds = existingRegistrations.map((reg: RegistrationType) => reg.atlitId);

  // Filter out already registered athletes
  const availableAtlits = dummyAtlits.filter(
    atlit => atlit.id !== undefined && !registeredAtlitIds.includes(atlit.id)
  );

  // Options untuk form
  const ageOptions: OptionType[] = formData.styleType === "poomsae" 
    ? [
        { value: "Cadet", label: "Cadet (14-17 tahun)" },
        { value: "Junior", label: "Junior (18-30 tahun)" },
        { value: "Senior", label: "Senior (30-40 tahun)" },
        { value: "Master", label: "Master (40+ tahun)" }
      ]
    : [
        { value: "Cadet", label: "Cadet (14-17 tahun)" },
        { value: "Junior", label: "Junior (18-32 tahun)" },
        { value: "Senior", label: "Senior (33+ tahun)" }
      ];

  const weightOptions: OptionType[] = [
    { value: "-54", label: "Fin (Under 54 kg)" },
    { value: "-58", label: "Fly (Under 58 kg)" },
    { value: "-63", label: "Bantam (Under 63 kg)" },
    { value: "-68", label: "Feather (Under 68 kg)" },
    { value: "-74", label: "Light (Under 74 kg)" },
    { value: "-80", label: "Welter (Under 80 kg)" },
    { value: "-87", label: "Middle (Under 87 kg)" },
    { value: "+87", label: "Heavy (Over 87 kg)" }
  ];

  const genderOptions: OptionType[] = [
    { value: "Laki-Laki", label: "Laki-Laki" },
    { value: "Perempuan", label: "Perempuan" }
  ];

  const atlitOptions: OptionType[] = availableAtlits
    .filter(a => a.id !== undefined)
    .map((a) => ({
      value: a.id!.toString(),
      label: `${a.name} - ${a.provinsi}`,
    }));

  const selectedAtlitData = availableAtlits.find(
    (a) => a.id.toString() === formData.selectedAtlit?.value
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
    if (currentStep === 1 && (!formData.styleType || !formData.categoryType)) {
      toast.error("Anda harus memilih style dan kategori terlebih dahulu!");
      return;
    }

    if (currentStep === 2 && (!formData.selectedGender)){
      toast.error("Anda harus memilih gender terlebih dahulu");
      return
    }

    if (currentStep === 3 && (!formData.selectedAtlit)){
      toast.error("Anda harus memilih atlit terlebih dahulu");
      return
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

  const handleSubmit = () => {
    if (!selectedAtlitData || selectedAtlitData.id === undefined) {
      toast.error("Data atlet tidak ditemukan!");
      return;
    }
    if (!formData.selectedAtlit){
      toast.error("Anda harus memilih atlit terlebih dahulu");
      return
    }

    // Validate weight category for kyorugi
    if (formData.styleType === "kyorugi" && formData.categoryType === "prestasi" && selectedAtlitData.bb) {
      const atlitWeight = selectedAtlitData.bb;
      const selectedWeightValue = formData.selectedWeight?.value;
      
      let isValidWeight = false;
      if (selectedWeightValue === "+87" && atlitWeight > 87) isValidWeight = true;
      else if (selectedWeightValue && selectedWeightValue !== "+87") {
        const maxWeight = parseInt(selectedWeightValue.replace("-", ""));
        isValidWeight = atlitWeight <= maxWeight;
      }
      
      if (!isValidWeight) {
        toast.error(`Berat badan atlet (${atlitWeight}kg) tidak sesuai dengan kategori yang dipilih!`);
        return;
      }
    }

    const registrationData = {
      atlitId: selectedAtlitData.id,
      atlitName: selectedAtlitData.name,
      kompetisiId: kompetisiId ?? 1,
      kompetisiName,
      styleType: formData.styleType!,
      categoryType: formData.categoryType!,
      gender: formData.selectedGender!.value as "Laki-Laki" | "Perempuan",
      ageCategory: formData.selectedAge?.value,
      weightCategory: formData.selectedWeight?.value,
      biayaPendaftaran
    };

    addRegistration(registrationData);
    
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
  };

  const canProceedStep1 = formData.styleType && formData.categoryType;
  
  // Untuk step 2: berurutan gender -> kelas umur -> kelas berat (jika perlu)
  const canProceedStep2 = () => {
    if (!formData.selectedGender) return false;
    
    // Jika pemula, cukup gender saja
    if (formData.categoryType === "pemula") return true;
    
    // Jika prestasi, perlu kelas umur
    if (!formData.selectedAge) return false;
    
    // Jika kyorugi prestasi, perlu kelas berat juga
    if (formData.styleType === "kyorugi" && formData.categoryType === "prestasi") {
      return !!formData.selectedWeight;
    }
    
    return true;
  };

  const canSubmit = canProceedStep2() && formData.selectedAtlit;

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
                    onClick={() => setFormData({...formData, styleType: "kyorugi", selectedAge: null, selectedWeight: null})}
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
                    onClick={() => setFormData({...formData, styleType: "poomsae", selectedWeight: null})}
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
                    onClick={() => setFormData({...formData, categoryType: "prestasi"})}
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
                    onClick={() => setFormData({...formData, categoryType: "pemula", selectedAge: null, selectedWeight: null})}
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
              {/* Gender - Always first and required */}
              <div>
                <label className="block text-black mb-3 text-lg font-plex font-semibold pl-2">
                  Jenis Kelamin <span className="text-red">*</span>
                </label>
                <LockedSelect
                  unstyled
                  options={genderOptions}
                  value={formData.selectedGender}
                  onChange={(value: OptionType | null) => setFormData({...formData, selectedGender: value})}
                  placeholder="Pilih jenis kelamin..."
                  isSearchable={false}
                  classNames={selectClassNames}
                  disabled={false}
                  message=""
                />
              </div>

              {/* Kelas Umur - Only for non-pemula, requires gender first */}
              {formData.categoryType !== "pemula" && (
                <div>
                  <label className="block text-black mb-3 text-lg font-plex font-semibold pl-2">
                    Kelas Umur <span className="text-red">*</span>
                  </label>
                  <LockedSelect
                    unstyled
                    options={ageOptions}
                    value={formData.selectedAge}
                    onChange={(value: OptionType | null) => setFormData({...formData, selectedAge: value})}
                    placeholder="Pilih kelas umur..."
                    isSearchable
                    classNames={selectClassNames}
                    disabled={!formData.selectedGender}
                    message="Harap pilih jenis kelamin terlebih dahulu"
                  />
                </div>
              )}

              {/* Kelas Berat - Only for kyorugi prestasi, requires age first */}
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
                    placeholder="Pilih kelas berat..."
                    isSearchable={false}
                    classNames={selectClassNames}
                    disabled={!formData.selectedAge}
                    message="Harap pilih kelas umur terlebih dahulu"
                  />
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
              {/* Display biaya pendaftaran */}
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="font-plex text-blue-700 text-lg">
                  <strong>Biaya Pendaftaran: {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                  }).format(biayaPendaftaran)}</strong>
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {availableAtlits.length === 0 ? (
                <div className="text-center py-8 bg-yellow-50 rounded-lg">
                  <p className="font-plex text-yellow-700">
                    Semua atlet sudah terdaftar untuk kompetisi ini!
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
                      disabled={!canProceedStep2()}
                      message="Harap lengkapi data sebelumnya terlebih dahulu"
                    />
                    {atlitOptions.length < dummyAtlits.length && (
                      <p className="text-xs text-blue-600 mt-2 pl-2">
                        {dummyAtlits.length - atlitOptions.length} atlet sudah terdaftar untuk kompetisi ini
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
                            onChange={() => toast.error("Berat badan tidak bisa diedit, silahkan edit di dalam data atlit")}
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
                            onChange={() => toast.error("Tinggi badan tidak bisa diedit, silahkan edit di dalam data atlit")}
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
                            value={selectedAtlitData.provinsi}
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
                              
                              if (selectedWeightValue === "+87") {
                                return atlitWeight > 87 
                                  ? ` ✓ Sesuai (${atlitWeight}kg untuk kategori Over 87kg)`
                                  : ` ⚠️ Tidak sesuai (${atlitWeight}kg untuk kategori Over 87kg)`;
                              } else {
                                const maxWeight = parseInt(selectedWeightValue.replace("-", ""));
                                return atlitWeight <= maxWeight 
                                  ? ` ✓ Sesuai (${atlitWeight}kg untuk kategori Under ${maxWeight}kg)`
                                  : ` ⚠️ Tidak sesuai (${atlitWeight}kg untuk kategori Under ${maxWeight}kg)`;
                              }
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
                  label="Daftar Sekarang"
                  onClick={handleSubmit}
                  className={`h-12 px-8 rounded-lg font-semibold transition-colors duration-300 ${
                    canSubmit && availableAtlits.length > 0
                      ? 'bg-green-500 border-2 border-green-500 text-white hover:bg-green-600'
                      : 'bg-gray-300 border-2 border-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
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