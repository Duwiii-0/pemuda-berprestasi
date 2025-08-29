// src/context/kompetisiContext.tsx
import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { apiClient } from "../../pemuda-berprestasi-mvp/src/config/api";

export interface Atlet {
  id_atlet: number;
  nama_atlet: string;
  umur: number;
  jenis_kelamin: 'LAKI_LAKI' | 'PEREMPUAN';
  dojang?: {
    id_dojang: number;
    nama_dojang: string;
    kota?: string;
    provinsi?: string;
  };
}

export interface Kompetisi {
  id_penyelenggara: number;
  tanggal_mulai: Date;
  tanggal_selesai: Date;
  nama_event: string;
  status: 'PENDAFTARAN' | 'SEDANG_DIMULAI' | 'SELESAI';
  lokasi?: string;
}

export interface KompetisiContextType {
  kompetisiList: Kompetisi[];
  atletList: Atlet[];
  loadingKompetisi: boolean;
  loadingAtlet: boolean;
  errorKompetisi: string | null;
  errorAtlet: string | null;
  fetchKompetisiList: () => Promise<void>;
  fetchAtletByKompetisi: (id_kompetisi: number, cabang?: 'kyorugi' | 'poomsae', page?: number, limit?: number) => Promise<void>;
}

const KompetisiContext = createContext<KompetisiContextType | undefined>(undefined);

export const KompetisiProvider = ({ children }: { children: ReactNode }) => {
  const [kompetisiList, setKompetisiList] = useState<Kompetisi[]>([]);
  const [atletList, setAtletList] = useState<Atlet[]>([]);
  const [loadingKompetisi, setLoadingKompetisi] = useState(false);
  const [loadingAtlet, setLoadingAtlet] = useState(false);
  const [errorKompetisi, setErrorKompetisi] = useState<string | null>(null);
  const [errorAtlet, setErrorAtlet] = useState<string | null>(null);

  const fetchKompetisiList = async () => {
    setLoadingKompetisi(true);
    setErrorKompetisi(null);
    try {
      const data = await apiClient.get("/kompetisi");
      setKompetisiList(data.data || []); // asumsi API balikin { data, message, pagination }
    } catch (err: any) {
      setErrorKompetisi(err.data?.message || err.message || "Gagal mengambil data kompetisi");
    } finally {
      setLoadingKompetisi(false);
    }
  };

  const fetchAtletByKompetisi = async (id_kompetisi: number, cabang?: 'kyorugi' | 'poomsae', page = 1, limit = 20) => {
    setLoadingAtlet(true);
    setErrorAtlet(null);
    try {
      let url = `/kompetisi/${id_kompetisi}/atlet?page=${page}&limit=${limit}`;
      if (cabang) url += `&cabang=${cabang}`; // misal query param untuk filter cabang
      const res = await apiClient.get(url);
      setAtletList(res.data.data || []);
    } catch (err: any) {
      setErrorAtlet(err.data?.message || err.message || "Gagal mengambil data atlet kompetisi");
    } finally {
      setLoadingAtlet(false);
    }
  };

  return (
    <KompetisiContext.Provider value={{
      kompetisiList,
      atletList,
      loadingKompetisi,
      loadingAtlet,
      errorKompetisi,
      errorAtlet,
      fetchKompetisiList,
      fetchAtletByKompetisi
    }}>
      {children}
    </KompetisiContext.Provider>
  );
};

export const useKompetisi = () => {
  const context = useContext(KompetisiContext);
  if (!context) {
    throw new Error("useKompetisi must be used within a KompetisiProvider");
  }
  return context;
};
