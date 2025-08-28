// src/context/kompetisiContext.tsx
import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { apiClient } from "../../pemuda-berprestasi-mvp/src/config/api"; // pastikan path sesuai

export interface Kompetisi {
  id_penyelenggara: number;
  tanggal_mulai: Date;
  tanggal_selesai: Date;
  nama_event: string;
  status: 'PENDAFTARAN' | 'SEDANG_DIMULAI' | 'SELESAI';
  lokasi?: string;
}

interface KompetisiContextType {
  kompetisiList: Kompetisi[];
  loading: boolean;
  error: string | null;
  fetchKompetisiList: () => Promise<void>;
}

const KompetisiContext = createContext<KompetisiContextType | undefined>(undefined);

export const KompetisiProvider = ({ children }: { children: ReactNode }) => {
  const [kompetisiList, setKompetisiList] = useState<Kompetisi[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchKompetisiList = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get("/kompetisi"); // endpoint GET /
      setKompetisiList(data.data || []); // asumsi API balikin { data, message, pagination }
    } catch (err: any) {
      setError(err.data?.message || err.message || "Gagal mengambil data kompetisi");
    } finally {
      setLoading(false);
    }
  };



  return (
    <KompetisiContext.Provider value={{ kompetisiList, loading, error, fetchKompetisiList }}>
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
