// src/context/dojangContext.tsx
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import toast from "react-hot-toast";
import { apiClient } from "../../pemuda-berprestasi-mvp/src/config/api"; // import apiClient

type OptionType = { value: string; label: string };

type Dojang = {
  id_dojang: number;
  nama_dojang: string;
  provinsi?: string;
  jumlah_atlet?: number;
  created_at: string;
  // tambahkan field lain sesuai kebutuhan
};

type DojangContextType = {
  dojangOptions: OptionType[];
  dojangs: Dojang[];
  isLoading: boolean;
  refreshDojang: () => Promise<void>; // <- ubah dari void ke Promise<void>
};

const DojangContext = createContext<DojangContextType>({
  dojangOptions: [],
  dojangs: [],
  isLoading: false,
  refreshDojang: async () => {},
});

export const useDojang = () => useContext(DojangContext);

type Props = { children: ReactNode };

export const DojangProvider = ({ children }: Props) => {
  const [dojangOptions, setDojangOptions] = useState<OptionType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dojangs, setDojangs] = useState<Dojang[]>([]);

  const fetchDojang = async (): Promise<void>  => {
  setIsLoading(true);
  try {
    const data = await apiClient.get("/dojang/listdojang");

    const options: OptionType[] = data.data?.map((item: any) => ({
      value: item.id_dojang.toString(),
      label: item.nama_dojang,
    })) || [];

    const listDojang: Dojang[] = data.data?.map((item: any) => ({
      id_dojang: item.id_dojang,
      nama_dojang: item.nama_dojang,
      provinsi: item.provinsi,
      jumlah_atlet: item.jumlah_atlet, // <- sudah dikirim dari backend
      created_at: item.created_at,
    })) || [];


    setDojangOptions(options);
    setDojangs(listDojang);
  } catch (err: any) {
    console.error("Gagal mengambil data dojang:");
    toast.error("Tidak dapat mengambil data dojang");
    throw err; 
  } finally {
    setIsLoading(false);
  }
};

const refreshDojang = async (): Promise<void> => fetchDojang();

  return (
    <DojangContext.Provider value={{ dojangOptions, dojangs, isLoading, refreshDojang }}>
      {children}
    </DojangContext.Provider>
  );
};
