// src/context/kompetisiContext.tsx
import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { apiClient } from "../config/api";

export interface Atlet {
  id_atlet: number;
  id_peserta_kompetisi: number;
  nama_atlet: string;
  kategori: string;
  umur: number;
  jenis_kelamin: "LAKI_LAKI" | "PEREMPUAN";
  berat_badan?: string;
  belt?: string;
  status?: "PENDING" | "APPROVED" | "REJECTED";
  tim?: any[];
  dojang?: {
    id_dojang: number;
    nama_dojang: string;
    kota?: string;
    provinsi?: string;
  };
}

export interface Kompetisi {
  id_kompetisi: number;
  tanggal_mulai: Date;
  tanggal_selesai: Date;
  nama_event: string;
  status: "PENDAFTARAN" | "SEDANG_DIMULAI" | "SELESAI";
  lokasi?: string;
  jumlah_peserta?: number;
}

export interface KelasKejuaraan {
  id_kelas_kejuaraan: number;
  id_kategori_event: number;
  id_kelompok?: number;
  id_kelas_berat?: number;
  id_poomsae?: number;
  id_kompetisi: number;
  cabang: "POOMSAE" | "KYORUGI";
  nama_kelas?: string;
  kategori_event: {
    id_kategori_event: number;
    nama_kategori: string;
  };
  kelompok?: {
    id_kelompok: number;
    nama_kelompok: string;
    usia_min: number;
    usia_max: number;
  };
  kelas_berat?: {
    id_kelas_berat: number;
    jenis_kelamin: "LAKI_LAKI" | "PEREMPUAN";
    batas_min: number;
    batas_max: number;
    nama_kelas: string;
  };
  poomsae?: {
    id_poomsae: number;
    nama_kelas: string;
  };
  _count?: {
    peserta_kompetisi: number;
  };
}

export interface KompetisiDetail extends Kompetisi {
  id_kompetisi: number;
  penyelenggara?: {
    id_penyelenggara: number;
    nama_penyelenggara: string;
  };
  kelas_kejuaraan?: KelasKejuaraan[];
  _count?: {
    kelas_kejuaraan: number;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PesertaKompetisi {
  id_peserta_kompetisi: number;
  id_atlet: number | null;
  id_kelas_kejuaraan: number;
  is_team: boolean;
  status: "PENDING" | "APPROVED" | "REJECTED";

  atlet?: {
    id_atlet: number;
    nama_atlet: string;
    tanggal_lahir: string;
    nik: string;
    berat_badan: number;
    provinsi: string;
    kota?: string;
    belt: string;
    alamat?: string;
    no_telp?: string;
    tinggi_badan: number;
    jenis_kelamin: "LAKI_LAKI" | "PEREMPUAN";
    umur?: number;
    dojang: {
      id_dojang: number;
      nama_dojang: string;
      email?: string;
      no_telp?: string;
      founder?: string;
      negara?: string;
      provinsi?: string;
      kota?: string;
    };
  };

  kelas_kejuaraan: {
    id_kelas_kejuaraan: number;
    id_kategori_event: number;
    id_kelompok?: number;
    id_kelas_berat?: number;
    id_poomsae?: number;
    id_kompetisi: number;
    cabang: "POOMSAE" | "KYORUGI";
    kategori_event: {
      id_kategori_event: number;
      nama_kategori: string;
    };
    kelompok?: {
      id_kelompok: number;
      nama_kelompok: string;
      usia_min: number;
      usia_max: number;
    };
    kelas_berat?: {
      id_kelas_berat: number;
      jenis_kelamin: "LAKI_LAKI" | "PEREMPUAN";
      batas_min: number;
      batas_max: number;
      nama_kelas: string;
    };
    poomsae?: {
      id_poomsae: number;
      nama_kelas: string;
    };
  };

  anggota_tim?: {
    id: number;
    id_peserta_kompetisi: number;
    id_atlet: number;
    atlet: {
      id_atlet: number;
      nama_atlet: string;
      tanggal_lahir: string;
      nik: string;
      berat_badan: number;
      provinsi: string;
      kota?: string;
      belt: string;
      alamat?: string;
      no_telp?: string;
      tinggi_badan: number;
      jenis_kelamin: "LAKI_LAKI" | "PEREMPUAN";
      umur?: number;
      dojang: {
        id_dojang: number;
        nama_dojang: string;
        email?: string;
        no_telp?: string;
        founder?: string;
        negara?: string;
        provinsi?: string;
        kota?: string;
      };
    };
  }[];
}

export interface KompetisiContextType {
  kompetisiList: Kompetisi[];
  kompetisiDetail: KompetisiDetail | null;
  pesertaList: PesertaKompetisi[];
  kelasKejuaraanList: KelasKejuaraan[];
  atletPagination: PaginationMeta;

  loadingKompetisi: boolean;
  loadingAtlet: boolean;
  loadingKelasKejuaraan: boolean;
  errorKompetisi: string | null;
  errorAtlet: string | null;
  errorKelasKejuaraan: string | null;

  fetchKompetisiList: () => Promise<void>;
  fetchKompetisiById: (id_kompetisi: number) => Promise<void>;
  fetchKelasKejuaraanByKompetisi: (id_kompetisi: number) => Promise<void>;
  fetchAtletByKompetisi: (
    id_kompetisi: number,
    cabang?: "kyorugi" | "poomsae",
    id_dojang?: number
  ) => Promise<void>;
  setAtletPage: (page: number) => void;
  setAtletLimit: (limit: number) => void;

  updatePesertaStatus: (
    kompetisiId: number,
    participantId: number,
    status: "PENDING" | "APPROVED" | "REJECTED"
  ) => Promise<any>;

  deleteParticipant: (
    kompetisiId: number,
    participantId: number
  ) => Promise<any>;

  updateParticipantClass: (
    kompetisiId: number,
    participantId: number,
    kelasKejuaraanId: number
  ) => Promise<any>;
}

const KompetisiContext = createContext<KompetisiContextType | undefined>(
  undefined
);

export const KompetisiProvider = ({ children }: { children: ReactNode }) => {
  const [kompetisiList, setKompetisiList] = useState<Kompetisi[]>([]);
  const [kompetisiDetail, setKompetisiDetail] =
    useState<KompetisiDetail | null>(null);
  const [pesertaList, setPesertaList] = useState<PesertaKompetisi[]>([]);
  const [kelasKejuaraanList, setKelasKejuaraanList] = useState<
    KelasKejuaraan[]
  >([]);
  const [atletPagination, setAtletPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 1000,
    total: 0,
    totalPages: 0,
  });

  const [loadingKompetisi, setLoadingKompetisi] = useState(false);
  const [loadingAtlet, setLoadingAtlet] = useState(false);
  const [loadingKelasKejuaraan, setLoadingKelasKejuaraan] = useState(false);
  const [errorKompetisi, setErrorKompetisi] = useState<string | null>(null);
  const [errorAtlet, setErrorAtlet] = useState<string | null>(null);
  const [errorKelasKejuaraan, setErrorKelasKejuaraan] = useState<string | null>(
    null
  );

  const fetchKompetisiList = async () => {
    setLoadingKompetisi(true);
    setErrorKompetisi(null);
    try {
      const res = await apiClient.get("/kompetisi");
      setKompetisiList(res.data);
    } catch (err: any) {
      setErrorKompetisi(
        err.response?.data?.message ||
          err.message ||
          "Gagal mengambil data kompetisi"
      );
    } finally {
      setLoadingKompetisi(false);
      console.log("[fetchKompetisiList] done");
    }
  };

  const fetchKompetisiById = async (id_kompetisi: number) => {
    setLoadingKompetisi(true);
    setErrorKompetisi(null);
    try {
      const res = await apiClient.get(`/kompetisi/${id_kompetisi}`);
      setKompetisiDetail(res.data?.data || null);
    } catch (err: any) {
      console.error("[fetchKompetisiById] error:", err);
      setErrorKompetisi(
        err.response?.data?.message ||
          err.message ||
          "Gagal mengambil detail kompetisi"
      );
    } finally {
      setLoadingKompetisi(false);
      console.log("[fetchKompetisiById] done");
    }
  };

  // 🆕 Fetch Kelas Kejuaraan berdasarkan ID Kompetisi
  const fetchKelasKejuaraanByKompetisi = async (id_kompetisi: number) => {
    setLoadingKelasKejuaraan(true);
    setErrorKelasKejuaraan(null);
    try {
      console.log("🔍 Fetching for kompetisi ID:", id_kompetisi);

      const res = await apiClient.get(`/kelas/${id_kompetisi}/kelas-kejuaraan`);

      console.log("📥 Full Response:", res);
      console.log("📥 Response.data type:", typeof res.data);
      console.log("📥 Response.data is Array:", Array.isArray(res.data));
      console.log("📥 Response.data:", res.data);

      // ✅ Fix: Check if res.data is already array
      let kelasData;
      if (Array.isArray(res.data)) {
        // Backend return array langsung
        kelasData = res.data;
      } else if (res.data?.data && Array.isArray(res.data.data)) {
        // Backend return { data: [...] }
        kelasData = res.data.data;
      } else {
        // Fallback
        kelasData = [];
      }

      setKelasKejuaraanList(kelasData);

      console.log(
        "[fetchKelasKejuaraanByKompetisi] Loaded kelas:",
        kelasData.length
      );
    } catch (err: any) {
      console.error("[fetchKelasKejuaraanByKompetisi] error:", err);
      console.error("Error response:", err.response);

      if (err.response?.status === 404) {
        setKelasKejuaraanList([]);
        setErrorKelasKejuaraan(null);
      } else {
        setErrorKelasKejuaraan(
          err.response?.data?.message ||
            err.message ||
            "Gagal mengambil data kelas kejuaraan"
        );
        setKelasKejuaraanList([]);
      }
    } finally {
      setLoadingKelasKejuaraan(false);
    }
  };

  const fetchAtletByKompetisi = async (
    id_kompetisi: number,
    cabang?: "kyorugi" | "poomsae",
    id_dojang?: number
  ) => {
    setLoadingAtlet(true);
    setErrorAtlet(null);
    try {
      let url = `/kompetisi/${id_kompetisi}/atlet?page=${atletPagination.page}&limit=${atletPagination.limit}`;
      if (cabang) url += `&cabang=${cabang}`;
      if (id_dojang) url += `&id_dojang=${id_dojang}`;

      const res = await apiClient.get(url);

      setPesertaList(
        Array.isArray(res.data)
          ? (res.data as PesertaKompetisi[])
          : (res.data.data as PesertaKompetisi[]) ?? []
      );
      setAtletPagination((prev) => ({
        ...prev,
        total: res.data?.meta?.total || 0,
        totalPages: res.data?.meta?.totalPages || 0,
      }));
    } catch (err: any) {
      console.error("[fetchAtletByKompetisi] error:", err);
      setErrorAtlet(
        err.response?.data?.message ||
          err.message ||
          "Gagal mengambil data atlet kompetisi"
      );
    } finally {
      setLoadingAtlet(false);
      console.log("[fetchAtletByKompetisi] done");
    }
  };

  const setAtletPage = (page: number) => {
    setAtletPagination((prev) => ({ ...prev, page }));
  };

  const setAtletLimit = (limit: number) => {
    setAtletPagination((prev) => ({ ...prev, limit, page: 1 }));
  };

  const updatePesertaStatus = async (
    kompetisiId: number,
    participantId: number,
    status: "PENDING" | "APPROVED" | "REJECTED"
  ) => {
    try {
      const res = await apiClient.put(
        `/kompetisi/${kompetisiId}/participants/${participantId}/status`,
        { status }
      );

      // setelah update, otomatis refresh daftar peserta
      await fetchAtletByKompetisi(kompetisiId);

      return res.data;
    } catch (err: any) {
      console.error("[updatePesertaStatus] error:", err);
      throw err;
    }
  };

  const deleteParticipant = async (
    kompetisiId: number,
    participantId: number
  ) => {
    const originalPesertaList = [...pesertaList];

    try {
      console.log(
        `🗑️ Deleting participant ${participantId} from kompetisi ${kompetisiId}`
      );

      setPesertaList((prev) =>
        prev.filter((p) => p.id_peserta_kompetisi !== participantId)
      );

      const response = await apiClient.delete(
        `/kompetisi/${kompetisiId}/participants/${participantId}`
      );

      console.log("✅ Participant deleted successfully:", response.data);

      setKompetisiList((prev) =>
        prev.map((k) =>
          k.id_kompetisi === kompetisiId
            ? { ...k, jumlah_peserta: Math.max((k.jumlah_peserta || 1) - 1, 0) }
            : k
        )
      );

      setAtletPagination((prev) => ({
        ...prev,
        total: Math.max(prev.total - 1, 0),
      }));

      console.log("Peserta berhasil dihapus dari kompetisi");
      return response.data;
    } catch (error: any) {
      console.error("❌ Error deleting participant:", error);

      setPesertaList(originalPesertaList);

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Gagal menghapus peserta";
      console.error(errorMessage);

      throw new Error(errorMessage);
    }
  };

  const updateParticipantClass = async (
    kompetisiId: number,
    participantId: number,
    kelasKejuaraanId: number
  ) => {
    try {
      console.log(
        `🔄 Updating participant ${participantId} to class ${kelasKejuaraanId} in kompetisi ${kompetisiId}`
      );

      const response = await apiClient.put(
        `/kompetisi/${kompetisiId}/participants/${participantId}/class`,
        { kelasKejuaraanId }
      );

      console.log("✅ Participant class updated successfully:", response.data);

      await fetchAtletByKompetisi(kompetisiId);

      return response.data;
    } catch (error: any) {
      console.error("❌ Error updating participant class:", error);

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Gagal mengubah kelas peserta";
      console.error(errorMessage);

      throw new Error(errorMessage);
    }
  };

  return (
    <KompetisiContext.Provider
      value={{
        kompetisiList,
        kompetisiDetail,
        pesertaList,
        kelasKejuaraanList,
        atletPagination,
        loadingKompetisi,
        loadingAtlet,
        loadingKelasKejuaraan,
        errorKompetisi,
        errorAtlet,
        errorKelasKejuaraan,
        fetchKompetisiList,
        fetchKompetisiById,
        fetchKelasKejuaraanByKompetisi,
        fetchAtletByKompetisi,
        updatePesertaStatus,
        deleteParticipant,
        updateParticipantClass,
        setAtletPage,
        setAtletLimit,
      }}
    >
      {children}
    </KompetisiContext.Provider>
  );
};

export function useKompetisi() {
  const context = useContext(KompetisiContext);
  if (!context) {
    throw new Error("useKompetisi harus dipakai di dalam <KompetisiProvider>");
  }
  return context;
}
