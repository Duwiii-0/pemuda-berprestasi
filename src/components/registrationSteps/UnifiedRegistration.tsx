// src/components/registrationSteps/UnifiedRegistration.tsx
import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Modal from "../modal";
import TextInput from "../textInput";
import { LockedSelect } from "../lockSelect";
import { useRegistration } from "../../context/RegistrationContext";
import GeneralButton from "../../components/generalButton";
import toast from "react-hot-toast";
import { apiClient } from "../../config/api";
import type { Atlit } from "../../context/RegistrationContext";
import { useAuth } from "../../context/authContext";

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
  biayaPendaftaran = 150000
}: UnifiedRegistrationProps) => {
  // Temporary mock functions until you implement the actual registration system
  
  
  
  const { token, user } = useAuth();  
  
  useEffect(() => {
      // Token handled by apiClient automatically
    }, [token]);
    
  const [currentStep, setCurrentStep] = useState(1);
  const {
  formData,
  setFormData,
  availableAtlits,
  fetchEligibleAtlits,
  ageOptions,
  weightOptions,
  poomsaeOptions,
  fetchAgeOptions,
  fetchWeightOptions,
  fetchKelasPoomsae,
  validateRegistration,           // ✅ ADD THIS
  registerAtlet,                 // ✅ ADD THIS  
  getRegistrationsByKompetisi,   // ✅ ADD THIS
  isPoomsaeTeam,                 // ✅ ADD THIS (replaces local function)
  fetchKelasKejuaraan,
  getSelectedAthletes            // ✅ ADD THIS

} = useRegistration();

const [, setExistingRegistrations] = useState<RegistrationType[]>([]);


useEffect(() => {
  if (isOpen) {
    fetchAgeOptions();
    // Fetch existing registrations for validation
    getRegistrationsByKompetisi(kompetisiId).then(registrations => {
      console.log("🎯 Loaded existing registrations:", registrations);
      setExistingRegistrations(registrations);
    });
  }
}, [isOpen, fetchAgeOptions, getRegistrationsByKompetisi, kompetisiId]);


  // Fetch kelas usia waktu modal dibuka
  useEffect(() => {
    if (isOpen) {
      fetchAgeOptions();
    }
  }, [isOpen, fetchAgeOptions]);

  // Fetch kelas berat kalau sudah pilih usia + gender (hanya untuk KYORUGI)
  useEffect(() => {
    if (formData.selectedAge && formData.selectedGender && formData.styleType === "KYORUGI") {
      fetchWeightOptions(Number(formData.selectedAge.value), formData.selectedGender.value as "LAKI_LAKI" | "PEREMPUAN");
    }
  }, [formData.selectedAge, formData.selectedGender, formData.styleType, fetchWeightOptions]);

  // ✅ UPDATED: fetch kelas poomsae jika styleType POOMSAE dan sudah pilih kelas umur
  useEffect(() => {
  if (formData.styleType === "POOMSAE") {
    let kelompokId = formData.selectedAge ? Number(formData.selectedAge.value) : undefined;

    // Otomatis pakai kelompokId 4 untuk pemula
    if (formData.categoryType === "pemula") {
      kelompokId = 4;
    }

    if (kelompokId) {
      fetchKelasPoomsae(kelompokId);
    }
  }
}, [formData.styleType, formData.selectedAge, formData.categoryType, fetchKelasPoomsae]);



  // fetch kelas kejuaraan
  useEffect(() => {
  if (!formData.styleType || !formData.categoryType || !user?.pelatih?.id_dojang) return;

  // Hanya fetch kalau prestasi dan sudah pilih usia
  if (formData.categoryType === "prestasi" && !formData.selectedAge) return;

  // Untuk KYORUGI, pastikan gender & weight tersedia
  if (formData.styleType === "KYORUGI" && (!formData.selectedGender || !formData.selectedWeight)) return;

  // Untuk POOMSAE, pastikan poomsae terpilih
  if (formData.styleType === "POOMSAE" && !formData.selectedPoomsae) return;

  const kelasFilter: any = {
    styleType: formData.styleType,
    categoryType: formData.categoryType,
  };

  if (formData.selectedGender) kelasFilter.gender = formData.selectedGender.value as "LAKI_LAKI" | "PEREMPUAN";
  if (formData.selectedAge) kelasFilter.kelompokId = Number(formData.selectedAge.value);
  if (formData.selectedWeight) kelasFilter.kelasBeratId = Number(formData.selectedWeight.value);
  if (formData.selectedPoomsae) kelasFilter.poomsaeId = Number(formData.selectedPoomsae.value);

  (async () => {
    try {
      const kelasId = await fetchKelasKejuaraan(kompetisiId, kelasFilter);
      if (kelasId) {
        console.log("✅ Kelas kejuaraan didapat:", kelasId);

        // Update formData untuk kelasKejuaraanId
        setFormData({
          ...formData,
          kelasKejuaraanId: kelasId,
        });
      }
    } catch (err) {
      console.error("❌ Gagal fetch kelas kejuaraan:", err);
    }
  })();
}, [
  formData.styleType,
  formData.categoryType,
  formData.selectedGender,
  formData.selectedAge,
  formData.selectedWeight,
  formData.selectedPoomsae,
  kompetisiId,
  user?.pelatih?.id_dojang,
  fetchKelasKejuaraan,
]);




  // ✅ UPDATED: useEffect untuk fetch eligible atlits dengan poomsae team support
  useEffect(() => {
    // Reset ketika tidak memenuhi criteria minimum
    if (!formData.styleType || !formData.categoryType || !user?.pelatih?.id_dojang) {
      return;
    }

    // Untuk kategori pemula, cukup gender saja (untuk kyorugi)
    if (formData.categoryType === "pemula") {
      // Pemula tetap perlu gender untuk semua style
      if (!formData.selectedGender) return;
      
      fetchEligibleAtlits(kompetisiId, {
        styleType: formData.styleType,
        gender: formData.selectedGender.value as "LAKI_LAKI" | "PEREMPUAN",
        umurId: 0, // dummy value untuk pemula
        beratBadanId: 0, // dummy value untuk pemula
        categoryType: formData.categoryType,
        dojangId: user.pelatih.id_dojang,
      });
      return;
    }

    // Untuk kategori prestasi, perlu kelas umur
    if (!formData.selectedAge) {
      return;
    }

    // Untuk KYORUGI prestasi, perlu gender dan kelas berat
    if (formData.styleType === "KYORUGI") {
      if (!formData.selectedGender || !formData.selectedWeight) {
        return;
      }
    }

    // ✅ UPDATED: Untuk POOMSAE prestasi
    if (formData.styleType === "POOMSAE") {
      if (!formData.selectedPoomsae) {
        return;
      }
      
      // Jika individu, perlu gender
      if (!isPoomsaeTeam() && !formData.selectedGender) {
        return;
      }
    }

    // Semua kriteria terpenuhi, fetch eligible atlits
    const filter: any = {
      styleType: formData.styleType,
      umurId: Number(formData.selectedAge.value),
      categoryType: formData.categoryType,
      dojangId: user.pelatih.id_dojang,
    };

    // ✅ FIXED: ONLY add gender if it's required for the specific category
    const shouldIncludeGender = (
      formData.styleType === "KYORUGI" || 
      (formData.styleType === "POOMSAE" && !isPoomsaeTeam())
    );

    if (shouldIncludeGender && formData.selectedGender) {
      filter.gender = formData.selectedGender.value as "LAKI_LAKI" | "PEREMPUAN";
    }

    // ✅ CONDITIONAL: Add weight for KYORUGI
    if (formData.styleType === "KYORUGI" && formData.selectedWeight) {
      filter.beratBadanId = Number(formData.selectedWeight.value);
    }

    // ✅ CONDITIONAL: Add poomsae for POOMSAE
    if (formData.styleType === "POOMSAE" && formData.selectedPoomsae) {
      filter.poomsaeId = Number(formData.selectedPoomsae.value);
      filter.beratBadanId = 0; // Not needed for POOMSAE
    }

    console.log("🚀 Fetching atlits with filter:", filter);
    fetchEligibleAtlits(kompetisiId, filter);
  }, [
    formData.styleType,
    formData.selectedGender,
    formData.selectedAge,
    formData.selectedWeight,
    formData.selectedPoomsae,
    formData.categoryType,
    user?.pelatih?.id_dojang,
    kompetisiId,
  ]);

  const totalSteps = 3;

  // Get existing registrations for this competition

  const genderOptions: OptionType[] = [
    { value: "LAKI_LAKI", label: "Laki-Laki" },
    { value: "PEREMPUAN", label: "Perempuan" }
  ];

  console.log("Debug availableAtlits:", {
    availableAtlits,
    isArray: Array.isArray(availableAtlits),
    length: availableAtlits?.length,
    isPoomsaeTeam: isPoomsaeTeam(),
    formData: {
      styleType: formData.styleType,
      categoryType: formData.categoryType,
      gender: formData.selectedGender?.value,
      age: formData.selectedAge?.value,
      weight: formData.selectedWeight?.value,
      poomsae: formData.selectedPoomsae?.value,
    }
  });

  const atlitOptions: OptionType[] = Array.isArray(availableAtlits)
    ? availableAtlits.map((a: Atlit) => ({
        value: a.id.toString(),
        label: a.nama,
      }))
    : [];

  const selectedAtlitData = (availableAtlits || []).find(
    (a) => a.id.toString() === formData.selectedAtlit?.value
  );

  // ✅ ADDED: For team poomsae, we need second athlete
  const selectedAtlit2Data = (availableAtlits || []).find(
    (a) => a.id.toString() === formData.selectedAtlit2?.value
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

  const TextInputDetail = ({ label, value }: { label: string; value?: string | number }) => (
  <div>
    <label className="block text-black mb-3 text-lg font-plex font-semibold pl-2">{label}</label>
    <TextInput
      value={value?.toString() || "Tidak tersedia"}
      className="h-12 w-full bg-gray-50"
      onChange={() => {}}
      disabled
    />
  </div>
);


  const handleNext = () => {
    if (currentStep === 1 && (!formData.styleType || !formData.categoryType)) {
      toast.error("Anda harus memilih style dan kategori terlebih dahulu!");
      return;
    }

    // ✅ UPDATED: Validation untuk step 2 dengan poomsae team logic
    if (currentStep === 2) {
      // Jika pemula, perlu gender
      if (formData.categoryType === "pemula" && !formData.selectedGender) {
        toast.error("Anda harus memilih jenis kelamin terlebih dahulu");
        return;
      }

      // Jika prestasi, perlu kelas umur
      if (formData.categoryType === "prestasi" && !formData.selectedAge) {
        toast.error("Anda harus memilih kelas umur terlebih dahulu");
        return;
      }

      // Untuk KYORUGI prestasi, perlu gender dan kelas berat
      if (formData.styleType === "KYORUGI" && formData.categoryType === "prestasi") {
        if (!formData.selectedGender) {
          toast.error("Anda harus memilih jenis kelamin terlebih dahulu");
          return;
        }
        if (!formData.selectedWeight) {
          toast.error("Anda harus memilih kelas berat terlebih dahulu");
          return;
        }
      }

      // ✅ UPDATED: Untuk POOMSAE prestasi
      if (formData.styleType === "POOMSAE" && formData.categoryType === "prestasi") {
        if (!formData.selectedPoomsae) {
          toast.error("Anda harus memilih kelas poomsae terlebih dahulu");
          return;
        }
        // Jika individu, perlu gender
        if (!isPoomsaeTeam() && !formData.selectedGender) {
          toast.error("Anda harus memilih jenis kelamin terlebih dahulu");
          return;
        }
      }
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
      // Reset field step sebelumnya
      if (currentStep === 2) {
        // Step 1 → reset styleType & categoryType
        setFormData({
          ...formData,
          styleType: null,
          categoryType: null,
          selectedAge: null,
          selectedWeight: null,
          selectedGender: null,
          selectedAtlit: null,
          selectedAtlit2: null, // ✅ ADDED
          selectedPoomsae: null
        });
      } else if (currentStep === 3) {
        // Step 2 → reset gender, age, weight, poomsae
        setFormData({
          ...formData,
          selectedGender: null,
          selectedAge: null,
          selectedWeight: null,
          selectedAtlit: null,
          selectedAtlit2: formData.styleType === "POOMSAE" && formData.selectedPoomsae ? null : formData.selectedAtlit2,
          selectedPoomsae: null
        });
      }

      setCurrentStep(currentStep - 1);
    } else {
      onClose();
    }
  };

const handleSubmit = async () => {
  try {
    console.log("🎯 Starting registration submission...");

    // Ambil kelasKejuaraanId & selected athletes dari context
    const kelasKejuaraanId = formData.kelasKejuaraanId;
    const selectedAthletes = getSelectedAthletes();

    // Validasi
    console.log("💡 Debug before validation:", { kelasKejuaraanId, selectedAthletes });
    const validation = validateRegistration(kelasKejuaraanId, selectedAthletes);
    console.log("📋 Validation result:", validation);

    if (!validation.isValid) {
      console.error("❌ Validation failed:", validation.errors);
      validation.errors.forEach(error => toast.error(error));
      return;
    }

    // Show warnings if any
    validation.warnings.forEach(warning => toast.error(warning));

    console.log("✅ Validation passed, proceeding with registration...");

    // Registrasi
    const result = await registerAtlet(kompetisiId, kelasKejuaraanId);
    
    if (result) {
      toast.success("Pendaftaran berhasil!");
      
      // Refresh existing registrations
      const updatedRegistrations = await getRegistrationsByKompetisi(kompetisiId);
      setExistingRegistrations(updatedRegistrations);
      
      setCurrentStep(1);
      onClose();
    }

  } catch (error: any) {
    console.error("❌ Registration error:", error);
    toast.error(error.message || "Gagal mendaftarkan atlet");
  }
};



  const canProceedStep1 = formData.styleType && formData.categoryType;
  
  // ✅ UPDATED: canProceedStep2 dengan logic poomsae team
  const canProceedStep2 = () => {
    // Jika pemula, cukup gender saja
    if (formData.categoryType === "pemula") {
      return !!formData.selectedGender;
    }
    
    // Jika prestasi, perlu kelas umur
    if (!formData.selectedAge) return false;
    
    // Jika kyorugi prestasi, perlu gender dan kelas berat
    if (formData.styleType === "KYORUGI" && formData.categoryType === "prestasi") {
      return !!(formData.selectedGender && formData.selectedWeight);
    }
    
    // ✅ UPDATED: Jika poomsae prestasi
    if (formData.styleType === "POOMSAE" && formData.categoryType === "prestasi") {
      if (!formData.selectedPoomsae) return false;
      
      // Jika individu, perlu gender juga
      if (!isPoomsaeTeam()) {
        return !!formData.selectedGender;
      }
      
      // Jika tim, tidak perlu gender
      return true;
    }
    
    return true;
  };

  // ✅ UPDATED: canSubmit dengan validation untuk team
  const canSubmit = () => {
    if (!canProceedStep2() || !formData.selectedAtlit) return false;
    
    // Jika poomsae team, perlu atlit kedua juga
    if (isPoomsaeTeam()) {
      return !!(formData.selectedAtlit2 && formData.selectedAtlit.value !== formData.selectedAtlit2.value &&
               formData.kelasKejuaraanId // ✅ pastikan kelas kejuaraan sudah ada
);
    }
    
    return true;
  };

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
                    onClick={() => setFormData({
                      ...formData, 
                      styleType: "KYORUGI", 
                      selectedAge: null, 
                      selectedWeight: null,
                      selectedPoomsae: null,
                      selectedAtlit2: null // ✅ ADDED
                    })}
                    className={`p-8 rounded-xl border-2 transition-all duration-300 font-bebas text-4xl ${
                      formData.styleType === "KYORUGI"
                        ? 'border-red bg-red text-white scale-105'
                        : 'border-red bg-white text-red hover:bg-[#cec3bd]'
                    }`}
                  >
                    <div>KYORUGI</div>
                    <div className="font-plex text-lg mt-2">(Tarung/Sparring)</div>
                  </button>
                  <button
                    onClick={() => setFormData({
                      ...formData, 
                      styleType: "POOMSAE", 
                      selectedWeight: null,
                      selectedPoomsae: null,
                      selectedAtlit2: null // ✅ ADDED
                    })}
                    className={`p-8 rounded-xl border-2 transition-all duration-300 font-bebas text-4xl ${
                      formData.styleType === "POOMSAE"
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
                    onClick={() => setFormData({
                      ...formData, 
                      categoryType: "pemula", 
                      selectedAge: null, 
                      selectedWeight: null,
                      selectedPoomsae: null,
                      selectedAtlit2: null // ✅ ADDED
                    })}
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
              {/* ✅ UPDATED: Kelas Umur - Show first for POOMSAE prestasi */}
              {formData.categoryType === "prestasi" && (
                <div>
                  <label className="block text-black mb-3 text-lg font-plex font-semibold pl-2">
                    Kelas Umur <span className="text-red">*</span>
                  </label>
                  <LockedSelect
                    unstyled
                    options={ageOptions}
                    value={formData.selectedAge}
                    onChange={(value: OptionType | null) => setFormData({
                      ...formData, 
                      selectedAge: value,
                      // Reset subsequent fields when age changes
                      selectedWeight: null,
                      selectedPoomsae: null,
                      selectedGender: null,
                      selectedAtlit: null,
                      selectedAtlit2: null // ✅ ADDED
                    })}
                    placeholder="Pilih kelas umur..."
                    isSearchable
                    classNames={selectClassNames}
                    disabled={false}
                    message=""
                  />
                </div>
              )}

              {/* ✅ UPDATED: Kelas Poomsae - Show after age for POOMSAE */}
              {formData.styleType === "POOMSAE" && (formData.categoryType === "prestasi" || formData.categoryType === "pemula") && (
                <div>
                  <label className="block text-black mb-3 text-lg font-plex font-semibold pl-2">
                    Kelas Poomsae <span className="text-red">*</span>
                  </label>
                  <LockedSelect
                    unstyled
                    options={poomsaeOptions}
                    value={formData.selectedPoomsae}
                    onChange={(value: OptionType | null) => setFormData({
                      ...formData, 
                      selectedPoomsae: value,
                      selectedGender: null, // Reset gender when poomsae changes
                      selectedAtlit: null,
                      selectedAtlit2: null // ✅ ADDED
                    })}
                    placeholder="Pilih kelas poomsae..."
                    isSearchable
                    classNames={selectClassNames}
                    disabled={false}
                    message="Harap pilih jenis kelamin terlebih dahulu"
                  />
                  {/* ✅ ADDED: Show info about team vs individual */}
                  {formData.selectedPoomsae && (
                    <p className="text-xs text-blue-600 mt-2 pl-2">
                      {isPoomsaeTeam() 
                        ? "Kategori Tim - Tidak perlu pilih jenis kelamin (bisa campuran)"
                        : "Kategori Individu - Perlu pilih jenis kelamin"
                      }
                    </p>
                  )}
                </div>
              )}

              {/* ✅ UPDATED: Gender - Conditional rendering */}
              {(
                formData.categoryType === "pemula" || 
                (formData.styleType === "KYORUGI" && formData.categoryType === "prestasi") ||
                (formData.styleType === "POOMSAE" && formData.categoryType === "prestasi" && !isPoomsaeTeam())
              ) && (
                <div>
                  <label className="block text-black mb-3 text-lg font-plex font-semibold pl-2">
                    Jenis Kelamin <span className="text-red">*</span>
                  </label>
                  <LockedSelect
                    unstyled
                    options={genderOptions}
                    value={formData.selectedGender}
                    onChange={(value: OptionType | null) => setFormData({
                      ...formData, 
                      selectedGender: value,
                      // Reset subsequent fields when gender changes
                      selectedWeight: null,
                      selectedAtlit: null,
                      selectedAtlit2: null // ✅ ADDED
                    })}
                    placeholder="Pilih jenis kelamin..."
                    isSearchable={false}
                    classNames={selectClassNames}
                    disabled={formData.styleType === "POOMSAE" && formData.categoryType === "prestasi" && !formData.selectedPoomsae}
                    message={formData.styleType === "POOMSAE" ? "Harap pilih kelas poomsae terlebih dahulu" : ""}
                  />
                </div>
              )}

              {/* Kelas Berat - Only for kyorugi prestasi, requires age and gender first */}
              {formData.styleType === "KYORUGI" && formData.categoryType === "prestasi" && (
                <div>
                  <label className="block text-black mb-3 text-lg font-plex font-semibold pl-2">
                    Kelas Berat <span className="text-red">*</span>
                  </label>
                  <LockedSelect
                    unstyled
                    options={weightOptions}
                    value={formData.selectedWeight}
                    onChange={(value: OptionType | null) => setFormData({
                      ...formData, 
                      selectedWeight: value,
                      selectedAtlit: null,
                      selectedAtlit2: null // ✅ ADDED
                    })}
                    placeholder="Pilih kelas berat..."
                    isSearchable={false}
                    classNames={selectClassNames}
                    disabled={!formData.selectedAge || !formData.selectedGender}
                    message="Harap pilih kelas umur dan jenis kelamin terlebih dahulu"
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
  {/* Header */}
  <div className="text-center">
    <h2 className="text-4xl md:text-6xl font-bebas text-red mb-2">
      Registrasi Atlit
    </h2>
    <p className="text-black/70 font-plex">Langkah 3 dari {totalSteps}</p>

    {/* Biaya Pendaftaran */}
    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
      <p className="font-plex text-blue-700 text-lg">
        <strong>
          Biaya Pendaftaran: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(biayaPendaftaran)}
        </strong>
      </p>
    </div>

    {/* Info Tim Poomsae */}
    {isPoomsaeTeam() && (
      <div className="mt-2 p-3 bg-purple-50 rounded-lg">
        <p className="font-plex text-purple-700 text-sm">
          <strong>Kategori Tim:</strong> {formData.selectedPoomsae?.label} - Pilih 2 atlet
        </p>
      </div>
    )}
  </div>

  {/* Form Atlet */}
  <div className="space-y-6">
    {availableAtlits.length === 0 ? (
      <div className="text-center py-8 bg-yellow-50 rounded-lg">
        <p className="font-plex text-yellow-700">
          Tidak ada atlet yang eligible atau semua atlet sudah terdaftar untuk kompetisi ini!
        </p>
      </div>
    ) : (
      <>
        {/* Atlet Pertama */}
        <div>
          <label className="block text-black mb-3 text-lg font-plex font-semibold pl-2">
            {isPoomsaeTeam() ? "Atlet Pertama" : "Nama Atlit"} <span className="text-red">*</span>
          </label>
          <LockedSelect
            unstyled
            options={atlitOptions}
            value={formData.selectedAtlit}
            onChange={(value: OptionType | null) => setFormData({
              ...formData,
              selectedAtlit: value,
              selectedAtlit2: formData.selectedAtlit2?.value === value?.value ? null : formData.selectedAtlit2
            })}
            placeholder="Pilih nama atlit..."
            isSearchable
            classNames={selectClassNames}
            disabled={!canProceedStep2()}
            message="Harap lengkapi data sebelumnya terlebih dahulu"
          />
        </div>

        {/* Atlet Kedua untuk Tim Poomsae */}
        {isPoomsaeTeam() && (
          <div>
            <label className="block text-black mb-3 text-lg font-plex font-semibold pl-2">
              Atlet Kedua <span className="text-red">*</span>
            </label>
            <LockedSelect
              unstyled
              options={atlitOptions.filter(option => option.value !== formData.selectedAtlit?.value)}
              value={formData.selectedAtlit2}
              onChange={(value: OptionType | null) => setFormData({ ...formData, selectedAtlit2: value })}
              placeholder="Pilih atlet kedua..."
              isSearchable
              classNames={selectClassNames}
              disabled={!formData.selectedAtlit}
              message="Harap pilih atlet pertama terlebih dahulu"
            />
            {formData.selectedAtlit && formData.selectedAtlit2?.value === formData.selectedAtlit.value && (
              <p className="text-xs text-red-600 mt-2 pl-2">
                Tidak dapat memilih atlet yang sama untuk kedua posisi
              </p>
            )}
          </div>
        )}

        {/* Detail Atlet Pertama */}
        {selectedAtlitData && (
          <div className="space-y-4">
            <h3 className="text-lg font-plex font-semibold text-black">
              Detail {isPoomsaeTeam() ? "Atlet Pertama" : "Atlet"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInputDetail label="Berat Badan (kg)" value={selectedAtlitData.bb} />
              <TextInputDetail label="Tinggi Badan (cm)" value={selectedAtlitData.tb} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInputDetail label="Provinsi" value={selectedAtlitData.provinsi} />
              <TextInputDetail label="Belt/Sabuk" value={selectedAtlitData.belt} />
            </div>
          </div>
        )}

        {/* Detail Atlet Kedua */}
        {isPoomsaeTeam() && selectedAtlit2Data && (
          <div className="space-y-4">
            <h3 className="text-lg font-plex font-semibold text-black">
              Detail Atlet Kedua
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInputDetail label="Berat Badan (kg)" value={selectedAtlit2Data.bb} />
              <TextInputDetail label="Tinggi Badan (cm)" value={selectedAtlit2Data.tb} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInputDetail label="Provinsi" value={selectedAtlit2Data.provinsi} />
              <TextInputDetail label="Belt/Sabuk" value={selectedAtlit2Data.belt} />
            </div>
          </div>
        )}

        {/* Kategori Poomsae */}
        {formData.styleType === "POOMSAE" && formData.selectedPoomsae && (
          <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
            <p className="font-plex text-blue-700 text-sm">
              <strong>Kategori Poomsae:</strong> {formData.selectedPoomsae.label}
              {isPoomsaeTeam() && (
                <span className="block mt-1">
                  <strong>Tim:</strong> Dapat memilih atlet dengan jenis kelamin berbeda
                </span>
              )}
            </p>
          </div>
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
      <div className="bg-gradient-to-b from-white/90 to-white/80 h-screen md:h-[vh] w-screen md:w-[80vw] lg:w-[70vw] xl:w-[60vw] rounded-xl flex flex-col justify-start items-center overflow-y-scroll font-plex">
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
                    canSubmit() && availableAtlits.length > 0
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