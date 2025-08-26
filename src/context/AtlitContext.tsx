// src/context/atletContext.tsx
import React, { createContext, useContext, useState } from "react";
import { useCallback } from "react";
import { apiClient } from "../../pemuda-berprestasi-mvp/src/config/api";

// Interface Atlet sesuai response API
export interface Atlet {
  id: string;
  nama_atlet: string;
  jenis_kelamin: "LAKI_LAKI" | "PEREMPUAN";
  tanggal_lahir: string;
  berat_badan?: number;      // Berat Badan
  tinggi_badan?: number;      // Tinggi Badan
  belt?: string;
  alamat?: string;
  provinsi?: string;
  phone?: string;
  nik?: string;
  umur?: number;
  // tambahkan field lain sesuai API
}

interface AtletContextType {
  atlits: Atlet[];
  fetchAllAtlits: () => Promise<void>;
  fetchAtletById: (id: string) => Promise<Atlet | undefined>;
  updateAtlet: (updated: Atlet) => void;
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
      console.error("Gagal fetch semua atlet:", err);
    }
  };

  // Fetch atlet berdasarkan ID
  const fetchAtletById = useCallback (async (id: string) => {
    let atlet = atlits.find(a => a.id === id);
    if (!atlet) {
      try {
        const res = await apiClient.get(`/atlet/${id}`);
        if (res.data) {
          atlet = res.data;
          setAtlits(prev => [...prev.filter(a => a.id !== id), atlet!]);
        }
      } catch (err) {
        console.error(`Gagal fetch atlet dengan ID ${id}:`, err);
      }
    }
    return atlet;
  }, []);

  // Update atlet di context
  const updateAtlet = (updated: Atlet) => {
    setAtlits(prev => prev.map(a => (a.id === updated.id ? updated : a)));
  };

  return (
    <AtletContext.Provider value={{ atlits, fetchAllAtlits, fetchAtletById, updateAtlet }}>
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
