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
  gender: "LAKI_LAKI" | "PEREMPUAN";
  umurId: number;
  beratBadanId: number;
  categoryType: "prestasi" | "pemula";
  poomsaeId?: number; // ✅ ADDED: Optional poomsae ID for POOMSAE style
};

export type RegistrationFormData = {
  styleType: "KYORUGI" | "POOMSAE" | null;
  categoryType: "prestasi" | "pemula" | null;
  selectedAge: OptionType | null;
  selectedWeight: OptionType | null;
  selectedGender: OptionType | null;
  selectedAtlit: OptionType | null;
  selectedPoomsae: OptionType | null; 
};

type RegistrationContextType = {
  formData: RegistrationFormData;
  setFormData: (data: RegistrationFormData) => void;
  resetForm: () => void;
  availableAtlits: Atlit[];
  ageOptions: OptionType[];
  weightOptions: OptionType[];
  fetchAgeOptions: () => Promise<void>;
  fetchWeightOptions: (ageId: number, gender: 'LAKI_LAKI'|'PEREMPUAN') => Promise<void>;
  fetchKelasKejuaraan: (kompetisiId: number, filter: KelasKejuaraanFilter) => Promise<number | null>;
  fetchEligibleAtlits: (
    kompetisiId: number,
    filter: KelasKejuaraanFilter & { dojangId: number }
  ) => Promise<void>;
  poomsaeOptions: OptionType[];
  fetchKelasPoomsae: (kelompokId: number) => Promise<void>;
};

const defaultFormData: RegistrationFormData = {
  styleType: null,
  categoryType: null,
  selectedAge: null,
  selectedWeight: null,
  selectedGender: null,
  selectedAtlit: null,
  selectedPoomsae: null, 
};

const RegistrationContext = createContext<RegistrationContextType>({
  formData: defaultFormData,
  setFormData: () => {},
  resetForm: () => {},
  availableAtlits: [],
  ageOptions: [],
  weightOptions: [],
  poomsaeOptions: [],
  fetchAgeOptions: async () => {},
  fetchWeightOptions: async () => {},
  fetchKelasPoomsae: async () => {},
  fetchKelasKejuaraan: async () => null,
  fetchEligibleAtlits: async () => {},
});

export const useRegistration = () => useContext(RegistrationContext);

type Props = { children: ReactNode };

export const RegistrationProvider = ({ children }: Props) => {
  const [formData, setFormDataState] = useState<RegistrationFormData>(defaultFormData);
  const [availableAtlits, setAvailableAtlits] = useState<Atlit[]>([]);
  const [ageOptions, setAgeOptions] = useState<OptionType[]>([]);
  const [weightOptions, setWeightOptions] = useState<OptionType[]>([]);
  const [poomsaeOptions, setPoomsaeOptions] = useState<OptionType[]>([]);

  const setFormData = (data: RegistrationFormData) => setFormDataState(data);
  const resetForm = () => setFormDataState(defaultFormData);

  const fetchAgeOptions = useCallback(async () => {
    try {
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
    }
  }, []);

  const fetchWeightOptions = useCallback(async (ageId: number, gender: 'LAKI_LAKI' | 'PEREMPUAN') => {
    try {
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
    }
  }, []);

  const fetchKelasPoomsae = useCallback(async (kelompokId: number) => {
    try {
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
    }
  }, []);

  const fetchKelasKejuaraan = useCallback(async (
    kompetisiId: number,
    filter: {
      styleType: "KYORUGI" | "POOMSAE";
      gender: "LAKI_LAKI" | "PEREMPUAN";
      categoryType: "prestasi" | "pemula";
      kelompokId?: number;
      kelasBeratId?: number;
      poomsaeId?: number; // ✅ ADDED: Include poomsae ID
    }
  ) => {
    try {
      const res = await apiClient.post(`/kelas/kejuaraan/${kompetisiId}/filter`, filter);
      if (!res) return null;
      return res.id_kelas_kejuaraan;
    } catch (err) {
      console.error("Error fetching kelas kejuaraan:", err);
      return null;
    }
  }, []);

  // ✅ UPDATED: Include poomsae in filter when calling fetchKelasKejuaraan
  const fetchEligibleAtlits = useCallback(async (
    kompetisiId: number,
    filter: KelasKejuaraanFilter & { dojangId: number }
  ) => {
    try {
      console.log("🔄 Fetching eligible atlits with filter:", filter);
      
      // 1. Dapatkan kelasId terlebih dahulu
      const kelasFilter = {
        styleType: filter.styleType,
        gender: filter.gender,
        categoryType: filter.categoryType,
        kelompokId: filter.umurId,
        kelasBeratId: filter.beratBadanId,
        poomsaeId: filter.poomsaeId, // ✅ ADDED
      };

      const kelasId = await fetchKelasKejuaraan(kompetisiId, kelasFilter);

      if (!kelasId) {
        console.warn("⚠️ No kelasId found for the given filter");
        setAvailableAtlits([]);
        return;
      }

      console.log("✅ KelasId found:", kelasId);

      // 2. Fetch eligible atlits dengan kelasId
      const response = await apiClient.post("/atlet/eligible", {
        kelasId,
        dojangId: filter.dojangId,
        gender: filter.gender,
        kelompokUsiaId: filter.umurId,
        kelasBeratId: filter.beratBadanId,
        // ✅ ADDED: Include poomsae ID in atlet eligibility check if needed
        ...(filter.poomsaeId ? { poomsaeId: filter.poomsaeId } : {}),
      });

      console.log("📊 API Response:", response);

      const data: Atlit[] = Array.isArray(response) ? response : [];
      
      console.log("👥 Available atlits:", data);
      setAvailableAtlits(data);
      
    } catch (err) {
      console.error("❌ Error fetching eligible atlits:", err);
      setAvailableAtlits([]);
    }
  }, [fetchKelasKejuaraan]);

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
        fetchAgeOptions,
        fetchWeightOptions,
        fetchKelasPoomsae,
        fetchKelasKejuaraan,
        fetchEligibleAtlits,
      }}
    >
      {children}
    </RegistrationContext.Provider>
  );
};