// src/context/atletContext.tsx
import React, { createContext, useContext, useState } from "react";
import { useCallback } from "react";
import { apiClient } from "../config/api";

// Interface Atlet sesuai response API
export interface Atlet {
  id_atlet: number;
  nama_atlet: string;
  jenis_kelamin: "LAKI_LAKI" | "PEREMPUAN";
  tanggal_lahir: string;
  berat_badan?: number; // Berat Badan
  tinggi_badan?: number; // Tinggi Badan
  belt?: string;
  alamat?: string;
  provinsi?: string;
  no_telp?: string;
  nik?: string;
  umur?: number;
  akte_kelahiran?: string; // ADD THIS
  pas_foto?: string; // ADD THIS
  sertifikat_belt?: string; // ADD THIS
  ktp?: string;
  peserta_kompetisi?: {
    kelas_kejuaraan: {
      kompetisi: {
        id_kompetisi: number;
      };
    };
  }[];
  // tambahkan field lain sesuai API
}

export type CreateAtletPayload = Omit<Atlet, "id_atlet" | "umur">;

export type UpdateAtletPayload = {
  id_atlet: number; // wajib, untuk identify
  nama_atlet?: string;
  nik?: string;
  tanggal_lahir?: string;
  jenis_kelamin?: "LAKI_LAKI" | "PEREMPUAN";
  tinggi?: number;
  berat?: number;
  no_telp?: string;
  alamat?: string;
  umur?: number;
  id_dojang?: string;
  id_pelatih?: string;
};

export const genderOptions = [
  { value: "LAKI_LAKI", label: "Laki-Laki" },
  { value: "PEREMPUAN", label: "Perempuan" },
];

export const beltOptions = [
  { value: "putih", label: "Putih/Geup 10" },
  { value: "kuning", label: "Kuning/Geup 9" },
  { value: "kuningHijau", label: "Kuning strip Hijau/Geup 8" },
  { value: "hijau", label: "Hijau/Geup 7" },
  { value: "hijauBiru", label: "Hijau strip Biru/Geup 6" },
  { value: "biru", label: "Biru/Geup 5" },
  { value: "biruMerah", label: "Biru strip Merah/Geup 4" },
  { value: "merah", label: "Merah/Geup 3" },
  { value: "merahHitam1", label: "Merah strip Hitam 1/Geup 2j" },
  { value: "merahHitam2", label: "Merah strip Hitam 2/Geup 1" },
  { value: "hitam1", label: "Hitam/Dan 1" },
  { value: "hitam2", label: "Hitam/Dan 2" },
  { value: "hitam3", label: "Hitam/Dan 3" },
  { value: "hitam4", label: "Hitam/Dan 4" },
  { value: "hitam5", label: "Hitam/Dan 5" },
  { value: "hitam6", label: "Hitam/Dan 6" },
  { value: "hitam7", label: "Hitam/Dan 7" },
  { value: "hitam8", label: "Hitam/Dan 8" },
];

export const calculateAge = (birthDate: string): number => {
  if (!birthDate) return 0;
  return new Date().getFullYear() - new Date(birthDate).getFullYear();
};

interface AtletContextType {
  atlits: Atlet[];
  fetchAllAtlits: () => Promise<void>;
  fetchAtletById: (id: number) => Promise<Atlet | undefined>;
  updateAtlet: (id: number, formData: FormData) => Promise<Atlet | undefined>;
  createAtlet: (formData: FormData) => Promise<Atlet | undefined>; // ⬅️ tambah
}

const AtletContext = createContext<AtletContextType | undefined>(undefined);

export const AtletProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [atlits, setAtlits] = useState<Atlet[]>([]);

  // Fetch semua atlet
  const fetchAllAtlits = async () => {
    try {
      console.log("📋 Fetching all atlits");

      const response = await apiClient.get("/atlet");
      console.log("✅ Fetch all response:", response);

      // FIXED: Extract data properly
      const atletData = response.data || response;

      if (atletData && Array.isArray(atletData)) {
        setAtlits(atletData);
      } else {
        console.warn("⚠️ Expected array but got:", typeof atletData);
      }
    } catch (err: any) {
      console.error("❌ Gagal fetch semua atlet:", err.message);
    }
  };

  // Fetch atlet berdasarkan ID
  // Fetch atlet berdasarkan ID - FIXED VERSION
  const fetchAtletById = useCallback(
    async (id: number, forceRefresh = false) => {
      // If forceRefresh is true, skip cache and make API call
      let atlet = forceRefresh
        ? undefined
        : atlits.find((a) => a.id_atlet === id);

      if (!atlet) {
        try {
          console.log(
            `🔍 Fetching atlet with ID: ${id} (forceRefresh: ${forceRefresh})`
          );

          const response = await apiClient.get(`/atlet/${id}`);
          console.log("📋 Fetch response:", response);

          // FIXED: Extract data properly
          atlet = response.data || response;

          if (atlet) {
            // Update the context with fresh data
            setAtlits((prev) => [
              ...prev.filter((a) => a.id_atlet !== id),
              atlet!,
            ]);
          }
        } catch (err: any) {
          console.error(`❌ Gagal fetch atlet dengan ID ${id}:`, err.message);
        }
      }
      return atlet;
    },
    [atlits]
  );

  const createAtlet = async (formData: FormData) => {
    try {
      console.log("🚀 AtletContext: Calling API with FormData");

      // Debug: Log FormData contents
      console.log("📤 FormData contents:");
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(
            `${key}: File - ${value.name} (${value.size} bytes, ${value.type})`
          );
        } else {
          console.log(`${key}: ${value}`);
        }
      }

      const response = await apiClient.postFormData("/atlet", formData);

      console.log("✅ API Response:", response);

      // FIXED: Extract data from response object
      const newAtlet = response.data || response;

      console.log("👤 New Atlet Data:", newAtlet);

      // Update context dengan data yang benar
      if (newAtlet && newAtlet.id_atlet) {
        setAtlits((prev) => [...prev, newAtlet]);
      }

      return newAtlet;
    } catch (err: any) {
      console.error("❌ AtletContext Error:", err);
      console.error("❌ Error Message:", err.message);
      console.error("❌ Error Stack:", err.stack);

      // Re-throw dengan pesan yang lebih jelas
      throw new Error(err.message || "Gagal membuat atlet");
    }
  };

  // Update atlet di context
  const updateAtlet = async (id: number, formData: FormData) => {
    try {
      console.log(`🔄 Updating atlet ID: ${id}`);

      const response = await apiClient.putFormData(`/atlet/${id}`, formData);
      console.log("✅ Update response:", response);
      console.log(
        "📋 Response data structure:",
        JSON.stringify(response, null, 2)
      );

      // Check if it's nested in response.data.data
      const updatedAtlet = response.data?.data || response.data || response;
      console.log("🎯 Extracted atlet data:", updatedAtlet);
      console.log("🏷️ Updated nama_atlet:", updatedAtlet?.nama_atlet);

      if (updatedAtlet) {
        setAtlits((prev) =>
          prev.map((a) => (a.id_atlet === id ? updatedAtlet : a))
        );
        return updatedAtlet;
      }
    } catch (err: any) {
      console.error(`❌ Gagal update atlet dengan ID ${id}:`, err.message);
      throw new Error(err.message || "Gagal update atlet");
    }
  };

  return (
    <AtletContext.Provider
      value={{
        atlits,
        fetchAllAtlits,
        fetchAtletById,
        updateAtlet,
        createAtlet,
      }}
    >
      {children}
    </AtletContext.Provider>
  );
};

// Hook untuk pakai context
export const useAtletContext = () => {
  const context = useContext(AtletContext);
  if (!context)
    throw new Error("useAtletContext harus digunakan dalam AtletProvider");
  return context;
};
