import React, { createContext, useContext, useState, useEffect } from "react";
import type { DummyAtlit } from "../dummy/dummyAtlit"; // ganti nanti ke model sebenarnya
import { apiClient } from "../../pemuda-berprestasi-mvp/src/config/api";
import { useAuth } from "../context/authContext"; // supaya bisa ambil pelatih.id_dojang dari login

interface AtlitContextType {
  atlits: DummyAtlit[];
  loading: boolean;
  fetchAtlits: () => Promise<void>;
  addAtlit: (atlit: Omit<DummyAtlit, "id">) => Promise<void>;
  updateAtlit: (atlit: DummyAtlit) => Promise<void>;
}

const AtlitContext = createContext<AtlitContextType | undefined>(undefined);

export const AtlitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [atlits, setAtlits] = useState<DummyAtlit[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth(); // misal user punya user.pelatih.id_dojang
  const id_dojang = user?.pelatih?.id_dojang;

  const fetchAtlits = async () => {
    if (!id_dojang) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/atlet/dojang/${id_dojang}?page=1&limit=50`);
      if (res?.data?.data) {
        setAtlits(res.data.data);
      } else {
        console.warn("Fetch atlits returned empty:", res);
        setAtlits([]);
      }
    } catch (err) {
      console.error("Failed to fetch atlits:", err);
    } finally {
      setLoading(false);
    }
  };

  const addAtlit = async (atlit: Omit<DummyAtlit, "id">) => {
    try {
      const res = await apiClient.post(`/atlet`, {
        ...atlit,
        id_dojang, // otomatis sama dengan dojang pelatih login
        id_pelatih_pembuat: user?.pelatih?.id_pelatih
      });
      setAtlits(prev => [...prev, res.data.data]); // data dari backend
    } catch (err) {
      console.error("Failed to add atlit:", err);
    }
  };

  const updateAtlit = async (atlit: DummyAtlit) => {
    try {
      const res = await apiClient.put(`/atlet/${atlit.id}`, atlit);
      setAtlits(prev => prev.map(a => a.id === atlit.id ? res.data.data : a));
    } catch (err) {
      console.error("Failed to update atlit:", err);
    }
  };

  useEffect(() => {
    fetchAtlits();
  }, [id_dojang]);

  return (
    <AtlitContext.Provider value={{ atlits, loading, fetchAtlits, addAtlit, updateAtlit }}>
      {children}
    </AtlitContext.Provider>
  );
};

export const useAtlit = () => {
  const context = useContext(AtlitContext);
  if (!context) throw new Error("useAtlit must be used within AtlitProvider");
  return context;
};
