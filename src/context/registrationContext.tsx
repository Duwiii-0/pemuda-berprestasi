// src/context/registrationContext.tsx - Fixed Version
import { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import type { ReactNode } from 'react';

export interface RegistrationData {
  id: string;
  atlitId: number;
  atlitName: string;
  kompetisiId: number;
  kompetisiName: string;
  styleType: "kyorugi" | "poomsae";
  categoryType: "prestasi" | "pemula";
  gender: "Laki-Laki" | "Perempuan";
  ageCategory?: string;
  weightCategory?: string;
  registrationDate: string;
  status: "confirmed" | "cancelled" | "pending";
  biayaPendaftaran: number;
}

// Updated API Response Types based on your schema
export interface ApiAtlet {
  id_atlet: number;
  nama_atlet: string;
  berat_badan: number;
  tinggi_badan: number;
  provinsi: string;
  belt: string;
  jenis_kelamin: 'LAKI_LAKI' | 'PEREMPUAN';
  nik: string;
  tanggal_lahir: string;
  kota?: string;
  alamat?: string;
  no_telp?: string;
  umur?: number;
  id_dojang: number;
}

export interface ApiKompetisi {
  id_kompetisi: number;
  nama_event: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  type_kompetisi: 'OPEN' | 'TRAINING' | 'GRADE_B' | 'GRADE_C';
  kelas_kejuaraan?: ApiKelasKejuaraan[];
}

export interface ApiKelasKejuaraan {
  id_kelas_kejuaraan: number;
  cabang: 'KYORUGI' | 'POOMSAE';
  id_kompetisi: number;
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
    nama_kelas: string;
    batas_min: number;
    batas_max: number;
    gender: 'LAKI_LAKI' | 'PEREMPUAN';
  };
  poomsae?: {
    id_poomsae: number;
    level: string;
    daftar_taeguk?: string;
  };
}

export interface ApiPesertaKompetisi {
  id_peserta_kompetisi: number;
  id_atlet: number;
  id_kelas_kejuaraan: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  atlet: ApiAtlet;
  kelas_kejuaraan: ApiKelasKejuaraan & {
    kompetisi: ApiKompetisi;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface RegistrationContextType {
  registrations: RegistrationData[];
  atlitList: ApiAtlet[];
  kompetisiList: ApiKompetisi[];
  selectedKompetisiClasses: ApiKelasKejuaraan[];
  
  // API functions
  fetchAtletList: () => Promise<void>;
  fetchKompetisiList: () => Promise<void>;
  fetchKompetisiClasses: (kompetisiId: number) => Promise<void>;
  fetchRegistrations: (kompetisiId?: number) => Promise<void>;
  
  // Registration functions
  addRegistration: (registration: Omit<RegistrationData, 'id' | 'registrationDate' | 'status'>) => Promise<void>;
  cancelRegistration: (registrationId: string) => Promise<void>;
  confirmRegistration: (registrationId: string) => Promise<void>;
  getRegistrationsByKompetisi: (kompetisiId: number) => RegistrationData[];
  getRegistrationsByAtlit: (atlitId: number) => RegistrationData[];
  updateKompetisiParticipants: (kompetisiId: number) => number;
  
  // Loading states
  loading: {
    atlet: boolean;
    kompetisi: boolean;
    classes: boolean;
    registration: boolean;
  };
}

const RegistrationContext = createContext<RegistrationContextType | undefined>(undefined);

export const useRegistration = () => {
  const context = useContext(RegistrationContext);
  if (!context) {
    throw new Error('useRegistration must be used within a RegistrationProvider');
  }
  return context;
};

interface RegistrationProviderProps {
  children: ReactNode;
}

export const RegistrationProvider = ({ children }: RegistrationProviderProps) => {
  const [registrations, setRegistrations] = useState<RegistrationData[]>([]);
  const [atlitList, setAtlitList] = useState<ApiAtlet[]>([]);
  const [kompetisiList, setKompetisiList] = useState<ApiKompetisi[]>([]);
  const [selectedKompetisiClasses, setSelectedKompetisiClasses] = useState<ApiKelasKejuaraan[]>([]);
  
  const [loading, setLoading] = useState({
    atlet: false,
    kompetisi: false,
    classes: false,
    registration: false
  });

  const API_BASE = process.env.REACT_APP_API_URL || '/api';

  // Fetch functions
  const fetchAtletList = async () => {
    setLoading(prev => ({ ...prev, atlet: true }));
    try {
      const response = await fetch(`${API_BASE}/atlet`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: ApiResponse<ApiAtlet[]> = await response.json();
      
      if (data.success) {
        setAtlitList(data.data);
      } else {
        toast.error(data.message || 'Gagal mengambil data atlet');
      }
    } catch (error) {
      toast.error('Error saat mengambil data atlet');
      console.error('Fetch atlet error:', error);
    } finally {
      setLoading(prev => ({ ...prev, atlet: false }));
    }
  };

  const fetchKompetisiList = async () => {
    setLoading(prev => ({ ...prev, kompetisi: true }));
    try {
      const response = await fetch(`${API_BASE}/kompetisi?status=PUBLISHED`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: ApiResponse<ApiKompetisi[]> = await response.json();
      
      if (data.success) {
        setKompetisiList(data.data);
      } else {
        toast.error(data.message || 'Gagal mengambil data kompetisi');
      }
    } catch (error) {
      toast.error('Error saat mengambil data kompetisi');
      console.error('Fetch kompetisi error:', error);
    } finally {
      setLoading(prev => ({ ...prev, kompetisi: false }));
    }
  };

  const fetchKompetisiClasses = async (kompetisiId: number) => {
    setLoading(prev => ({ ...prev, classes: true }));
    try {
      const response = await fetch(`${API_BASE}/kompetisi/${kompetisiId}/kelas`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: ApiResponse<ApiKelasKejuaraan[]> = await response.json();
      
      if (data.success) {
        setSelectedKompetisiClasses(data.data);
      } else {
        toast.error(data.message || 'Gagal mengambil kelas kejuaraan');
      }
    } catch (error) {
      toast.error('Error saat mengambil kelas kejuaraan');
      console.error('Fetch classes error:', error);
    } finally {
      setLoading(prev => ({ ...prev, classes: false }));
    }
  };

  const fetchRegistrations = async (kompetisiId?: number) => {
    try {
      const url = kompetisiId 
        ? `${API_BASE}/kompetisi/${kompetisiId}/peserta`
        : `${API_BASE}/peserta-kompetisi`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: ApiResponse<ApiPesertaKompetisi[]> = await response.json();
      
      if (data.success) {
        const transformedRegistrations: RegistrationData[] = data.data.map((peserta) => ({
          id: `reg-${peserta.id_peserta_kompetisi}`,
          atlitId: peserta.atlet.id_atlet,
          atlitName: peserta.atlet.nama_atlet,
          kompetisiId: peserta.kelas_kejuaraan.kompetisi.id_kompetisi,
          kompetisiName: peserta.kelas_kejuaraan.kompetisi.nama_event,
          styleType: peserta.kelas_kejuaraan.cabang.toLowerCase() as "kyorugi" | "poomsae",
          categoryType: peserta.kelas_kejuaraan.kategori_event.nama_kategori.toLowerCase().includes('prestasi') 
            ? "prestasi" : "pemula",
          gender: peserta.atlet.jenis_kelamin === 'LAKI_LAKI' ? 'Laki-Laki' : 'Perempuan',
          ageCategory: peserta.kelas_kejuaraan.kelompok?.nama_kelompok,
          weightCategory: peserta.kelas_kejuaraan.kelas_berat?.nama_kelas,
          registrationDate: new Date().toISOString().split('T')[0],
          status: peserta.status === 'APPROVED' ? 'confirmed' : 
                  peserta.status === 'REJECTED' ? 'cancelled' : 'pending',
          biayaPendaftaran: 150000 // This should come from kompetisi data
        }));
        
        if (kompetisiId) {
          setRegistrations(prev => [
            ...prev.filter(reg => reg.kompetisiId !== kompetisiId),
            ...transformedRegistrations
          ]);
        } else {
          setRegistrations(transformedRegistrations);
        }
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
    }
  };

  const generateId = () => `reg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addRegistration = async (registrationData: Omit<RegistrationData, 'id' | 'registrationDate' | 'status'>) => {
    // Check if athlete is already registered for this competition
    const existingRegistration = registrations.find(
      reg => reg.atlitId === registrationData.atlitId && 
             reg.kompetisiId === registrationData.kompetisiId &&
             reg.status !== 'cancelled'
    );

    if (existingRegistration) {
      toast.error('Atlet sudah terdaftar untuk kompetisi ini!');
      throw new Error('Athlete already registered');
    }

    setLoading(prev => ({ ...prev, registration: true }));

    try {
      // Find matching kelas kejuaraan based on selection
      const matchingClass = selectedKompetisiClasses.find(kelas => {
        const isCabangMatch = kelas.cabang.toLowerCase() === registrationData.styleType.toLowerCase();
        const isKategoriMatch = kelas.kategori_event.nama_kategori.toLowerCase().includes(
          registrationData.categoryType.toLowerCase()
        );
        
        // For gender matching (only if weight class exists)
        let isGenderMatch = true;
        if (kelas.kelas_berat) {
          isGenderMatch = kelas.kelas_berat.gender === 
            (registrationData.gender === 'Laki-Laki' ? 'LAKI_LAKI' : 'PEREMPUAN');
        }
        
        // For age matching
        let isAgeMatch = true;
        if (registrationData.ageCategory && kelas.kelompok) {
          isAgeMatch = kelas.kelompok.nama_kelompok === registrationData.ageCategory;
        } else if (registrationData.categoryType === "pemula") {
          // For pemula, no age category required
          isAgeMatch = true;
        }
        
        // For weight matching
        let isWeightMatch = true;
        if (registrationData.weightCategory && kelas.kelas_berat) {
          isWeightMatch = kelas.kelas_berat.nama_kelas === registrationData.weightCategory;
        } else if (registrationData.styleType === "poomsae" || registrationData.categoryType === "pemula") {
          // For poomsae or pemula, no weight category required
          isWeightMatch = true;
        }
        
        return isCabangMatch && isKategoriMatch && isGenderMatch && isAgeMatch && isWeightMatch;
      });

      if (!matchingClass) {
        toast.error('Tidak dapat menemukan kelas kejuaraan yang sesuai');
        throw new Error('No matching class found');
      }

      // Call API to register
      const response = await fetch(`${API_BASE}/peserta-kompetisi`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_atlet: registrationData.atlitId,
          id_kelas_kejuaraan: matchingClass.id_kelas_kejuaraan
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<ApiPesertaKompetisi> = await response.json();

      if (result.success) {
        // Add to local state
        const newRegistration: RegistrationData = {
          ...registrationData,
          id: generateId(),
          registrationDate: new Date().toISOString().split('T')[0],
          status: "pending" // Start as pending until approved
        };

        setRegistrations(prev => [...prev, newRegistration]);
        toast.success(`${registrationData.atlitName} berhasil didaftarkan untuk ${registrationData.kompetisiName}!`);
        
        // Refresh registrations from server
        await fetchRegistrations(registrationData.kompetisiId);
      } else {
        toast.error(result.message || 'Gagal mendaftarkan atlet');
        throw new Error(result.message || 'Registration failed');
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Error saat mendaftarkan atlet');
      }
      console.error('Registration error:', error);
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, registration: false }));
    }
  };

  const cancelRegistration = async (registrationId: string) => {
    try {
      const registration = registrations.find(reg => reg.id === registrationId);
      if (!registration) {
        toast.error('Registrasi tidak ditemukan');
        return;
      }

      // Extract the API ID from our local ID format
      const apiId = registrationId.replace('reg-', '');
      
      const response = await fetch(`${API_BASE}/peserta-kompetisi/${apiId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<any> = await response.json();

      if (result.success) {
        setRegistrations(prev =>
          prev.map(reg =>
            reg.id === registrationId
              ? { ...reg, status: "cancelled" as const }
              : reg
          )
        );
        toast.success('Registrasi berhasil dibatalkan!');
      } else {
        toast.error(result.message || 'Gagal membatalkan registrasi');
      }
    } catch (error) {
      toast.error('Error saat membatalkan registrasi');
      console.error('Cancel registration error:', error);
    }
  };

  const confirmRegistration = async (registrationId: string): Promise<void> => {
    setRegistrations(prev =>
      prev.map(reg =>
        reg.id === registrationId
          ? { ...reg, status: "confirmed" as const }
          : reg
      )
    );
    toast.success('Registrasi berhasil dikonfirmasi!');
  };

  const getRegistrationsByKompetisi = (kompetisiId: number) => {
    return registrations.filter(
      reg => reg.kompetisiId === kompetisiId && reg.status !== 'cancelled'
    );
  };

  const getRegistrationsByAtlit = (atlitId: number) => {
    return registrations.filter(
      reg => reg.atlitId === atlitId && reg.status !== 'cancelled'
    );
  };

  const updateKompetisiParticipants = (kompetisiId: number) => {
    return getRegistrationsByKompetisi(kompetisiId).length;
  };

  // Load initial data
  useEffect(() => {
    fetchAtletList();
    fetchKompetisiList();
  }, []);

  const value = {
    registrations,
    atlitList,
    kompetisiList,
    selectedKompetisiClasses,
    fetchAtletList,
    fetchKompetisiList,
    fetchKompetisiClasses,
    fetchRegistrations,
    addRegistration,
    cancelRegistration,
    confirmRegistration,
    getRegistrationsByKompetisi,
    getRegistrationsByAtlit,
    updateKompetisiParticipants,
    loading
  };

  return (
    <RegistrationContext.Provider value={value}>
      {children}
    </RegistrationContext.Provider>
  );
};