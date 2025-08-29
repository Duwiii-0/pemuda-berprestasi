import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import {apiClient} from "../../pemuda-berprestasi-mvp/src/config/api";

type OptionType = { value: string; label: string };

export type Atlit = {
  id: number;
  nama: string;
  provinsi: string;
  bb?: number;
  tb?: number;
  belt?: string;
};

export type RegistrationFormData = {
  styleType: "kyorugi" | "poomsae" | null;
  categoryType: "prestasi" | "pemula" | null;
  selectedAge: OptionType | null;
  selectedWeight: OptionType | null;
  selectedGender: OptionType | null;
  selectedAtlit: OptionType | null;
};

type RegistrationContextType = {
  formData: RegistrationFormData;
  setFormData: (data: RegistrationFormData) => void;
  resetForm: () => void;
  availableAtlits: Atlit[];
  fetchEligibleAtlits: (kelasId: number) => Promise<void>;

  // ✅ tambahan untuk usia & berat
  ageOptions: OptionType[];
  weightOptions: OptionType[];
  fetchAgeOptions: () => Promise<void>;
  fetchWeightOptions: (ageId: number, gender: string) => Promise<void>;
};

const defaultFormData: RegistrationFormData = {
  styleType: null,
  categoryType: null,
  selectedAge: null,
  selectedWeight: null,
  selectedGender: null,
  selectedAtlit: null,
};

const RegistrationContext = createContext<RegistrationContextType>({
  formData: defaultFormData,
  setFormData: () => {},
  resetForm: () => {},
  availableAtlits: [],
  fetchEligibleAtlits: async () => {},

  // default kosong
  ageOptions: [],
  weightOptions: [],
  fetchAgeOptions: async () => {},
  fetchWeightOptions: async () => {},
});

export const useRegistration = () => useContext(RegistrationContext);

type Props = { children: ReactNode };

export const RegistrationProvider = ({ children }: Props) => {
  const [formData, setFormDataState] = useState<RegistrationFormData>(defaultFormData);
  const [availableAtlits, setAvailableAtlits] = useState<Atlit[]>([]);
  const [ageOptions, setAgeOptions] = useState<OptionType[]>([]);
  const [weightOptions, setWeightOptions] = useState<OptionType[]>([]);

  const setFormData = (data: RegistrationFormData) => setFormDataState(data);
  const resetForm = () => setFormDataState(defaultFormData);

  const fetchEligibleAtlits = async (kelasId: number) => {
  try {
    const res = await apiClient.get(`/atlet/eligible/${kelasId}`);
    const data: Atlit[] = await res.json();
    setAvailableAtlits(data);
  } catch (err) {
    console.error("Error fetching eligible atlits:", err);
    setAvailableAtlits([]);
  }
};

  const fetchAgeOptions = async () => {
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
  };




  const fetchWeightOptions = async (ageId: number, gender: string) => {
  try {
    const url = `/kelas/berat?kelompokId=${ageId}&jenis_kelamin=${gender}`;
    const data: { id_kelas_berat: number; nama_kelas: string }[] = await apiClient.get(url);

    if (!data || data.length === 0) {
      console.warn("No weight data returned from API");
      setWeightOptions([]);
      return;
    }
    console.log("Fetched weight data:", data);

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
};



  return (
    <RegistrationContext.Provider
      value={{
        formData,
        setFormData,
        resetForm,
        availableAtlits,
        fetchEligibleAtlits,
        ageOptions,
        weightOptions,
        fetchAgeOptions,
        fetchWeightOptions,
      }}
    >
      {children}
    </RegistrationContext.Provider>
  );
};
