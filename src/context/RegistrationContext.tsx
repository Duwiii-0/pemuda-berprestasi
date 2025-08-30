  import { createContext, useContext, useState, useCallback } from "react";
  import type { ReactNode } from "react";
  import { apiClient } from "../../pemuda-berprestasi-mvp/src/config/api";

  type OptionType = { value: string; label: string };

  export type Atlit = {
    id: number;
    nama: string;
    provinsi: string;
    bb?: number;
    tb?: number;
    belt?: string;
  };

  type KelasKejuaraanFilter = {
    styleType: "KYORUGI" | "POOMSAE";
    gender?: "LAKI_LAKI" | "PEREMPUAN";
    umurId: number;
    beratBadanId: number;
    categoryType: "prestasi" | "pemula";
    poomsaeId?: number;
  };

  export type RegistrationFormData = {
    styleType: "KYORUGI" | "POOMSAE" | null;
    categoryType: "prestasi" | "pemula" | null;
    selectedAge: OptionType | null;
    selectedWeight: OptionType | null;
    selectedGender: OptionType | null;
    selectedAtlit: OptionType | null;
    selectedPoomsae: OptionType | null; 
    selectedAtlit2: OptionType | null; // For team/pair poomsae
    kelasKejuaraanId: number | null; // Store the class ID for registration
  };

  // Registration payload types
  export type RegistrationPayload = {
    atlitId: number;
    kelasKejuaraanId: number;
    atlitId2?: number; // For team/pair registrations
  };

  export type RegistrationResponse = {
    id: number;
    atlitId: number;
    kelasKejuaraanId: number;
    atlitId2?: number;
    createdAt: string;
    updatedAt: string;
  };

  export type RegistrationType = {
    id: number;
    atlitId: number;
    kompetisiId: number;
    kelasKejuaraanId: number;
    atlitId2?: number;
    createdAt: string;
    updatedAt: string;
    // Add other fields as needed
  };


  // Validation result type
  export type ValidationResult = {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };

  type RegistrationContextType = {
    formData: RegistrationFormData;
    setFormData: (data: RegistrationFormData) => void;
    resetForm: () => void;
    availableAtlits: Atlit[];
    ageOptions: OptionType[];
    weightOptions: OptionType[];
    poomsaeOptions: OptionType[];
    isLoading: boolean;
    
    // Fetch functions
    fetchAgeOptions: () => Promise<void>;
    fetchWeightOptions: (ageId: number, gender: 'LAKI_LAKI'|'PEREMPUAN') => Promise<void>;
    fetchKelasKejuaraan: (kompetisiId: number, filter: KelasKejuaraanFilter) => Promise<number | null>;
    fetchEligibleAtlits: (
      kompetisiId: number,
      filter: KelasKejuaraanFilter & { dojangId: number }
    ) => Promise<void>;
    fetchKelasPoomsae: (kelompokId: number) => Promise<void>;
    
    // Registration functions
    validateRegistration: (kelasKejuaraanId: number | null, selectedAthletes: Atlit[]) => ValidationResult;
    registerAtlet: (kompetisiId: number, kelasKejuaraanId: number | null) => Promise<RegistrationResponse | null>;
    getRegistrationsByKompetisi: (kompetisiId: number) => Promise<RegistrationType[]>; // ✅ ADD THIS

    // Utility functions
    isPoomsaeTeam: () => boolean;
    requiresTwoAthletes: () => boolean;
    getSelectedAthletes: () => Atlit[];
  };

  const defaultFormData: RegistrationFormData = {
    styleType: null,
    categoryType: null,
    selectedAge: null,
    selectedWeight: null,
    selectedGender: null,
    selectedAtlit: null,
    selectedPoomsae: null,
    selectedAtlit2: null,
    kelasKejuaraanId: null,
  };

  const RegistrationContext = createContext<RegistrationContextType>({
    formData: defaultFormData,
    setFormData: () => {},
    resetForm: () => {},
    availableAtlits: [],
    ageOptions: [],
    weightOptions: [],
    poomsaeOptions: [],
    isLoading: false,
    fetchAgeOptions: async () => {},
    fetchWeightOptions: async () => {},
    fetchKelasPoomsae: async () => {},
    fetchKelasKejuaraan: async () => null,
    fetchEligibleAtlits: async () => {},
    validateRegistration: () => ({ isValid: false, errors: [], warnings: [] }),
    registerAtlet: async () => null,
    isPoomsaeTeam: () => false,
    requiresTwoAthletes: () => false,
    getSelectedAthletes: () => [],
    getRegistrationsByKompetisi: async () => [], // ✅ ADD THIS
    
  });

  export const useRegistration = () => useContext(RegistrationContext);

  type Props = { children: ReactNode };

  export const RegistrationProvider = ({ children }: Props) => {
    const [formData, setFormDataState] = useState<RegistrationFormData>(defaultFormData);
    const [availableAtlits, setAvailableAtlits] = useState<Atlit[]>([]);
    const [ageOptions, setAgeOptions] = useState<OptionType[]>([]);
    const [weightOptions, setWeightOptions] = useState<OptionType[]>([]);
    const [poomsaeOptions, setPoomsaeOptions] = useState<OptionType[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [existingRegistrations, setExistingRegistrations] = useState<RegistrationType[]>([]); // ✅ ADD THIS

    const setFormData = (data: RegistrationFormData) => setFormDataState(data);
    const resetForm = () => setFormDataState(defaultFormData);

    // ✅ UTILITY: Check if current selection is poomsae team/pair
    const isPoomsaeTeam = useCallback(() => {
      const { selectedPoomsae } = formData;
      if (!selectedPoomsae) return false;
      
      // Assuming team/pair poomsae has "beregu" or "berpasangan" in the name
      const label = selectedPoomsae.label.toLowerCase();
      return label.includes('beregu') || label.includes('berpasangan') || label.includes('team');
    }, [formData.selectedPoomsae]);

    // ✅ UTILITY: Check if requires two athletes
    const requiresTwoAthletes = useCallback(() => {
      return formData.styleType === "POOMSAE" && isPoomsaeTeam();
    }, [formData.styleType, isPoomsaeTeam]);

    // ✅ UTILITY: Get selected athletes array
    const getSelectedAthletes = useCallback(() => {
      const athletes: Atlit[] = [];
      
      if (formData.selectedAtlit) {
        const atlit1 = availableAtlits.find(a => a.id.toString() === formData.selectedAtlit?.value);
        if (atlit1) athletes.push(atlit1);
      }
      
      if (formData.selectedAtlit2 && requiresTwoAthletes()) {
        const atlit2 = availableAtlits.find(a => a.id.toString() === formData.selectedAtlit2?.value);
        if (atlit2) athletes.push(atlit2);
      }
      
      return athletes;
    }, [formData.selectedAtlit, formData.selectedAtlit2, availableAtlits, requiresTwoAthletes]);

    const fetchAgeOptions = useCallback(async () => {
      try {
        setIsLoading(true);
        const data: { id_kelompok: number; nama_kelompok: string }[] =
          await apiClient.get("/kelas/kelompok-usia");

        setAgeOptions(
          data.map((umur) => ({
            value: umur.id_kelompok.toString(),
            label: umur.nama_kelompok,
          }))
        );
      } catch (err) {
        console.error("Error fetching age options:", err);
        setAgeOptions([]);
      } finally {
        setIsLoading(false);
      }
    }, []);

    const fetchWeightOptions = useCallback(async (ageId: number, gender: 'LAKI_LAKI' | 'PEREMPUAN') => {
      try {
        setIsLoading(true);
        const url = `/kelas/berat?kelompokId=${ageId}&jenis_kelamin=${gender}`;
        const data: { id_kelas_berat: number; nama_kelas: string }[] = await apiClient.get(url);

        if (!data || data.length === 0) {
          console.warn("No weight data returned from API");
          setWeightOptions([]);
          return;
        }
        
        setWeightOptions(
          data.map((w) => ({
            value: w.id_kelas_berat.toString(),
            label: w.nama_kelas,
          }))
        );
      } catch (err) {
        console.error("Error fetching weight options:", err);
        setWeightOptions([]);
      } finally {
        setIsLoading(false);
      }
    }, []);

    const fetchKelasPoomsae = useCallback(async (kelompokId: number) => {
      try {
        setIsLoading(true);
        if (!kelompokId) {
          setPoomsaeOptions([]);
          return;
        }

        const data: { id_poomsae: number; nama_kelas: string }[] =
          await apiClient.get(`/kelas/poomsae?kelompokId=${kelompokId}`);

        if (!data || data.length === 0) {
          setPoomsaeOptions([]);
          return;
        }

        setPoomsaeOptions(
          data.map((kp) => ({
            value: kp.id_poomsae.toString(),
            label: kp.nama_kelas,
          }))
        );
      } catch (err) {
        console.error("Error fetching kelas poomsae:", err);
        setPoomsaeOptions([]);
      } finally {
        setIsLoading(false);
      }
    }, []);

  const fetchKelasKejuaraan = useCallback(async (
    kompetisiId: number,
    filter: {
      styleType: "KYORUGI" | "POOMSAE";
      gender?: "LAKI_LAKI" | "PEREMPUAN";
      categoryType: "prestasi" | "pemula";
      kelompokId?: number;
      kelasBeratId?: number;
      poomsaeId?: number;
    }
  ) => {
    try {
      const payload: any = {
        styleType: filter.styleType,
        categoryType: filter.categoryType,
      };

      if (filter.gender) {
        payload.gender = filter.gender;
      }

      if (filter.kelompokId) {
        payload.kelompokId = filter.kelompokId;
      }

      if (filter.kelasBeratId) {
        payload.kelasBeratId = filter.kelasBeratId;
      }

      if (filter.poomsaeId) {
        payload.poomsaeId = filter.poomsaeId;
      }

      console.log("🚀 [fetchKelasKejuaraan] Request Details:", {
        url: `/kelas/kejuaraan/${kompetisiId}/filter`,
        method: "POST",
        kompetisiId: kompetisiId,
        originalFilter: filter,
        requestPayload: payload,
        timestamp: new Date().toISOString()
      });

      const res = await apiClient.post(`/kelas/kejuaraan/${kompetisiId}/filter`, payload);
      
      console.log("📥 [fetchKelasKejuaraan] API Response:", {
        success: !!res,
        hasIdKelasKejuaraan: !!(res?.id_kelas_kejuaraan),
        fullResponse: res,
        responseType: typeof res,
        responseKeys: res ? Object.keys(res) : [],
        kelasKejuaraanId: res?.id_kelas_kejuaraan
      });

      if (!res) {
        console.warn("⚠️ [fetchKelasKejuaraan] No response from API");
        return null;
      }

      if (!res.id_kelas_kejuaraan) {
        console.warn("⚠️ [fetchKelasKejuaraan] Response received but missing id_kelas_kejuaraan:", {
          response: res,
          availableFields: Object.keys(res)
        });
        return null;
      }

      console.log("✅ [fetchKelasKejuaraan] Success:", {
        kelasKejuaraanId: res.id_kelas_kejuaraan,
        forFilter: {
          styleType: filter.styleType,
          categoryType: filter.categoryType,
          gender: filter.gender || "NOT_SPECIFIED",
          kelompokId: filter.kelompokId,
          poomsaeId: filter.poomsaeId
        }
      });

      return res.id_kelas_kejuaraan;
      
    } catch (err: any) {
      console.error("❌ [fetchKelasKejuaraan] API Error:", {
        error: err,
        errorMessage: err.message,
        httpStatus: err.status || err.response?.status,
        apiResponse: err.response?.data,
        requestFilter: filter,
        kompetisiId: kompetisiId,
        timestamp: new Date().toISOString()
      });
      return null;
    }
  }, []);

    const fetchEligibleAtlits = useCallback(async (
      kompetisiId: number,
      filter: KelasKejuaraanFilter & { dojangId: number }
    ) => {
      try {
        setIsLoading(true);
        console.log("🔄 Fetching eligible atlits with filter:", filter);
        
        // For team poomsae without gender, fetch both genders and combine
        if (filter.styleType === "POOMSAE" && !filter.gender && filter.poomsaeId) {
          console.log("🎯 Fetching mixed gender team for poomsae");
          
          try {
            const maleKelasId = await fetchKelasKejuaraan(kompetisiId, {
              ...filter,
              gender: "LAKI_LAKI"
            });

            const femaleKelasId = await fetchKelasKejuaraan(kompetisiId, {
              ...filter,
              gender: "PEREMPUAN"
            });

            const allAtlets: Atlit[] = [];

            if (maleKelasId) {
              try {
                const maleResponse = await apiClient.post("/atlet/eligible", {
                  kelasId: maleKelasId,
                  dojangId: filter.dojangId,
                  gender: "LAKI_LAKI",
                  kelompokUsiaId: filter.umurId,
                  kelasBeratId: filter.beratBadanId,
                  poomsaeId: filter.poomsaeId,
                });
                
                if (Array.isArray(maleResponse)) {
                  allAtlets.push(...maleResponse);
                }
              } catch (maleErr) {
                console.warn("Failed to fetch male athletes:", maleErr);
              }
            }

            if (femaleKelasId) {
              try {
                const femaleResponse = await apiClient.post("/atlet/eligible", {
                  kelasId: femaleKelasId,
                  dojangId: filter.dojangId,
                  gender: "PEREMPUAN",
                  kelompokUsiaId: filter.umurId,
                  kelasBeratId: filter.beratBadanId,
                  poomsaeId: filter.poomsaeId,
                });
                
                if (Array.isArray(femaleResponse)) {
                  allAtlets.push(...femaleResponse);
                }
              } catch (femaleErr) {
                console.warn("Failed to fetch female athletes:", femaleErr);
              }
            }

            console.log("👥 Combined athletes (male + female):", allAtlets);
            setAvailableAtlits(allAtlets);
            return;
            
          } catch (teamErr) {
            console.error("❌ Error fetching team athletes:", teamErr);
            setAvailableAtlits([]);
            return;
          }
        }

        // Single gender flow (kyorugi, individual poomsae, etc.)
        const kelasFilter = {
          styleType: filter.styleType,
          categoryType: filter.categoryType,
          kelompokId: filter.umurId,
          kelasBeratId: filter.beratBadanId,
          poomsaeId: filter.poomsaeId,
          ...(filter.gender ? { gender: filter.gender } : {}),
        };

        const kelasId = await fetchKelasKejuaraan(kompetisiId, kelasFilter);

        if (!kelasId) {
          console.warn("⚠️ No kelasId found for the given filter");
          setAvailableAtlits([]);
          return;
        }

        console.log("✅ KelasId found:", kelasId);

        // Store kelasId in form data for registration
        setFormDataState(prev => ({
          ...prev,
          kelasKejuaraanId: kelasId
        }));

        const atlitPayload: any = {
          kelasId,
          dojangId: filter.dojangId,
          kelompokUsiaId: filter.umurId,
          kelasBeratId: filter.beratBadanId,
        };

        if (filter.gender) {
          atlitPayload.gender = filter.gender;
        }

        if (filter.poomsaeId) {
          atlitPayload.poomsaeId = filter.poomsaeId;
        }

        console.log("🚀 Sending atlet payload:", atlitPayload);

        const response = await apiClient.post("/atlet/eligible", atlitPayload);
        const data: Atlit[] = Array.isArray(response) ? response : [];
        
        console.log("👥 Available atlits:", data);
        setAvailableAtlits(data);
        
      } catch (err) {
        console.error("❌ Error fetching eligible atlits:", err);
        setAvailableAtlits([]);
      } finally {
        setIsLoading(false);
      }
    }, [fetchKelasKejuaraan]);

  const getRegistrationsByKompetisi = useCallback(async (kompetisiId: number): Promise<RegistrationType[]> => {
      try {
        setIsLoading(true);
        
        // Fetch existing registrations for this competition
        const response = await apiClient.get(`/kompetisi/${kompetisiId}/atlet`);
        const data: RegistrationType[] = Array.isArray(response) ? response : [];
        
        // Store in state for caching
        setExistingRegistrations(data);
        
        console.log(`📋 Found ${data.length} existing registrations for competition ${kompetisiId}`);
        return data;
        
      } catch (err) {
        console.error("Error fetching existing registrations:", err);
        setExistingRegistrations([]);
        return [];
      } finally {
        setIsLoading(false);
      }
    }, []);

    // ✅ UPDATED: Enhanced validation that checks for duplicate registrations
    const validateRegistration = useCallback(
    (kelasKejuaraanId: number | null, selectedAthletes: Atlit[]): ValidationResult => {
      const errors: string[] = [];
      const warnings: string[] = [];

      if (!kelasKejuaraanId) {
        errors.push("Kelas kejuaraan tidak ditemukan");
      }

      if (!formData.styleType) {
        errors.push("Style type (KYORUGI/POOMSAE) harus dipilih");
      }

      if (!formData.categoryType) {
        errors.push("Category type (prestasi/pemula) harus dipilih");
      }

      if (!formData.selectedAge) {
        errors.push("Kelompok usia harus dipilih");
      }

      if (!formData.selectedAtlit) {
        errors.push("Atlet pertama harus dipilih");
      }

      // Style-specific
      if (formData.styleType === "KYORUGI") {
        if (!formData.selectedWeight) {
          errors.push("Kelas berat harus dipilih untuk Kyorugi");
        }
        if (!formData.selectedGender) {
          errors.push("Jenis kelamin harus dipilih untuk Kyorugi");
        }
      }

      if (formData.styleType === "POOMSAE") {
        if (!formData.selectedPoomsae) {
          errors.push("Kelas poomsae harus dipilih");
        }

        if (isPoomsaeTeam()) {
          if (!formData.selectedAtlit2) {
            errors.push("Atlet kedua harus dipilih untuk poomsae beregu/berpasangan");
          }

          if (
            formData.selectedAtlit &&
            formData.selectedAtlit2 &&
            formData.selectedAtlit.value === formData.selectedAtlit2.value
          ) {
            errors.push("Atlet pertama dan kedua tidak boleh sama");
          }

          if (selectedAthletes.length < 2) {
            errors.push("Kedua atlet harus tersedia dan eligible");
          }
        }
      }

      if (selectedAthletes.length === 0) {
        errors.push("Tidak ada atlet yang dipilih atau eligible");
      }

      if (formData.styleType === "POOMSAE" && isPoomsaeTeam()) {
        warnings.push("Pastikan kedua atlet siap untuk berkompetisi sebagai tim");
      }

      return { isValid: errors.length === 0, errors, warnings };
    },
    [formData, isPoomsaeTeam]
  );


    // ✅ REGISTRATION: Main registration function
    const registerAtlet = useCallback(
    async (kompetisiId: number, kelasKejuaraanId: number | null): Promise<RegistrationResponse | null> => {
      try {
        setIsLoading(true);

        const selectedAthletes = getSelectedAthletes();

        // Validasi langsung pakai kelasKejuaraanId dan selectedAthletes
        console.log("💡 Debug before validation:", { kelasKejuaraanId, selectedAthletes });
        const validation = validateRegistration(kelasKejuaraanId, selectedAthletes);
        if (!validation.isValid) {
          throw new Error(`Validasi gagal: ${validation.errors.join(', ')}`);
        }

        const payload: RegistrationPayload = {
          atlitId: Number(selectedAthletes[0].id),
          kelasKejuaraanId: kelasKejuaraanId!,
        };

        if (requiresTwoAthletes() && selectedAthletes[1]) {
          payload.atlitId2 = Number(selectedAthletes[1].id);
        }

        console.log("🎯 Registering with payload:", payload);

        const response = await apiClient.post(`/kompetisi/${kompetisiId}/register`, payload);

        if (!response) throw new Error("Gagal mendaftarkan atlet");

        console.log("✅ Registration successful:", response);

        // Reset form
        resetForm();
        setAvailableAtlits([]);

        return response as RegistrationResponse;

      } catch (err: any) {
        console.error("❌ Registration error:", err);
        throw new Error(err.message || "Gagal mendaftarkan atlet");
      } finally {
        setIsLoading(false);
      }
    },
    [getSelectedAthletes, requiresTwoAthletes, resetForm, validateRegistration]
  );


    return (
      <RegistrationContext.Provider
        value={{
          formData,
          setFormData,
          resetForm,
          availableAtlits,
          ageOptions,
          weightOptions,
          poomsaeOptions,
          isLoading,
          fetchAgeOptions,
          fetchWeightOptions,
          fetchKelasPoomsae,
          fetchKelasKejuaraan,
          fetchEligibleAtlits,
          validateRegistration,
          registerAtlet,
          getRegistrationsByKompetisi, // ✅ ADD THIS
          isPoomsaeTeam,
          requiresTwoAthletes,
          getSelectedAthletes,
        }}
      >
        {children}
      </RegistrationContext.Provider>
    );
  };