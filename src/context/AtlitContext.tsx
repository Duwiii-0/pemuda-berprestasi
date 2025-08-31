// src/context/atletContext.tsx
import React, { createContext, useContext, useState } from "react";
import { useCallback } from "react";
import { apiClient } from "../../pemuda-berprestasi-mvp/src/config/api";

// Interface Atlet sesuai response API
export interface Atlet {
  id_atlet: number;
  nama_atlet: string;
  jenis_kelamin: "LAKI_LAKI" | "PEREMPUAN";
  tanggal_lahir: string;
  berat_badan?: number;      // Berat Badan
  tinggi_badan?: number;      // Tinggi Badan
  belt?: string;
  alamat?: string;
  provinsi?: string;
  no_telp?: string;
  nik?: string;
  umur?: number;
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
    { value: "putih", label: "Putih" },
    { value: "kuning", label: "Kuning" },
    { value: "kuningHijau", label: "Kuning strip Hijau" },
    { value: "hijau", label: "Hijau" },
    { value: "hijauBiru", label: "Hijau strip Biru" },
    { value: "biru", label: "Biru" },
    { value: "biruMerah", label: "Biru strip Merah" },
    { value: "merah", label: "Merah" },
    { value: "merahHitam", label: "Merah strip Coklat" },
    { value: "coklat", label: "Coklat" },
    { value: "hitam", label: "Hitam" },
  ];

export const calculateAge = (birthDate: string): number => {
  if (!birthDate) return 0;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

interface AtletContextType {
  atlits: Atlet[];
  fetchAllAtlits: () => Promise<void>;
  fetchAtletById: (id: number) => Promise<Atlet | undefined>;
  updateAtlet: (updated: Atlet) => Promise<Atlet | undefined>;
  createAtlet: (formData: FormData) => Promise<Atlet | undefined>; // ⬅️ tambah
}

const AtletContext = createContext<AtletContextType | undefined>(undefined);

export const AtletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [atlits, setAtlits] = useState<Atlet[]>([]);

  // Fetch semua atlet
  const fetchAllAtlits = async () => {
    try {
      const res = await apiClient.get("/atlet"); // endpoint fetch semua atlet
      if (res.data && Array.isArray(res.data)) setAtlits(res.data);
    } catch (err) {
      console.error("Gagal fetch semua atlet:");
    }
  };

  // Fetch atlet berdasarkan ID
  const fetchAtletById = useCallback (async (id: number) => {
    let atlet = atlits.find(a => a.id_atlet === id);
    if (!atlet) {
      try {
        const res = await apiClient.get(`/atlet/${id}`);
        if (res.data) {
          atlet = res.data;
          setAtlits(prev => [...prev.filter(a => a.id_atlet !== id), atlet!]);
        }
      } catch (err) {
        console.error(`Gagal fetch atlet dengan ID`);
      }
    }
    return atlet;
  }, []);

const createAtlet = async (formData: FormData) => {
  try {
    const data = await apiClient.postFormData("/atlet", formData); // ✅ pakai postFormData
    const id_dojang = Number(data.id_dojang);
    const id_pelatih = Number(data.id_pelatih);
    setAtlits(prev => [...prev, data]);
    return data;
  } catch (err) {
    console.error("Error creating athlete:");
    throw err;
  }
};

// Update atlet di context
const updateAtlet = async (updated: Atlet) => {
  try {
    const res = await apiClient.put(`/atlet/${updated.id_atlet}`, updated);
    if (res.data) {
      setAtlits(prev =>
        prev.map(a => (a.id_atlet === updated.id_atlet ? res.data : a))
      );
      return res.data; // return biar caller bisa pakai data terbaru
    }
  } catch (err) {
    console.error(`Gagal update atlet dengan ID`);
    throw err; // biar bisa ditangkap di UI
  }
};



  return (
    <AtletContext.Provider value={{ atlits, fetchAllAtlits, fetchAtletById, updateAtlet, createAtlet }}>
      {children}
    </AtletContext.Provider>
  );
};

// Hook untuk pakai context
export const useAtletContext = () => {
  const context = useContext(AtletContext);
  if (!context) throw new Error("useAtletContext harus digunakan dalam AtletProvider");
  return context;
};  
